from fastapi import APIRouter, HTTPException, Depends, Body, Header
from sqlalchemy.future import select
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timezone
import structlog
import uuid

from secure_mcp_server.database import (
    get_db_manager, User, ServiceAccount, APIKey, Session,
    ToolManifest, ApprovalRequest, AuditLog, PolicyDecisionLog,
    PolicyBundle, TaskContract, ReversibleExecutionLog
)
from secure_mcp_server.config import get_settings
from secure_mcp_server.auth import AuthManager
from secure_mcp_server.governance import (
    IntentClassifier, RiskScorer, PolicyEvaluator,
    PolicyDecisionType, IntentCategory, BlastRadius
)
from secure_mcp_server.governance.opa_evaluator import OPAPolicyEvaluator
from secure_mcp_server.governance.taint import TaintManager
from secure_mcp_server.governance.compensation import compensation_registry
from secure_mcp_server.governance.contracts import ContractManager

logger = structlog.get_logger(__name__)
router = APIRouter()

# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------
class APIKeyCreateRequest(BaseModel):
    name: str
    service_account_id: Optional[int] = None
    allowed_ips: List[str] = ["0.0.0.0/0", "::/0"]
    environment: str = "production"
    tier: str = "free"

class TaintAddRequest(BaseModel):
    session_id: str
    label: str

class TaintClearRequest(BaseModel):
    session_id: str

class RiskScoreRequest(BaseModel):
    tool_name: str
    parameters: Dict[str, Any]
    role: str = "developer"

class SimulationRequest(BaseModel):
    tool_name: str
    parameters: Dict[str, Any]
    role: str = "developer"
    session_id: Optional[str] = None

# ---------------------------------------------------------------------------
# Security Dashboard API (Phase 3)
# ---------------------------------------------------------------------------
import base64
import csv
import io
import json
from datetime import timedelta
from fastapi import Query
from fastapi.responses import StreamingResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from secure_mcp_server.api.routes.keys import get_current_user
from secure_mcp_server.database import get_db_session
from secure_mcp_server.api.schemas import ApprovalReviewRequest


async def _set_rls_context(db: AsyncSession, tenant_id: str, user_id: Optional[int]) -> None:
    """Set transaction-local PostgreSQL session settings for RLS policy enforcement."""
    uid_str = str(user_id) if user_id is not None else ""
    try:
        await db.execute(
            text("SELECT set_config('app.tenant_id', :t, true), set_config('app.user_id', :u, true)"),
            {"t": tenant_id, "u": uid_str}
        )
    except Exception as e:
        logger.debug("Failed to set app.tenant_id/app.user_id session config (e.g. SQLite test mode)", error=str(e))


def _parse_range(range_str: str) -> tuple[datetime, datetime, datetime]:
    now = datetime.now(timezone.utc)
    if range_str == "7d":
        delta = timedelta(days=7)
    elif range_str == "30d":
        delta = timedelta(days=30)
    else:
        delta = timedelta(hours=24)
    curr_start = now - delta
    prior_start = curr_start - delta
    return curr_start, now, prior_start


@router.get("/summary")
async def get_dashboard_summary(
    range: str = Query("24h", pattern=r"^(24h|7d|30d)$"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    tenant_id = getattr(user, "tenant_id", "default") or "default"
    await _set_rls_context(db, tenant_id, user.id)
    curr_start, curr_end, prior_start = _parse_range(range)

    # Current period stats
    stmt_curr = text("""
        SELECT
            count(*) AS total,
            coalesce(sum(CASE WHEN decision IN ('deny', 'quarantine') THEN 1 ELSE 0 END), 0) AS blocked,
            coalesce(sum(CASE WHEN decision IN ('allow', 'log_only', 'simulate') THEN 1 ELSE 0 END), 0) AS allowed
        FROM security_events
        WHERE tenant_id = :tenant_id
          AND (user_id = :user_id OR user_id IS NULL)
          AND ts >= :start_time AND ts <= :end_time
    """)
    res_curr = await db.execute(stmt_curr, {
        "tenant_id": tenant_id,
        "user_id": user.id,
        "start_time": curr_start,
        "end_time": curr_end,
    })
    curr_row = res_curr.mappings().first() or {"total": 0, "blocked": 0, "allowed": 0}

    # Prior period stats (for deltas)
    stmt_prior = text("""
        SELECT
            count(*) AS total,
            coalesce(sum(CASE WHEN decision IN ('deny', 'quarantine') THEN 1 ELSE 0 END), 0) AS blocked,
            coalesce(sum(CASE WHEN decision IN ('allow', 'log_only', 'simulate') THEN 1 ELSE 0 END), 0) AS allowed
        FROM security_events
        WHERE tenant_id = :tenant_id
          AND (user_id = :user_id OR user_id IS NULL)
          AND ts >= :start_time AND ts < :end_time
    """)
    res_prior = await db.execute(stmt_prior, {
        "tenant_id": tenant_id,
        "user_id": user.id,
        "start_time": prior_start,
        "end_time": curr_start,
    })
    prior_row = res_prior.mappings().first() or {"total": 0, "blocked": 0, "allowed": 0}

    def _calc_delta(c: int, p: int) -> float:
        if p == 0:
            return 100.0 if c > 0 else 0.0
        return round(((c - p) / p) * 100.0, 1)

    # Pending approvals for this tenant
    stmt_approvals = text("""
        SELECT count(*) AS pending
        FROM approval_requests
        WHERE tenant_id = :tenant_id AND status = 'PENDING'
    """)
    res_app = await db.execute(stmt_approvals, {"tenant_id": tenant_id})
    pending_approvals = (res_app.mappings().first() or {}).get("pending", 0)

    # Active API keys for this user
    stmt_keys = text("""
        SELECT count(*) AS active
        FROM api_keys
        WHERE user_id = :user_id AND is_active = true
    """)
    res_keys = await db.execute(stmt_keys, {"user_id": user.id})
    active_keys = (res_keys.mappings().first() or {}).get("active", 0)

    return {
        "range": range,
        "total_requests": curr_row["total"],
        "blocked_count": curr_row["blocked"],
        "allowed_count": curr_row["allowed"],
        "pending_approvals": pending_approvals,
        "active_keys": active_keys,
        "deltas": {
            "total_pct": _calc_delta(curr_row["total"], prior_row["total"]),
            "blocked_pct": _calc_delta(curr_row["blocked"], prior_row["blocked"]),
            "allowed_pct": _calc_delta(curr_row["allowed"], prior_row["allowed"]),
        }
    }


@router.get("/timeseries")
async def get_dashboard_timeseries(
    range: str = Query("24h", pattern=r"^(24h|7d|30d)$"),
    bucket: Optional[str] = Query(None, pattern=r"^(1h|1d)$"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    tenant_id = getattr(user, "tenant_id", "default") or "default"
    await _set_rls_context(db, tenant_id, user.id)
    curr_start, curr_end, _ = _parse_range(range)

    # Default bucket: 1h for 24h & 7d, 1d for 30d
    if not bucket:
        bucket = "1d" if range == "30d" else "1h"

    pg_bucket = "day" if bucket == "1d" else "hour"

    is_sqlite = False
    try:
        bind = db.get_bind()
        if bind and "sqlite" in str(bind.url):
            is_sqlite = True
    except Exception:
        pass

    if is_sqlite:
        trunc_expr = "strftime('%Y-%m-%d 00:00:00', ts)" if bucket == "1d" else "strftime('%Y-%m-%d %H:00:00', ts)"
    else:
        trunc_expr = f"date_trunc('{pg_bucket}', ts)"

    stmt = text(f"""
        SELECT
            {trunc_expr} AS bucket_ts,
            coalesce(sum(CASE WHEN decision IN ('allow', 'log_only', 'simulate') THEN 1 ELSE 0 END), 0) AS allowed,
            coalesce(sum(CASE WHEN decision IN ('deny', 'quarantine') THEN 1 ELSE 0 END), 0) AS blocked,
            coalesce(sum(CASE WHEN decision = 'require_approval' THEN 1 ELSE 0 END), 0) AS approvals
        FROM security_events
        WHERE tenant_id = :tenant_id
          AND (user_id = :user_id OR user_id IS NULL)
          AND ts >= :start_time AND ts <= :end_time
        GROUP BY bucket_ts
        ORDER BY bucket_ts ASC
    """)
    res = await db.execute(stmt, {
        "tenant_id": tenant_id,
        "user_id": user.id,
        "start_time": curr_start,
        "end_time": curr_end,
    })
    rows = res.mappings().all()

    # Build continuous buckets so chart has zero-filled gaps
    data_points = []
    def _normalize_bucket_key(val: Any, b: str) -> str:
        if hasattr(val, "strftime"):
            return val.strftime("%Y-%m-%d") if b == "1d" else val.strftime("%Y-%m-%d %H")
        s = str(val).replace("T", " ")
        return s[:10] if b == "1d" else s[:13]

    lookup: dict[str, dict[str, int]] = {}
    for r in rows:
        b_key = _normalize_bucket_key(r["bucket_ts"], bucket)
        if b_key not in lookup:
            lookup[b_key] = {"allowed": int(r["allowed"]), "blocked": int(r["blocked"]), "approvals": int(r["approvals"])}
        else:
            lookup[b_key]["allowed"] += int(r["allowed"])
            lookup[b_key]["blocked"] += int(r["blocked"])
            lookup[b_key]["approvals"] += int(r["approvals"])

    step = timedelta(days=1) if bucket == "1d" else timedelta(hours=1)
    # Align step start
    cursor = curr_start.replace(minute=0, second=0, microsecond=0)
    while cursor <= curr_end:
        b_key = _normalize_bucket_key(cursor, bucket)
        matched = lookup.get(b_key)
        if matched:
            data_points.append({
                "timestamp": cursor.isoformat(),
                "allowed": matched["allowed"],
                "blocked": matched["blocked"],
                "approvals": matched["approvals"],
            })
        else:
            data_points.append({
                "timestamp": cursor.isoformat(),
                "allowed": 0,
                "blocked": 0,
                "approvals": 0,
            })
        cursor += step

    return {
        "range": range,
        "bucket": bucket,
        "points": data_points,
    }


@router.get("/breakdown")
async def get_dashboard_breakdown(
    range: str = Query("24h", pattern=r"^(24h|7d|30d)$"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    tenant_id = getattr(user, "tenant_id", "default") or "default"
    await _set_rls_context(db, tenant_id, user.id)
    curr_start, curr_end, _ = _parse_range(range)

    params = {
        "tenant_id": tenant_id,
        "user_id": user.id,
        "start_time": curr_start,
        "end_time": curr_end,
    }

    # Top rules
    stmt_rules = text("""
        SELECT
            coalesce(rule_id, 'default_policy') AS rule,
            decision,
            count(*) AS count
        FROM security_events
        WHERE tenant_id = :tenant_id
          AND (user_id = :user_id OR user_id IS NULL)
          AND ts >= :start_time AND ts <= :end_time
        GROUP BY rule, decision
        ORDER BY count DESC
        LIMIT 6
    """)
    res_rules = await db.execute(stmt_rules, params)
    top_rules = [dict(r) for r in res_rules.mappings().all()]

    # Top tools
    stmt_tools = text("""
        SELECT
            coalesce(tool_name, 'unknown') AS tool,
            count(*) AS total,
            coalesce(sum(CASE WHEN decision IN ('deny', 'quarantine') THEN 1 ELSE 0 END), 0) AS blocked
        FROM security_events
        WHERE tenant_id = :tenant_id
          AND (user_id = :user_id OR user_id IS NULL)
          AND ts >= :start_time AND ts <= :end_time
        GROUP BY tool
        ORDER BY total DESC
        LIMIT 6
    """)
    res_tools = await db.execute(stmt_tools, params)
    top_tools = [dict(r) for r in res_tools.mappings().all()]

    # Pipeline stages
    stmt_stages = text("""
        SELECT
            coalesce(stage, 'policy') AS stage,
            count(*) AS count
        FROM security_events
        WHERE tenant_id = :tenant_id
          AND (user_id = :user_id OR user_id IS NULL)
          AND ts >= :start_time AND ts <= :end_time
        GROUP BY stage
        ORDER BY count DESC
    """)
    res_stages = await db.execute(stmt_stages, params)
    stage_breakdown = [dict(r) for r in res_stages.mappings().all()]

    # Taints
    stmt_taints = text("""
        SELECT
            label,
            count(*) AS count
        FROM taint_events
        WHERE tenant_id = :tenant_id
          AND (user_id = :user_id OR user_id IS NULL)
          AND ts >= :start_time AND ts <= :end_time
        GROUP BY label
        ORDER BY count DESC
        LIMIT 6
    """)
    res_taints = await db.execute(stmt_taints, params)
    taint_breakdown = [dict(r) for r in res_taints.mappings().all()]

    return {
        "range": range,
        "top_rules": top_rules,
        "top_tools": top_tools,
        "stages": stage_breakdown,
        "taints": taint_breakdown,
    }


@router.get("/events")
async def get_dashboard_events(
    limit: int = Query(25, ge=1, le=100),
    cursor: Optional[str] = Query(None),
    decision: Optional[str] = Query(None),
    stage: Optional[str] = Query(None),
    tool_name: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    tenant_id = getattr(user, "tenant_id", "default") or "default"
    await _set_rls_context(db, tenant_id, user.id)

    cursor_ts = None
    cursor_id = None
    if cursor:
        try:
            decoded = base64.urlsafe_b64decode(cursor.encode("ascii")).decode("utf-8")
            parts = decoded.split("|")
            cursor_ts = datetime.fromisoformat(parts[0])
            cursor_id = int(parts[1])
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid pagination cursor")

    search_pat = f"%{search.strip()}%" if search and search.strip() else None

    # Fetch limit + 1 to know if there is a next page
    fetch_limit = limit + 1

    clauses = [
        "tenant_id = :tenant_id",
        "(user_id = :user_id OR user_id IS NULL)",
    ]
    params: Dict[str, Any] = {
        "tenant_id": tenant_id,
        "user_id": user.id,
        "fetch_limit": fetch_limit,
    }
    if decision:
        clauses.append("decision = :decision")
        params["decision"] = decision
    if stage:
        clauses.append("stage = :stage")
        params["stage"] = stage
    if tool_name:
        clauses.append("tool_name = :tool_name")
        params["tool_name"] = tool_name
    if search_pat:
        clauses.append("(lower(tool_name) LIKE lower(:search_pat) OR lower(reason) LIKE lower(:search_pat) OR lower(principal) LIKE lower(:search_pat))")
        params["search_pat"] = search_pat
    if cursor_ts and cursor_id:
        clauses.append("(ts < :cursor_ts OR (ts = :cursor_ts AND id < :cursor_id))")
        params["cursor_ts"] = cursor_ts
        params["cursor_id"] = cursor_id

    where_sql = " AND ".join(clauses)
    stmt = text(f"""
        SELECT
            id, request_id, ts, tenant_id, user_id, api_key_id, principal, agent_name,
            cast(client_ip as text) AS client_ip, user_agent, session_id, event_type, action, stage,
            tool_name, intent_category, risk_score, risk_level, decision, rule_id,
            engine, mode, reason, args_hash, taint_labels, latency_ms
        FROM security_events
        WHERE {where_sql}
        ORDER BY ts DESC, id DESC
        LIMIT :fetch_limit
    """)

    res = await db.execute(stmt, params)
    raw_rows = res.mappings().all()

    has_more = len(raw_rows) > limit
    rows = list(raw_rows[:limit])

    next_cursor = None
    if has_more and rows:
        last_item = rows[-1]
        raw_ts = last_item["ts"]
        ts_str = raw_ts.isoformat() if hasattr(raw_ts, "isoformat") else str(raw_ts)
        next_cursor = base64.urlsafe_b64encode(f"{ts_str}|{last_item['id']}".encode("utf-8")).decode("ascii")

    # Format events cleanly
    events = []
    for r in rows:
        item = dict(r)
        if hasattr(item.get("ts"), "isoformat"):
            item["ts"] = item["ts"].isoformat()
        if hasattr(item.get("request_id"), "__str__"):
            item["request_id"] = str(item["request_id"])
        if isinstance(item.get("taint_labels"), str):
            try:
                item["taint_labels"] = json.loads(item["taint_labels"])
            except Exception:
                pass
        events.append(item)

    return {
        "events": events,
        "has_more": has_more,
        "next_cursor": next_cursor,
    }


@router.get("/events/{event_id}")
async def get_dashboard_event_detail(
    event_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    tenant_id = getattr(user, "tenant_id", "default") or "default"
    await _set_rls_context(db, tenant_id, user.id)

    stmt = text("""
        SELECT
            id, request_id, ts, tenant_id, user_id, api_key_id, principal, agent_name,
            cast(client_ip as text) AS client_ip, user_agent, session_id, event_type, action, stage,
            tool_name, intent_category, risk_score, risk_level, decision, rule_id,
            rule_snapshot, bundle_version, engine, mode, reason, args_redacted,
            args_hash, taint_labels, latency_ms
        FROM security_events
        WHERE id = :event_id
          AND tenant_id = :tenant_id
          AND (user_id = :user_id OR user_id IS NULL)
    """)
    res = await db.execute(stmt, {
        "event_id": event_id,
        "tenant_id": tenant_id,
        "user_id": user.id,
    })
    row = res.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Security event not found")

    item = dict(row)
    if hasattr(item.get("ts"), "isoformat"):
        item["ts"] = item["ts"].isoformat()
    if hasattr(item.get("request_id"), "__str__"):
        item["request_id"] = str(item["request_id"])
    for json_col in ("rule_snapshot", "args_redacted", "taint_labels"):
        val = item.get(json_col)
        if isinstance(val, str):
            try:
                item[json_col] = json.loads(val)
            except Exception:
                pass

    return item


@router.get("/approvals")
async def get_dashboard_approvals(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    tenant_id = getattr(user, "tenant_id", "default") or "default"
    stmt = text("""
        SELECT id, tool_name, requester_id, context_snapshot, status, required_role, created_at
        FROM approval_requests
        WHERE tenant_id = :tenant_id AND status = 'PENDING'
        ORDER BY created_at DESC
    """)
    res = await db.execute(stmt, {"tenant_id": tenant_id})
    rows = res.mappings().all()
    out = []
    for r in rows:
        d = dict(r)
        if hasattr(d.get("created_at"), "isoformat"):
            d["created_at"] = d["created_at"].isoformat()
        if isinstance(d.get("context_snapshot"), str):
            try:
                d["context_snapshot"] = json.loads(d["context_snapshot"])
            except Exception:
                pass
        out.append(d)
    return out


@router.post("/approvals/{approval_id}/review")
async def review_dashboard_approval(
    approval_id: str,
    req: ApprovalReviewRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    from secure_mcp_server.governance import approval_manager
    reviewer = f"user_{user.id}_{user.username}"
    result = await approval_manager.review_request(
        request_id=approval_id,
        decision=req.decision,
        reviewer_id=user.id,
        reason=req.reason,
    )
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))

    # Also log to EventRecorder
    from secure_mcp_server.governance.event_recorder import get_event_recorder, SecurityEventPayload
    tenant_id = getattr(user, "tenant_id", "default") or "default"
    await get_event_recorder().record_event(SecurityEventPayload(
        request_id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        user_id=user.id,
        principal=reviewer,
        event_type="approval",
        action="review_approval",
        stage="approval",
        decision="allow" if req.decision == "APPROVED" else "deny",
        reason=f"Approval request {approval_id} {req.decision}: {req.reason or 'No reason provided'}",
    ))

    return result


@router.get("/keys")
async def get_dashboard_keys(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = text("""
        SELECT id, name, prefix, environment, allowed_ips, is_active, created_at, last_used
        FROM api_keys
        WHERE user_id = :user_id
        ORDER BY created_at DESC
    """)
    res = await db.execute(stmt, {"user_id": user.id})
    rows = res.mappings().all()
    keys = []
    for r in rows:
        d = dict(r)
        if hasattr(d["created_at"], "isoformat"):
            d["created_at"] = d["created_at"].isoformat()
        if hasattr(d["last_used"], "isoformat") and d["last_used"]:
            d["last_used"] = d["last_used"].isoformat()
        keys.append(d)
    return keys


@router.get("/export.csv")
async def export_dashboard_csv(
    range: str = Query("24h", pattern=r"^(24h|7d|30d)$"),
    decision: Optional[str] = Query(None),
    tool_name: Optional[str] = Query(None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    tenant_id = getattr(user, "tenant_id", "default") or "default"
    await _set_rls_context(db, tenant_id, user.id)
    curr_start, curr_end, _ = _parse_range(range)

    clauses = [
        "tenant_id = :tenant_id",
        "(user_id = :user_id OR user_id IS NULL)",
        "ts >= :start_time AND ts <= :end_time",
    ]
    params: Dict[str, Any] = {
        "tenant_id": tenant_id,
        "user_id": user.id,
        "start_time": curr_start,
        "end_time": curr_end,
    }
    if decision:
        clauses.append("decision = :decision")
        params["decision"] = decision
    if tool_name:
        clauses.append("tool_name = :tool_name")
        params["tool_name"] = tool_name

    where_sql = " AND ".join(clauses)
    stmt = text(f"""
        SELECT
            ts, request_id, decision, stage, coalesce(tool_name, '') AS tool_name,
            coalesce(cast(risk_score as text), '') AS risk_score, coalesce(risk_level, '') AS risk_level,
            coalesce(rule_id, '') AS rule_id, coalesce(reason, '') AS reason,
            coalesce(cast(client_ip as text), '') AS client_ip, coalesce(cast(latency_ms as text), '') AS latency_ms
        FROM security_events
        WHERE {where_sql}
        ORDER BY ts DESC
        LIMIT 5000
    """)
    res = await db.execute(stmt, params)
    rows = res.mappings().all()

    def sanitize_cell(val: Any) -> str:
        s = str(val) if val is not None else ""
        if s and s[0] in ("=", "+", "-", "@", "\t", "\r"):
            return "'" + s
        return s

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Timestamp", "Request ID", "Decision", "Stage", "Tool Name",
        "Risk Score", "Risk Level", "Rule ID", "Reason", "Client IP", "Latency (ms)"
    ])

    for r in rows:
        writer.writerow([
            sanitize_cell(r["ts"].isoformat() if hasattr(r["ts"], "isoformat") else r["ts"]),
            sanitize_cell(str(r["request_id"])),
            sanitize_cell(r["decision"]),
            sanitize_cell(r["stage"]),
            sanitize_cell(r["tool_name"]),
            sanitize_cell(r["risk_score"]),
            sanitize_cell(r["risk_level"]),
            sanitize_cell(r["rule_id"]),
            sanitize_cell(r["reason"]),
            sanitize_cell(r["client_ip"]),
            sanitize_cell(r["latency_ms"]),
        ])

    output.seek(0)
    filename = f"runwall_security_audit_{range}_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


# ---------------------------------------------------------------------------
# 1. Identity & Access Control (Legacy Demos)
# ---------------------------------------------------------------------------
@router.get("/identity/users")
async def get_users():
    # Security: Do not expose real user records. Return empty list or sample agent identities.
    return []

@router.get("/identity/service-accounts")
async def get_service_accounts():
    async with get_db_manager().get_session_context() as db:
        stmt = select(ServiceAccount)
        res = await db.execute(stmt)
        accounts = res.scalars().all()
        return [
            {
                "id": sa.id,
                "name": sa.name,
                "description": sa.description,
                "tenant_id": sa.tenant_id,
                "is_active": sa.is_active,
                "created_at": sa.created_at
            }
            for sa in accounts
        ]

@router.get("/identity/keys")
async def get_api_keys(x_user_email: Optional[str] = Header(None)):
    if not x_user_email:
        # Prevent accessing other users' keys if header is missing
        return []
        
    email_clean = x_user_email.strip().lower()
    async with get_db_manager().get_session_context() as db:
        # Get or create user
        stmt = select(User).where(User.email == email_clean)
        res = await db.execute(stmt)
        user = res.scalar_one_or_none()
        if not user:
            username = email_clean.split('@')[0]
            user = User(
                username=username,
                email=email_clean,
                full_name=username,
                hashed_password="supabase-auth-placeholder",
                is_active=True,
                is_admin=False
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        
        # Fetch both user's keys and unlinked service account keys belonging to the tenant
        tenant_id = getattr(user, "tenant_id", "default") or "default"
        stmt = select(APIKey).where(
            (APIKey.user_id == user.id) | 
            ((APIKey.user_id == None) & (APIKey.tenant_id == tenant_id))
        )
        res = await db.execute(stmt)
        keys = res.scalars().all()
        return [
            {
                "id": k.id,
                "name": k.name,
                "prefix": k.prefix,
                "service_account_id": k.service_account_id,
                "environment": k.environment,
                "allowed_ips": k.allowed_ips,
                "is_active": k.is_active,
                "created_at": k.created_at
            }
            for k in keys
        ]

@router.post("/identity/keys", status_code=201)
async def generate_api_key(req: APIKeyCreateRequest, x_user_email: Optional[str] = Header(None)):
    if not x_user_email:
        raise HTTPException(status_code=400, detail="X-User-Email header is required to associate API keys.")
        
    email_clean = x_user_email.strip().lower()
    settings = get_settings()
    auth_manager = AuthManager(settings)
    
    # Resolve user
    async with get_db_manager().get_session_context() as db:
        stmt = select(User).where(User.email == email_clean)
        res = await db.execute(stmt)
        user = res.scalar_one_or_none()
        if not user:
            username = email_clean.split('@')[0]
            user = User(
                username=username,
                email=email_clean,
                full_name=username,
                hashed_password="supabase-auth-placeholder",
                is_active=True,
                is_admin=False
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        user_id = user.id

        # Check if user is rate limit exhausted across their active keys
        from secure_mcp_server.billing.rate_limiter import get_current_period, TIER_LIMITS, get_or_create_usage_record
        
        # Get active keys
        keys_stmt = select(APIKey).where(APIKey.user_id == user_id, APIKey.is_active == True)
        keys_res = await db.execute(keys_stmt)
        active_keys = keys_res.scalars().all()
        
        is_exhausted = False
        if active_keys:
            # Check if all active keys are exhausted
            all_exhausted = True
            for k in active_keys:
                if k.tier == "enterprise":
                    all_exhausted = False
                    continue
                limit = TIER_LIMITS.get(k.tier, k.rate_limit_requests)
                usage = await get_or_create_usage_record(k, db)
                if limit is not None and usage.request_count < limit:
                    all_exhausted = False
                    break
            is_exhausted = all_exhausted

        if is_exhausted:
            raise HTTPException(
                status_code=403,
                detail=(
                    "Key creation blocked. You have exhausted all requests in your current period. "
                    "You will be able to create a new key once your current period resets, or you "
                    "can renew/upgrade your Pro plan."
                )
            )

        # Resolve or create default service account if service_account_id not provided
        if not req.service_account_id:
            sa_stmt = select(ServiceAccount).where(ServiceAccount.name == "Default Service Account")
            sa_res = await db.execute(sa_stmt)
            sa = sa_res.scalar_one_or_none()
            if not sa:
                sa = ServiceAccount(
                    name="Default Service Account",
                    description="Automatically generated default service account for user API keys.",
                    is_active=True
                )
                db.add(sa)
                await db.flush()
            resolved_sa_id = sa.id
        else:
            resolved_sa_id = req.service_account_id
            stmt = select(ServiceAccount).where(ServiceAccount.id == resolved_sa_id)
            res = await db.execute(stmt)
            sa = res.scalar_one_or_none()
            if not sa:
                raise HTTPException(status_code=404, detail="Service account not found")

        # Check Pro subscription if tier is 'pro'
        rate_limit_requests = settings.free_tier_requests
        rate_limit_period = "week"
        if req.tier == "pro":
            # Check active subscription
            from secure_mcp_server.database.models import UserSubscription
            sub_stmt = select(UserSubscription).where(
                UserSubscription.user_id == user_id,
                UserSubscription.tier == "pro",
                UserSubscription.status == "active"
            )
            sub_res = await db.execute(sub_stmt)
            sub = sub_res.scalars().first()
            if not sub:
                raise HTTPException(
                    status_code=402,
                    detail="Payment Required: You do not have an active Pro subscription. Please select Pro plan and pay ₹674 ($7) first."
                )
            rate_limit_requests = settings.pro_tier_requests
            rate_limit_period = "month"

        # Generate API key inside the same transaction
        raw_key = await auth_manager.create_api_key(
            name=req.name,
            user_id=user_id,
            service_account_id=resolved_sa_id,
            allowed_ips=req.allowed_ips,
            environment=req.environment,
            tier=req.tier,
            rate_limit_requests=rate_limit_requests,
            rate_limit_period=rate_limit_period,
            db_session=db
        )
        await db.commit()

    return {"success": True, "api_key": raw_key, "message": "API key generated successfully"}

@router.delete("/identity/keys/{key_id}")
async def revoke_api_key(key_id: int, x_user_email: Optional[str] = Header(None)):
    if not x_user_email:
        raise HTTPException(status_code=401, detail="X-User-Email header is required")
        
    email_clean = x_user_email.strip().lower()
    async with get_db_manager().get_session_context() as db:
        user_stmt = select(User).where(User.email == email_clean)
        user_res = await db.execute(user_stmt)
        user = user_res.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        key_stmt = select(APIKey).where(APIKey.id == key_id, APIKey.user_id == user.id)
        key_res = await db.execute(key_stmt)
        key = key_res.scalar_one_or_none()
        if not key:
            raise HTTPException(status_code=404, detail="API key not found")
            
        key.is_active = False
        from datetime import datetime, timezone
        key.revoked_at = datetime.now(timezone.utc)
        await db.commit()
        return {"success": True, "message": f"API key '{key.name}' revoked successfully"}

# ---------------------------------------------------------------------------
# 2. Tenant Management
# ---------------------------------------------------------------------------
@router.get("/tenants")
async def get_tenants():
    return [
        {"id": "default", "name": "Default Tenant Org", "tier": "Enterprise", "status": "active"},
        {"id": "tenant-staging", "name": "Staging Environment Org", "tier": "Developer", "status": "active"},
        {"id": "tenant-sandbox", "name": "Isolated Sandbox Org", "tier": "Free", "status": "active"}
    ]

# ---------------------------------------------------------------------------
# 3. Tool / MCP Registry
# ---------------------------------------------------------------------------
@router.get("/tools")
async def get_tool_registry():
    async with get_db_manager().get_session_context() as db:
        stmt = select(ToolManifest)
        res = await db.execute(stmt)
        manifests = res.scalars().all()
        
        # If empty, return some default mocked values
        if not manifests:
            return [
                {"tool_name": "fetch_webpage", "description_hash": "a4b2c1...", "trust_status": "TRUSTED", "version": 1},
                {"tool_name": "jira_api", "description_hash": "9f2e3d...", "trust_status": "TRUSTED", "version": 1},
                {"tool_name": "salesforce_api", "description_hash": "5d2c1b...", "trust_status": "TRUSTED", "version": 1},
                {"tool_name": "delete_database", "description_hash": "f3a2e1...", "trust_status": "QUARANTINED", "version": 2}
            ]
            
        return [
            {
                "tool_name": m.tool_name,
                "description_hash": m.description_hash[:16] + "...",
                "trust_status": m.trust_status,
                "version": m.version,
                "last_verified_at": m.last_verified_at
            }
            for m in manifests
        ]

# ---------------------------------------------------------------------------
# 4. Taint Tracking Engine
# ---------------------------------------------------------------------------
@router.get("/taint/sessions")
async def get_taint_sessions():
    async with get_db_manager().get_session_context() as db:
        stmt = select(Session)
        res = await db.execute(stmt)
        sessions = res.scalars().all()
        return [
            {
                "id": s.id,
                "user_id": s.user_id,
                "tenant_id": s.tenant_id,
                "taints": getattr(s, "taint_labels", []),
                "is_active": s.is_active,
                "last_activity": s.last_activity
            }
            for s in sessions
        ]

@router.post("/taint/add")
async def add_session_taint(req: TaintAddRequest):
    taint_manager = TaintManager()
    
    # Verify session exists
    async with get_db_manager().get_session_context() as db:
        stmt = select(Session).where(Session.id == req.session_id)
        res = await db.execute(stmt)
        session = res.scalar_one_or_none()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
            
    success = await taint_manager.add_taint(req.session_id, req.label)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to add taint label")
    return {"success": True, "message": f"Added taint label '{req.label}' to session '{req.session_id}'"}

@router.post("/taint/clear")
async def clear_session_taint(req: TaintClearRequest):
    taint_manager = TaintManager()
    
    # Verify session exists
    async with get_db_manager().get_session_context() as db:
        stmt = select(Session).where(Session.id == req.session_id)
        res = await db.execute(stmt)
        session = res.scalar_one_or_none()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
            
    success = await taint_manager.clear_session_taints(req.session_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to clear taint labels")
    return {"success": True, "message": f"Cleared taint labels for session '{req.session_id}'"}

# ---------------------------------------------------------------------------
# 5. Risk Scoring Engine Simulator
# ---------------------------------------------------------------------------
@router.post("/risk/score")
async def compute_risk_score(req: RiskScoreRequest):
    intent_classifier = IntentClassifier()
    risk_scorer = RiskScorer()
    
    # Classify intent
    intent = intent_classifier.classify(req.tool_name, req.parameters)
    
    # Mock user context from role
    user_context = {
        "role": req.role,
        "tenant_id": "default",
        "is_admin": req.role == "admin"
    }
    
    # Score risk
    risk = risk_scorer.score(intent, user_context, {})
    return {
        "success": True,
        "intent_category": intent.intent_category.value,
        "blast_radius": intent.blast_radius.value,
        "risk_score": risk.score,
        "risk_level": risk.level.value,
        "explanation": risk.explanation,
        "factors": risk.factors.model_dump()
    }

# ---------------------------------------------------------------------------
# 6. Runtime Interceptor & Policy Simulation
# ---------------------------------------------------------------------------
@router.post("/interceptor/simulate")
async def simulate_execution(req: SimulationRequest):
    intent_classifier = IntentClassifier()
    risk_scorer = RiskScorer()
    opa_evaluator = OPAPolicyEvaluator()
    
    # Classify intent
    intent = intent_classifier.classify(req.tool_name, req.parameters)
    
    # Enrich session taints if session exists
    session_taints = []
    if req.session_id:
        taint_manager = TaintManager()
        session_taints = await taint_manager.get_session_taints(req.session_id)
        intent.taint_labels = session_taints
        
    # Mock user context
    user_context = {
        "user_id": 1,
        "role": req.role,
        "tenant_id": "default",
        "is_admin": req.role == "admin",
        "session_id": req.session_id or "sim-session-001"
    }
    
    # Score risk
    risk = risk_scorer.score(intent, user_context, {})
    
    # Evaluate OPA policies
    opa_res = await opa_evaluator.evaluate(
        intent=intent,
        risk=risk,
        user_context=user_context
    )
    
    return {
        "success": True,
        "decision": opa_res.decision.value,
        "explanation": opa_res.explanation,
        "intent": {
            "category": intent.intent_category.value,
            "blast_radius": intent.blast_radius.value,
            "is_destructive": intent.is_destructive,
            "taints": session_taints
        },
        "risk": {
            "score": risk.score,
            "level": risk.level.value,
            "factors": risk.factors.model_dump()
        }
    }

# ---------------------------------------------------------------------------
# 7. Rollbacks & Compensations
# ---------------------------------------------------------------------------
@router.get("/rollback/logs")
async def get_rollback_logs():
    async with get_db_manager().get_session_context() as db:
        stmt = select(ReversibleExecutionLog)
        res = await db.execute(stmt)
        logs = res.scalars().all()
        return [
            {
                "id": log.id,
                "tenant_id": log.tenant_id,
                "tool_name": log.tool_name,
                "compensation_handler": log.compensation_handler,
                "compensation_arguments": log.compensation_arguments,
                "status": log.status,
                "created_at": log.created_at,
                "rolled_back_at": log.rolled_back_at
            }
            for log in logs
        ]

@router.post("/rollback/{log_id}/trigger")
async def trigger_rollback(log_id: str):
    # Register mock creation and compensation handlers if not present
    @compensation_registry.register_handler("delete_jira_issue")
    async def rollback_jira(issue_key, project):
        return {"success": True}
        
    @compensation_registry.register_handler("rollback_db_write")
    async def rollback_db(row_id, table):
        return {"success": True}
        
    res = await compensation_registry.rollback_execution(log_id, user_id=1)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error"))
    return res

# ---------------------------------------------------------------------------
# 8. Quotas & Limits Config
# ---------------------------------------------------------------------------
@router.get("/quotas/limits")
async def get_limits():
    return {
        "default_tenant_rpm": 120,
        "default_user_rpm": 60,
        "default_service_account_rpm": 300,
        "default_tool_rpm": 45,
        "status": "normal",
        "current_tph": 124,
        "is_throttled": False
    }

# ---------------------------------------------------------------------------
# 9. Sandboxing Execution Profiles
# ---------------------------------------------------------------------------
@router.get("/sandboxing/profiles")
async def get_sandbox_profiles():
    return [
        {
            "profile_name": "Standard Secure Sandbox",
            "isolation_type": "Docker Container",
            "max_memory_mb": 512,
            "max_cpu_percent": 25,
            "allow_network": False,
            "status": "ready"
        },
        {
            "profile_name": "Critical Read-Only Sandbox",
            "isolation_type": "gVisor MicroVM",
            "max_memory_mb": 256,
            "max_cpu_percent": 10,
            "allow_network": False,
            "status": "ready"
        },
        {
            "profile_name": "External Integration Profile",
            "isolation_type": "Docker Container (Bridged)",
            "max_memory_mb": 1024,
            "max_cpu_percent": 50,
            "allow_network": True,
            "status": "ready"
        }
    ]


@router.post("/tests/run")
async def run_compliance_tests():
    import time
    import asyncio
    import tests.test_runwall_features as trf
    from secure_mcp_server.database import DatabaseManager, set_db_manager, get_db_manager
    from secure_mcp_server.config import get_settings
    
    settings = get_settings()
    try:
        original_db = get_db_manager()
    except RuntimeError:
        original_db = None
    
    results = []
    
    test_cases = [
        {"id": "identity", "name": "Identity & Access Control Check", "fn": trf.test_identity_access_control, "args": ["db", "settings"]},
        {"id": "tenancy", "name": "Multi-Tenant Isolation Check", "fn": trf.test_tenant_org_management, "args": ["db", "settings"]},
        {"id": "mcp_registry", "name": "Tool & MCP Server Registry Check", "fn": trf.test_tool_mcp_registry, "args": ["db"]},
        {"id": "policy_engine", "name": "OPA / Rego Policy Check", "fn": trf.test_policy_engine, "args": ["db", "settings"]},
        {"id": "interceptor", "name": "Runtime Interceptor Check", "fn": trf.test_runtime_interceptor, "args": ["settings", "db"]},
        {"id": "risk_scoring", "name": "Risk Scoring Engine Check", "fn": trf.test_risk_scoring_engine, "args": []},
        {"id": "taint_tracking", "name": "Dynamic Taint Tracking Check", "fn": trf.test_taint_tracking_engine, "args": ["db"]},
        {"id": "approval_workflow", "name": "Approval Workflow Engine Check", "fn": trf.test_approval_workflow_engine, "args": ["db"]},
        {"id": "audit_logs", "name": "Audit Logging & Evidence Check", "fn": trf.test_audit_evidence_replay, "args": ["db"]},
        {"id": "rollbacks", "name": "Rollback & Compensation Check", "fn": trf.test_rollback_compensating, "args": []},
        {"id": "quotas", "name": "Adaptive Quotas & Limits Check", "fn": trf.test_quotas_budgets_limits, "args": ["settings"]},
        {"id": "sandboxing", "name": "Sandboxing Execution Containment Check", "fn": trf.test_sandboxing_exec_profiles, "args": ["settings"]},
        {"id": "validation", "name": "Utility Access Policy Check", "fn": trf.test_access_control_and_validations, "args": ["settings"]}
    ]
    
    try:
        for tc in test_cases:
            start = time.time()
            # Create a separate, isolated database for each test case
            case_db = DatabaseManager("sqlite+aiosqlite:///:memory:")
            await case_db.initialize()
            set_db_manager(case_db)
            
            try:
                # Build test args
                args = []
                for arg_name in tc["args"]:
                    if arg_name == "db":
                        args.append(case_db)
                    elif arg_name == "settings":
                        args.append(settings)
                
                # Execute test function
                if asyncio.iscoroutinefunction(tc["fn"]):
                    await tc["fn"](*args)
                else:
                    tc["fn"](*args)
                    
                results.append({
                    "id": tc["id"],
                    "name": tc["name"],
                    "status": "passed",
                    "duration_ms": int((time.time() - start) * 1000),
                    "error": None
                })
            except Exception as e:
                import traceback
                error_trace = traceback.format_exc()
                logger.error("Test case failed during execution", test_id=tc["id"], error=str(e), traceback=error_trace)
                results.append({
                    "id": tc["id"],
                    "name": tc["name"],
                    "status": "failed",
                    "duration_ms": int((time.time() - start) * 1000),
                    "error": str(e)
                })
            finally:
                # Cleanup the case database
                await case_db.cleanup()
    finally:
        # Restore global db manager
        set_db_manager(original_db)
        
    passed_count = sum(1 for r in results if r["status"] == "passed")
    return {
        "success": True,
        "results": results,
        "total": len(results),
        "passed": passed_count,
        "failed": len(results) - passed_count,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
