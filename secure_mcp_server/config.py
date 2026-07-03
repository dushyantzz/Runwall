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
    
    # Security Settings
    secret_key: str = Field(description="Secret key for JWT tokens", validation_alias="SECRET_KEY")
    access_token_expire_minutes: int = Field(default=30, validation_alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_days: int = Field(default=7, validation_alias="REFRESH_TOKEN_EXPIRE_DAYS")
    algorithm: str = Field(default="HS256", validation_alias="ALGORITHM")
    
    # Database Configuration
    database_url: str = Field(
        default="sqlite+aiosqlite:///./secure_mcp.db", 
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
    
    # Rate Limiting
    rate_limit_requests_per_minute: int = Field(default=60, validation_alias="RATE_LIMIT_RPM")
    rate_limit_tools_per_hour: int = Field(default=1000, validation_alias="RATE_LIMIT_TPH")
    
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