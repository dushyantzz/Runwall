"""Database models for MCP Server."""

from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Boolean, Float,
    JSON, ForeignKey, Index, UniqueConstraint
)
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func

Base = declarative_base()


class User(Base):
    """User model."""
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    tenant_id: Mapped[str] = mapped_column(String(50), default="default", index=True)
    
    # Enterprise Identity Fields
    auth_provider: Mapped[str] = mapped_column(String(50), default="local", index=True)
    mfa_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    failed_login_attempts: Mapped[int] = mapped_column(Integer, default=0)
    locked_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    # Relationships
    sessions: Mapped[List["Session"]] = relationship("Session", back_populates="user")
    api_keys: Mapped[List["APIKey"]] = relationship("APIKey", back_populates="user")
    user_permissions: Mapped[List["UserPermission"]] = relationship("UserPermission", back_populates="user", foreign_keys="[UserPermission.user_id]")
    
    __table_args__ = (
        Index("idx_user_tenant_active", "tenant_id", "is_active"),
    )


class Session(Base):
    """Session model."""
    __tablename__ = "sessions"
    
    id: Mapped[str] = mapped_column(String(255), primary_key=True, index=True)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), index=True)
    tenant_id: Mapped[str] = mapped_column(String(50), index=True)
    client_info: Mapped[Optional[dict]] = mapped_column(JSON)
    capabilities: Mapped[Optional[dict]] = mapped_column(JSON)
    
    # Device and Network Metadata
    ip_address: Mapped[Optional[str]] = mapped_column(String(45))
    user_agent: Mapped[Optional[str]] = mapped_column(Text)
    device_metadata: Mapped[Optional[dict]] = mapped_column(JSON)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_activity: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Relationships
    user: Mapped[Optional["User"]] = relationship("User", back_populates="sessions")
    context_items: Mapped[List["ContextItem"]] = relationship("ContextItem", back_populates="session")
    tool_executions: Mapped[List["ToolExecution"]] = relationship("ToolExecution", back_populates="session")
    
    __table_args__ = (
        Index("idx_session_tenant_active", "tenant_id", "is_active"),
        Index("idx_session_last_activity", "last_activity"),
    )


class TokenRevocation(Base):
    """Stores revoked JWT token IDs (JTIs) before they naturally expire."""
    __tablename__ = "token_revocations"
    
    jti: Mapped[str] = mapped_column(String(255), primary_key=True, index=True)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), index=True)
    session_id: Mapped[Optional[str]] = mapped_column(String(255), ForeignKey("sessions.id"), index=True)
    
    revoked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    reason: Mapped[Optional[str]] = mapped_column(String(255))
    
    __table_args__ = (
        Index("idx_token_expiry", "expires_at"),
    )


class ContextItem(Base):
    """Context item model."""
    __tablename__ = "context_items"
    
    id: Mapped[str] = mapped_column(String(255), primary_key=True, index=True)
    session_id: Mapped[str] = mapped_column(String(255), ForeignKey("sessions.id"), index=True)
    item_type: Mapped[str] = mapped_column(String(50), index=True)
    data: Mapped[dict] = mapped_column(JSON)
    priority: Mapped[int] = mapped_column(Integer, default=2)
    token_cost: Mapped[int] = mapped_column(Integer, default=0)
    access_count: Mapped[int] = mapped_column(Integer, default=0)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_accessed: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    session: Mapped["Session"] = relationship("Session", back_populates="context_items")
    
    __table_args__ = (
        Index("idx_context_session_type", "session_id", "item_type"),
        Index("idx_context_priority_accessed", "priority", "last_accessed"),
    )


class Tool(Base):
    """Tool model."""
    __tablename__ = "tools"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    description: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(50), index=True)
    input_schema: Mapped[dict] = mapped_column(JSON)
    permissions: Mapped[List[str]] = mapped_column(JSON, default=list)
    rate_limit: Mapped[int] = mapped_column(Integer, default=100)
    timeout: Mapped[int] = mapped_column(Integer, default=30)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    tenant_id: Mapped[str] = mapped_column(String(50), default="default", index=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    executions: Mapped[List["ToolExecution"]] = relationship("ToolExecution", back_populates="tool")
    
    __table_args__ = (
        Index("idx_tool_tenant_active", "tenant_id", "is_active"),
        Index("idx_tool_category", "category"),
    )


class ToolExecution(Base):
    """Tool execution model."""
    __tablename__ = "tool_executions"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tool_id: Mapped[int] = mapped_column(Integer, ForeignKey("tools.id"), index=True)
    session_id: Mapped[Optional[str]] = mapped_column(String(255), ForeignKey("sessions.id"), index=True)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), index=True)
    
    arguments: Mapped[dict] = mapped_column(JSON)
    result: Mapped[Optional[dict]] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(String(20), index=True)  # 'success', 'error', 'timeout'
    error_message: Mapped[Optional[str]] = mapped_column(Text)
    execution_time: Mapped[float] = mapped_column(Integer)  # milliseconds
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    tool: Mapped["Tool"] = relationship("Tool", back_populates="executions")
    session: Mapped[Optional["Session"]] = relationship("Session", back_populates="tool_executions")
    
    __table_args__ = (
        Index("idx_execution_tool_status", "tool_id", "status"),
        Index("idx_execution_created_at", "created_at"),
    )


class ServiceAccount(Base):
    """Machine-to-machine service account identity."""
    __tablename__ = "service_accounts"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tenant_id: Mapped[str] = mapped_column(String(50), default="default", index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    api_keys: Mapped[List["APIKey"]] = relationship("APIKey", back_populates="service_account")
    
    __table_args__ = (
        Index("idx_service_account_tenant_active", "tenant_id", "is_active"),
    )

class APIKey(Base):
    """API key model."""
    __tablename__ = "api_keys"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tenant_id: Mapped[str] = mapped_column(String(50), default="default", index=True)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), index=True)
    service_account_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("service_accounts.id"), index=True)
    
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    key_hash: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    prefix: Mapped[str] = mapped_column(String(20), index=True)  # For identification
    
    permissions: Mapped[List[str]] = mapped_column(JSON, default=list)
    allowed_ips: Mapped[List[str]] = mapped_column(JSON, default=list)
    environment: Mapped[str] = mapped_column(String(50), default="production")
    
    rate_limit: Mapped[int] = mapped_column(Integer, default=1000)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_used: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    # Relationships
    user: Mapped[Optional["User"]] = relationship("User", back_populates="api_keys")
    service_account: Mapped[Optional["ServiceAccount"]] = relationship("ServiceAccount", back_populates="api_keys")
    
    __table_args__ = (
        Index("idx_apikey_user_active", "user_id", "is_active"),
        Index("idx_apikey_sa_active", "service_account_id", "is_active"),
    )


class UserPermission(Base):
    """User permission model."""
    __tablename__ = "user_permissions"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True)
    permission: Mapped[str] = mapped_column(String(100), nullable=False)
    resource: Mapped[Optional[str]] = mapped_column(String(100))  # Optional resource identifier
    granted_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"))
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="user_permissions", foreign_keys=[user_id])
    
    __table_args__ = (
        UniqueConstraint("user_id", "permission", "resource", name="uq_user_permission_resource"),
        Index("idx_permission_user", "user_id"),
    )


class AuditLog(Base):
    """Audit log model."""
    __tablename__ = "audit_logs"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), index=True)
    session_id: Mapped[Optional[str]] = mapped_column(String(255), index=True)
    
    event: Mapped[str] = mapped_column(String(100), index=True)
    resource: Mapped[Optional[str]] = mapped_column(String(100))
    details: Mapped[dict] = mapped_column(JSON)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45))  # IPv6 compatible
    user_agent: Mapped[Optional[str]] = mapped_column(Text)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        Index("idx_audit_event_created", "event", "created_at"),
        Index("idx_audit_user_created", "user_id", "created_at"),
    )


class PolicyRule(Base):
    """Versioned policy rule for the intent-aware execution policy engine."""
    __tablename__ = "policy_rules"

    id: Mapped[str] = mapped_column(String(255), primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    version: Mapped[int] = mapped_column(Integer, default=1)
    priority: Mapped[int] = mapped_column(Integer, default=100, index=True)
    tenant_id: Mapped[Optional[str]] = mapped_column(String(50), index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Conditions and action stored as JSON for maximum flexibility
    conditions: Mapped[dict] = mapped_column(JSON, default=dict)
    action: Mapped[str] = mapped_column(
        String(50), nullable=False, default="deny",
        comment="Policy decision: allow, deny, require_approval, simulate, log_only, quarantine",
    )
    action_params: Mapped[Optional[dict]] = mapped_column(
        JSON, default=dict,
        comment="Additional params e.g. required_approvers, expiry_minutes",
    )

    created_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    decision_logs: Mapped[List["PolicyDecisionLog"]] = relationship(
        "PolicyDecisionLog", back_populates="matched_rule",
    )

    __table_args__ = (
        Index("idx_policy_rule_priority_active", "priority", "is_active"),
        Index("idx_policy_rule_tenant", "tenant_id"),
    )


class PolicyDecisionLog(Base):
    """Immutable audit record of every policy decision made by the governance engine."""
    __tablename__ = "policy_decision_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    execution_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("tool_executions.id"), index=True,
    )
    session_id: Mapped[Optional[str]] = mapped_column(String(255), index=True)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), index=True)
    tenant_id: Mapped[Optional[str]] = mapped_column(String(50), index=True)

    tool_name: Mapped[str] = mapped_column(String(100), index=True)
    intent_category: Mapped[str] = mapped_column(String(50), index=True)
    risk_score: Mapped[float] = mapped_column(Float, index=True)
    risk_level: Mapped[str] = mapped_column(String(20), index=True)
    decision: Mapped[str] = mapped_column(String(50), index=True)

    matched_rule_id: Mapped[Optional[str]] = mapped_column(
        String(255), ForeignKey("policy_rules.id"), index=True,
    )
    evaluation_chain: Mapped[Optional[dict]] = mapped_column(
        JSON, comment="Full explainability trace: all rules evaluated with match/skip reasons",
    )
    parameters_hash: Mapped[Optional[str]] = mapped_column(
        String(64), comment="SHA-256 hash of the tool parameters for deduplication",
    )
    explanation: Mapped[Optional[str]] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    matched_rule: Mapped[Optional["PolicyRule"]] = relationship(
        "PolicyRule", back_populates="decision_logs",
    )

    __table_args__ = (
        Index("idx_decision_log_tool_decision", "tool_name", "decision"),
        Index("idx_decision_log_risk", "risk_level", "risk_score"),
        Index("idx_decision_log_created", "created_at"),
        Index("idx_decision_log_tenant_created", "tenant_id", "created_at"),
    )


class Tenant(Base):
    """Tenant model for multi-tenancy."""
    __tablename__ = "tenants"
    
    id: Mapped[str] = mapped_column(String(50), primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    settings: Mapped[dict] = mapped_column(JSON, default=dict)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    max_users: Mapped[int] = mapped_column(Integer, default=100)
    max_sessions: Mapped[int] = mapped_column(Integer, default=1000)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        Index("idx_tenant_active", "is_active"),
    )