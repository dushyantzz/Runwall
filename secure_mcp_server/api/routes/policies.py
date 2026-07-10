from fastapi import APIRouter, HTTPException, Depends
from typing import List
from sqlalchemy.future import select
import uuid

from secure_mcp_server.api.schemas import PolicyBundleDeployRequest
from secure_mcp_server.database import get_db_manager, PolicyBundle

router = APIRouter()

@router.post("", status_code=201)
async def deploy_policy(request: PolicyBundleDeployRequest):
    """Deploy a new OPA/Rego PolicyBundle version."""
    tenant_id = "default" # Normally extracted from auth dependency
    
    async with get_db_manager().get_session_context() as db:
        if request.is_active and request.rollout_percentage == 100:
            stmt = select(PolicyBundle).where(
                PolicyBundle.tenant_id == tenant_id, 
                PolicyBundle.is_active == True
            )
            result = await db.execute(stmt)
            for active_bundle in result.scalars().all():
                active_bundle.is_active = False
                
        bundle = PolicyBundle(
            id=f"pb-{uuid.uuid4().hex[:8]}",
            tenant_id=tenant_id,
            version=request.version,
            rego_content=request.rego_content,
            is_active=request.is_active,
            is_simulation_mode=request.is_simulation_mode,
            rollout_percentage=request.rollout_percentage
        )
        db.add(bundle)
        await db.commit()
        
        return {"success": True, "bundle_id": bundle.id, "version": request.version}

@router.get("")
async def list_policies():
    """List all deployed policy bundles."""
    async with get_db_manager().get_session_context() as db:
        stmt = select(PolicyBundle).where(PolicyBundle.tenant_id == "default")
        result = await db.execute(stmt)
        bundles = result.scalars().all()
        return [
            {
                "id": b.id, 
                "version": b.version, 
                "is_active": b.is_active,
                "is_simulation_mode": b.is_simulation_mode
            } 
            for b in bundles
        ]
