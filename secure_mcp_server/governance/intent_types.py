"""
Intent-Aware Execution Policy Engine — Domain Types.

Defines the core enums, value objects, and Pydantic models that form the
ubiquitous language of the governance domain.  Every other module in this
package imports from here; nothing here imports from the rest of the
application so the domain layer stays dependency-free.
"""

from __future__ import annotations

import hashlib
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class IntentCategory(str, Enum):
    """High-level intent behind a tool invocation."""

    READ = "read"
    WRITE = "write"
    DELETE = "delete"
    EXPORT = "export"
    ADMIN = "admin"
    EXECUTE = "execute"
    CONFIGURE = "configure"
    UNKNOWN = "unknown"


class BlastRadius(str, Enum):
    """How wide the impact of the action is."""

    NONE = "none"
    SINGLE_RECORD = "single_record"
    MULTI_RECORD = "multi_record"
    TABLE_LEVEL = "table_level"
    SYSTEM_WIDE = "system_wide"


class ResourceSensitivity(str, Enum):
    """Sensitivity classification of the target resource."""

    PUBLIC = "public"
    INTERNAL = "internal"
    CONFIDENTIAL = "confidential"
    RESTRICTED = "restricted"
    TOP_SECRET = "top_secret"


class RiskLevel(str, Enum):
    """Discrete risk tier derived from the composite risk score."""

    NEGLIGIBLE = "negligible"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class PolicyDecisionType(str, Enum):
    """What the policy engine decides to do with a request."""

    ALLOW = "allow"
    DENY = "deny"
    REQUIRE_APPROVAL = "require_approval"
    SIMULATE = "simulate"
    LOG_ONLY = "log_only"
    QUARANTINE = "quarantine"


# ---------------------------------------------------------------------------
# Value Objects / Pydantic Models
# ---------------------------------------------------------------------------

class IntentClassification(BaseModel):
    """Result of analysing what the caller *intends* to do."""

    tool_name: str = Field(..., description="Name of the tool being invoked")
    intent_category: IntentCategory = Field(
        default=IntentCategory.UNKNOWN,
        description="Classified intent category",
    )
    blast_radius: BlastRadius = Field(
        default=BlastRadius.NONE,
        description="Estimated breadth of impact",
    )
    resource_sensitivity: ResourceSensitivity = Field(
        default=ResourceSensitivity.PUBLIC,
        description="Sensitivity of the target resource",
    )
    is_destructive: bool = Field(
        default=False,
        description="True when the action permanently removes or alters data",
    )
    is_bulk_operation: bool = Field(
        default=False,
        description="True when the action affects a large number of records",
    )
    affected_resource_types: List[str] = Field(
        default_factory=list,
        description="Resource types touched by this action (e.g. 'customer', 'invoice')",
    )
    parameter_flags: Dict[str, Any] = Field(
        default_factory=dict,
        description="Key parameter signals detected (e.g. {'has_pii': True})",
    )
    confidence: float = Field(
        default=1.0,
        ge=0.0,
        le=1.0,
        description="Classifier confidence in this classification",
    )


class RiskFactors(BaseModel):
    """Individual risk factors with their computed scores."""

    tool_sensitivity: float = Field(default=0.0, ge=0.0, le=1.0)
    parameter_risk: float = Field(default=0.0, ge=0.0, le=1.0)
    user_trust: float = Field(
        default=1.0,
        ge=0.0,
        le=1.0,
        description="1.0 = fully trusted, 0.0 = untrusted",
    )
    resource_sensitivity: float = Field(default=0.0, ge=0.0, le=1.0)
    blast_radius: float = Field(default=0.0, ge=0.0, le=1.0)
    temporal_risk: float = Field(default=0.0, ge=0.0, le=1.0)
    behavioral_anomaly: float = Field(default=0.0, ge=0.0, le=1.0)


class RiskScore(BaseModel):
    """Composite risk assessment for a single tool invocation."""

    score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Composite risk score (0 = safe, 1 = maximum risk)",
    )
    level: RiskLevel = Field(..., description="Discrete risk tier")
    factors: RiskFactors = Field(
        default_factory=RiskFactors,
        description="Breakdown of individual risk factors",
    )
    explanation: str = Field(
        default="",
        description="Human-readable explanation of the score",
    )


class PolicyRuleMatch(BaseModel):
    """Represents a single policy rule that was evaluated."""

    rule_id: Optional[str] = Field(default=None)
    rule_name: str = Field(default="")
    priority: int = Field(default=0)
    matched: bool = Field(default=False)
    reason: str = Field(default="", description="Why this rule matched or was skipped")


class PolicyEvaluationResult(BaseModel):
    """Full, explainable result of the governance pipeline."""

    decision: PolicyDecisionType = Field(
        ..., description="Final policy decision"
    )
    intent: IntentClassification = Field(
        ..., description="How the request was classified"
    )
    risk: RiskScore = Field(
        ..., description="Computed risk assessment"
    )
    matched_rule: Optional[PolicyRuleMatch] = Field(
        default=None,
        description="The rule that produced the decision",
    )
    evaluation_chain: List[PolicyRuleMatch] = Field(
        default_factory=list,
        description="All rules evaluated, in priority order, with match/skip reasons",
    )
    requires_approval_from: Optional[List[str]] = Field(
        default=None,
        description="Roles/users required to approve (when decision=REQUIRE_APPROVAL)",
    )
    explanation: str = Field(
        default="",
        description="Human-readable summary of the decision",
    )
    evaluated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )

    # ---- Helpers ----------------------------------------------------------

    @property
    def is_allowed(self) -> bool:
        return self.decision in (
            PolicyDecisionType.ALLOW,
            PolicyDecisionType.LOG_ONLY,
            PolicyDecisionType.SIMULATE,
        )

    def to_audit_dict(self) -> Dict[str, Any]:
        """Serialise into a dict suitable for the PolicyDecisionLog table."""
        return {
            "decision": self.decision.value,
            "intent_category": self.intent.intent_category.value,
            "risk_score": self.risk.score,
            "risk_level": self.risk.level.value,
            "tool_name": self.intent.tool_name,
            "matched_rule_id": (
                self.matched_rule.rule_id if self.matched_rule else None
            ),
            "evaluation_chain": [m.model_dump() for m in self.evaluation_chain],
            "explanation": self.explanation,
            "evaluated_at": self.evaluated_at.isoformat(),
        }

    @staticmethod
    def hash_parameters(params: Dict[str, Any]) -> str:
        """Deterministic hash of tool parameters for deduplication / auditing."""
        import json

        canonical = json.dumps(params, sort_keys=True, default=str)
        return hashlib.sha256(canonical.encode()).hexdigest()[:16]
