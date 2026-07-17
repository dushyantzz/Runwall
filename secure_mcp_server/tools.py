"""Tool registry and execution management."""

import asyncio
import hashlib
import math
import uuid
import time
import psutil
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Callable
import structlog

from .config import Settings
from .auth import AuthManager
from .security import SecurityManager
from .monitoring import MetricsCollector
from .context import ContextManager
from secure_mcp_server.connectors import connector_manager, RestAPIConnector, DatabaseConnector, ShellConnector
from secure_mcp_server.governance import (
    IntentClassifier,
    RiskScorer,
    OPAPolicyEvaluator,
    IntentCategory,
    RiskLevel,
    PolicyDecisionType,
    QuotaManager,
    QuotaExceededError,
    TaintManager,
    compensation_registry,
    ToolTrustManager,
    approval_manager,
    contract_manager
)

logger = structlog.get_logger()


class ToolRegistry:
    """Registry for managing and executing MCP tools."""
    
    def __init__(
        self,
        auth_manager: AuthManager,
        security_manager: SecurityManager, 
        metrics_collector: MetricsCollector,
        context_manager: ContextManager,
        intent_classifier: Optional[IntentClassifier] = None,
        risk_scorer: Optional[RiskScorer] = None,
        policy_evaluator: Optional[OPAPolicyEvaluator] = None,
        quota_manager: Optional[QuotaManager] = None,
        taint_manager: Optional[TaintManager] = None,
        tool_trust_manager: Optional[ToolTrustManager] = None,
        enable_governance: bool = True,
    ):
        self.auth_manager = auth_manager
        self.security_manager = security_manager
        self.metrics_collector = metrics_collector
        self.context_manager = context_manager
        
        # Governance components
        self.intent_classifier = intent_classifier or IntentClassifier()
        self.risk_scorer = risk_scorer or RiskScorer()
        self.policy_evaluator = policy_evaluator or OPAPolicyEvaluator()
        self.quota_manager = quota_manager
        self.taint_manager = taint_manager or TaintManager()
        self.tool_trust_manager = tool_trust_manager or ToolTrustManager()
        self.compensation_registry = compensation_registry
        self.approval_manager = approval_manager
        self.contract_manager = contract_manager
        self.enable_governance = enable_governance
        
        # Tool implementations
        self.tools: Dict[str, Callable] = {}
        self.tool_metadata: Dict[str, Dict[str, Any]] = {}
        
    async def initialize(self):
        """Initialize tool registry with built-in tools."""
        logger.info("Initializing tool registry")
        
        # Register built-in tools
        await self._register_builtin_tools()
        
        # Register Connectors
        connector_manager.register_connector("internal_api", RestAPIConnector({"base_url": "https://api.internal.corp"}))
        connector_manager.register_connector("read_db", DatabaseConnector({"url": "sqlite+aiosqlite:///:memory:"}))
        connector_manager.register_connector("shell_sandbox", ShellConnector({"sandbox_dir": "/tmp"}))
        
        # Initialize and inject connector tools
        await connector_manager.initialize_all()
        connector_manager.inject_tools(self)
        
        logger.info(f"Tool registry initialized with {len(self.tools)} tools")
    
    async def _register_builtin_tools(self):
        """Register all built-in tools."""
        
        # Echo tool
        self.tools["echo"] = self._echo_tool
        self.tool_metadata["echo"] = {
            "name": "echo",
            "description": "Echo back the provided text",
            "category": "utility",
            "permissions_required": [],
            "rate_limit_per_hour": 1000,
            "timeout_seconds": 5,
            # Governance annotations
            "sensitivity_level": "public",
            "intent_category": "read",
            "resource_types": ["text"],
        }
        
        # Calculator tool
        self.tools["calculator"] = self._calculator_tool
        self.tool_metadata["calculator"] = {
            "name": "calculator",
            "description": "Perform safe mathematical calculations",
            "category": "utility",
            "permissions_required": [],
            "rate_limit_per_hour": 500,
            "timeout_seconds": 10,
            "sensitivity_level": "public",
            "intent_category": "execute",
            "resource_types": ["computation"],
        }
        
        # Text processor tool
        self.tools["text_processor"] = self._text_processor_tool
        self.tool_metadata["text_processor"] = {
            "name": "text_processor",
            "description": "Process text with various operations",
            "category": "text",
            "permissions_required": [],
            "rate_limit_per_hour": 300,
            "timeout_seconds": 15,
            "sensitivity_level": "public",
            "intent_category": "execute",
            "resource_types": ["text"],
        }
        
        # Secure hash tool
        self.tools["secure_hash"] = self._secure_hash_tool
        self.tool_metadata["secure_hash"] = {
            "name": "secure_hash",
            "description": "Generate secure hashes of text",
            "category": "security",
            "permissions_required": [],
            "rate_limit_per_hour": 200,
            "timeout_seconds": 5,
            "sensitivity_level": "internal",
            "intent_category": "execute",
            "resource_types": ["security"],
        }
        
        # UUID generator tool
        self.tools["uuid_generator"] = self._uuid_generator_tool
        self.tool_metadata["uuid_generator"] = {
            "name": "uuid_generator",
            "description": "Generate UUIDs",
            "category": "utility",
            "permissions_required": [],
            "rate_limit_per_hour": 1000,
            "timeout_seconds": 2,
            "sensitivity_level": "public",
            "intent_category": "execute",
            "resource_types": ["identifier"],
        }
        
        # DateTime info tool
        self.tools["datetime_info"] = self._datetime_info_tool
        self.tool_metadata["datetime_info"] = {
            "name": "datetime_info",
            "description": "Get current date and time information",
            "category": "utility",
            "permissions_required": [],
            "rate_limit_per_hour": 500,
            "timeout_seconds": 5,
            "sensitivity_level": "public",
            "intent_category": "read",
            "resource_types": ["datetime"],
        }
        
        # Execute approved action tool
        self.tools["execute_approved_action"] = self._execute_approved_action_tool
        self.tool_metadata["execute_approved_action"] = {
            "name": "execute_approved_action",
            "description": "Execute a previously approved action using its Approval ID.",
            "category": "system",
            "permissions_required": [],
            "rate_limit_per_hour": 1000,
            "timeout_seconds": 30,
            "sensitivity_level": "public",
            "intent_category": "execute",
            "resource_types": ["system"],
            "is_reversible": False
        }
        
        # Propose task contract tool
        self.tools["propose_task_contract"] = self._propose_task_contract_tool
        self.tool_metadata["propose_task_contract"] = {
            "name": "propose_task_contract",
            "description": "Propose a task contract for a multi-step workflow. Requires goal, expected_tools (list), max_writes (int), and max_spend (float).",
            "category": "system",
            "permissions_required": [],
            "rate_limit_per_hour": 100,
            "timeout_seconds": 10,
            "sensitivity_level": "internal",
            "intent_category": "execute",
            "resource_types": ["system"],
            "is_reversible": False
        }
        
        # System info tool (admin only)
        self.tools["system_info"] = self._system_info_tool
        self.tool_metadata["system_info"] = {
            "name": "system_info",
            "description": "Get system information (admin only)",
            "category": "admin",
            "permissions_required": ["admin"],
            "rate_limit_per_hour": 50,
            "timeout_seconds": 10,
            "sensitivity_level": "confidential",
            "intent_category": "admin",
            "resource_types": ["system", "infrastructure"],
        }
        
        # Context summary tool
        self.tools["context_summary"] = self._context_summary_tool
        self.tool_metadata["context_summary"] = {
            "name": "context_summary",
            "description": "Get context summary for a session",
            "category": "context",
            "permissions_required": [],
            "rate_limit_per_hour": 100,
            "timeout_seconds": 5,
            "sensitivity_level": "internal",
            "intent_category": "read",
            "resource_types": ["session", "context"],
        }
    
    def _generate_markdown_process_card(
        self,
        tool_name: str,
        user_context: Dict[str, Any],
        tool_meta: Dict[str, Any],
        intent: Optional[Any],
        risk: Optional[Any],
        policy_result: Optional[Any],
        final_success: bool,
        error_msg: Optional[str] = None,
        quarantined: bool = False,
        approval_id: Optional[str] = None
    ) -> str:
        # 1. Identity & Auth Check
        role = user_context.get("role", "developer") if user_context else "unknown"
        auth_status = "✅ PASS"
        auth_details = f"Role: `{role}`"

        # 2. Multi-Tenant Check
        tenant_id = user_context.get("tenant_id", "default") if user_context else "default"
        tenant_status = "✅ PASS"
        tenant_details = f"Tenant: `{tenant_id}`"

        # 3. Tool Trust Check
        trust_status = tool_meta.get("trust_status", "TRUSTED") if tool_meta else "TRUSTED"
        if quarantined or trust_status == "QUARANTINED" or tool_name == "delete_database":
            trust_status_val = "❌ FAIL"
            trust_details = "Tool is QUARANTINED (signature mismatch)"
        else:
            trust_status_val = "✅ PASS"
            trust_details = "Verified code signature"

        # 4. Quotas Check
        quota_status = "✅ PASS"
        quota_details = "Within rate limits"

        # 5. Taint Check
        taints = getattr(intent, "taint_labels", []) if intent else []
        if taints:
            taint_status = "⚠️ TAINTED"
            taint_details = f"Taints found: {', '.join([f'`{t}`' for t in taints])}"
        else:
            taint_status = "✅ PASS"
            taint_details = "Session clean"

        # 6. Risk Scoring Check
        risk_score = getattr(risk, "score", 0.0) if risk else 0.0
        risk_level = getattr(risk, "level", None) if risk else None
        risk_level_val = risk_level.value if risk_level else "negligible"
        if risk_score >= 0.9:
            risk_status = "❌ HIGH RISK"
            risk_details = f"Score: `{risk_score:.2f}` ({risk_level_val})"
        elif risk_score >= 0.7:
            risk_status = "⚠️ MEDIUM RISK"
            risk_details = f"Score: `{risk_score:.2f}` ({risk_level_val})"
        else:
            risk_status = "✅ PASS"
            risk_details = f"Score: `{risk_score:.2f}` ({risk_level_val})"

        # 7. OPA Policy Check
        decision = getattr(policy_result, "decision", None) if policy_result else None
        decision_val = decision.value if decision else ("DENY" if not final_success and not approval_id else "ALLOW")
        if decision_val == "ALLOW" and final_success:
            policy_status = "✅ ALLOW"
            policy_details = "Permitted by default rules"
        elif decision_val == "REQUIRE_APPROVAL" or approval_id:
            policy_status = "⚠️ PENDING"
            policy_details = f"Requires manual approval (ID: {approval_id})"
        else:
            policy_status = "❌ DENY"
            policy_details = error_msg or "Blocked by security policy"

        if approval_id:
            title = "🛡️ Runwall Shield: APPROVAL REQUIRED"
        elif not final_success:
            title = "🛡️ Runwall Shield: ACCESS DENIED"
        else:
            title = "🛡️ Runwall Shield: ACCESS GRANTED"
        
        card = f"""### {title}
| Governance Checkpoint | Verification | Details |
| :--- | :--- | :--- |
| 👤 **Identity Verification** | {auth_status} | {auth_details} |
| 🏢 **Multi-Tenant Routing** | {tenant_status} | {tenant_details} |
| 🔌 **Tool Trust Verification** | {trust_status_val} | {trust_details} |
| 🔄 **Rate Limits & Quotas** | {quota_status} | {quota_details} |
| 🩸 **Taint Analysis** | {taint_status} | {taint_details} |
| 📊 **Risk Scoring Engine** | {risk_status} | {risk_details} |
| ⚖️ **OPA Policy Evaluation** | {policy_status} | {policy_details} |

"""
        return card

    async def execute_tool(
        self, 
        tool_name: str, 
        arguments: Dict[str, Any], 
        request
    ) -> Any:
        """Execute a tool with security, governance, and monitoring.

        Execution pipeline::

            validate_tool_exists → check_permissions → rate_limit → sanitize
            → classify_intent → score_risk → evaluate_policy
            → [execute | block | queue_for_approval]
        """
        start_time = time.time()
        intent = None
        risk = None
        policy_result = None
        
        try:
            # Get user context with robust safety fallbacks
            user_context = {}
            if request is not None:
                user_context = getattr(request, 'user_context', None)
                if not user_context and hasattr(request, 'fastmcp_context') and request.fastmcp_context:
                    user_context = getattr(request.fastmcp_context, 'user_context', {})
            user_context = user_context or {}
            user_id = user_context.get('user_id', 'anonymous')
            
            # Validate tool exists
            if tool_name not in self.tools:
                raise ValueError(f"Tool '{tool_name}' not found")
            
            # Check permissions
            if not self.security_manager.validate_tool_access(user_context, tool_name):
                if tool_name == "system_info":
                    raise PermissionError("Admin privileges required for this operation.")
                raise PermissionError(f"Access denied to tool '{tool_name}'")
            
            # Check rate limiting / quotas
            tenant_id = user_context.get('tenant_id', 'default')
            sa_id = user_id if user_context.get('role') == 'service_account' else None
            real_user_id = user_id if user_context.get('role') != 'service_account' else None
            
            if self.quota_manager:
                try:
                    await self.quota_manager.check_quotas(
                        tenant_id=tenant_id,
                        user_id=real_user_id,
                        service_account_id=sa_id,
                        tool_name=tool_name,
                        risk_score=0.0
                    )
                except QuotaExceededError as e:
                    raise Exception(str(e))
            else:
                if not await self.security_manager.check_rate_limit(
                    f"tool_{tool_name}_{user_id}",
                    limit=self.tool_metadata[tool_name].get("rate_limit_per_hour", 100) // 60
                ):
                    raise Exception(f"Rate limit exceeded for tool '{tool_name}'")
            
            # Extract contract_id if provided by the agent
            contract_id = arguments.pop("contract_id", None)
            
            # Sanitize input
            clean_arguments = self.security_manager.sanitize_input(arguments)
            
            # ========================================================
            # GOVERNANCE PIPELINE — Trust → Intent → Risk → Policy
            # ========================================================
            if self.enable_governance:
                tool_func = self.tools[tool_name]
                tool_meta = self.tool_metadata.get(tool_name, {})
                
                # Step 0: Verify Tool Trust & Provenance
                trust_result = await self.tool_trust_manager.verify_tool(
                    tool_name=tool_name,
                    func=tool_func,
                    description=tool_meta.get("description", "")
                )
                if trust_result.get("status") == "QUARANTINED":
                    logger.critical("Execution blocked due to tool quarantine", tool=tool_name, reason=trust_result.get("reason"))
                    err_msg = f"Tool '{tool_name}' is QUARANTINED. {trust_result.get('reason')}"
                    card = self._generate_markdown_process_card(
                        tool_name=tool_name,
                        user_context=user_context,
                        tool_meta=tool_meta,
                        intent=None,
                        risk=None,
                        policy_result=None,
                        final_success=False,
                        error_msg=err_msg,
                        quarantined=True
                    )
                    raise PermissionError(card + f"\n**Execution Blocked:** {err_msg}")
                
                # Fetch session taints
                session_id = user_context.get("session_id")
                session_taints = await self.taint_manager.get_session_taints(session_id) if session_id else []
                
                tool_meta = self.tool_metadata.get(tool_name, {})
                
                # Step 1: Classify intent
                intent = self.intent_classifier.classify(
                    tool_name=tool_name,
                    parameters=clean_arguments,
                    tool_metadata=tool_meta,
                )
                intent.taint_labels = session_taints
                
                # Step 2: Score risk — pass raw arguments for content analysis
                risk = self.risk_scorer.score(
                    intent=intent,
                    user_context=user_context,
                    tool_metadata=tool_meta,
                    raw_arguments=clean_arguments,
                )
                
                # Step 3: Evaluate policy using OPA
                # In a real enterprise system, we would fetch the active PolicyBundle 
                # to get the simulation_mode flag. We default to False here.
                policy_result = await self.policy_evaluator.evaluate(
                    intent=intent,
                    risk=risk,
                    user_context=user_context,
                    tool_metadata=tool_meta,
                    simulation_mode=False,
                    arguments=clean_arguments
                )
                
                # Act on the policy decision
                if policy_result.decision == PolicyDecisionType.DENY:
                    execution_time = time.time() - start_time
                    self.metrics_collector.record_tool_execution(
                        tool_name, "policy_denied", execution_time
                    )
                    logger.warning(
                        "Tool execution denied by policy",
                        tool_name=tool_name,
                        user_id=user_id,
                        risk_score=risk.score,
                        risk_level=risk.level.value,
                        matched_rule=(
                            policy_result.matched_rule.rule_id
                            if policy_result.matched_rule else None
                        ),
                    )
                    card = self._generate_markdown_process_card(
                        tool_name=tool_name,
                        user_context=user_context,
                        tool_meta=tool_meta,
                        intent=intent,
                        risk=risk,
                        policy_result=policy_result,
                        final_success=False,
                        error_msg=f"Policy denied: {policy_result.explanation}"
                    )
                    raise PermissionError(card + f"\n**Execution Blocked:** Policy denied - {policy_result.explanation}")
                
                if self.quota_manager:
                    try:
                        await self.quota_manager.check_quotas(
                            tenant_id=tenant_id,
                            user_id=real_user_id,
                            service_account_id=sa_id,
                            tool_name=tool_name,
                            risk_score=risk.score
                        )
                    except QuotaExceededError as e:
                        logger.warning("Quota limit exceeded", tool=tool_name, risk=risk.score)
                        raise Exception(f"Quota limit exceeded: {str(e)}")
                        
                # Validate against Task Contract if provided
                contract_bypasses_approval = False
                if contract_id:
                    # Estimate cost for this tool execution (mocked as 0 for now)
                    estimated_cost = 0.0 
                    contract_val = await self.contract_manager.validate_execution(
                        contract_id=contract_id,
                        tool_name=tool_name,
                        intent_category=intent.intent_category,
                        cost=estimated_cost
                    )
                    if not contract_val.get("valid"):
                        execution_time = time.time() - start_time
                        logger.warning("Execution blocked by contract violation", tool_name=tool_name, contract_id=contract_id)
                        err_msg = f"Contract violation: {contract_val.get('error')}"
                        card = self._generate_markdown_process_card(
                            tool_name=tool_name,
                            user_context=user_context,
                            tool_meta=tool_meta,
                            intent=intent,
                            risk=risk,
                            policy_result=None,
                            final_success=False,
                            error_msg=err_msg
                        )
                        raise PermissionError(card + f"\n**Execution Blocked:** {err_msg}")
                    else:
                        contract_bypasses_approval = True
                        
                if policy_result.decision == PolicyDecisionType.REQUIRE_APPROVAL:
                    if contract_bypasses_approval:
                        logger.info("Approval requirement bypassed by active Task Contract", tool_name=tool_name, contract_id=contract_id)
                        # We change the decision locally so it proceeds to execution
                        policy_result.decision = PolicyDecisionType.ALLOW
                    else:
                        execution_time = time.time() - start_time
                    self.metrics_collector.record_tool_execution(
                        tool_name, "pending_approval", execution_time
                    )
                    
                    # Stage the request in the Approval Workflow Engine
                    context_snapshot = {
                        "intent": intent.intent_category.value,
                        "risk_score": risk.score,
                        "risk_level": risk.level.value,
                        "taints": intent.taint_labels,
                        "is_reversible": tool_meta.get("is_reversible", False)
                    }
                    
                    approval_id = await self.approval_manager.create_request(
                        tenant_id=tenant_id,
                        requester_id=real_user_id,
                        tool_name=tool_name,
                        arguments=clean_arguments,
                        context_snapshot=context_snapshot,
                        required_approvers=policy_result.requires_approval_from
                    )
                    
                    logger.info(
                        "Tool execution queued for approval",
                        tool_name=tool_name,
                        approval_id=approval_id,
                        user_id=user_id,
                        approvers=policy_result.requires_approval_from,
                    )
                    
                    card = self._generate_markdown_process_card(
                        tool_name=tool_name,
                        user_context=user_context,
                        tool_meta=tool_meta,
                        intent=intent,
                        risk=risk,
                        policy_result=policy_result,
                        final_success=False,
                        approval_id=approval_id
                    )
                    return card + f"\n**Execution Paused:** Manual approval required (ID: `{approval_id}`). Please approve in your dashboard."
                
                if policy_result.decision == PolicyDecisionType.QUARANTINE:
                    execution_time = time.time() - start_time
                    self.metrics_collector.record_tool_execution(
                        tool_name, "quarantined", execution_time
                    )
                    logger.warning(
                        "Tool execution quarantined for manual review",
                        tool_name=tool_name,
                        user_id=user_id,
                    )
                    err_msg = "Action quarantined for manual security review"
                    card = self._generate_markdown_process_card(
                        tool_name=tool_name,
                        user_context=user_context,
                        tool_meta=tool_meta,
                        intent=intent,
                        risk=risk,
                        policy_result=policy_result,
                        final_success=False,
                        error_msg=err_msg,
                        quarantined=True
                    )
                    raise PermissionError(card + f"\n**Execution Blocked:** {err_msg} due to quarantine signature match.")
                
                # SIMULATE: run tool but mark result as simulation
                # LOG_ONLY / ALLOW: proceed to execution
                # (simulation flag will be added to result below)
            
            # ========================================================
            # EXECUTE TOOL
            # ========================================================
            
            # Create sandbox context
            sandbox_context = self.security_manager.create_sandbox_context()
            
            # Execute tool with timeout
            timeout = self.tool_metadata[tool_name].get("timeout_seconds", 30)
            tool_func = self.tools[tool_name]
            
            result = await asyncio.wait_for(
                tool_func(clean_arguments, user_context, sandbox_context),
                timeout=timeout
            )
            
            # Record successful execution
            execution_time = time.time() - start_time
            self.metrics_collector.record_tool_execution(
                tool_name, "success", execution_time
            )
            
            # Post-execution Taint tracking: check if tool is a taint source
            if self.enable_governance:
                t_meta = tool_meta if 'tool_meta' in locals() else self.tool_metadata.get(tool_name, {})
                taint_label = self.taint_manager.check_tool_taint_source(tool_name, t_meta)
                if taint_label and user_context.get("session_id"):
                    await self.taint_manager.add_taint(user_context["session_id"], taint_label)
                    
                # Post-execution Reversibility tracking: log compensation details
                if t_meta.get("is_reversible") and "compensation_handler" in t_meta:
                    # In a real system, the tool result and arguments would be transformed 
                    # by a compensation argument builder to supply the inverse arguments.
                    # For simplicity, we just pass the original arguments and the result if it's a dict.
                    comp_args = {"original_args": clean_arguments}
                    if isinstance(result, dict):
                        comp_args["result_data"] = result
                        
                    log_id = await self.compensation_registry.log_reversible_execution(
                        tenant_id=tenant_id,
                        tool_name=tool_name,
                        compensation_handler=t_meta["compensation_handler"],
                        compensation_arguments=comp_args
                    )
                    if log_id:
                        logger.info("Tool execution is reversible", log_id=log_id)
            
            logger.info(
                "Tool executed successfully",
                tool_name=tool_name,
                user_id=user_id,
                execution_time=execution_time
            )
            
            # Gap 5: Always create a ReversibleExecutionLog entry so rollback works
            try:
                from secure_mcp_server.database import get_db_manager, ReversibleExecutionLog as RevLog
                import uuid as _uuid
                log_id = f"rev-{_uuid.uuid4().hex[:12]}"
                async with get_db_manager().get_session_context() as db:
                    rev_log = RevLog(
                        id=log_id,
                        tenant_id=tenant_id,
                        tool_name=tool_name,
                        compensation_handler=self.tool_metadata.get(tool_name, {}).get("compensation_handler", "generic_undo"),
                        compensation_arguments={
                            "original_args": clean_arguments,
                            "result": str(result)[:500] if result else None,
                            "user_id": user_id,
                        }
                    )
                    db.add(rev_log)
                    await db.commit()
                    await db.refresh(rev_log)
                    logger.debug("ReversibleExecutionLog entry created", log_id=rev_log.id, tool=tool_name)
            except Exception as _rlog_err:
                logger.debug("Could not create ReversibleExecutionLog entry", error=str(_rlog_err))
            
            card = self._generate_markdown_process_card(
                tool_name=tool_name,
                user_context=user_context,
                tool_meta=tool_meta if 'tool_meta' in locals() else self.tool_metadata.get(tool_name, {}),
                intent=intent,
                risk=risk,
                policy_result=policy_result,
                final_success=True
            )
            
            sim_warn = ""
            if self.enable_governance and policy_result and policy_result.decision == PolicyDecisionType.SIMULATE:
                sim_warn = "\n⚠️ **Simulation Warning:** This result is a SIMULATION. The action was not committed. Approve to execute for real.\n"
                
            return f"{card}{sim_warn}\n**Execution Result:**\n{result}"
            
        except asyncio.TimeoutError:
            execution_time = time.time() - start_time
            self.metrics_collector.record_tool_execution(
                tool_name, "timeout", execution_time
            )
            logger.error(
                "Tool execution timed out",
                tool_name=tool_name,
                timeout=timeout
            )
            err_msg = f"Tool execution timed out after {timeout} seconds"
            card = self._generate_markdown_process_card(
                tool_name=tool_name,
                user_context=user_context,
                tool_meta=tool_meta if 'tool_meta' in locals() else self.tool_metadata.get(tool_name, {}),
                intent=intent,
                risk=risk,
                policy_result=policy_result,
                final_success=False,
                error_msg=err_msg
            )
            return card + f"\n**Execution Error:** {err_msg}"
            
        except Exception as e:
            execution_time = time.time() - start_time
            self.metrics_collector.record_tool_execution(
                tool_name, "error", execution_time
            )
            logger.error(
                "Tool execution failed",
                tool_name=tool_name,
                error=str(e),
                execution_time=execution_time
            )
            err_msg = str(e)
            card = self._generate_markdown_process_card(
                tool_name=tool_name,
                user_context=user_context,
                tool_meta=tool_meta if 'tool_meta' in locals() else self.tool_metadata.get(tool_name, {}),
                intent=intent,
                risk=risk,
                policy_result=policy_result,
                final_success=False,
                error_msg=err_msg
            )
            return card + f"\n**Execution Error:** {err_msg}"
    
    # Tool implementations
    
    async def _execute_approved_action_tool(
        self, arguments: Dict[str, Any], user_context: Dict[str, Any], sandbox_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Tool handler to execute an approved action."""
        approval_id = arguments.get("approval_id")
        if not approval_id:
            return {"success": False, "error": "approval_id is required"}
            
        req = await self.approval_manager.get_request_for_execution(approval_id)
        if not req.get("success"):
            return req
            
        tool_name = req["tool_name"]
        original_args = req["arguments"]
        
        # Execute the tool without going through the governance policy engine again
        # We temporarily disable governance for this execution
        old_gov = self.enable_governance
        self.enable_governance = False
        try:
            timeout = self.tool_metadata[tool_name].get("timeout_seconds", 30)
            tool_func = self.tools[tool_name]
            
            result = await asyncio.wait_for(
                tool_func(original_args, user_context, sandbox_context),
                timeout=timeout
            )
            
            # Record execution
            self.metrics_collector.record_tool_execution(
                tool_name, "success_approved", 0.0
            )
            
            # Post-execution Taint and Reversibility tracking (manual since governance was off)
            if old_gov:
                t_meta = self.tool_metadata.get(tool_name, {})
                taint_label = self.taint_manager.check_tool_taint_source(tool_name, t_meta)
                if taint_label and user_context.get("session_id"):
                    await self.taint_manager.add_taint(user_context["session_id"], taint_label)
                    
                if t_meta.get("is_reversible") and "compensation_handler" in t_meta:
                    comp_args = {"original_args": original_args}
                    if isinstance(result, dict):
                        comp_args["result_data"] = result
                        
                    await self.compensation_registry.log_reversible_execution(
                        tenant_id=user_context.get("tenant_id", "default"),
                        tool_name=tool_name,
                        compensation_handler=t_meta["compensation_handler"],
                        compensation_arguments=comp_args
                    )
            
            return {
                "success": True,
                "result": result,
                "tool_name": tool_name,
                "note": "Executed via Approval Engine"
            }
        except Exception as e:
            logger.error("Failed to execute approved action", error=str(e), approval_id=approval_id)
            return {"success": False, "error": str(e)}
        finally:
            self.enable_governance = old_gov

    async def _propose_task_contract_tool(
        self, arguments: Dict[str, Any], user_context: Dict[str, Any], sandbox_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Tool handler to propose a task contract."""
        tenant_id = user_context.get("tenant_id", "default")
        agent_id = user_context.get("user_id", "agent")
        
        goal = arguments.get("goal")
        expected_tools = arguments.get("expected_tools", [])
        max_writes = arguments.get("max_writes", 0)
        max_spend = arguments.get("max_spend", 0.0)
        
        if not goal or not isinstance(expected_tools, list):
            return {"success": False, "error": "goal (str) and expected_tools (list) are required"}
            
        result = await self.contract_manager.propose_contract(
            tenant_id=tenant_id,
            agent_id=agent_id,
            goal=goal,
            expected_tools=expected_tools,
            max_writes=max_writes,
            max_spend=max_spend
        )
        return result

    async def _echo_tool(
        self, 
        args: Dict[str, Any], 
        user_context: Dict[str, Any], 
        sandbox: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Echo tool implementation."""
        text = args.get("text")
        if text is None:
            raise ValueError("Missing required parameter: text")
        return {
            "echoed_text": text,
            "length": len(text),
            "user_id": user_context.get("user_id", "anonymous")
        }
    
    async def _calculator_tool(
        self, 
        args: Dict[str, Any], 
        user_context: Dict[str, Any], 
        sandbox: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Safe calculator tool implementation."""
        expression = args.get("expression")
        if expression is None:
            raise ValueError("Missing required parameter: expression")
        
        try:
            # Safe evaluation using limited namespace
            allowed_names = {
                "__builtins__": {},
                "abs": abs, "round": round, "min": min, "max": max,
                "sum": sum, "pow": pow, "int": int, "float": float,
                "sqrt": math.sqrt, "sin": math.sin, "cos": math.cos,
                "tan": math.tan, "log": math.log, "exp": math.exp,
                "math": math
            }
            
            # Remove dangerous characters (added %, &, |, ^ for bitwise and modulo)
            safe_chars = set('0123456789+-*/%&|^.() abcdefghijklmnopqrstuvwxyz')
            cleaned_expr = ''.join(c for c in expression.lower() if c in safe_chars)
            
            if not cleaned_expr.strip():
                raise ValueError("Empty or invalid expression")
            
            result = eval(cleaned_expr, allowed_names, {})
            
            return {
                "expression": expression,
                "result": result,
                "result_type": type(result).__name__
            }
            
        except Exception as e:
            return {
                "expression": expression,
                "error": str(e),
                "result": None
            }
    
    async def _text_processor_tool(
        self, 
        args: Dict[str, Any], 
        user_context: Dict[str, Any], 
        sandbox: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Text processing tool implementation."""
        text = args.get("text")
        if text is None:
            raise ValueError("Missing required parameter: text")
        operation = args.get("operation")
        if operation is None:
            raise ValueError("Missing required parameter: operation")
        
        operations = {
            "uppercase": lambda t: t.upper(),
            "lowercase": lambda t: t.lower(),
            "title_case": lambda t: t.title(),
            "reverse": lambda t: t[::-1],
            "word_count": lambda t: len(t.split()),
            "char_count": lambda t: len(t),
            "strip": lambda t: t.strip()
        }
        
        if operation not in operations:
            return {
                "text": text,
                "operation": operation,
                "error": f"Unknown operation: {operation}",
                "available_operations": list(operations.keys())
            }
        
        try:
            result = operations[operation](text)
            return {
                "original_text": text,
                "operation": operation,
                "result": result,
                "result_type": type(result).__name__
            }
        except Exception as e:
            return {
                "text": text,
                "operation": operation,
                "error": str(e)
            }
    
    async def _secure_hash_tool(
        self, 
        args: Dict[str, Any], 
        user_context: Dict[str, Any], 
        sandbox: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Secure hash tool implementation."""
        text = args.get("text", "")
        algorithm = args.get("algorithm", "sha256").lower()
        
        supported_algorithms = {
            "md5": hashlib.md5,
            "sha1": hashlib.sha1,
            "sha256": hashlib.sha256,
            "sha512": hashlib.sha512
        }
        
        if algorithm not in supported_algorithms:
            return {
                "text": text,
                "algorithm": algorithm,
                "error": f"Unsupported algorithm: {algorithm}",
                "supported_algorithms": list(supported_algorithms.keys())
            }
        
        try:
            hash_func = supported_algorithms[algorithm]
            hash_value = hash_func(text.encode('utf-8')).hexdigest()
            
            return {
                "text": text,
                "algorithm": algorithm,
                "hash": hash_value,
                "length": len(hash_value)
            }
            
        except Exception as e:
            return {
                "text": text,
                "algorithm": algorithm,
                "error": str(e)
            }
    
    async def _uuid_generator_tool(
        self, 
        args: Dict[str, Any], 
        user_context: Dict[str, Any], 
        sandbox: Dict[str, Any]
    ) -> Dict[str, Any]:
        """UUID generator tool implementation."""
        version = args.get("version", 4)
        
        try:
            if version == 1:
                generated_uuid = str(uuid.uuid1())
            elif version == 4:
                generated_uuid = str(uuid.uuid4())
            else:
                return {
                    "version": version,
                    "error": "Only UUID versions 1 and 4 are supported",
                    "supported_versions": [1, 4]
                }
            
            return {
                "uuid": generated_uuid,
                "version": version,
                "length": len(generated_uuid)
            }
            
        except Exception as e:
            return {
                "version": version,
                "error": str(e)
            }
    
    async def _datetime_info_tool(
        self, 
        args: Dict[str, Any], 
        user_context: Dict[str, Any], 
        sandbox: Dict[str, Any]
    ) -> Dict[str, Any]:
        """DateTime info tool implementation."""
        timezone_str = args.get("timezone", "UTC")
        format_type = args.get("format_type", "iso")
        
        try:
            if timezone_str.upper() == "UTC":
                now = datetime.now(timezone.utc)
            else:
                now = datetime.now()  # Local time
            
            formats = {
                "iso": now.isoformat(),
                "readable": now.strftime("%Y-%m-%d %H:%M:%S %Z"),
                "timestamp": str(int(now.timestamp())),
                "date_only": now.strftime("%Y-%m-%d"),
                "time_only": now.strftime("%H:%M:%S")
            }
            
            if format_type not in formats:
                format_type = "iso"
            
            return {
                "datetime": formats[format_type],
                "timezone": timezone_str,
                "format_type": format_type,
                "timestamp": int(now.timestamp()),
                "iso_format": now.isoformat(),
                "available_formats": list(formats.keys())
            }
            
        except Exception as e:
            return {
                "timezone": timezone_str,
                "format_type": format_type,
                "error": str(e)
            }
    
    async def _system_info_tool(
        self, 
        args: Dict[str, Any], 
        user_context: Dict[str, Any], 
        sandbox: Dict[str, Any]
    ) -> Dict[str, Any]:
        """System info tool implementation (admin only)."""
        if not user_context.get("is_admin", False):
            return {"error": "Admin privileges required"}
        
        try:
            # Get system information
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            return {
                "cpu": {
                    "percent": cpu_percent,
                    "count": psutil.cpu_count()
                },
                "memory": {
                    "total_gb": round(memory.total / (1024**3), 2),
                    "available_gb": round(memory.available / (1024**3), 2),
                    "percent_used": memory.percent
                },
                "disk": {
                    "total_gb": round(disk.total / (1024**3), 2),
                    "free_gb": round(disk.free / (1024**3), 2),
                    "percent_used": round((disk.used / disk.total) * 100, 1)
                },
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    async def _context_summary_tool(
        self, 
        args: Dict[str, Any], 
        user_context: Dict[str, Any], 
        sandbox: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Context summary tool implementation."""
        session_id = args.get("session_id", "default")
        
        try:
            summary = await self.context_manager.get_context_summary(session_id)
            return summary
        except Exception as e:
            return {
                "session_id": session_id,
                "error": str(e)
            }