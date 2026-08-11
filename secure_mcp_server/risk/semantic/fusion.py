"""
Semantic Risk Layer — Fusion Logic.

Combines ``structural_risk_score`` (from existing OPA engine) and
``semantic_risk_score`` (from Sarvam classifier) into ``final_risk_score``.

Key design decisions:
- **Config-driven weighting**: ``semantic_weight`` (default 0.4) determines
  how much the semantic signal influences the final score.
- **Config-driven fail-open/fail-closed**: when the semantic result is
  ``degraded=True``, the behavior is:
  - **fail-open** (availability-first): ignore semantic signal, use structural
    score only.
  - **fail-closed** (security-first): treat degraded as elevated risk
    (add a penalty to the structural score).

This is a **real security decision**, not a style choice, and should be
reviewed rather than defaulted silently. The tradeoff is documented below.

This is the **only module** allowed to produce the number that downstream
risk-scoring/approval logic consumes.
"""

from __future__ import annotations

from enum import Enum
from typing import Optional

import structlog

from .models import ClassificationResult, RiskSignal, RiskSignalSource

logger = structlog.get_logger()


class FailMode(str, Enum):
    """How the fusion layer handles degraded semantic signals.

    OPEN (availability-first):
        When the semantic classifier is degraded (Sarvam down, budget
        exhausted, etc.), the semantic signal is ignored entirely and
        only the structural score is used.  This maximises availability
        but means a window where Indic-language attacks could slip through.

    CLOSED (security-first):
        When the semantic classifier is degraded, a configurable penalty
        is added to the structural score.  This reduces the risk of
        missed attacks but may cause legitimate requests to be escalated
        or denied during Sarvam outages.
    """

    OPEN = "open"
    CLOSED = "closed"


# Penalty added to structural score in fail-closed mode when semantic
# signal is degraded.  0.15 is enough to push a MEDIUM-risk action
# into HIGH without being so large that every request is denied.
_FAIL_CLOSED_PENALTY = 0.15


class RiskFusion:
    """Fuses structural and semantic risk signals into a final score.

    Parameters
    ----------
    semantic_weight:
        Weight for the semantic signal (0–1).  The structural signal
        gets weight ``1 - semantic_weight``.  Default: 0.4.
    fail_mode:
        How to handle degraded semantic signals.  Default: ``OPEN``.
    """

    def __init__(
        self,
        semantic_weight: float = 0.4,
        fail_mode: FailMode = FailMode.OPEN,
    ) -> None:
        if not (0.0 <= semantic_weight <= 1.0):
            raise ValueError(f"semantic_weight must be 0–1, got {semantic_weight}")

        self._semantic_weight = semantic_weight
        self._structural_weight = 1.0 - semantic_weight
        self._fail_mode = fail_mode

    @property
    def semantic_weight(self) -> float:
        return self._semantic_weight

    @property
    def fail_mode(self) -> FailMode:
        return self._fail_mode

    def fuse(
        self,
        structural_score: float,
        semantic_result: Optional[ClassificationResult] = None,
    ) -> float:
        """Combine structural and semantic scores into a final risk score.

        Parameters
        ----------
        structural_score:
            The risk score from the existing OPA/Rego engine (0–1).
        semantic_result:
            The classification result from the semantic layer.
            ``None`` means the semantic layer was not invoked (e.g. feature
            flag off, Latin-only content).

        Returns
        -------
        float
            Final fused risk score (0–1).
        """
        # No semantic signal — structural only
        if semantic_result is None:
            return self._clamp(structural_score)

        # Degraded semantic signal — apply fail mode
        if semantic_result.degraded:
            return self._handle_degraded(structural_score, semantic_result)

        # Normal fusion: weighted average
        fused = (
            self._structural_weight * structural_score
            + self._semantic_weight * semantic_result.risk_score
        )

        logger.debug(
            "Risk scores fused",
            structural=round(structural_score, 4),
            semantic=round(semantic_result.risk_score, 4),
            fused=round(fused, 4),
            semantic_weight=self._semantic_weight,
        )

        return self._clamp(fused)

    def _handle_degraded(
        self,
        structural_score: float,
        semantic_result: ClassificationResult,
    ) -> float:
        """Handle degraded semantic signal based on fail mode.

        fail-open: ignore semantic signal entirely.
        fail-closed: add penalty to structural score.
        """
        if self._fail_mode == FailMode.OPEN:
            logger.info(
                "Semantic signal degraded, fail-open: using structural score only",
                structural=round(structural_score, 4),
                degraded_reason=semantic_result.degraded_reason,
            )
            return self._clamp(structural_score)

        elif self._fail_mode == FailMode.CLOSED:
            penalized = structural_score + _FAIL_CLOSED_PENALTY
            logger.info(
                "Semantic signal degraded, fail-closed: adding penalty",
                structural=round(structural_score, 4),
                penalty=_FAIL_CLOSED_PENALTY,
                penalized=round(penalized, 4),
                degraded_reason=semantic_result.degraded_reason,
            )
            return self._clamp(penalized)

        # Should not reach here, but be defensive
        return self._clamp(structural_score)

    @staticmethod
    def _clamp(score: float) -> float:
        """Clamp score to [0, 1]."""
        return max(0.0, min(1.0, score))
