"""
Risk Scorer — multi-factor risk computation for tool invocations.

Computes a composite risk score (0.0–1.0) by combining seven independent
factors through a weighted average.  Each factor can be individually
configured per organization via the ``risk_score_weights`` setting.

Factors
-------
1. **Tool sensitivity** — from tool metadata ``sensitivity_level``.
2. **Parameter risk** — from ``IntentClassification.parameter_flags``.
3. **User trust** — inverse: lower trust → higher risk.
4. **Resource sensitivity** — from ``IntentClassification``.
5. **Blast radius** — from ``IntentClassification``.
6. **Temporal risk** — off-hours / weekend access patterns.
7. **Behavioral anomaly** — deviation from user's normal tool usage.

The composite score is a weighted arithmetic mean with configurable weights.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional

import structlog

from .intent_types import (
    BlastRadius,
    IntentCategory,
    IntentClassification,
    ResourceSensitivity,
    RiskFactors,
    RiskLevel,
    RiskScore,
)

logger = structlog.get_logger()


# ---------------------------------------------------------------------------
# Default factor weights (sum need not equal 1 — they are normalised)
# ---------------------------------------------------------------------------

DEFAULT_WEIGHTS: Dict[str, float] = {
    "tool_sensitivity": 0.20,
    "parameter_risk": 0.15,
    "user_trust": 0.15,
    "resource_sensitivity": 0.20,
    "blast_radius": 0.15,
    "temporal_risk": 0.05,
    "behavioral_anomaly": 0.10,
}

# ---------------------------------------------------------------------------
# Enum → numeric mappings
# ---------------------------------------------------------------------------

_SENSITIVITY_SCORES: Dict[ResourceSensitivity, float] = {
    ResourceSensitivity.PUBLIC: 0.0,
    ResourceSensitivity.INTERNAL: 0.25,
    ResourceSensitivity.CONFIDENTIAL: 0.55,
    ResourceSensitivity.RESTRICTED: 0.80,
    ResourceSensitivity.TOP_SECRET: 1.0,
}

_BLAST_RADIUS_SCORES: Dict[BlastRadius, float] = {
    BlastRadius.NONE: 0.0,
    BlastRadius.SINGLE_RECORD: 0.15,
    BlastRadius.MULTI_RECORD: 0.45,
    BlastRadius.TABLE_LEVEL: 0.75,
    BlastRadius.SYSTEM_WIDE: 1.0,
}

_TOOL_SENSITIVITY_DEFAULTS: Dict[str, float] = {
    "public": 0.0,
    "internal": 0.25,
    "confidential": 0.55,
    "restricted": 0.80,
    "top_secret": 1.0,
}

# Risk thresholds for level assignment
_LEVEL_THRESHOLDS = [
    (0.90, RiskLevel.CRITICAL),
    (0.70, RiskLevel.HIGH),
    (0.40, RiskLevel.MEDIUM),
    (0.15, RiskLevel.LOW),
    (0.00, RiskLevel.NEGLIGIBLE),
]


class RiskScorer:
    """
    Computes multi-factor risk scores for tool invocations.

    Usage::

        scorer = RiskScorer(
            weights={"tool_sensitivity": 0.25, ...},
            high_risk_threshold=0.7,
            critical_risk_threshold=0.9,
        )
        risk = scorer.score(
            intent=classification,
            user_context={"is_admin": False, "role": "analyst"},
            tool_metadata={"sensitivity_level": "confidential"},
        )
    """

    def __init__(
        self,
        weights: Optional[Dict[str, float]] = None,
        high_risk_threshold: float = 0.70,
        critical_risk_threshold: float = 0.90,
    ) -> None:
        self._weights = weights or DEFAULT_WEIGHTS.copy()
        self._high_risk = high_risk_threshold
        self._critical_risk = critical_risk_threshold

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def score(
        self,
        intent: IntentClassification,
        user_context: Dict[str, Any],
        tool_metadata: Optional[Dict[str, Any]] = None,
    ) -> RiskScore:
        """Compute composite risk score for a classified intent.

        Parameters
        ----------
        intent:
            Output of :class:`IntentClassifier`.
        user_context:
            Dict with at least ``user_id``, ``is_admin``, ``role``,
            ``session_age_minutes`` (optional).
        tool_metadata:
            Optional tool-registry metadata dict.

        Returns
        -------
        RiskScore
            Composite score with factor breakdown and explanation.
        """
        tool_metadata = tool_metadata or {}

        factors = RiskFactors(
            tool_sensitivity=self._tool_sensitivity(tool_metadata),
            parameter_risk=self._parameter_risk(intent),
            user_trust=self._user_trust_risk(user_context),
            resource_sensitivity=self._resource_sensitivity(intent),
            blast_radius=self._blast_radius(intent),
            temporal_risk=self._temporal_risk(),
            behavioral_anomaly=self._behavioral_anomaly(
                intent, user_context, tool_metadata,
            ),
        )

        composite = self._weighted_average(factors)
        level = self._score_to_level(composite)
        explanation = self._build_explanation(composite, level, factors, intent)

        risk = RiskScore(
            score=round(composite, 4),
            level=level,
            factors=factors,
            explanation=explanation,
        )

        logger.debug(
            "Risk scored",
            tool=intent.tool_name,
            score=risk.score,
            level=risk.level.value,
        )

        return risk

    # ------------------------------------------------------------------
    # Individual factor computations
    # ------------------------------------------------------------------

    def _tool_sensitivity(self, tool_metadata: Dict[str, Any]) -> float:
        level = tool_metadata.get("sensitivity_level", "public")
        return _TOOL_SENSITIVITY_DEFAULTS.get(str(level).lower(), 0.3)

    def _parameter_risk(self, intent: IntentClassification) -> float:
        risk = 0.0
        flags = intent.parameter_flags

        if flags.get("has_pii"):
            risk += 0.40
        if flags.get("has_wildcard_selector"):
            risk += 0.30
        if flags.get("has_large_numeric"):
            risk += 0.15
        if flags.get("has_large_list"):
            risk += 0.15

        # Destructive intent raises parameter risk
        if intent.is_destructive:
            risk += 0.25

        # Bulk operations add risk
        if intent.is_bulk_operation:
            risk += 0.20

        return min(risk, 1.0)

    def _user_trust_risk(self, user_context: Dict[str, Any]) -> float:
        """
        Computes risk from user trust perspective.

        NOTE: This is *risk*, not *trust*. A fully trusted admin → low risk.
        An anonymous or new user → high risk.
        """
        # Admin is most trusted → lowest risk
        if user_context.get("is_admin"):
            return 0.05

        # Service accounts are typically well-scoped
        if user_context.get("is_service_account"):
            return 0.15

        # Role-based trust
        role = user_context.get("role", "").lower()
        role_risk = {
            "owner": 0.05,
            "admin": 0.10,
            "manager": 0.20,
            "developer": 0.30,
            "analyst": 0.35,
            "viewer": 0.40,
            "guest": 0.60,
        }
        base_risk = role_risk.get(role, 0.50)

        # Adjust for session age — new sessions are riskier
        session_age = user_context.get("session_age_minutes", 0)
        if session_age < 5:
            base_risk += 0.10  # Very new session
        elif session_age > 60:
            base_risk -= 0.05  # Established session

        # Anonymous users
        if user_context.get("user_id") in (None, "anonymous", ""):
            return 0.90

        return min(max(base_risk, 0.0), 1.0)

    def _resource_sensitivity(self, intent: IntentClassification) -> float:
        return _SENSITIVITY_SCORES.get(intent.resource_sensitivity, 0.3)

    def _blast_radius(self, intent: IntentClassification) -> float:
        return _BLAST_RADIUS_SCORES.get(intent.blast_radius, 0.3)

    def _temporal_risk(self) -> float:
        """Off-hours / weekend access is riskier."""
        now = datetime.now(timezone.utc)
        hour = now.hour
        weekday = now.weekday()  # 0=Monday

        risk = 0.0

        # Weekend
        if weekday >= 5:
            risk += 0.30

        # Off-hours (before 7 AM or after 8 PM UTC)
        if hour < 7 or hour >= 20:
            risk += 0.25

        # Late night (midnight to 5 AM)
        if 0 <= hour < 5:
            risk += 0.15

        return min(risk, 1.0)

    def _behavioral_anomaly(
        self,
        intent: IntentClassification,
        user_context: Dict[str, Any],
        tool_metadata: Dict[str, Any],
    ) -> float:
        """
        Detect deviations from normal user behaviour.

        In a production system this would query historical usage patterns
        from the database.  For now we use heuristic signals:

        - First-time tool usage for this user
        - Unusual intent category for this user's role
        - Rapid escalation in tool sensitivity
        """
        risk = 0.0
        role = user_context.get("role", "").lower()

        # Viewer or analyst using destructive/admin tools is anomalous
        if role in ("viewer", "analyst", "guest"):
            if intent.intent_category in (
                IntentCategory.DELETE,
                IntentCategory.ADMIN,
                IntentCategory.CONFIGURE,
            ):
                risk += 0.50

        # Export by guest is suspicious
        if role == "guest" and intent.intent_category == IntentCategory.EXPORT:
            risk += 0.40

        # Bulk operations from non-admin roles
        if intent.is_bulk_operation and role not in ("admin", "owner", "manager"):
            risk += 0.25

        return min(risk, 1.0)

    # ------------------------------------------------------------------
    # Composite score computation
    # ------------------------------------------------------------------

    def _weighted_average(self, factors: RiskFactors) -> float:
        """Compute weighted arithmetic mean of all factors."""
        factor_values = {
            "tool_sensitivity": factors.tool_sensitivity,
            "parameter_risk": factors.parameter_risk,
            "user_trust": factors.user_trust,
            "resource_sensitivity": factors.resource_sensitivity,
            "blast_radius": factors.blast_radius,
            "temporal_risk": factors.temporal_risk,
            "behavioral_anomaly": factors.behavioral_anomaly,
        }

        total_weight = sum(self._weights.get(k, 0) for k in factor_values)
        if total_weight == 0:
            return 0.0

        weighted_sum = sum(
            factor_values[k] * self._weights.get(k, 0)
            for k in factor_values
        )

        return weighted_sum / total_weight

    def _score_to_level(self, score: float) -> RiskLevel:
        for threshold, level in _LEVEL_THRESHOLDS:
            if score >= threshold:
                return level
        return RiskLevel.NEGLIGIBLE

    def _build_explanation(
        self,
        composite: float,
        level: RiskLevel,
        factors: RiskFactors,
        intent: IntentClassification,
    ) -> str:
        parts = [
            f"Risk level {level.value.upper()} (score: {composite:.2f}).",
        ]

        # Call out the top contributing factors
        factor_items = [
            ("Tool sensitivity", factors.tool_sensitivity),
            ("Parameter risk", factors.parameter_risk),
            ("User trust risk", factors.user_trust),
            ("Resource sensitivity", factors.resource_sensitivity),
            ("Blast radius", factors.blast_radius),
            ("Temporal risk", factors.temporal_risk),
            ("Behavioral anomaly", factors.behavioral_anomaly),
        ]

        # Sort by contribution (descending)
        top = sorted(factor_items, key=lambda x: x[1], reverse=True)
        significant = [(name, val) for name, val in top if val >= 0.20]

        if significant:
            contrib = ", ".join(
                f"{name} ({val:.2f})" for name, val in significant[:3]
            )
            parts.append(f"Top contributors: {contrib}.")

        if intent.is_destructive:
            parts.append("Action is flagged as destructive.")
        if intent.is_bulk_operation:
            parts.append("Bulk operation detected.")

        return " ".join(parts)
