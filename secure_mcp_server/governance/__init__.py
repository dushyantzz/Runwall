"""
Intent-Aware Execution Policy Engine.

This package implements the governance pipeline that sits between
AI reasoning and production tool execution.  It classifies intent,
scores risk across seven factors, and evaluates versioned policy rules
to produce explainable ALLOW / DENY / REQUIRE_APPROVAL decisions.

Public API::

    from secure_mcp_server.governance import (
        IntentClassifier,
        RiskScorer,
        PolicyEvaluator,
        # domain types
        IntentCategory,
        RiskLevel,
        PolicyDecisionType,
        IntentClassification,
        RiskScore,
        PolicyEvaluationResult,
    )
"""

from .intent_types import (
    BlastRadius,
    IntentCategory,
    IntentClassification,
    PolicyDecisionType,
    PolicyEvaluationResult,
    PolicyRuleMatch,
    ResourceSensitivity,
    RiskFactors,
    RiskLevel,
    RiskScore,
)
from .intent_classifier import IntentClassifier
from .risk_scorer import RiskScorer
from .policy_evaluator import PolicyEvaluator, PolicyRule
from .quota_manager import QuotaManager, QuotaExceededError
from .taint import TaintManager, TaintLabel
from .compensation import CompensationRegistry, compensation_registry
from .trust import ToolTrustManager

__all__ = [
    # Services
    "IntentClassifier",
    "RiskScorer",
    "PolicyEvaluator",
    "PolicyRule",
    "QuotaManager",
    "TaintManager",
    "CompensationRegistry",
    "compensation_registry",
    "ToolTrustManager",
    # Enums
    "IntentCategory",
    "BlastRadius",
    "ResourceSensitivity",
    "RiskLevel",
    "PolicyDecisionType",
    "TaintLabel",
    # Value objects
    "IntentClassification",
    "RiskFactors",
    "RiskScore",
    "PolicyRuleMatch",
    "PolicyEvaluationResult",
    "QuotaExceededError",
]
