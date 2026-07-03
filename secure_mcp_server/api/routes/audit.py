from fastapi import APIRouter
from sqlalchemy.future import select
from typing import List

from secure_mcp_server.api.schemas import AuditLogResponse, PolicyDecisionResponse
from secure_mcp_server.database import get_db_manager, AuditLog, PolicyDecisionLog

router = APIRouter()

@router.get("/logs", response_model=List[AuditLogResponse])
async def get_audit_logs(limit: int = 50):
    """Retrieve execution audit logs."""
    async with get_db_manager().get_session_context() as db:
        stmt = select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
        result = await db.execute(stmt)
        return result.scalars().all()

@router.get("/decisions", response_model=List[PolicyDecisionResponse])
async def get_policy_decisions(limit: int = 50):
    """Retrieve policy decision logs (ALLOW/DENY/REQUIRE_APPROVAL)."""
    async with get_db_manager().get_session_context() as db:
        stmt = select(PolicyDecisionLog).order_by(PolicyDecisionLog.created_at.desc()).limit(limit)
        result = await db.execute(stmt)
        return result.scalars().all()
