"""
Compensation Registry for Reversible Execution.

This module maps tools to their inverse compensating handlers, enabling
the platform to "undo" destructive or side-effecting actions.
"""
from typing import Callable, Dict, Any, Optional
import structlog
import uuid
from datetime import datetime, timezone
from sqlalchemy.future import select

from secure_mcp_server.database import get_db_manager, ReversibleExecutionLog

logger = structlog.get_logger(__name__)

class CompensationRegistry:
    """Registry mapping tool actions to their compensating handlers."""
    
    def __init__(self):
        self._handlers: Dict[str, Callable] = {}
        
    def register_handler(self, name: str):
        """Decorator to register a compensating handler."""
        def decorator(func: Callable):
            self._handlers[name] = func
            logger.info("Registered compensation handler", handler=name)
            return func
        return decorator
        
    def get_handler(self, name: str) -> Optional[Callable]:
        """Retrieve a registered compensating handler by name."""
        return self._handlers.get(name)

    async def log_reversible_execution(
        self, 
        tenant_id: str, 
        tool_name: str, 
        compensation_handler: str, 
        compensation_arguments: Dict[str, Any],
        execution_id: Optional[int] = None
    ) -> Optional[str]:
        """Record an execution that can be reversed."""
        try:
            async with get_db_manager().get_session_context() as db:
                log_id = f"rev-{uuid.uuid4().hex[:12]}"
                log = ReversibleExecutionLog(
                    id=log_id,
                    tenant_id=tenant_id,
                    execution_id=execution_id,
                    tool_name=tool_name,
                    compensation_handler=compensation_handler,
                    compensation_arguments=compensation_arguments,
                    status="committed"
                )
                db.add(log)
                await db.commit()
                logger.info("Logged reversible execution", log_id=log_id, tool_name=tool_name)
                return log_id
        except Exception as e:
            logger.error("Failed to log reversible execution", error=str(e))
            return None

    async def rollback_execution(self, log_id: str, user_id: Optional[int] = None) -> Dict[str, Any]:
        """Execute a rollback for a previously committed action."""
        try:
            async with get_db_manager().get_session_context() as db:
                stmt = select(ReversibleExecutionLog).where(ReversibleExecutionLog.id == log_id)
                result = await db.execute(stmt)
                log = result.scalars().first()
                
                if not log:
                    return {"success": False, "error": f"Execution log {log_id} not found."}
                    
                if log.status != "committed":
                    return {"success": False, "error": f"Execution is already in status: {log.status}."}
                    
                handler = self.get_handler(log.compensation_handler)
                if not handler:
                    return {"success": False, "error": f"Compensation handler '{log.compensation_handler}' not found in registry."}
                    
                logger.info("Executing compensation handler", log_id=log_id, handler=log.compensation_handler)
                
                # Execute the handler (Assuming async handler)
                try:
                    await handler(**log.compensation_arguments)
                except Exception as handler_err:
                    log.status = "failed_rollback"
                    await db.commit()
                    logger.error("Compensation handler failed", error=str(handler_err))
                    return {"success": False, "error": f"Handler failed: {str(handler_err)}"}
                    
                # Mark as rolled back
                log.status = "rolled_back"
                log.rolled_back_at = datetime.now(timezone.utc)
                log.rolled_back_by = user_id
                await db.commit()
                
                return {"success": True, "message": f"Successfully rolled back execution {log_id}."}
        except Exception as e:
            logger.error("Failed to process rollback", error=str(e))
            return {"success": False, "error": str(e)}

# Global registry instance
compensation_registry = CompensationRegistry()
