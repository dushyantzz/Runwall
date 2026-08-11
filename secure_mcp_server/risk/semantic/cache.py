"""
Semantic Risk Layer — Classification Result Cache.

Caches Sarvam API classification results keyed by SHA-256 hash of
normalised content.  Primary purpose: **cost control** for repeated agent
loop calls — identical tool-call arguments are common in agent loops, and
each uncached call costs Sarvam credits.

The backing store is an in-memory dict now; the ``CacheProtocol`` interface
allows swapping to Redis or another store without touching the classifier.
"""

from __future__ import annotations

import hashlib
import time
from typing import Dict, Optional, Tuple

from .interfaces import CacheProtocol
from .models import ClassificationResult


class InMemorySemanticCache(CacheProtocol):
    """In-memory TTL cache for classification results.

    Parameters
    ----------
    ttl_seconds:
        Time-to-live for cached entries in seconds.  Default: 86400 (24h).
        Identical tool-call arguments are common in agent loops, so a
        long TTL is appropriate.  This is a cost-control decision, not
        just a performance one.
    max_entries:
        Maximum number of cached entries.  When exceeded, the oldest
        entries are evicted (simple LRU-ish behavior).
    """

    def __init__(
        self,
        ttl_seconds: float = 86400.0,
        max_entries: int = 10_000,
    ) -> None:
        self._ttl = ttl_seconds
        self._max_entries = max_entries
        # key: content hash → value: (ClassificationResult, timestamp)
        self._store: Dict[str, Tuple[ClassificationResult, float]] = {}

    # ------------------------------------------------------------------
    # CacheProtocol implementation
    # ------------------------------------------------------------------

    async def get(self, content: str) -> Optional[ClassificationResult]:
        """Retrieve a cached classification result.

        Returns None on cache miss or if the entry has expired.
        """
        key = self._hash_content(content)
        entry = self._store.get(key)

        if entry is None:
            return None

        result, timestamp = entry
        if time.time() - timestamp > self._ttl:
            # Expired — remove and return miss
            del self._store[key]
            return None

        # Return a copy marked as cached
        return result.model_copy(update={"cached": True})

    async def put(self, content: str, result: ClassificationResult) -> None:
        """Store a classification result in the cache.

        Evicts oldest entries if the cache exceeds ``max_entries``.
        """
        # Don't cache degraded results — they're fallbacks, not real classifications
        if result.degraded:
            return

        key = self._hash_content(content)
        self._store[key] = (result, time.time())

        # Evict oldest entries if over limit
        if len(self._store) > self._max_entries:
            self._evict_oldest()

    # ------------------------------------------------------------------
    # Cache management
    # ------------------------------------------------------------------

    @property
    def size(self) -> int:
        """Current number of entries in the cache."""
        return len(self._store)

    async def clear(self) -> None:
        """Clear all cached entries."""
        self._store.clear()

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    @staticmethod
    def _hash_content(content: str) -> str:
        """SHA-256 hash of normalised content for cache key."""
        normalised = content.strip().lower()
        return hashlib.sha256(normalised.encode("utf-8")).hexdigest()

    def _evict_oldest(self) -> None:
        """Evict the oldest 10% of entries when cache is full."""
        if not self._store:
            return
        evict_count = max(1, len(self._store) // 10)
        sorted_keys = sorted(
            self._store.keys(),
            key=lambda k: self._store[k][1],  # Sort by timestamp
        )
        for key in sorted_keys[:evict_count]:
            del self._store[key]
