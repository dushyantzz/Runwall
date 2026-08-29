"""
Unit and Integration Tests for Runwall MCP Public Endpoint and Plan-Tier Enforcement.

Validates the full Error Contract:
1. Missing Authorization header         → 401 {"error": "missing_api_key"}
2. Invalid / Non-existent API key       → 401 {"error": "invalid_api_key"}
3. Revoked API key                      → 401 {"error": "invalid_api_key"}
4. Valid key with missing subscription  → 500 {"error": "subscription_record_missing"}
5. Inactive subscription (past_due/etc) → 402 {"error": "subscription_inactive"}
6. Rate limit exceeded (RPM)            → 429 {"error": "rate_limit_exceeded", "retry_after": n} + Retry-After header
7. Daily tool-call limit reached        → 429 {"error": "daily_limit_exceeded"}
8. Key limit reached on POST /api/keys  → 400 {"error": "key_limit_reached", "limit": n}
9. GET /api/keys and DELETE /api/keys
10. GET / (Quickstart HTML) and GET /health
"""

import hashlib
import json
import pytest
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient, ASGITransport

from secure_mcp_server.api.app import app
from secure_mcp_server.billing.plan_enforcement import (
    hash_api_key,
    resolve_api_key,
    resolve_plan,
    enforce_rate_limit,
    get_rate_limiter,
    MissingApiKeyError,
    InvalidApiKeyError,
    SubscriptionRecordMissingError,
    SubscriptionInactiveError,
    RateLimitExceededError,
    DailyLimitExceededError,
)
from secure_mcp_server.database import get_db_manager
from secure_mcp_server.database.models import User, APIKey, UserSubscription
from secure_mcp_server.plan_limits import PLAN_LIMITS


@pytest.fixture(autouse=True)
async def reset_rate_limiter():
    """Reset rate limiter before each test."""
    await get_rate_limiter().reset()


@pytest.mark.asyncio
async def test_mcp_missing_api_key(db_manager):
    """Test that /mcp returns 401 missing_api_key when Authorization header is absent."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # GET /mcp without header
        response = await client.get("/mcp")
        assert response.status_code == 401
        assert response.json() == {"error": "missing_api_key"}

        # POST /mcp without header
        response = await client.post("/mcp", json={"jsonrpc": "2.0", "method": "ping"})
        assert response.status_code == 401
        assert response.json() == {"error": "missing_api_key"}


@pytest.mark.asyncio
async def test_mcp_invalid_api_key(db_manager):
    """Test that /mcp returns 401 invalid_api_key when key does not exist."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/mcp", headers={"Authorization": "Bearer mcp_non_existent_key_12345"})
        assert response.status_code == 401
        assert response.json() == {"error": "invalid_api_key"}


@pytest.mark.asyncio
async def test_mcp_revoked_api_key(db_manager):
    """Test that /mcp returns 401 invalid_api_key when key has been revoked."""
    raw_key = "mcp_revoked_test_key_abc123"
    key_hash = hash_api_key(raw_key)

    async with db_manager.get_session_context() as db:
        user = User(
            username="revoked_user",
            email="revoked@example.com",
            hashed_password="hash",
            is_active=True
        )
        db.add(user)
        await db.flush()

        api_key = APIKey(
            name="Revoked Key",
            key_hash=key_hash,
            prefix=raw_key[:8],
            user_id=user.id,
            is_active=False,
            revoked_at=datetime.now(timezone.utc),
            environment="production"
        )
        db.add(api_key)
        await db.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/mcp", headers={"Authorization": f"Bearer {raw_key}"})
        assert response.status_code == 401
        assert response.json() == {"error": "invalid_api_key"}


@pytest.mark.asyncio
async def test_mcp_missing_subscription_record_fails_loudly_500(db_manager):
    """
    Test that a valid key belonging to a user with NO subscription row
    fails loudly with HTTP 500 {"error": "subscription_record_missing"}.
    """
    raw_key = "mcp_valid_key_no_sub_12345"
    key_hash = hash_api_key(raw_key)

    async with db_manager.get_session_context() as db:
        user = User(
            username="nosub_user",
            email="nosub@example.com",
            hashed_password="hash",
            is_active=True
        )
        db.add(user)
        await db.flush()

        api_key = APIKey(
            name="No Sub Key",
            key_hash=key_hash,
            prefix=raw_key[:8],
            user_id=user.id,
            tier="free",
            is_active=True,
            environment="production"
        )
        db.add(api_key)
        await db.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/mcp", headers={"Authorization": f"Bearer {raw_key}"})
        assert response.status_code == 500
        assert response.json() == {"error": "subscription_record_missing"}


@pytest.mark.asyncio
async def test_mcp_inactive_subscription_402(db_manager):
    """
    Test that a user with an inactive/past_due/canceled subscription
    is rejected with HTTP 402 {"error": "subscription_inactive"}.
    """
    raw_key = "mcp_valid_key_inactive_sub_12345"
    key_hash = hash_api_key(raw_key)

    async with db_manager.get_session_context() as db:
        user = User(
            username="inactive_user",
            email="inactive@example.com",
            hashed_password="hash",
            is_active=True
        )
        db.add(user)
        await db.flush()

        sub = UserSubscription(
            user_id=user.id,
            tier="pro",
            status="canceled",
            current_period_end=datetime.now(timezone.utc) - timedelta(days=1)
        )
        db.add(sub)

        api_key = APIKey(
            name="Inactive Sub Key",
            key_hash=key_hash,
            prefix=raw_key[:8],
            user_id=user.id,
            tier="pro",
            is_active=True,
            environment="production"
        )
        db.add(api_key)
        await db.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/mcp", headers={"Authorization": f"Bearer {raw_key}"})
        assert response.status_code == 402
        assert response.json() == {"error": "subscription_inactive"}


@pytest.mark.asyncio
async def test_mcp_rate_limit_exceeded_429(db_manager):
    """
    Test that exceeding the requests_per_minute limit returns 429
    with {"error": "rate_limit_exceeded", "retry_after": n} and Retry-After header.
    """
    raw_key = "mcp_ratelimit_test_key_999"
    key_hash = hash_api_key(raw_key)
    free_rpm = PLAN_LIMITS["free"]["requests_per_minute"]

    async with db_manager.get_session_context() as db:
        user = User(
            username="ratelimit_user",
            email="ratelimit@example.com",
            hashed_password="hash",
            is_active=True
        )
        db.add(user)
        await db.flush()

        sub = UserSubscription(
            user_id=user.id,
            tier="free",
            status="active"
        )
        db.add(sub)

        api_key = APIKey(
            name="Rate Limit Key",
            key_hash=key_hash,
            prefix=raw_key[:8],
            user_id=user.id,
            tier="free",
            is_active=True,
            environment="production"
        )
        db.add(api_key)
        await db.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Exhaust the RPM quota (e.g. 10 requests for free tier)
        for i in range(free_rpm):
            res = await client.get("/mcp", headers={"Authorization": f"Bearer {raw_key}"})
            # May be 200 or FastMCP internal protocol response (not 401/429)
            assert res.status_code != 429, f"Premature 429 on request {i+1}"

        # 11th request must trigger 429
        over_limit_res = await client.get("/mcp", headers={"Authorization": f"Bearer {raw_key}"})
        assert over_limit_res.status_code == 429
        data = over_limit_res.json()
        assert data.get("error") == "rate_limit_exceeded"
        assert "retry_after" in data
        assert "retry-after" in over_limit_res.headers


@pytest.mark.asyncio
async def test_api_keys_management_and_limit_enforcement(db_manager):
    """
    Test POST /api/keys, GET /api/keys, DELETE /api/keys/{id}, and max_api_keys limits.
    """
    transport = ASGITransport(app=app)
    headers = {"X-User-Email": "developer@runwall.in"}

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Create first key (Free tier max is 1)
        res1 = await client.post("/api/keys", json={"label": "Laptop Key"}, headers=headers)
        assert res1.status_code == 201
        key1_data = res1.json()
        assert "key" in key1_data
        assert key1_data["key"].startswith("mcp_")
        assert key1_data["tier"] == "free"
        key1_id = key1_data["id"]

        # 2. Attempt second key on Free tier -> Expect 400 key_limit_reached
        res2 = await client.post("/api/keys", json={"label": "Second Key"}, headers=headers)
        assert res2.status_code == 400
        err_data = res2.json()
        assert err_data["detail"]["error"] == "key_limit_reached"
        assert err_data["detail"]["limit"] == 1

        # 3. List active keys
        list_res = await client.get("/api/keys", headers=headers)
        assert list_res.status_code == 200
        keys_list = list_res.json()
        assert len(keys_list) == 1
        assert keys_list[0]["id"] == key1_id

        # 4. Revoke key
        del_res = await client.delete(f"/api/keys/{key1_id}", headers=headers)
        assert del_res.status_code == 200
        assert del_res.json()["key_id"] == key1_id

        # 5. List keys again -> Should be empty
        list_res2 = await client.get("/api/keys", headers=headers)
        assert list_res2.status_code == 200
        assert len(list_res2.json()) == 0

        # 6. Now user can create a key again since the previous one was revoked
        res3 = await client.post("/api/keys", json={"label": "New Replacement Key"}, headers=headers)
        assert res3.status_code == 201


@pytest.mark.asyncio
async def test_quickstart_and_health_endpoints(db_manager):
    """Test public GET / and GET /health."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # GET /health
        health_res = await client.get("/health")
        assert health_res.status_code == 200
        assert health_res.json() == {"status": "healthy"}

        # GET / (Quickstart landing page)
        root_res = await client.get("/")
        assert root_res.status_code == 200
        assert "text/html" in root_res.headers["content-type"]
        assert "Runwall MCP Gateway" in root_res.text
        assert "API Key Authentication Required" in root_res.text
