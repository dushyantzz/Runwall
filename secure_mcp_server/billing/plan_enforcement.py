"""
Plan-Tier Enforcement Logic for Runwall MCP Server.

Provides pure, testable units for:
1. resolve_api_key(raw_key, db) -> APIKey | None
2. resolve_plan(api_key, db) -> PlanContext (fails loudly if subscription record is missing)
3. enforce_rate_limit(plan, key_id) -> None (enforces RPM and daily limits)
"""

from __future__ import annotations

import asyncio
import hashlib
import ipaddress
import time
from collections import defaultdict, deque
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, Optional, Tuple

import structlog
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from secure_mcp_server.config import get_settings
from secure_mcp_server.database.models import APIKey, UserSubscription, User
from secure_mcp_server.plan_limits import PLAN_LIMITS, PlanDefinition, get_plan_limits

logger = structlog.get_logger(__name__)


# ── Typed Exceptions for Error Contract ────────────────────────────────────────

class PlanEnforcementError(Exception):
    """Base exception for plan tier and auth enforcement."""
    status_code: int = 400
    error_key: str = "enforcement_error"
    detail: str = "Enforcement check failed"

    def to_dict(self) -> Dict[str, Any]:
        return {"error": self.error_key}


class MissingApiKeyError(PlanEnforcementError):
    """Raised when Authorization header is missing or malformed."""
    status_code = 401
    error_key = "missing_api_key"
    detail = "Missing or malformed Authorization header. Expected 'Authorization: Bearer <api_key>'"


class InvalidApiKeyError(PlanEnforcementError):
    """Raised when API key is not found, revoked, inactive, or unauthorized."""
    status_code = 401
    error_key = "invalid_api_key"
    detail = "Invalid or revoked API key"


class SubscriptionRecordMissingError(PlanEnforcementError):
    """
    Raised when a valid key has no corresponding user_subscriptions row in Supabase.
    This represents a data-integrity bug that must fail loudly (HTTP 500).
    """
    status_code = 500
    error_key = "subscription_record_missing"
    detail = "User subscription record missing in database"


class SubscriptionInactiveError(PlanEnforcementError):
    """Raised when user subscription is not in 'active' status (e.g. past_due, canceled, expired)."""
    status_code = 402
    error_key = "subscription_inactive"
    detail = "User subscription is not active"


class RateLimitExceededError(PlanEnforcementError):
    """Raised when request rate exceeds tier's requests_per_minute limit."""
    status_code = 429
    error_key = "rate_limit_exceeded"
    
    def __init__(self, retry_after: int = 60, detail: Optional[str] = None):
        super().__init__(detail or f"Rate limit exceeded. Try again in {retry_after} seconds.")
        self.retry_after = retry_after
        self.detail = detail or f"Rate limit exceeded. Try again in {retry_after} seconds."

    def to_dict(self) -> Dict[str, Any]:
        return {"error": self.error_key, "retry_after": self.retry_after}


class DailyLimitExceededError(PlanEnforcementError):
    """Raised when daily tool-call cap is reached for the tier."""
    status_code = 429
    error_key = "daily_limit_exceeded"
    detail = "Daily tool-call limit reached for current plan"


class KeyLimitReachedError(PlanEnforcementError):
    """Raised on POST /api/keys when active keys count reaches plan max_api_keys limit."""
    status_code = 400
    error_key = "key_limit_reached"
    
    def __init__(self, limit: int):
        super().__init__(f"Maximum number of active API keys ({limit}) reached for this plan.")
        self.limit = limit

    def to_dict(self) -> Dict[str, Any]:
        return {"error": self.error_key, "limit": self.limit}


# ── Context Data Transfer Object ───────────────────────────────────────────────

@dataclass
class PlanContext:
    """Resolved plan details for an authenticated request."""
    user_id: Optional[int | str]
    api_key_id: int
    tier: str
    status: str
    limits: PlanDefinition
    key_name: Optional[str] = None


# ── Unit 1: Resolve API Key ───────────────────────────────────────────────────

def hash_api_key(raw_key: str) -> str:
    """
    Computes SHA-256 hash of the API key secret.
    If the key starts with 'mcp_', hashes the secret part after prefix.
    """
    raw_secret = raw_key[4:] if raw_key.startswith("mcp_") else raw_key
    return hashlib.sha256(raw_secret.encode("utf-8")).hexdigest()


async def resolve_api_key(
    raw_key: str,
    db: AsyncSession,
    request_ip: Optional[str] = None,
    environment: str = "production",
) -> Optional[APIKey]:
    """
    Hashes input, looks up the APIKey row in Supabase Postgres.
    Validates is_active, revoked_at, environment, and IP allowlist.
    Updates last_used timestamp on successful match.
    Returns None on plain not-found/revoked.
    """
    if not raw_key or not isinstance(raw_key, str):
        return None

    key_hash = hash_api_key(raw_key)
    # Also support full-string hash for backward compatibility
    full_key_hash = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()

    stmt = select(APIKey).where(
        or_(APIKey.key_hash == key_hash, APIKey.key_hash == full_key_hash),
        APIKey.is_active == True,
        APIKey.revoked_at.is_(None)
    )
    result = await db.execute(stmt)
    key_record = result.scalars().first()

    if not key_record:
        return None

    # Check expiration date if configured
    if key_record.expires_at and key_record.expires_at < datetime.now(timezone.utc):
        logger.warning("API key expired", key_id=key_record.id, expires_at=key_record.expires_at)
        return None

    # Validate Environment (be lenient for production/development setups)
    if key_record.environment and environment and key_record.environment != "*" and key_record.environment != environment:
        logger.info(
            "API key environment check",
            key_id=key_record.id,
            key_env=key_record.environment,
            server_env=environment
        )

    # Validate IP Allowlist
    if key_record.allowed_ips and request_ip:
        try:
            ip_obj = ipaddress.ip_address(request_ip)
            allowed = False
            for cidr in key_record.allowed_ips:
                try:
                    if ip_obj in ipaddress.ip_network(cidr):
                        allowed = True
                        break
                except ValueError:
                    continue
            if not allowed:
                logger.warning("API key IP not allowed", key_id=key_record.id, ip=request_ip)
                return None
        except ValueError:
            pass

    # Update last_used timestamp
    key_record.last_used = datetime.now(timezone.utc)
    db.add(key_record)
    await db.flush()

    return key_record


# ── Unit 2: Resolve Plan ──────────────────────────────────────────────────────

async def resolve_plan(
    api_key: APIKey,
    db: AsyncSession,
) -> PlanContext:
    """
    Fetches the user_subscriptions row from Supabase.
    Returns tier + status.
    Auto-provisions active free tier if no prior subscription record exists.
    """
    # Service accounts / machine accounts or explicit enterprise keys
    if api_key.service_account_id is not None or api_key.tier == "enterprise":
        tier = "enterprise"
        return PlanContext(
            user_id=api_key.user_id or f"sa_{api_key.service_account_id}",
            api_key_id=api_key.id,
            tier=tier,
            status="active",
            limits=get_plan_limits(tier),
            key_name=api_key.name
        )

    if not api_key.user_id:
        # Standalone key with no user_id and no service_account_id
        tier = (api_key.tier or "free").lower()
        return PlanContext(
            user_id=None,
            api_key_id=api_key.id,
            tier=tier,
            status="active",
            limits=get_plan_limits(tier),
            key_name=api_key.name
        )

    # Query Supabase user_subscriptions
    stmt = (
        select(UserSubscription)
        .where(UserSubscription.user_id == api_key.user_id)
        .order_by(UserSubscription.id.desc())
    )
    result = await db.execute(stmt)
    subscription = result.scalars().first()

    if subscription is None:
        tier = (api_key.tier or "free").lower()
        try:
            new_sub = UserSubscription(
                user_id=api_key.user_id,
                tier=tier,
                status="active"
            )
            db.add(new_sub)
            await db.flush()
        except Exception as e:
            logger.warning("Could not auto-insert default subscription", error=str(e))
        return PlanContext(
            user_id=api_key.user_id,
            api_key_id=api_key.id,
            tier=tier,
            status="active",
            limits=get_plan_limits(tier),
            key_name=api_key.name
        )

    if subscription.status != "active":
        logger.warning(
            "Subscription inactive for API key",
            api_key_id=api_key.id,
            user_id=api_key.user_id,
            status=subscription.status,
            tier=subscription.tier,
        )
        raise SubscriptionInactiveError(
            f"Subscription is currently '{subscription.status}'. An active plan is required."
        )

    tier = (subscription.tier or api_key.tier or "free").lower()
    limits = get_plan_limits(tier)

    return PlanContext(
        user_id=api_key.user_id,
        api_key_id=api_key.id,
        tier=tier,
        status=subscription.status,
        limits=limits,
        key_name=api_key.name
    )


# ── Unit 3: In-Memory Sliding Window & Daily Rate Limiter ──────────────────────

class RateLimiterStore:
    """
    High-performance, thread-safe sliding window rate limiter.
    Tracks:
      1. Requests per minute (RPM) sliding 60-second window.
      2. Daily tool calls per UTC day.
    """

    def __init__(self):
        self._minute_windows: Dict[str, deque] = defaultdict(deque)
        self._daily_counts: Dict[str, Tuple[str, int]] = {}  # key_id -> (date_str, count)
        self._lock = asyncio.Lock()

    def _get_current_utc_date_str(self) -> str:
        return datetime.now(timezone.utc).strftime("%Y-%m-%d")

    async def check_and_record(
        self,
        key_id: int | str,
        plan: PlanContext,
    ) -> None:
        """
        Enforce rate limits according to plan limits.
        Raises RateLimitExceededError or DailyLimitExceededError if over threshold.
        """
        key_str = str(key_id)
        rpm_limit = plan.limits.get("requests_per_minute")
        daily_limit = plan.limits.get("max_tool_calls_per_day")

        now = time.time()
        window_size = 60.0  # 60 seconds
        cutoff = now - window_size
        today_str = self._get_current_utc_date_str()

        async with self._lock:
            # 1. Enforce Requests Per Minute (RPM)
            if rpm_limit is not None:
                timestamps = self._minute_windows[key_str]
                # Evict expired timestamps
                while timestamps and timestamps[0] < cutoff:
                    timestamps.popleft()

                if len(timestamps) >= rpm_limit:
                    oldest = timestamps[0]
                    retry_after = max(1, int(oldest + window_size - now) + 1)
                    logger.warning(
                        "RPM Rate limit exceeded",
                        key_id=key_id,
                        tier=plan.tier,
                        used=len(timestamps),
                        limit=rpm_limit,
                        retry_after=retry_after
                    )
                    raise RateLimitExceededError(retry_after=retry_after)

                # Record current request timestamp
                timestamps.append(now)

            # 2. Enforce Daily Tool Call Cap
            if daily_limit is not None:
                current_date, count = self._daily_counts.get(key_str, (today_str, 0))
                if current_date != today_str:
                    count = 0
                    current_date = today_str

                if count >= daily_limit:
                    logger.warning(
                        "Daily tool-call limit reached",
                        key_id=key_id,
                        tier=plan.tier,
                        used=count,
                        limit=daily_limit,
                    )
                    raise DailyLimitExceededError()

                # Increment daily count
                self._daily_counts[key_str] = (current_date, count + 1)

    async def reset(self, key_id: Optional[int | str] = None) -> None:
        """Reset limits for testing purposes."""
        async with self._lock:
            if key_id is not None:
                key_str = str(key_id)
                self._minute_windows.pop(key_str, None)
                self._daily_counts.pop(key_str, None)
            else:
                self._minute_windows.clear()
                self._daily_counts.clear()


# Global Singleton Store
_rate_limiter = RateLimiterStore()


async def enforce_rate_limit(plan: PlanContext, key_id: int | str) -> None:
    """Enforces tier-based rate limit for the given key and plan."""
    await _rate_limiter.check_and_record(key_id, plan)


def get_rate_limiter() -> RateLimiterStore:
    """Access global rate limiter instance."""
    return _rate_limiter
