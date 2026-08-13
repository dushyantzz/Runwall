"""Tests for the semantic risk cache — TTL, hit/miss, eviction."""

import time
from unittest.mock import patch

import pytest

from secure_mcp_server.risk.semantic.cache import InMemorySemanticCache
from secure_mcp_server.risk.semantic.models import ClassificationResult


def _make_result(risk_score: float = 0.5, degraded: bool = False) -> ClassificationResult:
    return ClassificationResult(
        risk_score=risk_score,
        reasoning="Test reasoning",
        model_used="sarvam-105b",
        tokens_used=100,
        degraded=degraded,
    )


class TestCacheHitMiss:
    @pytest.mark.asyncio
    async def test_cache_miss_returns_none(self):
        cache = InMemorySemanticCache()
        result = await cache.get("never cached this")
        assert result is None

    @pytest.mark.asyncio
    async def test_cache_hit_returns_result(self):
        cache = InMemorySemanticCache()
        original = _make_result(risk_score=0.7)

        await cache.put("test content", original)
        cached = await cache.get("test content")

        assert cached is not None
        assert cached.risk_score == 0.7
        assert cached.cached is True

    @pytest.mark.asyncio
    async def test_different_content_different_keys(self):
        cache = InMemorySemanticCache()
        await cache.put("content A", _make_result(risk_score=0.3))
        await cache.put("content B", _make_result(risk_score=0.8))

        a = await cache.get("content A")
        b = await cache.get("content B")

        assert a.risk_score == 0.3
        assert b.risk_score == 0.8


class TestContentNormalization:
    @pytest.mark.asyncio
    async def test_case_insensitive_hit(self):
        """Cache key should normalise case."""
        cache = InMemorySemanticCache()
        await cache.put("Hello World", _make_result(risk_score=0.4))
        result = await cache.get("hello world")
        assert result is not None
        assert result.risk_score == 0.4

    @pytest.mark.asyncio
    async def test_whitespace_normalized(self):
        """Leading/trailing whitespace should be stripped for cache key."""
        cache = InMemorySemanticCache()
        await cache.put("  test  ", _make_result(risk_score=0.6))
        result = await cache.get("test")
        assert result is not None
        assert result.risk_score == 0.6


class TestTTLExpiry:
    @pytest.mark.asyncio
    async def test_expired_entry_returns_none(self):
        cache = InMemorySemanticCache(ttl_seconds=1.0)
        await cache.put("test", _make_result())

        # Simulate time passing
        with patch("secure_mcp_server.risk.semantic.cache.time") as mock_time:
            # put was called with real time, but get checks with future time
            mock_time.time.return_value = time.time() + 2.0
            result = await cache.get("test")
        assert result is None

    @pytest.mark.asyncio
    async def test_non_expired_entry_returns_result(self):
        cache = InMemorySemanticCache(ttl_seconds=3600.0)
        await cache.put("test", _make_result(risk_score=0.5))

        result = await cache.get("test")
        assert result is not None
        assert result.risk_score == 0.5


class TestDegradedResults:
    @pytest.mark.asyncio
    async def test_degraded_results_not_cached(self):
        """Degraded (fallback) results should NOT be cached."""
        cache = InMemorySemanticCache()
        degraded = _make_result(degraded=True)

        await cache.put("test", degraded)
        result = await cache.get("test")

        assert result is None
        assert cache.size == 0


class TestEviction:
    @pytest.mark.asyncio
    async def test_eviction_when_over_max(self):
        cache = InMemorySemanticCache(max_entries=5)

        for i in range(10):
            await cache.put(f"content-{i}", _make_result(risk_score=i * 0.1))

        assert cache.size <= 5

    @pytest.mark.asyncio
    async def test_clear(self):
        cache = InMemorySemanticCache()
        await cache.put("a", _make_result())
        await cache.put("b", _make_result())

        await cache.clear()
        assert cache.size == 0
