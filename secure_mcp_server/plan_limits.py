"""
Single source of truth for Runwall Plan Limits across Free, Pro, and Enterprise tiers.

Referenced everywhere (rate limiter, enforcement layer, dashboard, quickstart docs, billing)
so limits can never drift out of sync.
"""

from typing import Any, Dict, Optional, TypedDict


class PlanDefinition(TypedDict):
    requests_per_minute: Optional[int]
    max_tool_calls_per_day: Optional[int]
    max_api_keys: Optional[int]
    concurrent_connections: Optional[int]
    policy_engine_features: str
    semantic_risk_scoring: bool
    support: str
    sla: Optional[str]


PLAN_LIMITS: Dict[str, PlanDefinition] = {
    "free": {
        "requests_per_minute": 10,
        "max_tool_calls_per_day": 200,
        "max_api_keys": 1,
        "concurrent_connections": 1,
        "policy_engine_features": "basic",   # OPA default policies only
        "semantic_risk_scoring": False,       # LLM-based risk scoring disabled
        "support": "community (GitHub issues only)",
        "sla": None,
    },
    "pro": {
        "requests_per_minute": 60,
        "max_tool_calls_per_day": 10_000,
        "max_api_keys": 5,
        "concurrent_connections": 5,
        "policy_engine_features": "custom OPA policies",
        "semantic_risk_scoring": True,
        "support": "email, target 24h response",
        "sla": None,
    },
    "enterprise": {
        "requests_per_minute": None,          # negotiated / effectively unmetered, still guarded by abuse limits
        "max_tool_calls_per_day": None,        # negotiated per contract
        "max_api_keys": None,                  # unlimited, managed by org admin
        "concurrent_connections": None,
        "policy_engine_features": "custom OPA policies + multi-tenant isolation",
        "semantic_risk_scoring": True,
        "support": "dedicated channel / priority response",
        "sla": "custom, per contract",
    },
}


def get_plan_limits(tier: str) -> PlanDefinition:
    """Retrieve plan definitions for the specified tier, defaulting to free."""
    tier_normalized = (tier or "free").lower()
    return PLAN_LIMITS.get(tier_normalized, PLAN_LIMITS["free"])
