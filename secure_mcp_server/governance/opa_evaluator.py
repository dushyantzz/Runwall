"""
OPA / Rego Policy Evaluator.

Evaluates execution intent, risk, and user context against versioned Rego policies.
"""
import asyncio
import json
import os
import re
import uuid
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

# Module-level counter for DB insert failures — exposed via /health
_decision_log_failure_count: int = 0

# Keys whose values must be redacted before storing in evaluation_chain
_SECRET_KEYS = frozenset({
    "token", "api_key", "apikey", "secret", "password", "passwd",
    "authorization", "auth", "credential", "credentials",
    "access_token", "refresh_token", "private_key",
})


def _redact_args(obj: Any) -> Any:
    """Recursively redact sensitive keys from a dict/list before DB storage."""
    if isinstance(obj, dict):
        return {
            k: ("***REDACTED***" if k.lower() in _SECRET_KEYS else _redact_args(v))
            for k, v in obj.items()
        }
    elif isinstance(obj, list):
        return [_redact_args(item) for item in obj]
    return obj


def _safe_user_id(raw: Any) -> Optional[int]:
    """Return int(raw) if castable, else None."""
    if raw is None:
        return None
    try:
        return int(raw)
    except (ValueError, TypeError):
        return None


def _extract_client_ip(user_context: Dict[str, Any], scope: Dict[str, Any] = None) -> Optional[str]:
    """
    Extract client IP in priority order:
      1. CF-Connecting-IP (from user_context pre-populated by middleware)
      2. X-Forwarded-For (first entry)
      3. client_ip already set in user_context
      4. socket address from ASGI scope
    """
    for key in ("cf_connecting_ip", "CF-Connecting-IP"):
        ip = user_context.get(key)
        if ip:
            return str(ip).strip()

    xff = user_context.get("x_forwarded_for") or user_context.get("X-Forwarded-For")
    if xff:
        return str(xff).split(",")[0].strip()

    ip = user_context.get("client_ip")
    if ip:
        return str(ip).strip()

    if scope:
        client = scope.get("client")
        if client:
            return client[0]

    return None


class OPAPolicyResult:
    def __init__(self, decision: PolicyDecisionType, explanation: str, raw_output: Dict[str, Any] = None):
        self.decision = decision
        self.explanation = explanation
        self.matched_rule = None
        self.raw_output = raw_output or {}
        self.requires_approval_from = None
        self.evaluation_engine: str = "opa"  # overridden to "fallback" when OPA is not used

    def to_audit_dict(self) -> Dict[str, Any]:
        return {
            "decision": self.decision.value,
            "explanation": self.explanation,
            "engine": self.evaluation_engine,
        }


async def check_opa_available(opa_bin: str) -> tuple[bool, str]:
    """
    Run `opa version` and return (ok, version_string).
    Returns (False, error_message) if the binary is not found or fails.
    """
    try:
        proc = await asyncio.create_subprocess_exec(
            opa_bin, "version",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await proc.communicate()
        if proc.returncode == 0:
            version_line = stdout.decode().splitlines()[0] if stdout else "unknown"
            return True, version_line
        return False, stderr.decode().strip()
    except Exception as e:
        return False, str(e)


async def startup_opa_check(opa_bin: str, environment: str = "production") -> None:
    """
    Run at server startup.
    - production: raises RuntimeError if OPA is unavailable (refuse to start).
    - other envs: logs a loud WARNING but continues.
    """
    ok, info = await check_opa_available(opa_bin)
    if ok:
        logger.info("OPA binary verified", version=info, path=opa_bin)
    else:
        msg = f"OPA binary not available at '{opa_bin}': {info}"
        if environment.lower() == "production":
            raise RuntimeError(f"[FATAL] {msg} — refusing to start in production without OPA.")
        else:
            logger.warning(
                "⚠️  OPA BINARY NOT FOUND — policy evaluation will use FAIL-CLOSED FALLBACK",
                opa_bin=opa_bin,
                error=info,
            )


class OPAPolicyEvaluator:
    """Evaluates policies using Open Policy Agent (OPA)."""

    def __init__(self, policy_dir: str = "secure_mcp_server/policies"):
        self.policy_dir = policy_dir
        self.default_policy = os.path.join(policy_dir, "governance.rego")
        from secure_mcp_server.config import get_settings
        self._settings = get_settings()

    @property
    def _opa_bin(self) -> str:
        return self._settings.opa_bin

    async def evaluate(
        self,
        intent: IntentClassification,
        risk: RiskScore,
        user_context: Dict[str, Any],
        tool_metadata: Dict[str, Any] = None,
        simulation_mode: bool = False,
        arguments: Dict[str, Any] = None,
        asgi_scope: Dict[str, Any] = None,
    ) -> OPAPolicyResult:
        """Evaluate the execution against OPA policies."""
        global _decision_log_failure_count
        import time as _time
        eval_start_time = _time.time()

        # 1. Resolve tenant and check database for active PolicyBundle
        tenant_id = user_context.get("tenant_id") or "default"
        db_policy_rego = None
        try:
            from secure_mcp_server.database import PolicyBundle
            async with get_db_manager().get_session_context() as db:
                stmt = select(PolicyBundle).where(
                    PolicyBundle.tenant_id == tenant_id,
                    PolicyBundle.is_active == True,
                )
                result = await db.execute(stmt)
                db_bundle = result.scalars().first()
                if db_bundle and db_bundle.rego_content:
                    db_policy_rego = db_bundle.rego_content
        except Exception as e:
            logger.debug("Failed to query active PolicyBundle from DB, using file-based fallback", error=str(e))

        # Determine path to evaluate
        policy_file_path = self.default_policy
        if db_policy_rego:
            safe_tenant_id = re.sub(r'[^a-zA-Z0-9_-]', '', str(tenant_id))
            if not safe_tenant_id:
                safe_tenant_id = "default"
            policy_file_path = os.path.join(self.policy_dir, f"active_db_{safe_tenant_id}.rego")
            try:
                with open(policy_file_path, "w", encoding="utf-8") as f:
                    f.write(db_policy_rego)
            except Exception as e:
                logger.error("Failed to write active PolicyBundle to file", error=str(e))
                policy_file_path = self.default_policy

        # 2. Construct the Input JSON (with URL decoding to prevent evasion bypasses)
        import urllib.parse
        decoded_arguments = {}
        if arguments:
            for k, v in arguments.items():
                if isinstance(v, str):
                    try:
                        decoded_arguments[k] = urllib.parse.unquote(v)
                    except Exception:
                        decoded_arguments[k] = v
                else:
                    decoded_arguments[k] = v

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
                "arguments": decoded_arguments
            }
        }

        decision_str = "ALLOW"
        explanation = "Execution permitted by default policies"
        req_approvers = None
        evaluation_engine = "opa"

        # 3. Attempt to run OPA
        try:
            proc = await asyncio.create_subprocess_exec(
                self._opa_bin, 'eval', '-d', policy_file_path,
                'data.secure_mcp.governance', '-I',
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            stdout, stderr = await proc.communicate(json.dumps(input_data["input"]).encode())

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
                logger.warning("OPA evaluation failed, falling back to strict evaluator", stderr=stderr.decode())
                decision_str, explanation = self._fallback_evaluation(input_data["input"])
                evaluation_engine = "fallback"

        except Exception as e:
            logger.warning(
                "OPA binary not found or execution failed, using fail-closed fallback",
                opa_bin=self._opa_bin,
                error=str(e),
            )
            decision_str, explanation = self._fallback_evaluation(input_data["input"])
            evaluation_engine = "fallback"

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

        # 6. Resolve principal + user_id safely
        raw_principal = user_context.get("user_id")
        safe_uid = _safe_user_id(raw_principal)
        principal_str = str(raw_principal) if raw_principal is not None else None

        # 7. Resolve session_id — generate one if missing
        session_id = user_context.get("session_id")
        if not session_id:
            session_id = str(uuid.uuid4())

        # 8. Extract client_ip
        client_ip = _extract_client_ip(user_context, asgi_scope)

        # 9. Redact secrets from stored arguments
        redacted_arguments = _redact_args(arguments or {})

        # 10. Log to Database
        # For DENY / REQUIRE_APPROVAL: write synchronously (before returning response)
        # For ALLOW: write synchronously too — failures are now surfaced, not swallowed
        log_id = None
        try:
            async with get_db_manager().get_session_context() as db:
                log_entry = PolicyDecisionLog(
                    tenant_id=user_context.get("tenant_id", "default"),
                    user_id=safe_uid,
                    principal=principal_str,
                    session_id=session_id,
                    client_ip=client_ip,
                    tool_name=intent.tool_name,
                    intent_category=intent.intent_category.value,
                    risk_score=risk.score,
                    risk_level=risk.level.value,
                    decision=decision.value,
                    explanation=explanation,
                    evaluation_engine=evaluation_engine,
                    evaluation_chain={
                        # Redact secrets from the stored OPA input as well
                        "opa_input": {
                            **input_data["input"],
                            "arguments": redacted_arguments,
                        },
                        "tool_arguments": redacted_arguments,
                        "taint_labels": getattr(intent, "taint_labels", []),
                        "client_ip": client_ip,
                    },
                    taint_labels=getattr(intent, "taint_labels", []),
                )
                db.add(log_entry)
                await db.commit()
                await db.refresh(log_entry)
                log_id = log_entry.id
        except Exception as e:
            _decision_log_failure_count += 1
            logger.error(
                "Failed to log policy decision to DB",
                failure_count=_decision_log_failure_count,
                decision=decision.value,
                tool_name=intent.tool_name,
                principal=principal_str,
                session_id=session_id,
                error=str(e),
            )

        # 11. Record into security_events via EventRecorder
        try:
            from secure_mcp_server.governance.event_recorder import get_event_recorder, SecurityEventPayload
            from secure_mcp_server.governance.redaction import redact, compute_args_hash

            event_req_id = user_context.get("request_id")
            if not event_req_id and asgi_scope:
                event_req_id = asgi_scope.get("request_id") or (asgi_scope.get("state") or {}).get("request_id")
            if not event_req_id:
                event_req_id = str(uuid.uuid4())

            redacted_payload = redact(arguments or {})
            args_hash_val = compute_args_hash(redacted_payload)
            eval_latency_ms = int((_time.time() - eval_start_time) * 1000)

            sec_event = SecurityEventPayload(
                request_id=event_req_id,
                tenant_id=user_context.get("tenant_id", "default"),
                user_id=safe_uid,
                api_key_id=user_context.get("api_key_id"),
                principal=principal_str,
                agent_name=user_context.get("agent_name"),
                client_ip=client_ip,
                user_agent=user_context.get("user_agent"),
                session_id=session_id,
                event_type="tool_call",
                action="call_tool",
                stage="policy",
                tool_name=intent.tool_name,
                intent_category=intent.intent_category.value,
                risk_score=risk.score,
                risk_level=risk.level.value,
                decision=decision.value,
                rule_id=None,
                rule_snapshot=None,
                bundle_version=None,
                engine=evaluation_engine,
                mode="simulate" if simulation_mode else "enforce",
                reason=explanation,
                args_redacted=redacted_payload,
                args_hash=args_hash_val,
                taint_labels=list(getattr(intent, "taint_labels", []) or []),
                latency_ms=eval_latency_ms,
            )
            event_recorded = await get_event_recorder().record_event(sec_event)

            # Fail-closed enforcement if audit write fails and risk >= 0.7 for an ALLOW decision
            if not event_recorded and decision == PolicyDecisionType.ALLOW:
                from secure_mcp_server.config import get_settings
                if get_settings().audit_fail_mode == "closed" and risk.score >= 0.7:
                    logger.critical(
                        "Audit write failed for elevated risk action in fail-closed mode — forcing REQUIRE_APPROVAL",
                        tool=intent.tool_name,
                        risk_score=risk.score,
                        request_id=event_req_id,
                    )
                    decision = PolicyDecisionType.REQUIRE_APPROVAL
                    explanation = f"[FAIL-CLOSED AUDIT] {explanation} (Audit record persistence failed)"
                    req_approvers = ["admin"]
        except Exception as _ev_err:
            logger.error("Failed to record security event in EventRecorder", error=str(_ev_err))

        res = OPAPolicyResult(decision=decision, explanation=explanation)
        res.requires_approval_from = req_approvers
        res.evaluation_engine = evaluation_engine
        return res

    def _fallback_evaluation(self, input_data: Dict[str, Any]) -> tuple[str, str]:
        """
        Fail-closed Python fallback that mirrors governance.rego logic.

        Decision ladder (highest priority first):
          - Fallback itself errors → DENY
          - risk >= 0.9 (any intent) → DENY
          - risk >= 0.8 (any intent) → REQUIRE_APPROVAL
          - Shell injection (recursive) → DENY
          - Sensitive path (recursive, normalized) → DENY
          - SSRF URL (recursive) → DENY
          - Destructive command in args (recursive) → DENY
          - Path traversal → DENY
          - Delete intent + risk >= 0.9 → DENY
          - Delete/taint/permission checks → existing logic
          - risk >= 0.7 (any intent) → REQUIRE_APPROVAL
          - Default → ALLOW
        """
        try:
            return self._fallback_evaluation_inner(input_data)
        except Exception as e:
            logger.error("Fallback evaluator raised an exception — failing CLOSED", error=str(e))
            return "DENY", "Policy evaluation failed — execution denied by safety default"

    def _fallback_evaluation_inner(self, input_data: Dict[str, Any]) -> tuple[str, str]:
        import re as _re
        import urllib.parse as _urlparse

        intent_cat = input_data["intent"]["intent_category"]
        risk_score = input_data["risk"]["score"]
        taints = input_data["taints"]
        arguments = input_data.get("arguments") or {}

        # Collect all string leaf values recursively
        def _collect_strings(obj: Any) -> List[str]:
            strings = []
            if isinstance(obj, str):
                strings.append(obj)
            elif isinstance(obj, dict):
                for v in obj.values():
                    strings.extend(_collect_strings(v))
            elif isinstance(obj, list):
                for item in obj:
                    strings.extend(_collect_strings(item))
            return strings

        def _normalize_path(s: str) -> str:
            """Normalize for path matching: URL-decode, collapse .., lowercase."""
            try:
                s = _urlparse.unquote(s)
            except Exception:
                pass
            s = s.replace("\\", "/")
            # Resolve ..
            parts = s.split("/")
            resolved = []
            for part in parts:
                if part == "..":
                    if resolved:
                        resolved.pop()
                else:
                    resolved.append(part)
            return "/".join(resolved).lower()

        all_strings = []
        for k, v in arguments.items():
            all_strings.extend(_collect_strings(v))
            # Also include key names for path args
            if isinstance(k, str):
                all_strings.append(k)

        # ── Generic high-risk gates (before per-rule checks) ─────────────
        if risk_score >= 0.9:
            return "DENY", "Critical risk score — execution denied by safety threshold"
        if risk_score >= 0.8:
            return "REQUIRE_APPROVAL", "High risk score — requires manual approval"

        # ── Shell injection (recursive) ───────────────────────────────────
        # Patterns that are unambiguously shell metacharacters:
        #   ;          — command separator
        #   |          — pipe (not part of URL, matched as token)
        #   `          — backtick substitution
        #   &&         — shell AND (NOT lone & which appears in URL query strings)
        #   $( ${ $VARNAME — shell substitution ($9 is NOT a var name — it's a price)
        #   Shell var names start with letter or underscore, not digit
        _SHELL_RE = _re.compile(r'(;|(?<![a-z0-9_])\|(?![^;|]*://)|`|&&|\$[({]|\$[a-zA-Z_])')
        for s in all_strings:
            if _SHELL_RE.search(s):
                return "DENY", f"Shell injection pattern detected in arguments: contains dangerous characters"

        # ── Path traversal (recursive, before normalization) ─────────────
        _TRAVERSAL_RE = _re.compile(
            r'(\.\./|%2e%2e[/%]|%252e%252e)',
            _re.IGNORECASE,
        )
        for s in all_strings:
            if _TRAVERSAL_RE.search(s):
                return "DENY", "Path traversal sequence detected in arguments"

        # ── Sensitive path (recursive, normalized) ────────────────────────
        # Also match paths WITHOUT leading slash (e.g. after traversal normalization)
        _SENSITIVE_PATH_RE = _re.compile(
            r'(/?(etc|proc|dev)/(passwd|shadow|sudoers|hosts)|'
            r'/?\.ssh/|'
            r'(^|/)\.env(/|$)|'
            r'/?\.aws/credentials|'
            r'/?\.git-credentials|'
            r'kubeconfig|/root/)',
            _re.IGNORECASE,
        )
        for s in all_strings:
            norm = _normalize_path(s)
            if _SENSITIVE_PATH_RE.search(norm):
                return "DENY", f"Access to sensitive path or file prohibited"

        # ── SSRF detection (recursive) ────────────────────────────────────
        _SSRF_HOST_RE = _re.compile(
            r'(169\.254\.169\.254'            # AWS IMDS
            r'|metadata\.google\.internal'    # GCP metadata
            r'|fd00:ec2::254'                 # IPv6 IMDS
            r'|localhost'
            r'|127\.\d+\.\d+\.\d+'           # 127.x.x.x
            r'|10\.\d+\.\d+\.\d+'            # RFC1918 10/8
            r'|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+'  # RFC1918 172.16-31
            r'|192\.168\.\d+\.\d+'           # RFC1918 192.168
            r'|\[::1\]'                       # IPv6 loopback
            r'|0177\.'                        # Octal 127
            r'|0x7f)',                        # Hex 127
            _re.IGNORECASE,
        )
        _SSRF_SCHEME_RE = _re.compile(r'^(file|gopher|dict|ftp|sftp|ldap|tftp)://', _re.IGNORECASE)
        for s in all_strings:
            if _SSRF_SCHEME_RE.match(s.strip()):
                return "DENY", "Non-HTTP(S) URL scheme blocked to prevent SSRF"
            if _re.search(r'https?://', s, _re.IGNORECASE) and _SSRF_HOST_RE.search(s):
                return "DENY", "URL targets a private/metadata IP — SSRF blocked"

        # ── Destructive commands (recursive) ─────────────────────────────
        _DESTRUCTIVE_CMD_RE = _re.compile(
            r'(rm\s+-rf'
            r'|mkfs\b'
            r'|dd\s+if='
            r'|dd\s+of='
            r'|\bshred\b'
            r'|DROP\s+(TABLE|DATABASE|SCHEMA)'
            r'|TRUNCATE\s+TABLE'
            r'|DELETE\s+FROM\s+\w+\s*(?!WHERE)'  # DELETE FROM without WHERE
            r'|chmod\s+-R\s+777'
            r'|>\s*/dev/'
            r'|mkfs\.'
            r'|format\s+c:)',
            _re.IGNORECASE,
        )
        for s in all_strings:
            if _DESTRUCTIVE_CMD_RE.search(s):
                return "DENY", "Destructive command detected in arguments — execution denied"

        # ── Delete intent rules ───────────────────────────────────────────
        if intent_cat == "delete":
            if risk_score >= 0.9:
                return "DENY", "High risk destructive actions are strictly prohibited"
            elif risk_score >= 0.7:
                return "REQUIRE_APPROVAL", "Destructive delete actions require manual approval"

        # ── Taint blocking on sensitive categories ────────────────────────
        taint_blocking_categories = {"write", "execute", "delete", "configure", "admin"}
        if intent_cat in taint_blocking_categories and len(taints) > 0:
            return "DENY", f"Tainted session cannot execute sensitive action: category '{intent_cat}'"

        # ── Permission check ──────────────────────────────────────────────
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

        # ── Write rules ───────────────────────────────────────────────────
        if intent_cat == "write" and len(taints) > 0:
            return "DENY", "Mutating actions are not allowed when session is tainted"

        if intent_cat == "write" and 0.7 <= risk_score < 0.9 and len(taints) == 0:
            return "REQUIRE_APPROVAL", "Medium-high risk writes require manual approval"

        if input_data.get("tool_metadata", {}).get("sensitivity_level") == "restricted":
            if input_data.get("user_context", {}).get("role") != "admin":
                return "REQUIRE_APPROVAL", "Restricted sensitivity tools require admin approval for non-admins"

        # ── Generic risk >= 0.7 gate ──────────────────────────────────────
        if risk_score >= 0.7:
            return "REQUIRE_APPROVAL", "Elevated risk score — requires manual approval"

        return "ALLOW", "Execution permitted by fallback default policies"
