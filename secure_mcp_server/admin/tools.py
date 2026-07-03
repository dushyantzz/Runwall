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

from secure_mcp_server.database import get_db_manager, PolicyRule, PolicyDecisionLog, AuditLog
from secure_mcp_server.governance import compensation_registry

logger = structlog.get_logger(__name__)


def _require_admin(request):
    """Ensure the requester is an admin."""
    user_ctx = getattr(request, "user_context", {})
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
