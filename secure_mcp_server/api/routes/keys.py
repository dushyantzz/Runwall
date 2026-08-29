"""
API Key Management Routes.

Endpoints:
  POST   /api/keys           → Issue a new API key (enforcing tier max_api_keys)
  GET    /api/keys           → List user's active keys
  DELETE /api/keys/{key_id}  → Revoke a key immediately
"""

from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

import structlog
from fastapi import APIRouter, Depends, Header, HTTPException, Request, Response, status
from pydantic import BaseModel, Field
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from secure_mcp_server.auth import AuthManager
from secure_mcp_server.billing.plan_enforcement import (
    KeyLimitReachedError,
    hash_api_key,
)
from secure_mcp_server.config import get_settings
from secure_mcp_server.database import get_db_manager, get_db_session
from secure_mcp_server.database.models import APIKey, User, UserSubscription
from secure_mcp_server.plan_limits import PLAN_LIMITS, get_plan_limits

logger = structlog.get_logger(__name__)
router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class CreateKeyRequest(BaseModel):
    name: Optional[str] = Field(default="Default Key", description="Friendly label for the API key")
    label: Optional[str] = Field(default=None, description="Alias for name")
    environment: str = Field(default="production", description="Environment scope")
    allowed_ips: List[str] = Field(default_factory=lambda: ["0.0.0.0/0", "::/0"])


class KeyResponse(BaseModel):
    id: int
    name: str
    prefix: str
    tier: str
    created_at: datetime
    last_used: Optional[datetime] = None
    is_active: bool = True
    key: Optional[str] = None  # Returned only on creation


# ── Auth Helper for Dashboard Endpoints ────────────────────────────────────────

async def get_current_user(
    request: Request,
    authorization: Optional[str] = Header(None),
    x_user_email: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db_session),
) -> User:
    """
    Resolves the authenticated user via:
    1. JWT Bearer token in Authorization header
    2. X-User-Email header (Supabase auth bridge)
    3. Basic auth / admin session
    """
    settings = get_settings()
    auth_manager = AuthManager(settings)

    # 1. Check JWT Bearer token
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:].strip()
        # Avoid treating raw mcp_ api keys as JWTs on management endpoints
        if not token.startswith("mcp_"):
            payload = await auth_manager.verify_token(token, token_type="access")
            if payload and payload.get("sub"):
                user_id = payload["sub"]
                stmt = select(User).where(User.id == int(user_id) if str(user_id).isdigit() else User.username == str(user_id))
                res = await db.execute(stmt)
                user = res.scalar_one_or_none()
                if user and user.is_active:
                    return user

    # 2. Check X-User-Email header
    if x_user_email:
        email_clean = x_user_email.strip().lower()
        stmt = select(User).where(User.email == email_clean)
        res = await db.execute(stmt)
        user = res.scalar_one_or_none()
        if not user:
            # Auto-provision Supabase authenticated user
            username = email_clean.split("@")[0]
            user = User(
                username=username,
                email=email_clean,
                full_name=username,
                hashed_password="supabase-auth-managed",
                is_active=True,
                is_admin=False,
            )
            db.add(user)
            await db.flush()

            # Also provision initial active Free subscription
            sub = UserSubscription(
                user_id=user.id,
                tier="free",
                status="active",
                current_period_start=datetime.now(timezone.utc),
                current_period_end=datetime.now(timezone.utc) + timedelta(days=3650),
            )
            db.add(sub)
            await db.flush()
        return user

    # 3. Check if user_context exists on request state
    if hasattr(request.state, "user_context") and request.state.user_context:
        uid = request.state.user_context.get("user_id")
        if uid and str(uid).isdigit():
            stmt = select(User).where(User.id == int(uid))
            res = await db.execute(stmt)
            user = res.scalar_one_or_none()
            if user:
                return user

    # If no credentials provided, return 401
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={"error": "unauthorized", "message": "Authentication required. Provide Bearer JWT token or X-User-Email header."},
    )


# ── POST /api/keys ────────────────────────────────────────────────────────────

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_api_key(
    req: CreateKeyRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    """
    Issue a new API key for the authenticated user.
    Enforces max_api_keys limit per plan tier at creation time.
    """
    # 1. Resolve user's active subscription and tier
    sub_stmt = (
        select(UserSubscription)
        .where(UserSubscription.user_id == user.id)
        .order_by(UserSubscription.id.desc())
    )
    sub_res = await db.execute(sub_stmt)
    subscription = sub_res.scalars().first()

    if not subscription:
        # Auto-create active free tier subscription
        subscription = UserSubscription(
            user_id=user.id,
            tier="free",
            status="active",
            current_period_start=datetime.now(timezone.utc),
            current_period_end=datetime.now(timezone.utc) + timedelta(days=3650),
        )
        db.add(subscription)
        await db.flush()

    tier = (subscription.tier or "free").lower()
    limits = get_plan_limits(tier)
    max_keys = limits.get("max_api_keys")

    # 2. Check active keys count for this user
    active_keys_stmt = select(APIKey).where(
        APIKey.user_id == user.id,
        APIKey.is_active == True,
        APIKey.revoked_at.is_(None),
    )
    active_keys_res = await db.execute(active_keys_stmt)
    active_keys = active_keys_res.scalars().all()

    if max_keys is not None and len(active_keys) >= max_keys:
        logger.warning(
            "Max API keys limit reached for user",
            user_id=user.id,
            tier=tier,
            active_count=len(active_keys),
            max_keys=max_keys,
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "key_limit_reached", "limit": max_keys},
        )

    # 3. Generate raw key and SHA-256 hash
    secret = secrets.token_urlsafe(32)
    raw_key = f"mcp_{secret}"
    key_prefix = raw_key[:8]
    key_hash = hash_api_key(raw_key)

    key_name = req.label or req.name or "API Key"

    new_key = APIKey(
        tenant_id=user.tenant_id or "default",
        user_id=user.id,
        name=key_name,
        key_hash=key_hash,
        prefix=key_prefix,
        tier=tier,
        environment=req.environment or "production",
        allowed_ips=req.allowed_ips or ["0.0.0.0/0", "::/0"],
        permissions=["*"],
        is_active=True,
    )
    db.add(new_key)
    await db.flush()
    await db.refresh(new_key)

    logger.info("API key created successfully", user_id=user.id, key_id=new_key.id, tier=tier)

    return {
        "id": new_key.id,
        "key": raw_key,  # Returned only once upon creation
        "prefix": new_key.prefix,
        "name": new_key.name,
        "label": new_key.name,
        "tier": new_key.tier,
        "environment": new_key.environment,
        "created_at": new_key.created_at,
    }


# ── GET /api/keys ─────────────────────────────────────────────────────────────

@router.get("")
async def list_api_keys(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    """List all active API keys belonging to the authenticated user."""
    stmt = (
        select(APIKey)
        .where(
            APIKey.user_id == user.id,
            APIKey.is_active == True,
            APIKey.revoked_at.is_(None),
        )
        .order_by(APIKey.created_at.desc())
    )
    res = await db.execute(stmt)
    keys = res.scalars().all()

    return [
        {
            "id": k.id,
            "name": k.name,
            "label": k.name,
            "prefix": k.prefix,
            "tier": k.tier,
            "environment": k.environment,
            "allowed_ips": k.allowed_ips,
            "is_active": k.is_active,
            "created_at": k.created_at,
            "last_used": k.last_used,
        }
        for k in keys
    ]


# ── DELETE /api/keys/{key_id} ─────────────────────────────────────────────────

@router.delete("/{key_id}")
async def revoke_api_key(
    key_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    """
    Revoke an API key immediately.
    Takes effect immediately; subsequent requests with this key will fail with 401.
    """
    stmt = select(APIKey).where(
        APIKey.id == key_id,
        (APIKey.user_id == user.id) | (user.is_admin == True),
    )
    res = await db.execute(stmt)
    key_record = res.scalar_one_or_none()

    if not key_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "key_not_found", "message": "API key not found or already revoked."},
        )

    key_record.is_active = False
    key_record.revoked_at = datetime.now(timezone.utc)
    db.add(key_record)
    await db.flush()

    logger.warning("API key revoked", key_id=key_id, user_id=user.id)

    return {
        "message": "API key revoked successfully",
        "key_id": key_id,
        "revoked_at": key_record.revoked_at,
    }
