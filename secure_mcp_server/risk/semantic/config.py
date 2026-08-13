"""
Semantic Risk Layer — Typed Configuration.

Single typed config object loaded from environment variables.  No secrets
or magic numbers anywhere else in the module — every other file receives
these values via constructor injection, not by reading env vars directly.
"""

from __future__ import annotations

from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings

from .fusion import FailMode


class SemanticRiskConfig(BaseSettings):
    """Configuration for the Indic-Aware Semantic Risk Layer.

    All values are loaded from environment variables.  Defaults are
    chosen for a safe initial deployment (feature off, fail-open).
    """

    model_config = dict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Feature flag — must be explicitly enabled
    enable_semantic_risk_layer: bool = Field(
        default=False,
        description=(
            "Master switch for the semantic risk layer. "
            "When False, the layer is completely inactive and has zero "
            "impact on the existing risk scoring pipeline."
        ),
        validation_alias="ENABLE_SEMANTIC_RISK_LAYER",
    )

    # Sarvam API credentials
    sarvam_api_key: str = Field(
        default="",
        description="Sarvam AI API subscription key",
        validation_alias="SARVAM_API_KEY",
    )

    sarvam_base_url: str = Field(
        default="https://api.sarvam.ai",
        description="Sarvam AI API base URL",
        validation_alias="SARVAM_BASE_URL",
    )

    sarvam_timeout_seconds: float = Field(
        default=30.0,
        description="Per-request timeout for Sarvam API calls in seconds",
        validation_alias="SARVAM_TIMEOUT_SECONDS",
    )

    sarvam_model: str = Field(
        default="sarvam-105b",
        description="Sarvam model identifier to use",
        validation_alias="SARVAM_MODEL",
    )

    # Budget
    sarvam_budget_total_inr: float = Field(
        default=50_000.0,
        description="Total Sarvam credit budget in INR",
        validation_alias="SARVAM_BUDGET_TOTAL_INR",
    )

    sarvam_budget_warning_threshold: float = Field(
        default=0.90,
        description="Budget utilization fraction at which to emit a warning",
        validation_alias="SARVAM_BUDGET_WARNING_THRESHOLD",
    )

    # Fusion
    semantic_weight: float = Field(
        default=0.4,
        ge=0.0,
        le=1.0,
        description=(
            "Weight of the semantic risk signal in the final fused score. "
            "The structural signal gets weight (1 - semantic_weight)."
        ),
        validation_alias="SEMANTIC_WEIGHT",
    )

    fail_mode: str = Field(
        default="open",
        description=(
            "How to handle degraded semantic signals. "
            "'open' = ignore semantic signal (availability-first). "
            "'closed' = add penalty to structural score (security-first)."
        ),
        validation_alias="FAIL_MODE",
    )

    # Cache
    cache_ttl_seconds: float = Field(
        default=86400.0,
        description="TTL for cached classification results in seconds (default: 24h)",
        validation_alias="CACHE_TTL_SECONDS",
    )

    cache_max_entries: int = Field(
        default=10_000,
        description="Maximum number of cached classification results",
        validation_alias="CACHE_MAX_ENTRIES",
    )

    # Budget state persistence
    budget_state_file: str = Field(
        default="sarvam_budget_state.json",
        description="File path for persisting budget spend state",
        validation_alias="SARVAM_BUDGET_STATE_FILE",
    )

    @property
    def fail_mode_enum(self) -> FailMode:
        """Convert string fail_mode to FailMode enum."""
        return FailMode(self.fail_mode.lower())
