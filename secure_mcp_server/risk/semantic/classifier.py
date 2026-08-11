"""
Semantic Risk Layer — Classifier Orchestration.

``SemanticRiskClassifier`` is the main entry point for the semantic risk
layer.  It orchestrates the full pipeline:

    detect language → if Latin-only English, return neutral result →
    else check cache → on miss, check budget guard → call Sarvam client →
    store in cache → return result

Every failure path (Sarvam down, budget exhausted, malformed response)
returns an explicit fallback ``ClassificationResult`` with ``degraded=True``
rather than raising uncaught.  The caller (fusion layer) decides
fail-open vs fail-closed based on config — this module's job is just to
never crash the pipeline.

All dependencies are injected via the constructor.  Nothing is
constructed internally.
"""

from __future__ import annotations

from typing import Optional

import structlog

from .budget_guard import BudgetGuard
from .cache import InMemorySemanticCache
from .exceptions import (
    BudgetExhaustedError,
    MalformedResponseError,
    SarvamAPIError,
    SarvamRateLimitError,
    SarvamTimeoutError,
    SemanticRiskError,
)
from .interfaces import CacheProtocol, RiskClassifierProtocol, LanguageDetectorProtocol
from .language_detector import LanguageDetector
from .models import ClassificationResult

logger = structlog.get_logger()


def _neutral_result(reason: str = "Latin-only content, semantic layer skipped") -> ClassificationResult:
    """Return a neutral/no-op classification result.

    Used when content is unambiguously plain English and the Sarvam
    API call is skipped entirely.
    """
    return ClassificationResult(
        risk_score=0.0,
        reasoning=reason,
        model_used="none",
        tokens_used=0,
        degraded=False,
    )


def _degraded_result(reason: str) -> ClassificationResult:
    """Return a degraded fallback classification result.

    Used when the semantic layer encounters an error.  The fusion layer
    checks ``degraded=True`` to decide fail-open vs fail-closed.
    """
    return ClassificationResult(
        risk_score=0.0,
        reasoning=f"Degraded: {reason}",
        model_used="none",
        tokens_used=0,
        degraded=True,
        degraded_reason=reason,
    )


class SemanticRiskClassifier:
    """Orchestrates the semantic risk classification pipeline.

    Dependencies are injected via constructor — nothing constructed internally.

    Parameters
    ----------
    language_detector:
        Detects script/language to decide whether to call Sarvam.
    risk_classifier:
        The Sarvam client (or any ``RiskClassifierProtocol`` impl).
    cache:
        Cache for classification results (cost control).
    budget_guard:
        Tracks credit spend and enforces budget limits.
    """

    def __init__(
        self,
        language_detector: LanguageDetectorProtocol,
        risk_classifier: RiskClassifierProtocol,
        cache: CacheProtocol,
        budget_guard: BudgetGuard,
    ) -> None:
        self._detector = language_detector
        self._classifier = risk_classifier
        self._cache = cache
        self._budget = budget_guard

    async def classify(self, content: str) -> ClassificationResult:
        """Classify content for semantic risk.

        Pipeline:
        1. Detect language — if Latin-only, return neutral immediately.
        2. Check cache — if hit, return cached result.
        3. Check budget — if exhausted, return degraded result.
        4. Call Sarvam — if error, return degraded result.
        5. Store in cache — return result.

        **Never raises.** All errors are caught and returned as
        degraded results.
        """
        # Step 1: Language detection (cost gate)
        try:
            profile = self._detector.detect(content)
        except Exception as e:
            logger.error("Language detection failed", error=str(e))
            # If detection fails, be conservative and proceed with classification
            profile = None

        if profile is not None and profile.is_latin_only:
            logger.debug(
                "Semantic layer skipped: Latin-only content",
                confidence=profile.confidence,
            )
            return _neutral_result()

        # Step 2: Cache lookup
        try:
            cached = await self._cache.get(content)
            if cached is not None:
                logger.debug("Semantic cache hit", risk_score=cached.risk_score)
                return cached
        except Exception as e:
            logger.warning("Cache lookup failed, proceeding without cache", error=str(e))

        # Step 3: Budget check
        try:
            await self._budget.check_budget()
        except BudgetExhaustedError as e:
            logger.warning(
                "Sarvam budget exhausted, returning degraded result",
                spent_inr=e.spent_inr,
                budget_inr=e.budget_inr,
            )
            return _degraded_result(f"Budget exhausted: spent ₹{e.spent_inr:.2f} of ₹{e.budget_inr:.2f}")

        # Step 4: Call Sarvam
        try:
            result = await self._classifier.classify(content)
        except SarvamTimeoutError as e:
            logger.error("Sarvam API timed out", error=str(e))
            return _degraded_result(f"Sarvam timeout: {e.message}")
        except SarvamRateLimitError as e:
            logger.warning("Sarvam rate limited", retry_after=e.retry_after)
            return _degraded_result("Sarvam rate limited")
        except SarvamAPIError as e:
            logger.error("Sarvam API error", error=str(e), status_code=e.status_code)
            return _degraded_result(f"Sarvam API error: {e.message}")
        except MalformedResponseError as e:
            logger.error("Malformed Sarvam response", error=str(e))
            return _degraded_result(f"Malformed response: {e.message}")
        except Exception as e:
            logger.error("Unexpected error in semantic classifier", error=str(e))
            return _degraded_result(f"Unexpected error: {type(e).__name__}: {e}")

        # Step 5: Record spend and cache result
        try:
            await self._budget.record_spend(result)
        except Exception as e:
            logger.warning("Failed to record spend", error=str(e))

        try:
            await self._cache.put(content, result)
        except Exception as e:
            logger.warning("Failed to cache result", error=str(e))

        logger.info(
            "Semantic risk classified",
            risk_score=result.risk_score,
            model_used=result.model_used,
            tokens_used=result.tokens_used,
        )

        return result
