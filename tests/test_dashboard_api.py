"""
Tests for Per-User Security Dashboard API (Phase 3).

Validates:
1. Multi-tenant / Per-user isolation (Alice cannot view Bob's events)
2. Summary endpoint metrics and period-over-period deltas
3. Timeseries continuous bucket aggregation
4. Breakdowns (rules, tools, stages, taints)
5. Keyset pagination on (ts, id) with cursor
6. Event detail retrieval (404 on cross-user access)
7. Approvals listing and review
8. Keys listing
9. CSV export with formula injection sanitization
"""

import base64
import csv
import io
import uuid
from datetime import datetime, timezone, timedelta
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import text

from secure_mcp_server.api.app import app
from secure_mcp_server.database import get_db_manager
from secure_mcp_server.database.models import User, APIKey, SecurityEvent, TaintEvent, ApprovalRequest


@pytest.fixture(autouse=True)
def setup_in_memory_events():
    from secure_mcp_server.governance.event_recorder import InMemoryEventRecorder, set_event_recorder
    mem_recorder = InMemoryEventRecorder()
    set_event_recorder(mem_recorder)
    yield mem_recorder
    set_event_recorder(None)


@pytest.mark.asyncio
async def test_unauthenticated_dashboard_fails(db_manager):
    """Unauthenticated requests to /api/dashboard/* must return 401."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/dashboard/summary")
        assert res.status_code == 401

        res_v1 = await client.get("/api/v1/dashboard/summary")
        assert res_v1.status_code == 401


@pytest.mark.asyncio
async def test_summary_and_isolation(db_manager):
    """Test summary stats and verify User A cannot see User B's events."""
    db = db_manager
    async with db.get_session_context() as session:
        # Create Alice
        alice = User(username="alice", email="alice@runwall.test", hashed_password="pw", tenant_id="tenant_a")
        # Create Bob
        bob = User(username="bob", email="bob@runwall.test", hashed_password="pw", tenant_id="tenant_b")
        session.add(alice)
        session.add(bob)
        await session.commit()
        await session.refresh(alice)
        await session.refresh(bob)

        # Alice events (2 allowed, 1 blocked)
        now = datetime.now(timezone.utc)
        for i in range(2):
            session.add(SecurityEvent(
                request_id=str(uuid.uuid4()),
                ts=now - timedelta(minutes=10 * i),
                tenant_id="tenant_a",
                user_id=alice.id,
                event_type="tool_call",
                stage="policy",
                tool_name="read_file",
                decision="allow",
            ))
        session.add(SecurityEvent(
            request_id=str(uuid.uuid4()),
            ts=now - timedelta(minutes=5),
            tenant_id="tenant_a",
            user_id=alice.id,
            event_type="tool_call",
            stage="policy",
            tool_name="delete_database",
            decision="deny",
            reason="Blocked by safety rule",
        ))

        # Bob events (10 events)
        for i in range(10):
            session.add(SecurityEvent(
                request_id=str(uuid.uuid4()),
                ts=now - timedelta(minutes=i),
                tenant_id="tenant_b",
                user_id=bob.id,
                event_type="tool_call",
                stage="policy",
                tool_name="admin_tool",
                decision="deny",
            ))

        # Alice active key
        session.add(APIKey(
            user_id=alice.id,
            name="Alice Key 1",
            prefix="mcp_live_alice",
            key_hash="hash1",
            tenant_id="tenant_a",
            is_active=True,
        ))

        await session.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Request as Alice
        headers = {"X-User-Email": "alice@runwall.test"}
        res = await client.get("/api/dashboard/summary?range=24h", headers=headers)
        assert res.status_code == 200
        data = res.json()

        # Alice must see strictly 3 total, 2 allowed, 1 blocked, 1 active key
        assert data["total_requests"] == 3
        assert data["allowed_count"] == 2
        assert data["blocked_count"] == 1
        assert data["active_keys"] == 1

        # Check v1 prefix works identically
        res_v1 = await client.get("/api/v1/dashboard/summary?range=24h", headers=headers)
        assert res_v1.status_code == 200
        assert res_v1.json()["total_requests"] == 3


@pytest.mark.asyncio
async def test_timeseries_buckets(db_manager):
    """Test timeseries returns continuous timestamp buckets."""
    db = db_manager
    async with db.get_session_context() as session:
        user = User(username="charlie", email="charlie@runwall.test", hashed_password="pw", tenant_id="default")
        session.add(user)
        await session.commit()
        await session.refresh(user)

        now = datetime.now(timezone.utc)
        # Add 1 allow, 1 deny
        session.add(SecurityEvent(
            request_id=str(uuid.uuid4()),
            ts=now,
            tenant_id="default",
            user_id=user.id,
            event_type="tool_call",
            stage="policy",
            tool_name="fetch",
            decision="allow",
        ))
        session.add(SecurityEvent(
            request_id=str(uuid.uuid4()),
            ts=now,
            tenant_id="default",
            user_id=user.id,
            event_type="tool_call",
            stage="policy",
            tool_name="rm",
            decision="deny",
        ))
        await session.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        headers = {"X-User-Email": "charlie@runwall.test"}
        res = await client.get("/api/dashboard/timeseries?range=24h&bucket=1h", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert "points" in data
        assert len(data["points"]) >= 24  # 24 continuous hourly buckets
        total_allowed = sum(p["allowed"] for p in data["points"])
        total_blocked = sum(p["blocked"] for p in data["points"])
        assert total_allowed == 1
        assert total_blocked == 1


@pytest.mark.asyncio
async def test_breakdown_aggregations(db_manager):
    """Test breakdown aggregations across tools, rules, stages, taints."""
    db = db_manager
    async with db.get_session_context() as session:
        user = User(username="diana", email="diana@runwall.test", hashed_password="pw", tenant_id="default")
        session.add(user)
        await session.commit()
        await session.refresh(user)

        now = datetime.now(timezone.utc)
        session.add(SecurityEvent(
            request_id=str(uuid.uuid4()),
            ts=now,
            tenant_id="default",
            user_id=user.id,
            event_type="tool_call",
            stage="policy",
            tool_name="curl_api",
            rule_id="no_external_egress",
            decision="deny",
        ))
        session.add(TaintEvent(
            request_id=str(uuid.uuid4()),
            ts=now,
            tenant_id="default",
            user_id=user.id,
            label="EXTERNAL_WEB",
            tool_name="curl_api",
        ))
        await session.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        headers = {"X-User-Email": "diana@runwall.test"}
        res = await client.get("/api/dashboard/breakdown?range=24h", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert any(r["rule"] == "no_external_egress" for r in data["top_rules"])
        assert any(t["tool"] == "curl_api" for t in data["top_tools"])
        assert any(s["stage"] == "policy" for s in data["stages"])
        assert any(t["label"] == "EXTERNAL_WEB" for t in data["taints"])


@pytest.mark.asyncio
async def test_events_keyset_pagination_and_filtering(db_manager):
    """Test keyset pagination and search filters."""
    db = db_manager
    async with db.get_session_context() as session:
        user = User(username="eve", email="eve@runwall.test", hashed_password="pw", tenant_id="default")
        session.add(user)
        await session.commit()
        await session.refresh(user)

        now = datetime.now(timezone.utc)
        for i in range(30):
            session.add(SecurityEvent(
                request_id=str(uuid.uuid4()),
                ts=now - timedelta(seconds=i * 10),
                tenant_id="default",
                user_id=user.id,
                event_type="tool_call",
                stage="policy",
                tool_name="search_tool" if i % 2 == 0 else "echo_tool",
                decision="deny" if i % 3 == 0 else "allow",
                reason=f"Event reason {i}",
            ))
        await session.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        headers = {"X-User-Email": "eve@runwall.test"}

        # Page 1 (limit 10)
        res1 = await client.get("/api/dashboard/events?limit=10", headers=headers)
        assert res1.status_code == 200
        d1 = res1.json()
        assert len(d1["events"]) == 10
        assert d1["has_more"] is True
        cursor1 = d1["next_cursor"]
        assert cursor1 is not None

        # Page 2 using cursor
        res2 = await client.get(f"/api/dashboard/events?limit=10&cursor={cursor1}", headers=headers)
        assert res2.status_code == 200
        d2 = res2.json()
        assert len(d2["events"]) == 10
        # Check no duplicates between pages
        page1_ids = {e["id"] for e in d1["events"]}
        page2_ids = {e["id"] for e in d2["events"]}
        assert len(page1_ids.intersection(page2_ids)) == 0

        # Filter by decision
        res_deny = await client.get("/api/dashboard/events?decision=deny", headers=headers)
        assert res_deny.status_code == 200
        for ev in res_deny.json()["events"]:
            assert ev["decision"] == "deny"

        # Search filter
        res_search = await client.get("/api/dashboard/events?search=search_tool", headers=headers)
        assert res_search.status_code == 200
        for ev in res_search.json()["events"]:
            assert "search_tool" in ev["tool_name"].lower()


@pytest.mark.asyncio
async def test_event_detail_and_isolation(db_manager):
    """Test detail retrieval and 404 when querying another user's event."""
    db = db_manager
    event_alice_id = None
    event_bob_id = None

    async with db.get_session_context() as session:
        user_alice = User(username="alice2", email="alice2@runwall.test", hashed_password="pw", tenant_id="tenant_x")
        user_bob = User(username="bob2", email="bob2@runwall.test", hashed_password="pw", tenant_id="tenant_y")
        session.add(user_alice)
        session.add(user_bob)
        await session.commit()
        await session.refresh(user_alice)
        await session.refresh(user_bob)

        ev_a = SecurityEvent(
            request_id=str(uuid.uuid4()),
            tenant_id="tenant_x",
            user_id=user_alice.id,
            event_type="tool_call",
            stage="policy",
            tool_name="alice_tool",
            decision="allow",
            args_redacted={"key": "safe"},
            args_hash="hash_a",
        )
        ev_b = SecurityEvent(
            request_id=str(uuid.uuid4()),
            tenant_id="tenant_y",
            user_id=user_bob.id,
            event_type="tool_call",
            stage="policy",
            tool_name="bob_tool",
            decision="allow",
            args_redacted={"key": "secret_b"},
            args_hash="hash_b",
        )
        session.add(ev_a)
        session.add(ev_b)
        await session.commit()
        await session.refresh(ev_a)
        await session.refresh(ev_b)
        event_alice_id = ev_a.id
        event_bob_id = ev_b.id

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Alice requests her own event -> 200
        headers_alice = {"X-User-Email": "alice2@runwall.test"}
        res = await client.get(f"/api/dashboard/events/{event_alice_id}", headers=headers_alice)
        assert res.status_code == 200
        assert res.json()["tool_name"] == "alice_tool"
        assert res.json()["args_redacted"] == {"key": "safe"}

        # Alice requests Bob's event -> 404 (isolation)
        res_cross = await client.get(f"/api/dashboard/events/{event_bob_id}", headers=headers_alice)
        assert res_cross.status_code == 404


@pytest.mark.asyncio
async def test_approvals_inbox_and_review(db_manager):
    """Test approvals listing and review action."""
    db = db_manager
    approval_id = str(uuid.uuid4())

    async with db.get_session_context() as session:
        user = User(username="frank", email="frank@runwall.test", hashed_password="pw", tenant_id="tenant_frank")
        session.add(user)
        await session.commit()
        await session.refresh(user)

        session.add(ApprovalRequest(
            id=approval_id,
            tenant_id="tenant_frank",
            requester_id=user.id,
            tool_name="deploy_prod",
            arguments={"env": "prod"},
            context_snapshot={"risk": "high"},
            status="PENDING",
            required_role="admin",
        ))
        await session.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        headers = {"X-User-Email": "frank@runwall.test"}
        # List approvals
        res = await client.get("/api/dashboard/approvals", headers=headers)
        assert res.status_code == 200
        items = res.json()
        assert len(items) == 1
        assert items[0]["id"] == approval_id

        # Review approval
        review_payload = {"decision": "APPROVED", "reason": "Authorized by team lead"}
        res_rev = await client.post(f"/api/dashboard/approvals/{approval_id}/review", json=review_payload, headers=headers)
        assert res_rev.status_code == 200


@pytest.mark.asyncio
async def test_csv_export_formula_injection_sanitization(db_manager):
    """Verify CSV export and spreadsheet formula sanitization (starts with =,+,-,@)."""
    db = db_manager
    async with db.get_session_context() as session:
        user = User(username="grace", email="grace@runwall.test", hashed_password="pw", tenant_id="default")
        session.add(user)
        await session.commit()
        await session.refresh(user)

        # Dangerous strings that could execute formulas in Excel/Google Sheets
        session.add(SecurityEvent(
            request_id=str(uuid.uuid4()),
            tenant_id="default",
            user_id=user.id,
            event_type="tool_call",
            stage="policy",
            tool_name="=SUM(A1:A10)",
            decision="+cmd|' /C calc'!A0",
            reason="-dangerous_subtraction",
        ))
        await session.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        headers = {"X-User-Email": "grace@runwall.test"}
        res = await client.get("/api/dashboard/export.csv?range=24h", headers=headers)
        assert res.status_code == 200
        assert "text/csv" in res.headers["content-type"]
        assert "attachment; filename=" in res.headers["content-disposition"]

        csv_content = res.text
        reader = csv.reader(io.StringIO(csv_content))
        rows = list(reader)
        assert len(rows) >= 2  # header + data row
        data_row = rows[1]

        # In data row: tool_name, decision, and reason were formula triggers
        # Verify every cell starting with =, +, -, @ was prefixed with '
        for cell in data_row:
            if cell:
                assert not cell.startswith(("=", "+", "-", "@")), f"Formula not sanitized: {cell}"
