"""
Hourly cron job: downgrade API keys whose Pro subscriptions have expired.

Started as a background asyncio task in main.py at server startup.
This acts as a safety net in case Razorpay webhooks fail or are delayed.
"""

from __future__ import annotations

import asyncio
import structlog
from datetime import datetime, timezone

from sqlalchemy.future import select

from secure_mcp_server.database import get_db_manager, APIKey, UserSubscription, RateLimitUsage
from secure_mcp_server.config import get_settings
from secure_mcp_server.billing.rate_limiter import get_current_period

logger = structlog.get_logger(__name__)

CRON_INTERVAL_SECONDS = 3600   # run every hour


async def downgrade_expired_subscriptions() -> int:
    """
    Find all active Pro/Enterprise API keys whose subscription has expired
    and downgrade them to free. Returns the number of keys downgraded.
    """
    settings = get_settings()
    now = datetime.now(timezone.utc)
    period_start, period_end = get_current_period("free", now)
    downgraded = 0

    try:
        async with get_db_manager().get_session_context() as db:
            # Find UserSubscriptions that have expired but are still marked active
            stmt = select(UserSubscription).where(
                UserSubscription.status == "active",
                UserSubscription.current_period_end < now,
                UserSubscription.tier != "free",
            )
            result = await db.execute(stmt)
            expired_subs = result.scalars().all()

            for sub in expired_subs:
                sub.status = "expired"
                sub.canceled_at = now
                logger.info(
                    "Cron: subscription expired",
                    sub_id=sub.id,
                    user_id=sub.user_id,
                    period_end=sub.current_period_end,
                )

                if sub.api_key_id:
                    key_stmt = select(APIKey).where(APIKey.id == sub.api_key_id)
                    key_result = await db.execute(key_stmt)
                    key = key_result.scalars().first()
                    if key and key.tier != "free":
                        key.tier = "free"
                        key.subscription_id = None
                        key.subscription_status = "expired"
                        key.subscription_end_date = None
                        key.rate_limit_requests = settings.free_tier_requests
                        key.rate_limit_period = "week"

                        # Create a fresh free-tier usage record
                        new_usage = RateLimitUsage(
                            api_key_id=key.id,
                            period_start=period_start,
                            period_end=period_end,
                            request_count=0,
                            requests_remaining=settings.free_tier_requests,
                            is_exceeded=False,
                        )
                        db.add(new_usage)
                        downgraded += 1

            if downgraded:
                await db.commit()
                logger.info("Cron: downgraded expired subscriptions", count=downgraded)

    except Exception as e:
        logger.error("Cron: failed to run subscription expiry check", error=str(e))

    return downgraded


async def _cron_loop() -> None:
    """Background loop that runs downgrade_expired_subscriptions every hour."""
    logger.info("Billing cron started", interval_seconds=CRON_INTERVAL_SECONDS)
    while True:
        try:
            count = await downgrade_expired_subscriptions()
            if count:
                logger.info("Cron completed: subscriptions downgraded", count=count)
        except Exception as e:
            logger.error("Billing cron loop error", error=str(e))
        await asyncio.sleep(CRON_INTERVAL_SECONDS)


def start_billing_cron() -> asyncio.Task:
    """Start the billing cron as an asyncio background task. Call this once at startup."""
    return asyncio.create_task(_cron_loop(), name="billing_cron")
