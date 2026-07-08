"""
Admin MCP Tools for Governance & Platform Management.
Provides CRUD for PolicyRules, Audit Log exploration, and Decision Logs.
"""
from typing import Dict, Any, List, Optional
import json
import uuid
import structlog
from fastmcp import FastMCP
from sqlalchemy.future import select

from secure_mcp_server.database import get_db_manager, PolicyRule, PolicyDecisionLog, AuditLog, ToolManifest, ApprovalRequest, PolicyBundle
from secure_mcp_server.governance import compensation_registry, ToolTrustManager, approval_manager, OPAPolicyEvaluator, IntentCategory, RiskScorer, IntentClassifier

logger = structlog.get_logger(__name__)


def _require_admin(request):
    """Ensure the requester is an admin."""
    user_ctx = getattr(request, "user_context", None)
    if not user_ctx and hasattr(request, "fastmcp_context") and request.fastmcp_context:
        user_ctx = getattr(request.fastmcp_context, "user_context", {})
    user_ctx = user_ctx or {}
    if not user_ctx.get("is_admin", False):
        raise PermissionError("Admin privileges required for this operation.")
    return user_ctx


def register_admin_tools(mcp: FastMCP):
    """Register all administrative tools to the MCP server."""
    
    @mcp.tool()
    async def manage_policy(
        action: str,
        rule_id: Optional[str] = None,
        name: Optional[str] = None,
        description: Optional[str] = None,
        priority: Optional[int] = None,
        conditions: Optional[str] = None,  # JSON string
        policy_action: Optional[str] = None,
        action_params: Optional[str] = None,  # JSON string
    ) -> Dict[str, Any]:
        """
        Manage Execution Policies (CRUD).
        action: 'create', 'read', 'update', 'delete', 'list'
        """
        user_ctx = _require_admin(mcp.current_request)
        tenant_id = user_ctx.get("tenant_id", "default")
        
        async with get_db_manager().get_session_context() as db:
            if action == "list":
                stmt = select(PolicyRule).where(PolicyRule.tenant_id == tenant_id).order_by(PolicyRule.priority)
                result = await db.execute(stmt)
                rules = result.scalars().all()
                return {
                    "success": True, 
                    "rules": [
                        {
                            "id": r.id, 
                            "name": r.name, 
                            "priority": r.priority, 
                            "action": r.action, 
                            "active": r.is_active
                        } for r in rules
                    ]
                }
                
            elif action == "create":
                if not name or not policy_action:
                    return {"success": False, "error": "name and policy_action required for create"}
                
                new_rule = PolicyRule(
                    id=rule_id or f"rule-{uuid.uuid4().hex[:8]}",
                    name=name,
                    description=description,
                    priority=priority or 100,
                    conditions=json.loads(conditions) if conditions else {},
                    action=policy_action,
                    action_params=json.loads(action_params) if action_params else {},
                    tenant_id=tenant_id,
                    created_by=user_ctx.get("user_id")
                )
                db.add(new_rule)
                await db.commit()
                return {"success": True, "message": f"Policy {new_rule.id} created.", "id": new_rule.id}
                
            elif action == "update":
                if not rule_id:
                    return {"success": False, "error": "rule_id required for update"}
                    
                stmt = select(PolicyRule).where(PolicyRule.id == rule_id, PolicyRule.tenant_id == tenant_id)
                result = await db.execute(stmt)
                rule = result.scalars().first()
                if not rule:
                    return {"success": False, "error": "Rule not found"}
                    
                # Apply updates
                if name: rule.name = name
                if description: rule.description = description
                if priority is not None: rule.priority = priority
                if conditions: rule.conditions = json.loads(conditions)
                if policy_action: rule.action = policy_action
                if action_params: rule.action_params = json.loads(action_params)
                
                rule.version += 1
                await db.commit()
                return {"success": True, "message": f"Policy {rule_id} updated to version {rule.version}"}
                
            elif action == "delete":
                if not rule_id:
                    return {"success": False, "error": "rule_id required for delete"}
                stmt = select(PolicyRule).where(PolicyRule.id == rule_id, PolicyRule.tenant_id == tenant_id)
                result = await db.execute(stmt)
                rule = result.scalars().first()
                if not rule:
                    return {"success": False, "error": "Rule not found"}
                
                # Soft delete
                rule.is_active = False
                await db.commit()
                return {"success": True, "message": f"Policy {rule_id} disabled (soft delete)."}
                
            return {"success": False, "error": "Unknown action"}

    @mcp.tool()
    async def explore_audit_logs(limit: int = 100, user_id: Optional[int] = None, event_type: Optional[str] = None) -> Dict[str, Any]:
        """Explore system audit logs."""
        user_ctx = _require_admin(mcp.current_request)
        
        async with get_db_manager().get_session_context() as db:
            stmt = select(AuditLog)
            if user_id:
                stmt = stmt.where(AuditLog.user_id == user_id)
            if event_type:
                stmt = stmt.where(AuditLog.event == event_type)
            stmt = stmt.order_by(AuditLog.created_at.desc()).limit(limit)
            
            result = await db.execute(stmt)
            logs = result.scalars().all()
            
            return {
                "success": True,
                "logs": [
                    {
                        "id": log.id,
                        "event": log.event,
                        "user_id": log.user_id,
                        "resource": log.resource,
                        "details": log.details,
                        "created_at": log.created_at.isoformat() if log.created_at else None
                    } for log in logs
                ]
            }

    @mcp.tool()
    async def get_decision_logs(limit: int = 50, tool_name: Optional[str] = None) -> Dict[str, Any]:
        """Fetch policy decision logs for review or replay."""
        user_ctx = _require_admin(mcp.current_request)
        tenant_id = user_ctx.get("tenant_id", "default")
        
        async with get_db_manager().get_session_context() as db:
            stmt = select(PolicyDecisionLog).where(PolicyDecisionLog.tenant_id == tenant_id)
            if tool_name:
                stmt = stmt.where(PolicyDecisionLog.tool_name == tool_name)
            stmt = stmt.order_by(PolicyDecisionLog.created_at.desc()).limit(limit)
            
            result = await db.execute(stmt)
            logs = result.scalars().all()
            
            return {
                "success": True,
                "logs": [
                    {
                        "id": log.id,
                        "tool_name": log.tool_name,
                        "decision": log.decision,
                        "risk_score": log.risk_score,
                        "explanation": log.explanation,
                        "created_at": log.created_at.isoformat() if log.created_at else None
                    } for log in logs
                ]
            }

    @mcp.tool()
    async def view_tool_inventory() -> Dict[str, Any]:
        """View all registered tools and their metadata."""
        user_ctx = _require_admin(mcp.current_request)
        
        # In a real setup, we'd fetch from ToolRegistry, but for MCP we can list registered tools
        # mcp._tools is a dictionary of Tool objects in FastMCP
        tools_info = []
        for name, tool in mcp._tools.items():
            tools_info.append({
                "name": name,
                "description": tool.description,
                "parameters": tool.parameters
            })
            
        return {
            "success": True,
            "total_tools": len(tools_info),
            "tools": tools_info
        }

    @mcp.tool()
    async def rollback_action(execution_id: str) -> Dict[str, Any]:
        """
        Rollback a previously executed action using its ReversibleExecutionLog ID.
        """
        user_ctx = _require_admin(mcp.current_request)
        user_id = user_ctx.get("user_id")
        
        result = await compensation_registry.rollback_execution(execution_id, user_id=user_id)
        return result

    @mcp.tool()
    async def approve_tool_trust_state(tool_name: str) -> Dict[str, Any]:
        """
        Approve a quarantined tool by resetting its trust status and bumping its version.
        This acknowledges that the detected code/description drift is intentional and safe.
        """
        user_ctx = _require_admin(mcp.current_request)
        
        async with get_db_manager().get_session_context() as db:
            stmt = select(ToolManifest).where(ToolManifest.tool_name == tool_name)
            result = await db.execute(stmt)
            manifest = result.scalars().first()
            
            if not manifest:
                return {"success": False, "error": f"Tool '{tool_name}' not found in registry."}
                
            if manifest.trust_status == "TRUSTED":
                return {"success": False, "error": f"Tool '{tool_name}' is already TRUSTED."}
                
            # Recompute current hashes
            tool = mcp._tools.get(tool_name)
            if not tool:
                return {"success": False, "error": f"Tool '{tool_name}' is not currently loaded in the active server."}
                
            code_content = ToolTrustManager.get_function_source(tool.fn)
            manifest.code_hash = ToolTrustManager.compute_hash(code_content)
            manifest.description_hash = ToolTrustManager.compute_hash(tool.description or "")
            
            manifest.trust_status = "TRUSTED"
            manifest.version += 1
            
            await db.commit()
            logger.info("Admin approved tool trust state", tool_name=tool_name, new_version=manifest.version, admin_id=user_ctx.get("user_id"))
            
            return {
                "success": True, 
                "message": f"Tool '{tool_name}' is now TRUSTED at version {manifest.version}."
            }

    @mcp.tool()
    async def get_pending_approvals() -> Dict[str, Any]:
        """
        List all pending approval requests.
        """
        user_ctx = _require_admin(mcp.current_request)
        tenant_id = user_ctx.get("tenant_id", "default")
        
        async with get_db_manager().get_session_context() as db:
            stmt = select(ApprovalRequest).where(
                ApprovalRequest.tenant_id == tenant_id,
                ApprovalRequest.status == "PENDING"
            )
            result = await db.execute(stmt)
            requests = result.scalars().all()
            
            return {
                "success": True,
                "pending_count": len(requests),
                "requests": [
                    {
                        "id": r.id,
                        "tool_name": r.tool_name,
                        "arguments": r.arguments,
                        "context": r.context_snapshot,
                        "created_at": str(r.created_at)
                    } for r in requests
                ]
            }

    @mcp.tool()
    async def review_approval(approval_id: str, decision: str, reason: str) -> Dict[str, Any]:
        """
        Review a pending approval request. 
        decision: MUST be "APPROVED" or "REJECTED".
        reason: Justification for the decision.
        """
        user_ctx = _require_admin(mcp.current_request)
        user_id = user_ctx.get("user_id")
        
        if not user_id:
            return {"success": False, "error": "User ID missing from context"}
            
        result = await approval_manager.review_request(
            request_id=approval_id,
            decision=decision,
            reviewer_id=user_id,
            reason=reason
        )
        return result

    @mcp.tool()
    async def deploy_policy_version(version: str, rego_content: str, is_active: bool = False, is_simulation_mode: bool = False, rollout_percentage: int = 100) -> Dict[str, Any]:
        """
        Deploy a new OPA/Rego PolicyBundle version.
        """
        user_ctx = _require_admin(mcp.current_request)
        tenant_id = user_ctx.get("tenant_id", "default")
        
        async with get_db_manager().get_session_context() as db:
            if is_active:
                # Deactivate others if this one is 100% active
                if rollout_percentage == 100:
                    stmt = select(PolicyBundle).where(PolicyBundle.tenant_id == tenant_id, PolicyBundle.is_active == True)
                    result = await db.execute(stmt)
                    for active_bundle in result.scalars().all():
                        active_bundle.is_active = False
                        
            bundle = PolicyBundle(
                id=f"pb-{uuid.uuid4().hex[:8]}",
                tenant_id=tenant_id,
                version=version,
                rego_content=rego_content,
                is_active=is_active,
                is_simulation_mode=is_simulation_mode,
                rollout_percentage=rollout_percentage
            )
            db.add(bundle)
            await db.commit()
            
            return {
                "success": True,
                "message": f"Deployed PolicyBundle v{version}",
                "bundle_id": bundle.id
            }

    @mcp.tool()
    async def run_policy_simulation(tool_name: str, arguments: str, session_taints: str = "") -> Dict[str, Any]:
        """
        Simulate an OPA policy evaluation against the current active rules without executing the tool.
        arguments: JSON string of tool arguments.
        session_taints: comma separated taints (e.g. 'high_risk,pii').
        """
        user_ctx = _require_admin(mcp.current_request)
        
        try:
            args_dict = json.loads(arguments)
        except Exception:
            args_dict = {}
            
        taint_list = [t.strip() for t in session_taints.split(",") if t.strip()]
        
        # Mock Intent and Risk (normally done by pipelines)
        intent = IntentClassifier().classify(tool_name, args_dict, {})
        intent.taint_labels = taint_list
        risk = RiskScorer().score(intent, user_ctx, {})
        
        evaluator = OPAPolicyEvaluator()
        result = await evaluator.evaluate(
            intent=intent,
            risk=risk,
            user_context=user_ctx,
            tool_metadata={},
            simulation_mode=True
        )
        
        return {
            "success": True,
            "decision": result.decision.value,
            "explanation": result.explanation,
            "simulated_intent": intent.intent_category.value,
            "simulated_risk": risk.score
        }
