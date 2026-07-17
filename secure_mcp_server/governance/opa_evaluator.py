"""
OPA / Rego Policy Evaluator.

Evaluates execution intent, risk, and user context against versioned Rego policies.
"""
import asyncio
import json
import os
import re
from typing import Any, Dict, List, Optional

import structlog

from sqlalchemy.future import select
from secure_mcp_server.database import PolicyDecisionLog, get_db_manager
from secure_mcp_server.governance.intent_types import (
    IntentCategory,
    IntentClassification,
    PolicyDecisionType,
    RiskScore,
)

logger = structlog.get_logger(__name__)

class OPAPolicyResult:
    def __init__(self, decision: PolicyDecisionType, explanation: str, raw_output: Dict[str, Any] = None):
        self.decision = decision
        self.explanation = explanation
        self.matched_rule = None
        self.raw_output = raw_output or {}
        self.requires_approval_from = None

    def to_audit_dict(self) -> Dict[str, Any]:
        return {
            "decision": self.decision.value,
            "explanation": self.explanation,
            "engine": "OPA/Rego"
        }

class OPAPolicyEvaluator:
    """Evaluates policies using Open Policy Agent (OPA)."""

    def __init__(self, policy_dir: str = "secure_mcp_server/policies"):
        self.policy_dir = policy_dir
        self.default_policy = os.path.join(policy_dir, "governance.rego")

    async def evaluate(
        self,
        intent: IntentClassification,
        risk: RiskScore,
        user_context: Dict[str, Any],
        tool_metadata: Dict[str, Any] = None,
        simulation_mode: bool = False,
        arguments: Dict[str, Any] = None
    ) -> OPAPolicyResult:
        """Evaluate the execution against OPA policies."""
        
        # 1. Resolve tenant and check database for active PolicyBundle
        tenant_id = user_context.get("tenant_id") or "default"
        db_policy_rego = None
        try:
            from secure_mcp_server.database import PolicyBundle
            async with get_db_manager().get_session_context() as db:
                stmt = select(PolicyBundle).where(PolicyBundle.tenant_id == tenant_id, PolicyBundle.is_active == True)
                result = await db.execute(stmt)
                db_bundle = result.scalars().first()
                if db_bundle and db_bundle.rego_content:
                    db_policy_rego = db_bundle.rego_content
        except Exception as e:
            logger.debug("Failed to query active PolicyBundle from DB, using file-based fallback", error=str(e))

        # Determine path to evaluate
        policy_file_path = self.default_policy
        if db_policy_rego:
            policy_file_path = os.path.join(self.policy_dir, f"active_db_{tenant_id}.rego")
            try:
                with open(policy_file_path, "w", encoding="utf-8") as f:
                    f.write(db_policy_rego)
            except Exception as e:
                logger.error("Failed to write active PolicyBundle to file", error=str(e))
                policy_file_path = self.default_policy

        # 2. Construct the Input JSON
        input_data = {
            "input": {
                "intent": {
                    "intent_category": intent.intent_category.value,
                    "confidence": intent.confidence,
                },
                "risk": {
                    "score": risk.score,
                    "level": risk.level.value
                },
                "user_context": user_context,
                "tool_metadata": tool_metadata or {},
                "taints": getattr(intent, "taint_labels", []),
                "arguments": arguments or {}
            }
        }
        
        decision_str = "ALLOW"
        explanation = "Execution permitted by default policies"
        req_approvers = None
        
        # 3. Attempt to run OPA
        try:
            # Check if OPA exists and execute evaluation
            proc = await asyncio.create_subprocess_shell(
                f"opa eval -d {policy_file_path} 'data.secure_mcp.governance' -I",
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await proc.communicate(json.dumps(input_data).encode())
            
            if proc.returncode == 0:
                result = json.loads(stdout.decode())
                if "result" in result and len(result["result"]) > 0:
                    gov_data = result["result"][0].get("expressions", [])[0].get("value", {})
                    decision_str = gov_data.get("decision", "ALLOW")
                    explanation = gov_data.get("explanation", explanation)
                    
                    if decision_str == "REQUIRE_APPROVAL":
                        if "admin" in explanation.lower():
                            req_approvers = ["admin"]
                        else:
                            req_approvers = ["manager", "admin"]
                            
                    logger.debug("OPA evaluation complete", decision=decision_str)
            else:
                logger.warning("OPA evaluation failed, falling back to strict mock", stderr=stderr.decode())
                decision_str, explanation = self._fallback_evaluation(input_data["input"])
                
        except Exception as e:
            logger.warning("OPA binary not found or execution failed, using fallback evaluation", error=str(e))
            decision_str, explanation = self._fallback_evaluation(input_data["input"])

        # Clean up temporary database policy file if created
        if policy_file_path != self.default_policy:
            try:
                os.remove(policy_file_path)
            except Exception:
                pass

        # 4. Map to Python Enum
        decision = PolicyDecisionType(decision_str.lower())
        if decision == PolicyDecisionType.REQUIRE_APPROVAL and not req_approvers:
            if "admin" in explanation.lower():
                req_approvers = ["admin"]
            else:
                req_approvers = ["manager", "admin"]
        
        # 5. Handle Simulation Mode
        if simulation_mode and decision != PolicyDecisionType.ALLOW:
            logger.info(
                "SIMULATION MODE: Would have blocked execution",
                decision=decision.value,
                explanation=explanation
            )
            explanation = f"[SIMULATED] Would have resulted in {decision.value}: {explanation}"
            decision = PolicyDecisionType.ALLOW
            
        # 6. Log to Database
        try:
            async with get_db_manager().get_session_context() as db:
                log_entry = PolicyDecisionLog(
                    tenant_id=user_context.get("tenant_id", "default"),
                    user_id=user_context.get("user_id"),
                    session_id=user_context.get("session_id"),
                    tool_name=intent.tool_name,
                    intent_category=intent.intent_category.value,
                    risk_score=risk.score,
                    risk_level=risk.level.value,
                    decision=decision.value,
                    explanation=explanation,
                    evaluation_chain={
                        "opa_input": input_data["input"],
                        "tool_arguments": arguments or {},   # Gap 4: persist full arguments
                        "taint_labels": getattr(intent, "taint_labels", []),
                        "client_ip": user_context.get("client_ip"),
                    },
                    taint_labels=getattr(intent, "taint_labels", [])
                )
                db.add(log_entry)
                await db.commit()
        except Exception as e:
            logger.error("Failed to log policy decision to DB", error=str(e))

        res = OPAPolicyResult(decision=decision, explanation=explanation)
        res.requires_approval_from = req_approvers
        return res

    def _fallback_evaluation(self, input_data: Dict[str, Any]) -> tuple[str, str]:
        """A native python fallback mimicking the Rego logic if the opa binary is missing."""
        intent_cat = input_data["intent"]["intent_category"]
        risk_score = input_data["risk"]["score"]
        taints = input_data["taints"]
        arguments = input_data.get("arguments") or {}
        
        # 1. Shell Injection detection
        for k, v in arguments.items():
            if isinstance(v, str) and re.search(r'[;&|`$]', v):
                return "DENY", f"Injection detected in parameter '{k}': contains dangerous characters"
        
        # 2. Destructive delete actions
        if intent_cat == "delete":
            if risk_score >= 0.9:
                return "DENY", "High risk destructive actions are strictly prohibited"
            elif risk_score >= 0.7:
                return "REQUIRE_APPROVAL", "Destructive delete actions require manual approval"
        
        # 3. Taint Blocking on sensitive categories
        taint_blocking_categories = {"write", "execute", "delete", "configure", "admin"}
        if intent_cat in taint_blocking_categories and len(taints) > 0:
            return "DENY", f"Tainted session cannot execute sensitive action: category '{intent_cat}'"
            
        # 4. Check permissions required
        req_perms = input_data.get("tool_metadata", {}).get("permissions_required") or []
        user_perms = input_data.get("user_context", {}).get("permissions") or []
        if req_perms:
            has_perm = False
            if "*" in user_perms:
                has_perm = True
            else:
                has_perm = all(p in user_perms for p in req_perms)
            if not has_perm:
                return "DENY", f"Missing required permissions. Need: {req_perms}"
            
        # 5. Rest of the existing fallback rules
        if intent_cat == "write" and len(taints) > 0:
            return "DENY", "Mutating actions are not allowed when session is tainted"
            
        if intent_cat == "write" and 0.7 <= risk_score < 0.9 and len(taints) == 0:
            return "REQUIRE_APPROVAL", "Medium-high risk writes require manual approval"
            
        if input_data.get("tool_metadata", {}).get("sensitivity_level") == "restricted":
            if input_data.get("user_context", {}).get("role") != "admin":
                return "REQUIRE_APPROVAL", "Restricted sensitivity tools require admin approval for non-admins"
                
        return "ALLOW", "Execution permitted by fallback default policies"
