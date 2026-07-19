"""
Rate limiting middleware for Runwall.

Logic:
  - FREE  tier: 15 requests/week  (Sunday 00:00 → Sunday 23:59 UTC)
  - PRO   tier: 2000 requests/month (1st of month 00:00 → 1st next month 23:59 UTC)
  - ENTERPRISE: unlimited

check_rate_limit() runs BEFORE tool execution.
record_usage()     runs AFTER successful tool execution.
"""

from __future__ import annotations

import structlog
from datetime import datetime, timezone, timedelta
from typing import Tuple, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from secure_mcp_server.database.models import APIKey, RateLimitUsage

logger = structlog.get_logger(__name__)

# ── Constants ─────────────────────────────────────────────────────────────────

TIER_LIMITS = {
    "free": 15,
    "pro": 2000,
    "enterprise": None,   # None = unlimited
}

TIER_PERIODS = {
    "free": "week",
    "pro": "month",
    "enterprise": "month",
}


# ── Period calculation helpers ────────────────────────────────────────────────

def get_current_period(tier: str, now: Optional[datetime] = None) -> Tuple[datetime, datetime]:
    """Return (period_start, period_end) for the given tier at the given moment."""
    if now is None:
        now = datetime.now(timezone.utc)

    if tier == "free":
        # Weekly: Monday-anchored ISO week, but spec says Sunday-Sunday.
        # Calculate last Sunday 00:00 → next Sunday 00:00.
        weekday = now.isoweekday() % 7   # Sunday = 0
        period_start = (now - timedelta(days=weekday)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        period_end = period_start + timedelta(weeks=1)
    else:
        # Monthly: 1st of current month → 1st of next month.
        period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if now.month == 12:
            period_end = period_start.replace(year=now.year + 1, month=1)
        else:
            period_end = period_start.replace(month=now.month + 1)

    return period_start, period_end


# ── Core helpers ──────────────────────────────────────────────────────────────

async def get_or_create_usage_record(
    api_key: APIKey,
    db: AsyncSession,
) -> RateLimitUsage:
    """Fetch the usage row for the current period, or create a fresh one."""
    period_start, period_end = get_current_period(api_key.tier)
    limit = TIER_LIMITS.get(api_key.tier, api_key.rate_limit_requests)

    stmt = (
        select(RateLimitUsage)
        .where(
            RateLimitUsage.api_key_id == api_key.id,
            RateLimitUsage.period_start == period_start,
        )
    )
    result = await db.execute(stmt)
    usage = result.scalars().first()

    if usage is None:
        # New period: create a fresh record.
        usage = RateLimitUsage(
            api_key_id=api_key.id,
            period_start=period_start,
            period_end=period_end,
            request_count=0,
            requests_remaining=limit if limit is not None else 999_999_999,
            is_exceeded=False,
        )
        db.add(usage)
        await db.flush()
        logger.info(
            "New rate-limit period created",
            api_key_id=api_key.id,
            tier=api_key.tier,
            period_start=period_start.isoformat(),
            period_end=period_end.isoformat(),
        )

    return usage


async def check_rate_limit(api_key_id: int, db: AsyncSession) -> dict:
    """
    Check whether the API key has quota remaining for the current period.

    Returns a dict:
      { "allowed": True }                on success
      { "allowed": False, "detail": str, "used": int, "limit": int, "reset_at": str }
      on rate limit exceeded.

    Enterprise keys always pass.
    """
    stmt = select(APIKey).where(APIKey.id == api_key_id, APIKey.is_active == True)
    result = await db.execute(stmt)
    api_key = result.scalars().first()

    if api_key is None:
        return {"allowed": False, "detail": "API key not found or inactive"}

    # Enterprise is always unlimited.
    if api_key.tier == "enterprise":
        return {"allowed": True}

    limit = TIER_LIMITS.get(api_key.tier, api_key.rate_limit_requests)
    usage = await get_or_create_usage_record(api_key, db)
    _, period_end = get_current_period(api_key.tier)

    if limit is not None and usage.request_count >= limit:
        usage.is_exceeded = True
        await db.flush()
        reset_str = period_end.strftime("%A, %B %-d") if hasattr(period_end, "strftime") else str(period_end)
        logger.warning(
            "Rate limit exceeded",
            api_key_id=api_key_id,
            tier=api_key.tier,
            used=usage.request_count,
            limit=limit,
        )
        return {
            "allowed": False,
            "detail": (
                f"Rate limit exceeded. You have used {usage.request_count}/{limit} "
                f"requests this {'week' if api_key.tier == 'free' else 'month'}. "
                f"Resets on {period_end.strftime('%B %-d, %Y') if hasattr(period_end, 'strftime') else str(period_end)}."
            ),
            "used": usage.request_count,
            "limit": limit,
            "reset_at": period_end.isoformat(),
            "tier": api_key.tier,
        }

    return {"allowed": True}


async def record_usage(api_key_id: int, db: AsyncSession) -> None:
    """Increment the request counter after a successful tool execution."""
    stmt = select(APIKey).where(APIKey.id == api_key_id, APIKey.is_active == True)
    result = await db.execute(stmt)
    api_key = result.scalars().first()

    if api_key is None or api_key.tier == "enterprise":
        return

    limit = TIER_LIMITS.get(api_key.tier, api_key.rate_limit_requests)
    usage = await get_or_create_usage_record(api_key, db)

    usage.request_count += 1
    if limit is not None:
        usage.requests_remaining = max(0, limit - usage.request_count)
    usage.last_request_at = datetime.now(timezone.utc)

    await db.flush()
    logger.debug(
        "Usage recorded",
        api_key_id=api_key_id,
        tier=api_key.tier,
        count=usage.request_count,
        remaining=usage.requests_remaining,
    )
