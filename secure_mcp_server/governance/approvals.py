"""
Approval Workflow Engine.

This module provides an asynchronous staging area for actions that require human approval.
Rather than blocking and failing instantly, high-risk actions are queued with a rich
context summary, allowing administrators to make informed decisions before execution.
"""
from typing import Dict, Any, Optional, List
import uuid
import structlog
from datetime import datetime, timezone
from sqlalchemy.future import select

from secure_mcp_server.database import get_db_manager, ApprovalRequest

logger = structlog.get_logger(__name__)


class ApprovalManager:
    """Manages the lifecycle of approval requests."""

    async def create_request(
        self,
        tenant_id: str,
        requester_id: Optional[int],
        tool_name: str,
        arguments: Dict[str, Any],
        context_snapshot: Dict[str, Any],
        required_approvers: List[str]
    ) -> Optional[str]:
        """Create a new approval request."""
        try:
            async with get_db_manager().get_session_context() as db:
                request_id = f"req-{uuid.uuid4().hex[:12]}"
                
                # Format required roles (just take the first one or default to admin)
                required_role = required_approvers[0] if required_approvers else "admin"
                
                req = ApprovalRequest(
                    id=request_id,
                    tenant_id=tenant_id,
                    requester_id=requester_id,
                    tool_name=tool_name,
                    arguments=arguments,
                    context_snapshot=context_snapshot,
                    status="PENDING",
                    required_role=required_role
                )
                db.add(req)
                await db.commit()
                logger.info("Approval request created", request_id=request_id, tool_name=tool_name)
                return request_id
        except Exception as e:
            logger.error("Failed to create approval request", error=str(e))
            return None

    async def review_request(
        self,
        request_id: str,
        decision: str,  # APPROVED or REJECTED
        reviewer_id: int,
        reason: str
    ) -> Dict[str, Any]:
        """Approve or reject a pending request."""
        if decision not in ["APPROVED", "REJECTED"]:
            return {"success": False, "error": "Decision must be APPROVED or REJECTED"}
            
        try:
            async with get_db_manager().get_session_context() as db:
                stmt = select(ApprovalRequest).where(ApprovalRequest.id == request_id)
                result = await db.execute(stmt)
                req = result.scalars().first()
                
                if not req:
                    return {"success": False, "error": f"Request {request_id} not found."}
                    
                if req.status != "PENDING":
                    return {"success": False, "error": f"Request is already {req.status}."}
                    
                req.status = decision
                req.reviewed_by = reviewer_id
                req.review_reason = reason
                req.reviewed_at = datetime.now(timezone.utc)
                
                await db.commit()
                logger.info("Approval request reviewed", request_id=request_id, decision=decision, reviewer_id=reviewer_id)
                return {"success": True, "message": f"Request {request_id} is now {decision}."}
        except Exception as e:
            logger.error("Failed to review approval request", error=str(e))
            return {"success": False, "error": str(e)}

    async def get_request_for_execution(self, request_id: str) -> Dict[str, Any]:
        """Fetch an approved request and mark it as EXECUTED."""
        try:
            async with get_db_manager().get_session_context() as db:
                stmt = select(ApprovalRequest).where(ApprovalRequest.id == request_id)
                result = await db.execute(stmt)
                req = result.scalars().first()
                
                if not req:
                    return {"success": False, "error": f"Request {request_id} not found."}
                    
                if req.status != "APPROVED":
                    return {"success": False, "error": f"Cannot execute request. Current status: {req.status}"}
                    
                # We return the tool name and args, and update status
                req.status = "EXECUTED"
                await db.commit()
                
                return {
                    "success": True,
                    "tool_name": req.tool_name,
                    "arguments": req.arguments,
                    "context_snapshot": req.context_snapshot
                }
        except Exception as e:
            logger.error("Failed to fetch request for execution", error=str(e))
            return {"success": False, "error": str(e)}

# Global instance
approval_manager = ApprovalManager()
