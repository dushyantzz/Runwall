"""Configuration management for MCP Server."""

import os
from typing import Optional, List
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator


class Settings(BaseSettings):
    """Application settings."""
    
    model_config = dict(
        env_file = ".env",
        case_sensitive = False,
        extra = "allow"
    )
    
    # Server Configuration
    server_host: str = Field(default="0.0.0.0", validation_alias="SERVER_HOST")
    server_port: int = Field(default=8000, validation_alias="SERVER_PORT")
    debug: bool = Field(default=False, validation_alias="DEBUG")
    environment: str = Field(default="production", validation_alias="ENVIRONMENT")
    
    # Security
    secret_key: str = Field(validation_alias="SECRET_KEY")
    access_token_expire_minutes: int = Field(default=30, validation_alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_days: int = Field(default=7, validation_alias="REFRESH_TOKEN_EXPIRE_DAYS")
    algorithm: str = Field(default="HS256", validation_alias="ALGORITHM")
    
    # Database
    database_url: str = Field(default="sqlite:///./mcp_server.db", validation_alias="DATABASE_URL")
    redis_url: str = Field(default="redis://localhost:6379/0", validation_alias="REDIS_URL")
    
    # OAuth Configuration
    google_client_id: Optional[str] = Field(default=None, validation_alias="GOOGLE_CLIENT_ID")
    google_client_secret: Optional[str] = Field(default=None, validation_alias="GOOGLE_CLIENT_SECRET")
    github_client_id: Optional[str] = Field(default=None, validation_alias="GITHUB_CLIENT_ID")
    github_client_secret: Optional[str] = Field(default=None, validation_alias="GITHUB_CLIENT_SECRET")
    
    # Monitoring
    prometheus_port: int = Field(default=9090, validation_alias="PROMETHEUS_PORT")
    log_level: str = Field(default="INFO", validation_alias="LOG_LEVEL")
    
    # Context Management
    max_context_length: int = Field(default=4096, validation_alias="MAX_CONTEXT_LENGTH")
    max_tools_per_session: int = Field(default=50, validation_alias="MAX_TOOLS_PER_SESSION")
    session_timeout_minutes: int = Field(default=60, validation_alias="SESSION_TIMEOUT_MINUTES")
    
    # Multi-tenant
    enable_multi_tenant: bool = Field(default=True, validation_alias="ENABLE_MULTI_TENANT")
    default_tenant: str = Field(default="default", validation_alias="DEFAULT_TENANT")
    
    # Allowed origins for CORS
    allowed_origins: List[str] = Field(default=["*"], validation_alias="ALLOWED_ORIGINS")


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