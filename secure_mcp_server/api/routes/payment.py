"""
Razorpay payment, subscription, and webhook endpoints.

Routes:
  POST /api/v1/payment/create-order      → Create Razorpay subscription order
  POST /api/v1/payment/verify            → Verify signature and upgrade tier
  POST /api/v1/webhooks/razorpay         → Handle auto-renewal webhook events
  GET  /api/v1/subscription/current      → Return tier + usage info
  POST /api/v1/subscription/cancel       → Cancel and downgrade to free
  GET  /api/v1/subscription/usage        → Detailed usage counters
"""

from __future__ import annotations

import hashlib
import hmac
import json
import structlog
from datetime import datetime, timezone, timedelta
from typing import Optional, Any

from fastapi import APIRouter, HTTPException, Header, Request, Depends
from pydantic import BaseModel
from sqlalchemy.future import select

from secure_mcp_server.database import (
    get_db_manager, APIKey, UserSubscription, RateLimitUsage, PaymentTransaction, User
)
from secure_mcp_server.config import get_settings
from secure_mcp_server.billing.rate_limiter import (
    get_current_period, TIER_LIMITS, get_or_create_usage_record
)

logger = structlog.get_logger(__name__)
router = APIRouter()

# ── Pydantic schemas ──────────────────────────────────────────────────────────

class CreateOrderRequest(BaseModel):
    tier: str = "pro"                # only 'pro' for now; enterprise is manual

class VerifyPaymentRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str
    api_key_id: Optional[int] = None
    key_name: Optional[str] = None


class CancelSubscriptionRequest(BaseModel):
    api_key_id: int


# ── Helper: resolve API key from request ─────────────────────────────────────

async def _get_api_key_by_id(api_key_id: int, db) -> APIKey:
    stmt = select(APIKey).where(APIKey.id == api_key_id, APIKey.is_active == True)
    result = await db.execute(stmt)
    key = result.scalars().first()
    if not key:
        raise HTTPException(status_code=404, detail="API key not found")
    return key


# ── Helper: verify Razorpay HMAC signature ────────────────────────────────────

def _verify_razorpay_signature(order_id: str, payment_id: str, signature: str, secret: str) -> bool:
    """Verify the payment signature returned by Razorpay checkout."""
    body = f"{order_id}|{payment_id}"
    expected = hmac.new(secret.encode(), body.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


def _verify_webhook_signature(raw_body: bytes, signature: str, secret: str) -> bool:
    """Verify the webhook payload signature from Razorpay."""
    expected = hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


# ── POST /api/v1/payment/create-order ────────────────────────────────────────

@router.post("/payment/create-order")
async def create_order(body: CreateOrderRequest):
    """
    Create a Razorpay subscription order for the requested tier.
    Returns order details needed to open the Razorpay checkout modal on the frontend.
    """
    settings = get_settings()

    if not settings.razorpay_key_id or settings.razorpay_key_id.startswith("REPLACE_ME"):
        raise HTTPException(
            status_code=503,
            detail="Razorpay is not configured yet. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your .env file."
        )

    if body.tier not in ("pro",):
        raise HTTPException(status_code=400, detail=f"Unsupported tier: {body.tier}")

    try:
        import razorpay
        client = razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))

        # Create a subscription (recurring)
        subscription_data = {
            "plan_id": settings.razorpay_plan_id,
            "total_count": 120,      # max renewals (10 years)
            "quantity": 1,
        }
        subscription = client.subscription.create(data=subscription_data)

        logger.info("Razorpay subscription created", subscription_id=subscription.get("id"))

        return {
            "success": True,
            "subscription_id": subscription.get("id"),
            "key_id": settings.razorpay_key_id,
            "amount": settings.pro_tier_price_paise,
            "currency": "INR",
            "tier": body.tier,
            "description": "Runwall Pro - Monthly Subscription (₹7/month)",
        }

    except Exception as e:
        logger.error("Failed to create Razorpay order", error=str(e))
        raise HTTPException(status_code=500, detail=f"Payment order creation failed: {str(e)}")


# ── POST /api/v1/payment/verify ───────────────────────────────────────────────

@router.post("/payment/verify")
async def verify_payment(body: VerifyPaymentRequest, x_user_email: Optional[str] = Header(None)):
    """
    Verify Razorpay payment signature and upgrade or create the API key under Pro tier.
    Called by the frontend after Razorpay checkout succeeds.
    """
    settings = get_settings()

    # 1. Verify signature
    valid = _verify_razorpay_signature(
        order_id=body.razorpay_order_id,
        payment_id=body.razorpay_payment_id,
        signature=body.razorpay_signature,
        secret=settings.razorpay_key_secret,
    )
    if not valid:
        logger.warning("Invalid Razorpay signature", payment_id=body.razorpay_payment_id)
        raise HTTPException(status_code=400, detail="Payment verification failed: invalid signature.")

    now = datetime.now(timezone.utc)
    period_start, period_end = get_current_period("pro", now)

    generated_raw_key = None
    async with get_db_manager().get_session_context() as db:
        # Resolve user
        if not x_user_email:
            raise HTTPException(status_code=400, detail="X-User-Email header is required.")
        email_clean = x_user_email.strip().lower()
        
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
            
        if body.api_key_id:
            # 2a. Upgrade existing API key
            key = await _get_api_key_by_id(body.api_key_id, db)
            key.tier = "pro"
            key.subscription_id = body.razorpay_order_id
            key.subscription_status = "active"
            key.subscription_end_date = period_end
            key.rate_limit_requests = settings.pro_tier_requests
            key.rate_limit_period = "month"
            db.add(key)
        else:
            # 2b. Create brand new Pro API key
            from secure_mcp_server.auth import AuthManager
            auth_manager = AuthManager(settings)
            
            # Resolve or create default service account
            from secure_mcp_server.database import ServiceAccount
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
                await db.commit()
                await db.refresh(sa)
                
            generated_raw_key = await auth_manager.create_api_key(
                name=body.key_name or "Pro API Key",
                user_id=user.id,
                service_account_id=sa.id,
                tier="pro",
                rate_limit_requests=settings.pro_tier_requests,
                rate_limit_period="month"
            )
            
            # Retrieve the created key to link subscription details
            key_hash = hashlib.sha256(generated_raw_key[4:].encode()).hexdigest()
            key_stmt = select(APIKey).where(APIKey.key_hash == key_hash)
            key_res = await db.execute(key_stmt)
            key = key_res.scalar_one()
            
            key.subscription_id = body.razorpay_order_id
            key.subscription_status = "active"
            key.subscription_end_date = period_end
            db.add(key)

        # 3. Upsert UserSubscription
        sub_stmt = select(UserSubscription).where(
            UserSubscription.api_key_id == key.id
        )
        result = await db.execute(sub_stmt)
        sub = result.scalars().first()
        if sub is None:
            sub = UserSubscription(api_key_id=key.id, user_id=user.id)
            db.add(sub)

        sub.tier = "pro"
        sub.status = "active"
        sub.razorpay_subscription_id = body.razorpay_order_id
        sub.current_period_start = period_start
        sub.current_period_end = period_end
        sub.auto_renew = True
        sub.price_paid = settings.pro_tier_price_paise
        sub.currency = "INR"

        # 4. Create payment transaction record
        txn = PaymentTransaction(
            user_id=user.id,
            api_key_id=key.id,
            tier="pro",
            amount=settings.pro_tier_price_paise,
            currency="INR",
            status="completed",
            razorpay_payment_id=body.razorpay_payment_id,
            razorpay_order_id=body.razorpay_order_id,
            razorpay_signature=body.razorpay_signature,
            description="Runwall Pro subscription payment",
        )
        db.add(txn)

        # 5. Reset usage for the new pro period
        usage_stmt = select(RateLimitUsage).where(
            RateLimitUsage.api_key_id == key.id,
            RateLimitUsage.period_start == period_start,
        )
        usage_result = await db.execute(usage_stmt)
        usage = usage_result.scalars().first()
        if usage is None:
            usage = RateLimitUsage(
                api_key_id=key.id,
                period_start=period_start,
                period_end=period_end,
                request_count=0,
                requests_remaining=settings.pro_tier_requests,
                is_exceeded=False,
            )
            db.add(usage)
        else:
            usage.request_count = 0
            usage.requests_remaining = settings.pro_tier_requests
            usage.is_exceeded = False

        await db.commit()

    logger.info(
        "Pro key verification completed",
        api_key_id=key.id,
        payment_id=body.razorpay_payment_id,
    )

    ret = {
        "success": True,
        "tier": "pro",
        "rate_limit": {
            "requests": settings.pro_tier_requests,
            "period": "month",
            "reset_at": period_end.isoformat(),
        },
    }
    if generated_raw_key:
        ret["api_key"] = generated_raw_key
    return ret


# ── POST /api/v1/webhooks/razorpay ───────────────────────────────────────────

@router.post("/webhooks/razorpay")
async def razorpay_webhook(request: Request):
    """
    Handle Razorpay webhook events (subscription.charged, subscription.cancelled, etc.).
    Razorpay sends these automatically on renewal or cancellation.
    """
    settings = get_settings()
    raw_body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")

    # Verify webhook signature
    if settings.razorpay_webhook_secret and not settings.razorpay_webhook_secret.startswith("REPLACE_ME"):
        if not _verify_webhook_signature(raw_body, signature, settings.razorpay_webhook_secret):
            logger.warning("Invalid Razorpay webhook signature")
            raise HTTPException(status_code=400, detail="Invalid webhook signature")

    try:
        payload = json.loads(raw_body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event = payload.get("event", "")
    logger.info("Razorpay webhook received", event=event)

    if event == "subscription.charged":
        await _handle_subscription_charged(payload)
    elif event in ("subscription.cancelled", "subscription.completed"):
        await _handle_subscription_cancelled(payload)
    elif event == "payment.failed":
        await _handle_payment_failed(payload)

    return {"status": "ok"}


async def _handle_subscription_charged(payload: dict) -> None:
    """Auto-renewal: reset period counters and update dates."""
    settings = get_settings()
    sub_data = payload.get("payload", {}).get("subscription", {}).get("entity", {})
    payment_data = payload.get("payload", {}).get("payment", {}).get("entity", {})

    razorpay_sub_id = sub_data.get("id")
    if not razorpay_sub_id:
        return

    # Unix timestamps from Razorpay
    period_start_ts = sub_data.get("current_start")
    period_end_ts = sub_data.get("current_end")
    now = datetime.now(timezone.utc)

    period_start = datetime.fromtimestamp(period_start_ts, tz=timezone.utc) if period_start_ts else now
    period_end = datetime.fromtimestamp(period_end_ts, tz=timezone.utc) if period_end_ts else (now + timedelta(days=30))

    async with get_db_manager().get_session_context() as db:
        stmt = select(UserSubscription).where(
            UserSubscription.razorpay_subscription_id == razorpay_sub_id
        )
        result = await db.execute(stmt)
        sub = result.scalars().first()

        if sub is None:
            logger.warning("Webhook: subscription not found in DB", razorpay_sub_id=razorpay_sub_id)
            return

        # Update subscription period
        sub.current_period_start = period_start
        sub.current_period_end = period_end
        sub.status = "active"

        # Update API key
        if sub.api_key_id:
            key_stmt = select(APIKey).where(APIKey.id == sub.api_key_id)
            key_result = await db.execute(key_stmt)
            key = key_result.scalars().first()
            if key:
                key.subscription_end_date = period_end
                key.subscription_status = "active"

                # Create fresh usage record for new period
                new_usage = RateLimitUsage(
                    api_key_id=key.id,
                    period_start=period_start,
                    period_end=period_end,
                    request_count=0,
                    requests_remaining=settings.pro_tier_requests,
                    is_exceeded=False,
                )
                db.add(new_usage)

        # Record transaction
        txn = PaymentTransaction(
            user_id=sub.user_id,
            api_key_id=sub.api_key_id,
            tier="pro",
            amount=payment_data.get("amount", settings.pro_tier_price_paise),
            currency="INR",
            status="completed",
            razorpay_payment_id=payment_data.get("id"),
            subscription_id=razorpay_sub_id,
            description="Runwall Pro auto-renewal",
        )
        db.add(txn)
        await db.commit()

    logger.info("Auto-renewal processed", razorpay_sub_id=razorpay_sub_id)


async def _handle_subscription_cancelled(payload: dict) -> None:
    """Subscription cancelled by user or by Razorpay — downgrade to free."""
    sub_data = payload.get("payload", {}).get("subscription", {}).get("entity", {})
    razorpay_sub_id = sub_data.get("id")
    if not razorpay_sub_id:
        return

    await _downgrade_subscription(razorpay_sub_id, reason="subscription.cancelled webhook")


async def _handle_payment_failed(payload: dict) -> None:
    """Record a failed payment transaction."""
    payment = payload.get("payload", {}).get("payment", {}).get("entity", {})
    razorpay_payment_id = payment.get("id")
    if not razorpay_payment_id:
        return

    async with get_db_manager().get_session_context() as db:
        # Check if already recorded to avoid duplicates
        stmt = select(PaymentTransaction).where(
            PaymentTransaction.razorpay_payment_id == razorpay_payment_id
        )
        result = await db.execute(stmt)
        existing = result.scalars().first()
        if existing:
            return

        txn = PaymentTransaction(
            tier="pro",
            amount=payment.get("amount", 0),
            currency=payment.get("currency", "INR"),
            status="failed",
            razorpay_payment_id=razorpay_payment_id,
            error_message=payment.get("error_description", "Payment failed"),
            description="Failed Razorpay payment",
        )
        db.add(txn)
        await db.commit()

    logger.warning("Payment failed recorded", razorpay_payment_id=razorpay_payment_id)


# ── Shared downgrade helper ───────────────────────────────────────────────────

async def _downgrade_subscription(razorpay_sub_id: str, reason: str = "") -> None:
    """Downgrade an API key to free tier."""
    settings = get_settings()
    now = datetime.now(timezone.utc)
    period_start, period_end = get_current_period("free", now)

    async with get_db_manager().get_session_context() as db:
        stmt = select(UserSubscription).where(
            UserSubscription.razorpay_subscription_id == razorpay_sub_id
        )
        result = await db.execute(stmt)
        sub = result.scalars().first()

        if not sub:
            return

        sub.status = "canceled"
        sub.canceled_at = now

        if sub.api_key_id:
            key_stmt = select(APIKey).where(APIKey.id == sub.api_key_id)
            key_result = await db.execute(key_stmt)
            key = key_result.scalars().first()
            if key:
                key.tier = "free"
                key.subscription_id = None
                key.subscription_status = "canceled"
                key.subscription_end_date = None
                key.rate_limit_requests = settings.free_tier_requests
                key.rate_limit_period = "week"

                # Create fresh free-tier usage record
                new_usage = RateLimitUsage(
                    api_key_id=key.id,
                    period_start=period_start,
                    period_end=period_end,
                    request_count=0,
                    requests_remaining=settings.free_tier_requests,
                    is_exceeded=False,
                )
                db.add(new_usage)

        await db.commit()

    logger.info("Subscription downgraded to free", razorpay_sub_id=razorpay_sub_id, reason=reason)


# ── GET /api/v1/subscription/current ─────────────────────────────────────────

@router.get("/subscription/current")
async def get_current_subscription(api_key_id: int):
    """
    Return the current subscription status, tier, rate limit, and usage for an API key.
    """
    async with get_db_manager().get_session_context() as db:
        key = await _get_api_key_by_id(api_key_id, db)
        limit = TIER_LIMITS.get(key.tier)
        period_start, period_end = get_current_period(key.tier)
        usage = await get_or_create_usage_record(key, db)
        await db.commit()

        return {
            "api_key_id": api_key_id,
            "tier": key.tier,
            "subscription_status": key.subscription_status,
            "subscription_end_date": key.subscription_end_date.isoformat() if key.subscription_end_date else None,
            "rate_limit": {
                "requests_per_period": limit,
                "period": key.rate_limit_period,
                "period_start": period_start.isoformat(),
                "period_end": period_end.isoformat(),
            },
            "usage": {
                "used": usage.request_count,
                "remaining": usage.requests_remaining,
                "is_exceeded": usage.is_exceeded,
                "last_request_at": usage.last_request_at.isoformat() if usage.last_request_at else None,
            },
        }


# ── POST /api/v1/subscription/cancel ─────────────────────────────────────────

@router.post("/subscription/cancel")
async def cancel_subscription(body: CancelSubscriptionRequest):
    """Cancel a Pro subscription and downgrade the API key to free tier."""
    settings = get_settings()

    async with get_db_manager().get_session_context() as db:
        key = await _get_api_key_by_id(body.api_key_id, db)

        if key.tier == "free":
            return {"success": True, "message": "Already on free tier."}

        razorpay_sub_id = key.subscription_id

        # Cancel on Razorpay side if credentials are available
        if razorpay_sub_id and settings.razorpay_key_id and not settings.razorpay_key_id.startswith("REPLACE_ME"):
            try:
                import razorpay
                client = razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))
                client.subscription.cancel(razorpay_sub_id, {"cancel_at_cycle_end": 0})
                logger.info("Razorpay subscription cancelled", sub_id=razorpay_sub_id)
            except Exception as e:
                logger.warning("Could not cancel Razorpay subscription", error=str(e))

        # Downgrade in DB
        now = datetime.now(timezone.utc)
        period_start, period_end = get_current_period("free", now)

        # Update UserSubscription
        if razorpay_sub_id:
            stmt = select(UserSubscription).where(
                UserSubscription.razorpay_subscription_id == razorpay_sub_id
            )
            result = await db.execute(stmt)
            sub = result.scalars().first()
            if sub:
                sub.status = "canceled"
                sub.canceled_at = now

        # Downgrade API key
        key.tier = "free"
        key.subscription_id = None
        key.subscription_status = "canceled"
        key.subscription_end_date = None
        key.rate_limit_requests = settings.free_tier_requests
        key.rate_limit_period = "week"

        # Create fresh free usage record
        new_usage = RateLimitUsage(
            api_key_id=key.id,
            period_start=period_start,
            period_end=period_end,
            request_count=0,
            requests_remaining=settings.free_tier_requests,
            is_exceeded=False,
        )
        db.add(new_usage)
        await db.commit()

    return {
        "success": True,
        "message": "Subscription cancelled. You have been downgraded to the free tier (15 requests/week).",
        "tier": "free",
    }


# ── GET /api/v1/subscription/usage ───────────────────────────────────────────

@router.get("/subscription/usage")
async def get_usage(api_key_id: int):
    """Return detailed usage counters for the current period."""
    async with get_db_manager().get_session_context() as db:
        key = await _get_api_key_by_id(api_key_id, db)
        limit = TIER_LIMITS.get(key.tier, key.rate_limit_requests)
        period_start, period_end = get_current_period(key.tier)
        usage = await get_or_create_usage_record(key, db)
        await db.commit()

        return {
            "api_key_id": api_key_id,
            "tier": key.tier,
            "used": usage.request_count,
            "limit": limit,
            "remaining": usage.requests_remaining,
            "is_exceeded": usage.is_exceeded,
            "period_start": period_start.isoformat(),
            "period_end": period_end.isoformat(),
            "reset_at": period_end.isoformat(),
        }
