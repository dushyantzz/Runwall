"""Database models for MCP Server."""

from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Boolean, 
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
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), onupdate=func.now())
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    # Relationships
    sessions: Mapped[List["Session"]] = relationship("Session", back_populates="user")
    api_keys: Mapped[List["APIKey"]] = relationship("APIKey", back_populates="user")
    permissions: Mapped[List["UserPermission"]] = relationship("UserPermission", back_populates="user")
    
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
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), onupdate=func.now())
    
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


class APIKey(Base):
    """API key model."""
    __tablename__ = "api_keys"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    key_hash: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    prefix: Mapped[str] = mapped_column(String(20), index=True)  # For identification
    
    permissions: Mapped[List[str]] = mapped_column(JSON, default=list)
    rate_limit: Mapped[int] = mapped_column(Integer, default=1000)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_used: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="api_keys")
    
    __table_args__ = (
        Index("idx_apikey_user_active", "user_id", "is_active"),
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
    user: Mapped["User"] = relationship("User", back_populates="permissions", foreign_keys=[user_id])
    
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
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), onupdate=func.now())
    
    __table_args__ = (
        Index("idx_tenant_active", "is_active"),
    )