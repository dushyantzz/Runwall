"""
Event Recorder Service for Zero-Trust AI Governance.

Provides reliable, non-blocking ingestion of security and audit events across all
pipeline stages. Features fail-closed resilience, synchronous write for blocking
decisions, bounded queues for background events, stdout fallback, and unauthenticated rate-limiting.
"""

import asyncio
from abc import ABC, abstractmethod
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
import json
import time
from typing import Any, Dict, List, Optional
import structlog
from sqlalchemy import text

from secure_mcp_server.governance.redaction import redact, compute_args_hash
from secure_mcp_server.config import get_settings

logger = structlog.get_logger(__name__)

import ipaddress
import uuid

def _sanitize_ip(ip: Optional[str]) -> Optional[str]:
    """Validate and clean IP address string for PostgreSQL inet column."""
    if not ip:
        return None
    try:
        ip_str = str(ip).strip()
        if ":" in ip_str and ip_str.count(":") == 1:
            ip_str = ip_str.split(":")[0]
        ipaddress.ip_address(ip_str)
        return ip_str
    except Exception:
        return None

def _ensure_uuid(val: Any) -> str:
    """Ensure a valid UUID string is returned."""
    if val is None:
        return str(uuid.uuid4())
    try:
        return str(uuid.UUID(str(val)))
    except Exception:
        return str(uuid.uuid5(uuid.NAMESPACE_DNS, str(val)))

# Module-level counter for DB write failures (monitored on /health)
_event_log_failures: int = 0


@dataclass
class SecurityEventPayload:
    request_id: str
    tenant_id: str
    event_type: str  # 'tool_call','auth','approval','taint','config','access'
    user_id: Optional[int] = None
    api_key_id: Optional[int] = None
    principal: Optional[str] = None
    agent_name: Optional[str] = None
    client_ip: Optional[str] = None
    user_agent: Optional[str] = None
    session_id: Optional[str] = None
    action: Optional[str] = None
    stage: Optional[str] = None  # 'auth','tenant','trust','rate_limit','taint','risk','policy','approval','system'
    tool_name: Optional[str] = None
    intent_category: Optional[str] = None
    risk_score: Optional[float] = None
    risk_level: Optional[str] = None
    decision: Optional[str] = None  # 'allow','deny','require_approval','quarantine','log_only','simulate'
    rule_id: Optional[str] = None
    rule_snapshot: Optional[Dict[str, Any]] = None
    bundle_version: Optional[str] = None
    engine: Optional[str] = None  # 'opa','fallback','db_rules','transport','none'
    mode: str = "enforce"
    reason: Optional[str] = None
    args_redacted: Optional[Dict[str, Any]] = None
    args_hash: Optional[str] = None
    taint_labels: List[str] = field(default_factory=list)
    latency_ms: Optional[int] = None
    ts: Optional[datetime] = None


@dataclass
class TaintEventPayload:
    tenant_id: str
    label: str
    user_id: Optional[int] = None
    api_key_id: Optional[int] = None
    session_id: Optional[str] = None
    request_id: Optional[str] = None
    source_type: Optional[str] = None  # web | email | file | tool | user
    source_ref: Optional[str] = None
    tool_name: Optional[str] = None
    ts: Optional[datetime] = None


class IEventRecorder(ABC):
    """Abstract interface for Runwall event recording."""

    @abstractmethod
    async def record_event(self, event: SecurityEventPayload) -> bool:
        """Record a security event."""
        pass

    @abstractmethod
    async def record_taint(self, taint: TaintEventPayload) -> bool:
        """Record a taint provenance event."""
        pass

    @abstractmethod
    async def flush(self) -> None:
        """Flush any pending background events."""
        pass


class InMemoryEventRecorder(IEventRecorder):
    """Fast in-memory event recorder for tests."""

    def __init__(self):
        self.events: List[SecurityEventPayload] = []
        self.taints: List[TaintEventPayload] = []

    async def record_event(self, event: SecurityEventPayload) -> bool:
        if not event.ts:
            event.ts = datetime.now(timezone.utc)
        self.events.append(event)
        return True

    async def record_taint(self, taint: TaintEventPayload) -> bool:
        if not taint.ts:
            taint.ts = datetime.now(timezone.utc)
        self.taints.append(taint)
        return True

    async def flush(self) -> None:
        pass

    def clear(self):
        self.events.clear()
        self.taints.clear()


class PostgresEventRecorder(IEventRecorder):
    """
    Production EventRecorder writing to PostgreSQL (Supabase).
    - Synchronous writes for DENY / REQUIRE_APPROVAL / QUARANTINE / auth failures.
    - Bounded async background queue for ALLOW events.
    - Rate limits unauthenticated event floods per client IP.
    - Stdout JSON-line fallback on database connection errors.
    """

    def __init__(self, db_manager=None, queue_size: int = 10000):
        self.db_manager = db_manager
        self.queue: asyncio.Queue = asyncio.Queue(maxsize=queue_size)
        self._worker_task: Optional[asyncio.Task] = None
        self._shutdown_event = asyncio.Event()

        # In-memory IP tracking for unauthenticated flood protection (ip -> (count, window_start))
        self._unauth_rate_limits: Dict[str, tuple[int, float]] = {}

    def _get_db(self):
        if self.db_manager:
            return self.db_manager
        from secure_mcp_server.database import get_db_manager
        return get_db_manager()

    def _should_rate_limit_unauthenticated(self, ip: Optional[str]) -> bool:
        """Allow up to 30 unauthenticated log events per minute per IP."""
        if not ip:
            return False
        now = time.time()
        count, window_start = self._unauth_rate_limits.get(ip, (0, now))
        if now - window_start > 60.0:
            self._unauth_rate_limits[ip] = (1, now)
            return False
        if count >= 30:
            return True
        self._unauth_rate_limits[ip] = (count + 1, window_start)
        return False

    def _write_stdout_fallback(self, record_type: str, payload: Dict[str, Any], error: str) -> None:
        """Write structured JSON line to stdout so Render / CloudWatch logs capture it."""
        global _event_log_failures
        _event_log_failures += 1
        entry = {
            "log_type": "security_event_stdout_fallback",
            "record_type": record_type,
            "failure_counter": _event_log_failures,
            "error": str(error),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "payload": payload,
        }
        print(f"RUNWALL_AUDIT_FALLBACK: {json.dumps(entry, default=str)}", flush=True)

    async def _insert_event_sync(self, event: SecurityEventPayload) -> bool:
        """Execute direct synchronous insert into security_events."""
        payload_dict = asdict(event)
        try:
            db = self._get_db()
            clean_request_id = _ensure_uuid(event.request_id)
            clean_ip = _sanitize_ip(event.client_ip)

            async with db.get_session_context() as session:
                stmt = text("""
                    INSERT INTO public.security_events (
                        request_id, tenant_id, user_id, api_key_id, principal,
                        agent_name, client_ip, user_agent, session_id, event_type,
                        action, stage, tool_name, intent_category, risk_score,
                        risk_level, decision, rule_id, rule_snapshot, bundle_version,
                        engine, mode, reason, args_redacted, args_hash,
                        taint_labels, latency_ms
                    ) VALUES (
                        :request_id::uuid, :tenant_id, :user_id, :api_key_id, :principal,
                        :agent_name, :client_ip::inet, :user_agent, :session_id, :event_type,
                        :action, :stage, :tool_name, :intent_category, :risk_score,
                        :risk_level, :decision, :rule_id, :rule_snapshot::jsonb, :bundle_version,
                        :engine, :mode, :reason, :args_redacted::jsonb, :args_hash,
                        :taint_labels::jsonb, :latency_ms
                    )
                """)
                params = {
                    "request_id": clean_request_id,
                    "tenant_id": event.tenant_id or "default",
                    "user_id": event.user_id,
                    "api_key_id": event.api_key_id,
                    "principal": event.principal,
                    "agent_name": event.agent_name,
                    "client_ip": clean_ip,
                    "user_agent": event.user_agent,
                    "session_id": event.session_id,
                    "event_type": event.event_type or "tool_call",
                    "action": event.action,
                    "stage": event.stage or "policy",
                    "tool_name": event.tool_name,
                    "intent_category": event.intent_category,
                    "risk_score": event.risk_score,
                    "risk_level": event.risk_level,
                    "decision": event.decision or "allow",
                    "rule_id": event.rule_id,
                    "rule_snapshot": json.dumps(event.rule_snapshot) if event.rule_snapshot else None,
                    "bundle_version": event.bundle_version,
                    "engine": event.engine,
                    "mode": event.mode or "enforce",
                    "reason": event.reason,
                    "args_redacted": json.dumps(event.args_redacted) if event.args_redacted is not None else None,
                    "args_hash": event.args_hash,
                    "taint_labels": json.dumps(event.taint_labels or []),
                    "latency_ms": event.latency_ms,
                }
                await session.execute(stmt, params)
                await session.commit()
            return True
        except Exception as e:
            self._write_stdout_fallback("security_events", payload_dict, str(e))
            return False

    async def _insert_taint_sync(self, taint: TaintEventPayload) -> bool:
        """Execute direct synchronous insert into taint_events."""
        payload_dict = asdict(taint)
        try:
            db = self._get_db()
            clean_request_id = _ensure_uuid(taint.request_id) if taint.request_id else None

            async with db.get_session_context() as session:
                stmt = text("""
                    INSERT INTO public.taint_events (
                        tenant_id, user_id, api_key_id, session_id,
                        request_id, label, source_type, source_ref, tool_name
                    ) VALUES (
                        :tenant_id, :user_id, :api_key_id, :session_id,
                        :request_id::uuid, :label, :source_type, :source_ref, :tool_name
                    )
                """)
                params = {
                    "tenant_id": taint.tenant_id or "default",
                    "user_id": taint.user_id,
                    "api_key_id": taint.api_key_id,
                    "session_id": taint.session_id,
                    "request_id": clean_request_id,
                    "label": taint.label,
                    "source_type": taint.source_type,
                    "source_ref": taint.source_ref,
                    "tool_name": taint.tool_name,
                }
                await session.execute(stmt, params)
                await session.commit()
            return True
        except Exception as e:
            self._write_stdout_fallback("taint_events", payload_dict, str(e))
            return False

    async def _background_worker(self):
        """Processes asynchronous ALLOW events from the bounded queue."""
        while not self._shutdown_event.is_set() or not self.queue.empty():
            try:
                item = await asyncio.wait_for(self.queue.get(), timeout=1.0)
                if isinstance(item, SecurityEventPayload):
                    await self._insert_event_sync(item)
                elif isinstance(item, TaintEventPayload):
                    await self._insert_taint_sync(item)
                self.queue.task_done()
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                logger.error("Background event worker exception", error=str(e))

    def _ensure_worker(self):
        if self._worker_task is None or self._worker_task.done():
            self._worker_task = asyncio.create_task(self._background_worker())

    async def record_event(self, event: SecurityEventPayload) -> bool:
        # Rate-limit unauthenticated event spam
        if event.tenant_id == "_unauthenticated" and self._should_rate_limit_unauthenticated(event.client_ip):
            logger.debug("Unauthenticated event flood dropped", ip=event.client_ip)
            return False

        # Redact args if present and unredacted
        if event.args_redacted and not isinstance(event.args_redacted, dict):
            event.args_redacted = redact(event.args_redacted)

        # Compute hash if missing
        if not event.args_hash and event.args_redacted is not None:
            event.args_hash = compute_args_hash(event.args_redacted)

        # Critical/Blocking decisions are written synchronously
        is_blocking = event.decision in ("deny", "require_approval", "quarantine") or event.event_type in ("auth", "approval")
        if is_blocking:
            success = await self._insert_event_sync(event)
            return success

        # Normal ALLOW events go to bounded async queue
        self._ensure_worker()
        try:
            self.queue.put_nowait(event)
            return True
        except asyncio.QueueFull:
            logger.warning("Event queue full — writing synchronously", request_id=event.request_id)
            return await self._insert_event_sync(event)

    async def record_taint(self, taint: TaintEventPayload) -> bool:
        self._ensure_worker()
        try:
            self.queue.put_nowait(taint)
            return True
        except asyncio.QueueFull:
            return await self._insert_taint_sync(taint)

    async def flush(self) -> None:
        """Drain queue on shutdown."""
        self._shutdown_event.set()
        if self._worker_task:
            try:
                await asyncio.wait_for(self.queue.join(), timeout=5.0)
            except asyncio.TimeoutError:
                logger.warning("Event flush timed out with items in queue")
            self._worker_task.cancel()


# Global singleton instance
_event_recorder: Optional[IEventRecorder] = None


def get_event_recorder() -> IEventRecorder:
    """Get the active EventRecorder instance."""
    global _event_recorder
    if _event_recorder is None:
        _event_recorder = PostgresEventRecorder()
    return _event_recorder


def set_event_recorder(recorder: Optional[IEventRecorder]) -> None:
    """Set the active EventRecorder instance (used in tests)."""
    global _event_recorder
    _event_recorder = recorder
