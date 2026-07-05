from fastapi import APIRouter, HTTPException, Depends, Body
from sqlalchemy.future import select
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timezone
import structlog
import uuid

from secure_mcp_server.database import (
    get_db_manager, User, ServiceAccount, APIKey, Session,
    ToolManifest, ApprovalRequest, AuditLog, PolicyDecisionLog,
    PolicyBundle, TaskContract, ReversibleExecutionLog
)
from secure_mcp_server.config import get_settings
from secure_mcp_server.auth import AuthManager
from secure_mcp_server.governance import (
    IntentClassifier, RiskScorer, PolicyEvaluator,
    PolicyDecisionType, IntentCategory, BlastRadius
)
from secure_mcp_server.governance.opa_evaluator import OPAPolicyEvaluator
from secure_mcp_server.governance.taint import TaintManager
from secure_mcp_server.governance.compensation import compensation_registry
from secure_mcp_server.governance.contracts import ContractManager

logger = structlog.get_logger(__name__)
router = APIRouter()

# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------
class APIKeyCreateRequest(BaseModel):
    name: str
    service_account_id: int
    allowed_ips: List[str] = ["127.0.0.1/32"]
    environment: str = "production"

class TaintAddRequest(BaseModel):
    session_id: str
    label: str

class RiskScoreRequest(BaseModel):
    tool_name: str
    parameters: Dict[str, Any]
    role: str = "developer"

class SimulationRequest(BaseModel):
    tool_name: str
    parameters: Dict[str, Any]
    role: str = "developer"
    session_id: Optional[str] = None

# ---------------------------------------------------------------------------
# 1. Identity & Access Control
# ---------------------------------------------------------------------------
@router.get("/identity/users")
async def get_users():
    async with get_db_manager().get_session_context() as db:
        stmt = select(User)
        res = await db.execute(stmt)
        users = res.scalars().all()
        return [
            {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "full_name": u.full_name,
                "is_active": u.is_active,
                "is_admin": u.is_admin,
                "created_at": u.created_at
            }
            for u in users
        ]

@router.get("/identity/service-accounts")
async def get_service_accounts():
    async with get_db_manager().get_session_context() as db:
        stmt = select(ServiceAccount)
        res = await db.execute(stmt)
        accounts = res.scalars().all()
        return [
            {
                "id": sa.id,
                "name": sa.name,
                "description": sa.description,
                "tenant_id": sa.tenant_id,
                "is_active": sa.is_active,
                "created_at": sa.created_at
            }
            for sa in accounts
        ]

@router.get("/identity/keys")
async def get_api_keys():
    async with get_db_manager().get_session_context() as db:
        stmt = select(APIKey)
        res = await db.execute(stmt)
        keys = res.scalars().all()
        return [
            {
                "id": k.id,
                "name": k.name,
                "prefix": k.prefix,
                "service_account_id": k.service_account_id,
                "environment": k.environment,
                "allowed_ips": k.allowed_ips,
                "is_active": k.is_active,
                "created_at": k.created_at
            }
            for k in keys
        ]

@router.post("/identity/keys", status_code=201)
async def generate_api_key(req: APIKeyCreateRequest):
    settings = get_settings()
    auth_manager = AuthManager(settings)
    
    # Verify service account exists
    async with get_db_manager().get_session_context() as db:
        stmt = select(ServiceAccount).where(ServiceAccount.id == req.service_account_id)
        res = await db.execute(stmt)
        sa = res.scalar_one_or_none()
        if not sa:
            raise HTTPException(status_code=404, detail="Service account not found")
            
    # Generate API key
    raw_key = await auth_manager.create_api_key(
        name=req.name,
        service_account_id=req.service_account_id,
        allowed_ips=req.allowed_ips,
        environment=req.environment
    )
    return {"success": True, "api_key": raw_key, "message": "API key generated successfully"}

# ---------------------------------------------------------------------------
# 2. Tenant Management
# ---------------------------------------------------------------------------
@router.get("/tenants")
async def get_tenants():
    return [
        {"id": "default", "name": "Default Tenant Org", "tier": "Enterprise", "status": "active"},
        {"id": "tenant-staging", "name": "Staging Environment Org", "tier": "Developer", "status": "active"},
        {"id": "tenant-sandbox", "name": "Isolated Sandbox Org", "tier": "Free", "status": "active"}
    ]

# ---------------------------------------------------------------------------
# 3. Tool / MCP Registry
# ---------------------------------------------------------------------------
@router.get("/tools")
async def get_tool_registry():
    async with get_db_manager().get_session_context() as db:
        stmt = select(ToolManifest)
        res = await db.execute(stmt)
        manifests = res.scalars().all()
        
        # If empty, return some default mocked values
        if not manifests:
            return [
                {"tool_name": "fetch_webpage", "description_hash": "a4b2c1...", "trust_status": "TRUSTED", "version": 1},
                {"tool_name": "jira_api", "description_hash": "9f2e3d...", "trust_status": "TRUSTED", "version": 1},
                {"tool_name": "salesforce_api", "description_hash": "5d2c1b...", "trust_status": "TRUSTED", "version": 1},
                {"tool_name": "delete_database", "description_hash": "f3a2e1...", "trust_status": "QUARANTINED", "version": 2}
            ]
            
        return [
            {
                "tool_name": m.tool_name,
                "description_hash": m.description_hash[:16] + "...",
                "trust_status": m.trust_status,
                "version": m.version,
                "last_verified_at": m.last_verified_at
            }
            for m in manifests
        ]

# ---------------------------------------------------------------------------
# 4. Taint Tracking Engine
# ---------------------------------------------------------------------------
@router.get("/taint/sessions")
async def get_taint_sessions():
    async with get_db_manager().get_session_context() as db:
        stmt = select(Session)
        res = await db.execute(stmt)
        sessions = res.scalars().all()
        return [
            {
                "id": s.id,
                "user_id": s.user_id,
                "tenant_id": s.tenant_id,
                "taints": getattr(s, "taint_labels", []),
                "is_active": s.is_active,
                "last_activity": s.last_activity
            }
            for s in sessions
        ]

@router.post("/taint/add")
async def add_session_taint(req: TaintAddRequest):
    taint_manager = TaintManager()
    
    # Verify session exists
    async with get_db_manager().get_session_context() as db:
        stmt = select(Session).where(Session.id == req.session_id)
        res = await db.execute(stmt)
        session = res.scalar_one_or_none()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
            
    success = await taint_manager.add_taint(req.session_id, req.label)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to add taint label")
    return {"success": True, "message": f"Added taint label '{req.label}' to session '{req.session_id}'"}

# ---------------------------------------------------------------------------
# 5. Risk Scoring Engine Simulator
# ---------------------------------------------------------------------------
@router.post("/risk/score")
async def compute_risk_score(req: RiskScoreRequest):
    intent_classifier = IntentClassifier()
    risk_scorer = RiskScorer()
    
    # Classify intent
    intent = intent_classifier.classify(req.tool_name, req.parameters)
    
    # Mock user context from role
    user_context = {
        "role": req.role,
        "tenant_id": "default",
        "is_admin": req.role == "admin"
    }
    
    # Score risk
    risk = risk_scorer.score(intent, user_context, {})
    return {
        "success": True,
        "intent_category": intent.intent_category.value,
        "blast_radius": intent.blast_radius.value,
        "risk_score": risk.score,
        "risk_level": risk.level.value,
        "explanation": risk.explanation,
        "factors": risk.factors.model_dump()
    }

# ---------------------------------------------------------------------------
# 6. Runtime Interceptor & Policy Simulation
# ---------------------------------------------------------------------------
@router.post("/interceptor/simulate")
async def simulate_execution(req: SimulationRequest):
    intent_classifier = IntentClassifier()
    risk_scorer = RiskScorer()
    opa_evaluator = OPAPolicyEvaluator()
    
    # Classify intent
    intent = intent_classifier.classify(req.tool_name, req.parameters)
    
    # Enrich session taints if session exists
    session_taints = []
    if req.session_id:
        taint_manager = TaintManager()
        session_taints = await taint_manager.get_session_taints(req.session_id)
        intent.taint_labels = session_taints
        
    # Mock user context
    user_context = {
        "user_id": 1,
        "role": req.role,
        "tenant_id": "default",
        "is_admin": req.role == "admin",
        "session_id": req.session_id or "sim-session-001"
    }
    
    # Score risk
    risk = risk_scorer.score(intent, user_context, {})
    
    # Evaluate OPA policies
    opa_res = await opa_evaluator.evaluate(
        intent=intent,
        risk=risk,
        user_context=user_context
    )
    
    return {
        "success": True,
        "decision": opa_res.decision.value,
        "explanation": opa_res.explanation,
        "intent": {
            "category": intent.intent_category.value,
            "blast_radius": intent.blast_radius.value,
            "is_destructive": intent.is_destructive,
            "taints": session_taints
        },
        "risk": {
            "score": risk.score,
            "level": risk.level.value,
            "factors": risk.factors.model_dump()
        }
    }

# ---------------------------------------------------------------------------
# 7. Rollbacks & Compensations
# ---------------------------------------------------------------------------
@router.get("/rollback/logs")
async def get_rollback_logs():
    async with get_db_manager().get_session_context() as db:
        stmt = select(ReversibleExecutionLog)
        res = await db.execute(stmt)
        logs = res.scalars().all()
        return [
            {
                "id": log.id,
                "tenant_id": log.tenant_id,
                "tool_name": log.tool_name,
                "compensation_handler": log.compensation_handler,
                "compensation_arguments": log.compensation_arguments,
                "status": log.status,
                "created_at": log.created_at,
                "rolled_back_at": log.rolled_back_at
            }
            for log in logs
        ]

@router.post("/rollback/{log_id}/trigger")
async def trigger_rollback(log_id: str):
    # Register mock creation and compensation handlers if not present
    @compensation_registry.register_handler("delete_jira_issue")
    async def rollback_jira(issue_key, project):
        return {"success": True}
        
    @compensation_registry.register_handler("rollback_db_write")
    async def rollback_db(row_id, table):
        return {"success": True}
        
    res = await compensation_registry.rollback_execution(log_id, user_id=1)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error"))
    return res

# ---------------------------------------------------------------------------
# 8. Quotas & Limits Config
# ---------------------------------------------------------------------------
@router.get("/quotas/limits")
async def get_limits():
    return {
        "default_tenant_rpm": 120,
        "default_user_rpm": 60,
        "default_service_account_rpm": 300,
        "default_tool_rpm": 45,
        "status": "normal",
        "current_tph": 124,
        "is_throttled": False
    }

# ---------------------------------------------------------------------------
# 9. Sandboxing Execution Profiles
# ---------------------------------------------------------------------------
@router.get("/sandboxing/profiles")
async def get_sandbox_profiles():
    return [
        {
            "profile_name": "Standard Secure Sandbox",
            "isolation_type": "Docker Container",
            "max_memory_mb": 512,
            "max_cpu_percent": 25,
            "allow_network": False,
            "status": "ready"
        },
        {
            "profile_name": "Critical Read-Only Sandbox",
            "isolation_type": "gVisor MicroVM",
            "max_memory_mb": 256,
            "max_cpu_percent": 10,
            "allow_network": False,
            "status": "ready"
        },
        {
            "profile_name": "External Integration Profile",
            "isolation_type": "Docker Container (Bridged)",
            "max_memory_mb": 1024,
            "max_cpu_percent": 50,
            "allow_network": True,
            "status": "ready"
        }
    ]
