"""
OPA / Rego Policy Evaluator.

Evaluates execution intent, risk, and user context against versioned Rego policies.
"""
from typing import Dict, Any, Optional, List
import json
import subprocess
import asyncio
import structlog
import os

from secure_mcp_server.governance.intent_types import Intent, IntentCategory
from secure_mcp_server.governance.risk_scorer import RiskAssessment
from secure_mcp_server.database import get_db_manager, PolicyDecisionLog, PolicyDecisionType

logger = structlog.get_logger(__name__)

class OPAPolicyResult:
    def __init__(self, decision: PolicyDecisionType, explanation: str, raw_output: Dict[str, Any] = None):
        self.decision = decision
        self.explanation = explanation
        self.matched_rule = None
        self.raw_output = raw_output or {}

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
        intent: Intent,
        risk: RiskAssessment,
        user_context: Dict[str, Any],
        tool_metadata: Dict[str, Any] = None,
        simulation_mode: bool = False
    ) -> OPAPolicyResult:
        """Evaluate the execution against OPA policies."""
        
        # 1. Construct the Input JSON
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
                "taints": intent.taint_labels
            }
        }
        
        decision_str = "ALLOW"
        explanation = "Execution permitted by default policies"
        
        # 2. Attempt to run OPA
        try:
            # Check if opa exists
            proc = await asyncio.create_subprocess_shell(
                f"opa eval -d {self.default_policy} 'data.secure_mcp.governance' -I",
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
                    logger.debug("OPA evaluation complete", decision=decision_str)
            else:
                logger.warning("OPA evaluation failed, falling back to strict mock", stderr=stderr.decode())
                decision_str, explanation = self._fallback_evaluation(input_data["input"])
                
        except Exception as e:
            logger.warning("OPA binary not found or execution failed, using fallback evaluation", error=str(e))
            decision_str, explanation = self._fallback_evaluation(input_data["input"])

        # 3. Map to Python Enum
        decision = PolicyDecisionType(decision_str.upper())
        
        # 4. Handle Simulation Mode
        if simulation_mode and decision != PolicyDecisionType.ALLOW:
            logger.info(
                "SIMULATION MODE: Would have blocked execution",
                decision=decision.value,
                explanation=explanation
            )
            explanation = f"[SIMULATED] Would have resulted in {decision.value}: {explanation}"
            decision = PolicyDecisionType.ALLOW
            
        # 5. Log to Database
        try:
            async with get_db_manager().get_session_context() as db:
                log_entry = PolicyDecisionLog(
                    tenant_id=user_context.get("tenant_id", "default"),
                    user_id=user_context.get("user_id"),
                    decision=decision.value,
                    explanation=explanation,
                    context_snapshot=input_data["input"]
                )
                db.add(log_entry)
                await db.commit()
        except Exception as e:
            logger.error("Failed to log policy decision to DB", error=str(e))

        return OPAPolicyResult(decision=decision, explanation=explanation)

    def _fallback_evaluation(self, input_data: Dict[str, Any]) -> tuple[str, str]:
        """A native python fallback mimicking the Rego logic if the opa binary is missing."""
        intent_cat = input_data["intent"]["intent_category"]
        risk_score = input_data["risk"]["score"]
        taints = input_data["taints"]
        
        if intent_cat == "delete" and risk_score >= 0.9:
            return "DENY", "High risk destructive actions are strictly prohibited"
            
        if intent_cat == "write" and len(taints) > 0:
            return "DENY", "Mutating actions are not allowed when session is tainted"
            
        if intent_cat == "write" and 0.7 <= risk_score < 0.9 and len(taints) == 0:
            return "REQUIRE_APPROVAL", "Medium-high risk writes require manual approval"
            
        if input_data.get("tool_metadata", {}).get("sensitivity_level") == "restricted":
            if input_data.get("user_context", {}).get("role") != "admin":
                return "REQUIRE_APPROVAL", "Restricted sensitivity tools require admin approval for non-admins"
                
        return "ALLOW", "Execution permitted by fallback default policies"
