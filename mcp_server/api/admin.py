"""Admin endpoints."""

from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
import structlog

from ..core.monitoring import MetricsCollector
from ..core.context_manager import ContextManager
from ..config import get_settings
from .auth import get_current_user

logger = structlog.get_logger()
router = APIRouter()


class SystemStatsResponse(BaseModel):
    """System statistics response model."""
    active_sessions: int
    total_tools: int
    total_users: int
    uptime_seconds: float
    memory_usage_mb: float
    cpu_percent: float


class SessionResponse(BaseModel):
    """Session response model."""
    session_id: str
    user_id: Optional[str]
    tenant_id: str
    created_at: str
    last_activity: str
    total_items: int
    total_tokens: int
    active_tools: List[str]


class AlertResponse(BaseModel):
    """Alert response model."""
    rule_name: str
    condition: str
    threshold: float
    current_value: float
    severity: str
    status: str
    triggered_at: Optional[str] = None


class TenantResponse(BaseModel):
    """Tenant response model."""
    id: str
    name: str
    is_active: bool
    user_count: int
    session_count: int
    created_at: str


def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """Require admin privileges."""
    if not current_user.get("is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user


@router.get("/stats", response_model=SystemStatsResponse)
async def get_system_stats(
    admin_user: dict = Depends(require_admin)
) -> SystemStatsResponse:
    """Get system statistics."""
    import psutil
    import time
    
    process = psutil.Process()
    
    # Mock data - in production, get from actual managers
    return SystemStatsResponse(
        active_sessions=5,
        total_tools=8,
        total_users=12,
        uptime_seconds=time.time() - 1698624000,  # Mock start time
        memory_usage_mb=process.memory_info().rss / 1024 / 1024,
        cpu_percent=process.cpu_percent()
    )


@router.get("/sessions", response_model=List[SessionResponse])
async def list_sessions(
    admin_user: dict = Depends(require_admin)
) -> List[SessionResponse]:
    """List all active sessions."""
    # Mock data - in production, get from context manager
    return [
        SessionResponse(
            session_id="session_1",
            user_id="admin",
            tenant_id="default",
            created_at="2025-10-30T00:30:00Z",
            last_activity="2025-10-30T01:15:00Z",
            total_items=5,
            total_tokens=1024,
            active_tools=["calculator", "echo"]
        ),
        SessionResponse(
            session_id="session_2",
            user_id="user1",
            tenant_id="default",
            created_at="2025-10-30T00:45:00Z",
            last_activity="2025-10-30T01:10:00Z",
            total_items=3,
            total_tokens=512,
            active_tools=["text_processor"]
        )
    ]


@router.delete("/sessions/{session_id}")
async def terminate_session(
    session_id: str,
    admin_user: dict = Depends(require_admin)
) -> Dict[str, str]:
    """Terminate a specific session."""
    # In production, call context_manager.cleanup_session_context(session_id)
    logger.info(f"Session {session_id} terminated by admin", admin_id=admin_user["sub"])
    return {"message": f"Session {session_id} terminated"}


@router.get("/alerts", response_model=List[AlertResponse])
async def get_alerts(
    admin_user: dict = Depends(require_admin)
) -> List[AlertResponse]:
    """Get active alerts."""
    # Mock data - in production, get from alert manager
    return [
        AlertResponse(
            rule_name="High Error Rate",
            condition="error_rate_high",
            threshold=5.0,
            current_value=3.2,
            severity="warning",
            status="resolved",
            triggered_at="2025-10-30T00:45:00Z"
        )
    ]


@router.get("/tenants", response_model=List[TenantResponse])
async def list_tenants(
    admin_user: dict = Depends(require_admin)
) -> List[TenantResponse]:
    """List all tenants."""
    # Mock data - in production, get from database
    return [
        TenantResponse(
            id="default",
            name="Default Tenant",
            is_active=True,
            user_count=10,
            session_count=5,
            created_at="2025-10-01T00:00:00Z"
        ),
        TenantResponse(
            id="enterprise",
            name="Enterprise Tenant",
            is_active=True,
            user_count=50,
            session_count=25,
            created_at="2025-10-15T00:00:00Z"
        )
    ]


@router.post("/maintenance")
async def enter_maintenance_mode(
    admin_user: dict = Depends(require_admin)
) -> Dict[str, str]:
    """Put system into maintenance mode."""
    # In production, this would:
    # 1. Stop accepting new connections
    # 2. Gracefully close existing sessions
    # 3. Set maintenance flag
    
    logger.warning("System entering maintenance mode", admin_id=admin_user["sub"])
    return {"message": "System entering maintenance mode"}


@router.delete("/maintenance")
async def exit_maintenance_mode(
    admin_user: dict = Depends(require_admin)
) -> Dict[str, str]:
    """Exit maintenance mode."""
    logger.info("System exiting maintenance mode", admin_id=admin_user["sub"])
    return {"message": "System exiting maintenance mode"}


@router.post("/cleanup")
async def cleanup_resources(
    admin_user: dict = Depends(require_admin)
) -> Dict[str, Any]:
    """Cleanup expired resources."""
    # In production, this would:
    # 1. Clean expired sessions
    # 2. Clean expired tokens
    # 3. Vacuum database
    # 4. Clean temporary files
    
    cleaned_sessions = 3
    cleaned_tokens = 15
    
    logger.info(
        "Resource cleanup completed", 
        admin_id=admin_user["sub"],
        cleaned_sessions=cleaned_sessions,
        cleaned_tokens=cleaned_tokens
    )
    
    return {
        "message": "Resource cleanup completed",
        "cleaned_sessions": cleaned_sessions,
        "cleaned_tokens": cleaned_tokens
    }


@router.get("/logs")
async def get_recent_logs(
    limit: int = 100,
    admin_user: dict = Depends(require_admin)
) -> List[Dict[str, Any]]:
    """Get recent system logs."""
    # Mock data - in production, read from log files or log aggregation system
    return [
        {
            "timestamp": "2025-10-30T01:15:00Z",
            "level": "INFO",
            "message": "Tool executed successfully",
            "user_id": "user1",
            "tool_name": "calculator"
        },
        {
            "timestamp": "2025-10-30T01:14:30Z",
            "level": "WARNING",
            "message": "Rate limit approached",
            "user_id": "user2",
            "endpoint": "/tools/execute"
        }
    ]