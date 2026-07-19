"""Configuration management for the Secure MCP Server."""

import os
from typing import List, Optional
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    model_config = dict(
        env_file = ".env",
        env_file_encoding = "utf-8",
        case_sensitive = False,
        extra = "allow"
    )
    
    # Server Configuration
    server_name: str = Field(default="Secure MCP Server", description="Server name")
    debug: bool = Field(default=False, validation_alias="DEBUG")
    environment: str = Field(default="production", validation_alias="ENVIRONMENT")
    
    secret_key: str = Field(default="runwall-secret-key-temporary-change-in-production-12345", description="Secret key for JWT tokens", validation_alias="SECRET_KEY")
    access_token_expire_minutes: int = Field(default=30, validation_alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_days: int = Field(default=7, validation_alias="REFRESH_TOKEN_EXPIRE_DAYS")
    algorithm: str = Field(default="HS256", validation_alias="ALGORITHM")
    
    # Database Configuration
    database_url: str = Field(
        default="postgresql+asyncpg://postgres.catmnzhnxfmgayvnvszh:Daredevil%409451856439@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?prepared_statement_cache_size=0", 
        description="Database connection URL",
        validation_alias="DATABASE_URL"
    )
    
    # Redis Configuration (optional)
    redis_url: Optional[str] = Field(default=None, validation_alias="REDIS_URL")
    
    # Context Management
    max_context_length: int = Field(default=8192, validation_alias="MAX_CONTEXT_LENGTH")
    max_tools_per_session: int = Field(default=50, validation_alias="MAX_TOOLS_PER_SESSION")
    session_timeout_minutes: int = Field(default=60, validation_alias="SESSION_TIMEOUT_MINUTES")
    
    # Multi-tenant Support
    enable_multi_tenant: bool = Field(default=True, validation_alias="ENABLE_MULTI_TENANT")
    default_tenant: str = Field(default="default", validation_alias="DEFAULT_TENANT")
    
    # Rate Limiting & Distributed Quotas
    default_tenant_rpm: int = Field(default=1000, validation_alias="DEFAULT_TENANT_RPM")
    default_user_rpm: int = Field(default=100, validation_alias="DEFAULT_USER_RPM")
    default_service_account_rpm: int = Field(default=500, validation_alias="DEFAULT_SA_RPM")
    default_tool_rpm: int = Field(default=50, validation_alias="DEFAULT_TOOL_RPM")
    rate_limit_requests_per_minute: int = Field(default=60, validation_alias="RATE_LIMIT_RPM") # legacy
    rate_limit_tools_per_hour: int = Field(default=1000, validation_alias="RATE_LIMIT_TPH") # legacy
    
    # Monitoring and Logging
    log_level: str = Field(default="INFO", validation_alias="LOG_LEVEL")
    enable_metrics: bool = Field(default=True, validation_alias="ENABLE_METRICS")
    metrics_retention_days: int = Field(default=30, validation_alias="METRICS_RETENTION_DAYS")
    
    # Security Features
    enable_audit_logging: bool = Field(default=True, validation_alias="ENABLE_AUDIT_LOGGING")
    enable_input_sanitization: bool = Field(default=True, validation_alias="ENABLE_INPUT_SANITIZATION")
    enable_rate_limiting: bool = Field(default=True, validation_alias="ENABLE_RATE_LIMITING")
    
    # Tool Execution
    tool_execution_timeout: int = Field(default=30, validation_alias="TOOL_EXECUTION_TIMEOUT")
    enable_tool_sandboxing: bool = Field(default=True, validation_alias="ENABLE_TOOL_SANDBOXING")
    
    # Admin Settings
    admin_username: str = Field(default="admin", validation_alias="ADMIN_USERNAME")
    admin_password: str = Field(default="admin123", validation_alias="ADMIN_PASSWORD")
    admin_email: str = Field(default="admin@example.com", validation_alias="ADMIN_EMAIL")

    # Governance — Intent-Aware Execution Policy Engine
    enable_intent_policy: bool = Field(
        default=True,
        description="Enable the intent-aware policy engine in the execution pipeline",
        validation_alias="ENABLE_INTENT_POLICY",
    )
    default_policy_action: str = Field(
        default="deny",
        description="Default decision when no policy rule matches (Zero Trust = deny)",
        validation_alias="DEFAULT_POLICY_ACTION",
    )
    high_risk_threshold: float = Field(
        default=0.70,
        description="Risk score >= this value is classified as HIGH",
        validation_alias="HIGH_RISK_THRESHOLD",
    )
    critical_risk_threshold: float = Field(
        default=0.90,
        description="Risk score >= this value is classified as CRITICAL",
        validation_alias="CRITICAL_RISK_THRESHOLD",
    )
    risk_score_weights: Optional[dict] = Field(
        default=None,
        description=(
            "Custom factor weights for risk scoring. "
            "Keys: tool_sensitivity, parameter_risk, user_trust, "
            "resource_sensitivity, blast_radius, temporal_risk, behavioral_anomaly"
        ),
        validation_alias="RISK_SCORE_WEIGHTS",
    )

    # ── Razorpay Payment Integration ──────────────────────────────────────
    razorpay_key_id: str = Field(default="", validation_alias="RAZORPAY_KEY_ID")
    razorpay_key_secret: str = Field(default="", validation_alias="RAZORPAY_KEY_SECRET")
    razorpay_webhook_secret: str = Field(default="", validation_alias="RAZORPAY_WEBHOOK_SECRET")
    razorpay_plan_id: str = Field(default="", validation_alias="RAZORPAY_PLAN_ID")

    # Tier configuration
    free_tier_requests: int = Field(default=15, validation_alias="FREE_TIER_REQUESTS")
    pro_tier_requests: int = Field(default=2000, validation_alias="PRO_TIER_REQUESTS")
    pro_tier_price_paise: int = Field(default=67400, validation_alias="PRO_TIER_PRICE_PAISE")


# Global settings instance
_settings: Optional[Settings] = None


def get_settings() -> Settings:
    """Get application settings (singleton pattern)."""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings


def reload_settings() -> Settings:
    """Reload settings (useful for testing)."""
    global _settings
    _settings = None
    return get_settings()