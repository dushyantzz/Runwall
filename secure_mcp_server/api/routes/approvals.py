from fastapi import APIRouter, HTTPException
from sqlalchemy.future import select

from secure_mcp_server.api.schemas import ApprovalReviewRequest
from secure_mcp_server.database import get_db_manager, ApprovalRequest
from secure_mcp_server.governance import approval_manager

router = APIRouter()

@router.get("")
async def get_pending_approvals():
    """List all pending approval requests."""
    async with get_db_manager().get_session_context() as db:
        stmt = select(ApprovalRequest).where(
            ApprovalRequest.tenant_id == "default",
            ApprovalRequest.status == "PENDING"
        )
        result = await db.execute(stmt)
        requests = result.scalars().all()
        return [
            {
                "id": r.id,
                "tool_name": r.tool_name,
                "context": r.context_snapshot,
                "created_at": r.created_at
            }
            for r in requests
        ]

@router.post("/{approval_id}/review")
async def review_approval(approval_id: str, request: ApprovalReviewRequest):
    """Review an approval request (Approve/Reject)."""
    result = await approval_manager.review_request(
        request_id=approval_id,
        decision=request.decision,
        reviewer_id="admin_api_user", # Normally from auth context
        reason=request.reason
    )
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result
