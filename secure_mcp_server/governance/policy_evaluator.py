"""
Policy Evaluator — rule-based decision engine for execution governance.

Evaluates versioned, priority-ordered policy rules against the classified
intent and risk score to produce an explainable ALLOW / DENY /
REQUIRE_APPROVAL decision.

Rules follow a **first-match-wins** model (like firewall rules):

1. Rules are sorted by ``priority`` (lower number = higher priority).
2. The first rule whose conditions match the current request determines
   the decision.
3. If no rule matches, the **default policy** applies (configurable,
   defaults to DENY — Zero Trust).

Every evaluation produces a full :class:`PolicyEvaluationResult` with an
``evaluation_chain`` that records why each rule matched or was skipped,
making every decision explainable and auditable.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import json

from sqlalchemy.future import select
import structlog

from .intent_types import (
    BlastRadius,
    IntentCategory,
    IntentClassification,
    PolicyDecisionType,
    PolicyEvaluationResult,
    PolicyRuleMatch,
    ResourceSensitivity,
    RiskLevel,
    RiskScore,
)

from secure_mcp_server.database import get_db_manager, PolicyRule as DBPolicyRule, PolicyDecisionLog

logger = structlog.get_logger()


class PolicyRule:
    """
    In-memory representation of a policy rule.

    In production, these are loaded from the ``policy_rules`` database table.
    This class is a lightweight domain object used by the evaluator; it is
    **not** the SQLAlchemy ORM model (that lives in ``database.models``).

    Attributes
    ----------
    rule_id : str
        Unique identifier.
    name : str
        Human-readable rule name.
    description : str
        Explains the rule's purpose.
    priority : int
        Lower number = evaluated first.
    conditions : dict
        Matching criteria.  Supported keys:

        - ``intent_categories`` : list[str]  — match any of these intents
        - ``risk_levels`` : list[str]  — match any of these risk levels
        - ``risk_threshold_min`` : float  — match when score >= this value
        - ``risk_threshold_max`` : float  — match when score <= this value
        - ``tool_patterns`` : list[str]  — fnmatch-style tool name patterns
        - ``user_roles`` : list[str]  — match if user has any of these roles
        - ``tenant_ids`` : list[str]  — restrict to specific tenants
        - ``is_destructive`` : bool  — match destructive actions
        - ``is_bulk`` : bool  — match bulk operations
        - ``blast_radius`` : list[str] — match any of these radii
        - ``resource_sensitivity`` : list[str] — match any of these levels
        - ``is_admin_only`` : bool  — only apply to non-admin users

    action : PolicyDecisionType
        The decision to apply when this rule matches.
    action_params : dict
        Additional parameters for the action (e.g. approval requirements).
    is_active : bool
        Disabled rules are skipped during evaluation.
    """

    def __init__(
        self,
        rule_id: str,
        name: str,
        description: str = "",
        priority: int = 100,
        conditions: Optional[Dict[str, Any]] = None,
        action: PolicyDecisionType = PolicyDecisionType.DENY,
        action_params: Optional[Dict[str, Any]] = None,
        is_active: bool = True,
        tenant_id: Optional[str] = None,
        version: int = 1,
    ) -> None:
        self.rule_id = rule_id
        self.name = name
        self.description = description
        self.priority = priority
        self.conditions = conditions or {}
        self.action = action
        self.action_params = action_params or {}
        self.is_active = is_active
        self.tenant_id = tenant_id
        self.version = version


# ---------------------------------------------------------------------------
# Default policy rules (seeded on first boot)
# ---------------------------------------------------------------------------

def get_default_policy_rules() -> List[PolicyRule]:
    """
    Return the built-in policy rules that ship with the platform.

    These provide sensible governance out of the box while allowing
    organisations to override with their own rules at higher priority.
    """
    return [
        # --- Priority 10: Hard deny for anonymous destructive actions ------
        PolicyRule(
            rule_id="default-001",
            name="Block anonymous destructive actions",
            description=(
                "Deny any destructive action (delete, drop, truncate) from "
                "anonymous or unauthenticated users."
            ),
            priority=10,
            conditions={
                "is_destructive": True,
                "user_roles": ["anonymous", "guest"],
            },
            action=PolicyDecisionType.DENY,
        ),

        # --- Priority 20: Require approval for critical risk ---------------
        PolicyRule(
            rule_id="default-002",
            name="Require approval for critical risk",
            description=(
                "Any action that scores CRITICAL risk must be approved by "
                "a security team member before execution."
            ),
            priority=20,
            conditions={
                "risk_levels": ["critical"],
            },
            action=PolicyDecisionType.REQUIRE_APPROVAL,
            action_params={
                "required_approvers": ["security_team", "admin"],
                "expiry_minutes": 60,
            },
        ),

        # --- Priority 30: Require approval for high-risk bulk exports ------
        PolicyRule(
            rule_id="default-003",
            name="Require approval for bulk exports",
            description=(
                "Bulk export operations with high or critical risk require "
                "manager approval."
            ),
            priority=30,
            conditions={
                "intent_categories": ["export"],
                "is_bulk": True,
                "risk_levels": ["high", "critical"],
            },
            action=PolicyDecisionType.REQUIRE_APPROVAL,
            action_params={
                "required_approvers": ["manager", "admin"],
                "expiry_minutes": 120,
            },
        ),

        # --- Priority 40: Quarantine system-wide destructive actions -------
        PolicyRule(
            rule_id="default-004",
            name="Quarantine system-wide destructive actions",
            description=(
                "Destructive actions with system-wide blast radius are "
                "quarantined for manual review."
            ),
            priority=40,
            conditions={
                "is_destructive": True,
                "blast_radius": ["system_wide"],
                "is_admin_only": True,
            },
            action=PolicyDecisionType.QUARANTINE,
        ),

        # --- Priority 50: Simulate high-risk write operations ---------------
        PolicyRule(
            rule_id="default-005",
            name="Simulate high-risk writes",
            description=(
                "Write operations with high risk are run in simulation mode "
                "first to preview the effect."
            ),
            priority=50,
            conditions={
                "intent_categories": ["write", "configure"],
                "risk_levels": ["high"],
            },
            action=PolicyDecisionType.SIMULATE,
        ),

        # --- Priority 60: Log-only for medium-risk operations ---------------
        PolicyRule(
            rule_id="default-006",
            name="Enhanced logging for medium-risk actions",
            description=(
                "Medium-risk actions are allowed but logged with full detail "
                "for audit review."
            ),
            priority=60,
            conditions={
                "risk_levels": ["medium"],
            },
            action=PolicyDecisionType.LOG_ONLY,
        ),

        # --- Priority 70: Allow all read operations for authenticated users -
        PolicyRule(
            rule_id="default-007",
            name="Allow read operations",
            description="Read-only operations are allowed for authenticated users.",
            priority=70,
            conditions={
                "intent_categories": ["read"],
            },
            action=PolicyDecisionType.ALLOW,
        ),

        # --- Priority 80: Allow low-risk operations -------------------------
        PolicyRule(
            rule_id="default-008",
            name="Allow low-risk operations",
            description="Operations with negligible or low risk are allowed.",
            priority=80,
            conditions={
                "risk_levels": ["negligible", "low"],
            },
            action=PolicyDecisionType.ALLOW,
        ),

        # --- Priority 90: Allow admin users for most operations -------------
        PolicyRule(
            rule_id="default-009",
            name="Admin override — allow",
            description=(
                "Admin users are allowed to perform most operations. "
                "Critical-risk actions are still caught by higher-priority rules."
            ),
            priority=90,
            conditions={
                "user_roles": ["admin", "owner"],
            },
            action=PolicyDecisionType.ALLOW,
        ),

        # --- Priority 1000: Catch-all deny (Zero Trust) ---------------------
        PolicyRule(
            rule_id="default-999",
            name="Default deny (Zero Trust)",
            description=(
                "If no other rule matched, deny the request. "
                "This is the Zero Trust default."
            ),
            priority=1000,
            conditions={},  # Matches everything
            action=PolicyDecisionType.DENY,
        ),
    ]


class PolicyEvaluator:
    """
    Evaluates policy rules against classified intents and risk scores.

    Usage::

        evaluator = PolicyEvaluator(
            rules=loaded_rules,
            default_action=PolicyDecisionType.DENY,
        )
        result = evaluator.evaluate(
            intent=classification,
            risk=risk_score,
            user_context=user_ctx,
        )
        if result.is_allowed:
            execute_tool(...)
    """

    def __init__(
        self,
        default_action: PolicyDecisionType = PolicyDecisionType.DENY,
    ) -> None:
        self._default_action = default_action

    # ------------------------------------------------------------------
    # Rule management
    # ------------------------------------------------------------------

    def load_rules(self, rules: List[PolicyRule]) -> None:
        """Load and sort rules by priority (lowest number first)."""
        self._rules = sorted(
            [r for r in rules if r.is_active],
            key=lambda r: r.priority,
        )
        logger.info(
            "Policy rules loaded",
            count=len(self._rules),
            rule_ids=[r.rule_id for r in self._rules],
        )

    def add_rule(self, rule: PolicyRule) -> None:
        """Add a single rule and re-sort."""
        self._rules.append(rule)
        self._rules = sorted(
            [r for r in self._rules if r.is_active],
            key=lambda r: r.priority,
        )

    @property
    def rules(self) -> List[PolicyRule]:
        return list(self._rules)

    # ------------------------------------------------------------------
    # Evaluation
    # ------------------------------------------------------------------

    async def evaluate(
        self,
        intent: IntentClassification,
        risk: RiskScore,
        user_context: Dict[str, Any],
    ) -> PolicyEvaluationResult:
        """
        Evaluate all rules in priority order and return the first match.
        Queries the database for live rules and records the decision.
        """
        evaluation_chain: List[PolicyRuleMatch] = []
        matched_rule: Optional[PolicyRule] = None
        matched_rm: Optional[PolicyRuleMatch] = None
        
        tenant_id = user_context.get("tenant_id", "default")
        
        # Load rules from DB
        db_rules = []
        try:
            async with get_db_manager().get_session_context() as db_session:
                stmt = (
                    select(DBPolicyRule)
                    .where(DBPolicyRule.is_active == True)
                    .where(
                        (DBPolicyRule.tenant_id == tenant_id) | 
                        (DBPolicyRule.tenant_id == None) | 
                        (DBPolicyRule.tenant_id == "default")
                    )
                    .order_by(DBPolicyRule.priority.asc())
                )
                result = await db_session.execute(stmt)
                db_rules = result.scalars().all()
        except RuntimeError:
            # Fallback if DB manager isn't initialized yet
            pass
            
        # Convert to domain objects
        rules = []
        for dbr in db_rules:
            action_type = PolicyDecisionType.DENY
            try:
                action_type = PolicyDecisionType(dbr.action.lower())
            except ValueError:
                pass
                
            rules.append(PolicyRule(
                rule_id=dbr.id,
                name=dbr.name,
                description=dbr.description or "",
                priority=dbr.priority,
                conditions=dbr.conditions or {},
                action=action_type,
                action_params=dbr.action_params or {},
                tenant_id=dbr.tenant_id
            ))

        for rule in rules:
            # Skip rules scoped to a different tenant
            if rule.tenant_id and rule.tenant_id != user_context.get("tenant_id"):
                rm = PolicyRuleMatch(
                    rule_id=rule.rule_id,
                    rule_name=rule.name,
                    priority=rule.priority,
                    matched=False,
                    reason=f"Tenant mismatch: rule={rule.tenant_id}, "
                           f"user={user_context.get('tenant_id')}",
                )
                evaluation_chain.append(rm)
                continue

            match, reason = self._matches(rule, intent, risk, user_context)
            rm = PolicyRuleMatch(
                rule_id=rule.rule_id,
                rule_name=rule.name,
                priority=rule.priority,
                matched=match,
                reason=reason,
            )
            evaluation_chain.append(rm)

            if match:
                matched_rule = rule
                matched_rm = rm
                break  # First-match-wins

        # Build result
        if matched_rule:
            decision = matched_rule.action
            explanation = (
                f"Rule '{matched_rule.name}' (priority {matched_rule.priority}) "
                f"matched: {matched_rule.description}"
            )
            approval_from = matched_rule.action_params.get("required_approvers")
        else:
            decision = self._default_action
            explanation = (
                f"No rule matched. Applying default policy: {self._default_action.value}."
            )
            approval_from = None

        result = PolicyEvaluationResult(
            decision=decision,
            intent=intent,
            risk=risk,
            matched_rule=matched_rm,
            evaluation_chain=evaluation_chain,
            requires_approval_from=approval_from,
            explanation=explanation,
        )

        logger.info(
            "Policy evaluated",
            tool=intent.tool_name,
            decision=decision.value,
            risk_score=risk.score,
            risk_level=risk.level.value,
            matched_rule=matched_rule.rule_id if matched_rule else None,
            rules_evaluated=len(evaluation_chain),
        )
        
        # Save decision log to DB
        try:
            async with get_db_manager().get_session_context() as db_session:
                try:
                    log = PolicyDecisionLog(
                        session_id=user_context.get("session_id"),
                        user_id=user_context.get("user_id") if user_context.get("role") != "service_account" else None,
                        tenant_id=user_context.get("tenant_id", "default"),
                        tool_name=intent.tool_name,
                        intent_category=intent.intent_category.value,
                        risk_score=risk.score,
                        risk_level=risk.level.value,
                        decision=decision.value,
                        matched_rule_id=matched_rule.rule_id if matched_rule else None,
                        evaluation_chain=[rm.to_audit_dict() for rm in evaluation_chain],
                        explanation=explanation,
                        taint_labels=getattr(intent, "taint_labels", [])
                    )
                    db_session.add(log)
                    await db_session.commit()
                except Exception as e:
                    logger.error("Failed to save policy decision log", error=str(e))
                    await db_session.rollback()
        except RuntimeError:
            pass # DB manager not initialized

        return result

    # ------------------------------------------------------------------
    # Condition matching
    # ------------------------------------------------------------------

    def _matches(
        self,
        rule: PolicyRule,
        intent: IntentClassification,
        risk: RiskScore,
        user_context: Dict[str, Any],
    ) -> tuple[bool, str]:
        """
        Check whether ``rule`` conditions match the current request.

        Returns (matched: bool, reason: str).
        All conditions in the rule must be satisfied (AND logic).
        """
        conditions = rule.conditions

        # Empty conditions → catch-all (always matches)
        if not conditions:
            return True, "Catch-all rule (no conditions)"

        # --- intent_categories ---------------------------------------------
        if "intent_categories" in conditions:
            allowed = {c.lower() for c in conditions["intent_categories"]}
            if intent.intent_category.value not in allowed:
                return (
                    False,
                    f"Intent '{intent.intent_category.value}' not in {allowed}",
                )

        # --- taint_labels --------------------------------------------------
        if "taint_labels" in conditions:
            required_taints = {t.lower() for t in conditions["taint_labels"]}
            actual_taints = {t.lower() for t in getattr(intent, "taint_labels", [])}
            if not required_taints.intersection(actual_taints):
                return (
                    False,
                    f"No matching taint labels from {required_taints}",
                )

        # --- risk_levels ---------------------------------------------------
        if "risk_levels" in conditions:
            allowed = {l.lower() for l in conditions["risk_levels"]}
            if risk.level.value not in allowed:
                return (
                    False,
                    f"Risk level '{risk.level.value}' not in {allowed}",
                )

        # --- risk_threshold_min --------------------------------------------
        if "risk_threshold_min" in conditions:
            if risk.score < conditions["risk_threshold_min"]:
                return (
                    False,
                    f"Risk score {risk.score} < min threshold "
                    f"{conditions['risk_threshold_min']}",
                )

        # --- risk_threshold_max --------------------------------------------
        if "risk_threshold_max" in conditions:
            if risk.score > conditions["risk_threshold_max"]:
                return (
                    False,
                    f"Risk score {risk.score} > max threshold "
                    f"{conditions['risk_threshold_max']}",
                )

        # --- tool_patterns -------------------------------------------------
        if "tool_patterns" in conditions:
            import fnmatch

            matched_pattern = any(
                fnmatch.fnmatch(intent.tool_name.lower(), pat.lower())
                for pat in conditions["tool_patterns"]
            )
            if not matched_pattern:
                return (
                    False,
                    f"Tool '{intent.tool_name}' doesn't match patterns "
                    f"{conditions['tool_patterns']}",
                )

        # --- user_roles ----------------------------------------------------
        if "user_roles" in conditions:
            allowed_roles = {r.lower() for r in conditions["user_roles"]}
            user_role = user_context.get("role", "").lower()
            user_id = str(user_context.get("user_id", "")).lower()

            # Special handling for "anonymous" and "guest"
            is_anon = user_id in ("", "anonymous", "none")
            user_roles = {user_role}
            if is_anon:
                user_roles.add("anonymous")
            if user_context.get("is_admin"):
                user_roles.add("admin")
                user_roles.add("owner")

            if not user_roles.intersection(allowed_roles):
                return (
                    False,
                    f"User role '{user_role}' not in {allowed_roles}",
                )

        # --- tenant_ids ----------------------------------------------------
        if "tenant_ids" in conditions:
            tenant = user_context.get("tenant_id", "default")
            if tenant not in conditions["tenant_ids"]:
                return (
                    False,
                    f"Tenant '{tenant}' not in {conditions['tenant_ids']}",
                )

        # --- is_destructive ------------------------------------------------
        if "is_destructive" in conditions:
            if intent.is_destructive != conditions["is_destructive"]:
                return (
                    False,
                    f"Destructive flag mismatch: intent={intent.is_destructive}, "
                    f"required={conditions['is_destructive']}",
                )

        # --- is_bulk -------------------------------------------------------
        if "is_bulk" in conditions:
            if intent.is_bulk_operation != conditions["is_bulk"]:
                return (
                    False,
                    f"Bulk flag mismatch: intent={intent.is_bulk_operation}, "
                    f"required={conditions['is_bulk']}",
                )

        # --- blast_radius --------------------------------------------------
        if "blast_radius" in conditions:
            allowed = {b.lower() for b in conditions["blast_radius"]}
            if intent.blast_radius.value not in allowed:
                return (
                    False,
                    f"Blast radius '{intent.blast_radius.value}' not in {allowed}",
                )

        # --- resource_sensitivity ------------------------------------------
        if "resource_sensitivity" in conditions:
            allowed = {s.lower() for s in conditions["resource_sensitivity"]}
            if intent.resource_sensitivity.value not in allowed:
                return (
                    False,
                    f"Sensitivity '{intent.resource_sensitivity.value}' not in {allowed}",
                )

        # --- is_admin_only -------------------------------------------------
        if conditions.get("is_admin_only"):
            # Rule *only* applies to non-admin users
            if user_context.get("is_admin"):
                return False, "Admin users are excluded from this rule"

        # All conditions passed
        return True, "All conditions matched"
