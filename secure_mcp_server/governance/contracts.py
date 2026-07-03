"""
Task Contract Manager.

Allows LLM agents to declare intended multi-step workflows. If the contract is 
approved, individual tool executions are bounded by the contract's limits 
(e.g., expected tools, max writes) rather than triggering individual policy approvals.
"""
from typing import Dict, Any, Optional, List
import uuid
import structlog
from datetime import datetime, timezone
from sqlalchemy.future import select

from secure_mcp_server.database import get_db_manager, TaskContract
from secure_mcp_server.governance.intent_types import IntentCategory

logger = structlog.get_logger(__name__)


class ContractManager:
    """Manages LLM workflow Task Contracts."""

    async def propose_contract(
        self,
        tenant_id: str,
        agent_id: str,
        goal: str,
        expected_tools: List[str],
        max_writes: int,
        max_spend: float
    ) -> Dict[str, Any]:
        """Propose a new Task Contract."""
        try:
            async with get_db_manager().get_session_context() as db:
                contract_id = f"tc-{uuid.uuid4().hex[:12]}"
                
                # In a real system, we'd run this through the ApprovalManager or PolicyEngine
                # to determine if it can be auto-approved or needs human review.
                # For this implementation, we will auto-approve it if max_writes <= 10.
                status = "APPROVED" if max_writes <= 10 else "PENDING"
                
                contract = TaskContract(
                    id=contract_id,
                    tenant_id=tenant_id,
                    agent_id=agent_id,
                    goal=goal,
                    expected_tools=expected_tools,
                    max_writes=max_writes,
                    current_writes=0,
                    max_spend=max_spend,
                    current_spend=0.0,
                    status=status
                )
                db.add(contract)
                await db.commit()
                logger.info("Task contract proposed", contract_id=contract_id, status=status)
                
                return {
                    "success": True,
                    "contract_id": contract_id,
                    "status": status,
                    "message": f"Contract {status}"
                }
        except Exception as e:
            logger.error("Failed to propose task contract", error=str(e))
            return {"success": False, "error": str(e)}

    async def validate_execution(
        self,
        contract_id: str,
        tool_name: str,
        intent_category: IntentCategory,
        cost: float = 0.0
    ) -> Dict[str, Any]:
        """Validate an execution against an active contract."""
        try:
            async with get_db_manager().get_session_context() as db:
                stmt = select(TaskContract).where(TaskContract.id == contract_id)
                result = await db.execute(stmt)
                contract = result.scalars().first()
                
                if not contract:
                    return {"valid": False, "error": f"Contract {contract_id} not found."}
                    
                if contract.status != "APPROVED":
                    return {"valid": False, "error": f"Contract is not APPROVED (status: {contract.status})."}
                    
                # Rule 1: Expected Tools
                if tool_name not in contract.expected_tools:
                    contract.status = "VIOLATED"
                    await db.commit()
                    logger.warning("Contract violated: unexpected tool", contract_id=contract_id, tool_name=tool_name)
                    return {"valid": False, "error": f"Tool '{tool_name}' not listed in contract expected_tools."}
                    
                # Rule 2: Max Writes
                is_write = intent_category in [IntentCategory.WRITE, IntentCategory.DELETE, IntentCategory.EXECUTE, IntentCategory.ADMIN]
                if is_write:
                    if contract.current_writes >= contract.max_writes:
                        contract.status = "EXHAUSTED"
                        await db.commit()
                        logger.warning("Contract exhausted: max writes reached", contract_id=contract_id)
                        return {"valid": False, "error": f"Contract exhausted: reached max_writes ({contract.max_writes})."}
                    
                    contract.current_writes += 1
                
                # Rule 3: Max Spend
                if cost > 0:
                    if (contract.current_spend + cost) > contract.max_spend:
                        contract.status = "EXHAUSTED"
                        await db.commit()
                        logger.warning("Contract exhausted: max spend reached", contract_id=contract_id)
                        return {"valid": False, "error": f"Contract exhausted: max spend exceeded."}
                        
                    contract.current_spend += cost
                    
                await db.commit()
                return {"valid": True, "message": "Execution allowed by contract"}
                
        except Exception as e:
            logger.error("Failed to validate execution against contract", error=str(e))
            return {"valid": False, "error": str(e)}

# Global instance
contract_manager = ContractManager()
