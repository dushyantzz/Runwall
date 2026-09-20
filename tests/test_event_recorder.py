"""
Unit & Integration Tests for EventRecorder, Secret Redaction, and Event Capture.
"""

import asyncio
import os
import uuid
import pytest
from datetime import datetime, timezone

from secure_mcp_server.governance.redaction import redact, redact_string, compute_args_hash
from secure_mcp_server.governance.event_recorder import (
    InMemoryEventRecorder,
    PostgresEventRecorder,
    SecurityEventPayload,
    TaintEventPayload,
    get_event_recorder,
    set_event_recorder,
    _sanitize_ip,
    _ensure_uuid,
)


class TestSecretRedaction:
    """Tests for recursive secret scrub and argument hashing."""

    def test_sensitive_keys_redacted(self):
        payload = {
            "username": "alice",
            "password": "super_secret_password_123",
            "api_key": "sk-12345678901234567890",
            "nested": {
                "auth_token": "secret_token_val",
                "normal_field": "safe_value",
            },
        }
        cleaned = redact(payload)
        assert cleaned["username"] == "alice"
        assert cleaned["password"] == "***REDACTED***"
        assert cleaned["api_key"] == "***REDACTED***"
        assert cleaned["nested"]["auth_token"] == "***REDACTED***"
        assert cleaned["nested"]["normal_field"] == "safe_value"

    def test_pattern_replacements_in_values(self):
        # Bearer token
        assert "Bearer [REDACTED]" in redact_string("Authorization: Bearer my-secret-jwt-token-val")
        # OpenAI key
        assert "[REDACTED_OPENAI_KEY]" in redact_string("key is sk-abcdefghijklmnopqrstuvwxyz12345")
        # AWS key
        assert "[REDACTED_AWS_KEY]" in redact_string("AWS: AKIAIOSFODNN7EXAMPLE")
        # JWT
        jwt_sample = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.doNotLeakThisSignature"
        assert "[REDACTED_JWT]" in redact_string(f"My token is {jwt_sample}")
        # Connection string
        conn = "postgresql://myuser:mypassword123@db.supabase.co:5432/postgres"
        redacted_conn = redact_string(conn)
        assert "mypassword123" not in redacted_conn
        assert "[REDACTED_CREDENTIALS]" in redacted_conn

    def test_payload_length_caps(self):
        # Value length truncation
        long_val = "A" * 3000
        redacted = redact_string(long_val, max_len=100)
        assert len(redacted) < 200
        assert "...[TRUNCATED]" in redacted

        # Total payload size cap
        huge_dict = {f"k_{i}": "x" * 200 for i in range(150)}
        cleaned = redact(huge_dict, max_total_len=500)
        assert cleaned.get("_payload_truncated") is True
        assert "...[OVERSIZED_PAYLOAD_TRUNCATED]" in cleaned.get("preview", "")

    def test_compute_args_hash_deterministic(self):
        args1 = {"a": 1, "b": "hello"}
        args2 = {"b": "hello", "a": 1}  # Different key ordering
        hash1 = compute_args_hash(args1, server_key="test_key")
        hash2 = compute_args_hash(args2, server_key="test_key")
        assert hash1 == hash2
        assert len(hash1) == 64  # SHA256 hex


class TestEventRecorderHelpers:
    """Tests for sanitization and helper utilities in event recorder."""

    def test_sanitize_ip(self):
        assert _sanitize_ip("192.168.1.1") == "192.168.1.1"
        assert _sanitize_ip("10.0.0.1:8080") == "10.0.0.1"
        assert _sanitize_ip("2001:db8::1") == "2001:db8::1"
        assert _sanitize_ip("invalid_ip") is None
        assert _sanitize_ip("") is None
        assert _sanitize_ip(None) is None

    def test_ensure_uuid(self):
        valid = str(uuid.uuid4())
        assert _ensure_uuid(valid) == valid
        generated = _ensure_uuid(None)
        assert uuid.UUID(generated)  # does not raise
        non_uuid = _ensure_uuid("some-arbitrary-request-id")
        assert uuid.UUID(non_uuid)  # uuid5 generated deterministically


class TestInMemoryEventRecorder:
    """Tests for test double in-memory event recorder."""

    @pytest.mark.asyncio
    async def test_record_and_clear(self):
        recorder = InMemoryEventRecorder()
        event = SecurityEventPayload(
            request_id=str(uuid.uuid4()),
            tenant_id="test_tenant",
            event_type="tool_call",
            stage="policy",
            decision="allow",
            tool_name="echo",
        )
        taint = TaintEventPayload(
            tenant_id="test_tenant",
            label="EXTERNAL_WEB",
            tool_name="fetch_webpage",
        )

        assert await recorder.record_event(event) is True
        assert await recorder.record_taint(taint) is True
        assert len(recorder.events) == 1
        assert len(recorder.taints) == 1
        assert recorder.events[0].tool_name == "echo"
        assert recorder.taints[0].label == "EXTERNAL_WEB"

        recorder.clear()
        assert len(recorder.events) == 0
        assert len(recorder.taints) == 0


class TestPostgresEventRecorderUnauthRateLimit:
    """Tests for unauthenticated event flood rate-limiting."""

    def test_rate_limit_unauthenticated(self):
        recorder = PostgresEventRecorder()
        ip = "198.51.100.25"
        # First 30 calls should pass
        for _ in range(30):
            assert recorder._should_rate_limit_unauthenticated(ip) is False
        # 31st call should be rate-limited
        assert recorder._should_rate_limit_unauthenticated(ip) is True


class TestPipelineEventCapture:
    """Tests verifying pipeline components record events through EventRecorder."""

    @pytest.mark.asyncio
    async def test_opa_evaluator_emits_security_event(self):
        from secure_mcp_server.governance.opa_evaluator import OPAPolicyEvaluator
        from secure_mcp_server.governance.intent_types import (
            IntentClassification, IntentCategory, RiskScore, RiskLevel, PolicyDecisionType
        )
        from unittest.mock import patch, MagicMock

        mem_recorder = InMemoryEventRecorder()
        set_event_recorder(mem_recorder)

        evaluator = OPAPolicyEvaluator(policy_dir="secure_mcp_server/policies")
        intent = IntentClassification(
            tool_name="test_tool",
            intent_category=IntentCategory.READ,
            confidence=1.0,
            taint_labels=["EXTERNAL_WEB"],
        )
        risk = RiskScore(score=0.2, level=RiskLevel.LOW)
        user_ctx = {
            "tenant_id": "test_tenant",
            "user_id": 101,
            "session_id": "sess-xyz",
            "client_ip": "1.2.3.4",
            "user_agent": "TestAgent/1.0",
        }
        args = {"query": "SELECT 1", "api_key": "sk-secret1234567890123456"}

        mock_session = MagicMock()
        mock_session.add = lambda x: None
        async def _async_nop(*args, **kwargs): return None
        mock_session.commit = _async_nop
        mock_session.refresh = _async_nop
        mock_session.execute = _async_nop

        class _MockDb:
            def get_session_context(self):
                class _Ctx:
                    async def __aenter__(self): return mock_session
                    async def __aexit__(self, *a): return False
                return _Ctx()

        with patch("secure_mcp_server.governance.opa_evaluator.get_db_manager", return_value=_MockDb()):
            with patch("asyncio.create_subprocess_exec", side_effect=FileNotFoundError("no opa")):
                result = await evaluator.evaluate(
                    intent=intent,
                    risk=risk,
                    user_context=user_ctx,
                    arguments=args,
                )

        assert result.decision == PolicyDecisionType.ALLOW
        assert len(mem_recorder.events) == 1
        ev = mem_recorder.events[0]
        assert ev.tenant_id == "test_tenant"
        assert ev.user_id == 101
        assert ev.tool_name == "test_tool"
        assert ev.stage == "policy"
        assert ev.decision == "allow"
        assert ev.args_redacted["api_key"] == "***REDACTED***"
        assert ev.args_hash is not None
        assert "EXTERNAL_WEB" in ev.taint_labels

        set_event_recorder(None)

    @pytest.mark.asyncio
    async def test_auth_middleware_emits_auth_failure_event(self):
        from secure_mcp_server.api.app import MCPAuthASGIMiddleware

        mem_recorder = InMemoryEventRecorder()
        set_event_recorder(mem_recorder)

        # Mock inner ASGI app
        async def mock_app(scope, receive, send):
            pass

        middleware = MCPAuthASGIMiddleware(mock_app)

        sent_messages = []
        async def mock_send(msg):
            sent_messages.append(msg)

        async def mock_receive():
            return {"type": "http.request"}

        # Missing token on /mcp path
        scope = {
            "type": "http",
            "path": "/mcp",
            "headers": [(b"user-agent", b"TestClient/2.0")],
            "client": ("10.0.0.99", 54321),
            "query_string": b"",
        }

        await middleware(scope, mock_receive, mock_send)

        assert sent_messages[0]["status"] == 401
        assert len(mem_recorder.events) == 1
        ev = mem_recorder.events[0]
        assert ev.tenant_id == "_unauthenticated"
        assert ev.stage == "auth"
        assert ev.decision == "deny"
        assert ev.reason == "missing_api_key"
        assert ev.client_ip == "10.0.0.99"
        assert ev.user_agent == "TestClient/2.0"

        set_event_recorder(None)

