"""
Semantic Risk Layer — Abstract Contracts.

Defines the interfaces that make the semantic risk module swappable:

- ``RiskClassifierProtocol``: any provider (Sarvam, another LLM, a rule engine)
  that can classify content for semantic risk.
- ``LanguageDetectorProtocol``: any implementation that can detect
  script/language characteristics of content.
- ``CacheProtocol``: any backing store (in-memory, Redis, etc.) for
  caching classification results.
- ``BudgetStorageProtocol``: any durable store for tracking credit spend.

Nothing here imports I/O libraries or contains business logic.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Optional

from .models import ClassificationResult, LanguageProfile


class RiskClassifierProtocol(ABC):
    """Abstract interface for semantic risk classification.

    Any provider that can evaluate tool-call content for prompt-injection,
    policy-evasion, or data-exfiltration risk should implement this.
    The Sarvam client is one such implementation — but the rest of the
    module depends only on this interface, so a different provider can
    be swapped in by implementing this single method.
    """

    @abstractmethod
    async def classify(self, content: str) -> ClassificationResult:
        """Classify the given content for semantic risk.

        Parameters
        ----------
        content:
            The raw tool-call argument content to evaluate.

        Returns
        -------
        ClassificationResult
            Risk score, reasoning, flagged patterns, and metadata.
        """
        ...


class LanguageDetectorProtocol(ABC):
    """Abstract interface for language/script detection.

    Implementations determine whether content contains non-Latin script
    (Devanagari, etc.) or common Hinglish/transliterated tokens.
    This is the cost gate that decides whether the expensive Sarvam API
    call is needed.
    """

    @abstractmethod
    def detect(self, content: str) -> LanguageProfile:
        """Detect the script and language characteristics of the content.

        Parameters
        ----------
        content:
            The raw text to analyse.

        Returns
        -------
        LanguageProfile
            Script type, is_latin_only flag, confidence, and detected tokens.
        """
        ...


class CacheProtocol(ABC):
    """Abstract interface for classification result caching.

    The backing store (in-memory dict now, Redis later) can change
    without touching the classifier by implementing this interface.
    """

    @abstractmethod
    async def get(self, content: str) -> Optional[ClassificationResult]:
        """Retrieve a cached classification result for the given content.

        Parameters
        ----------
        content:
            The raw content string (will be hashed internally for the key).

        Returns
        -------
        ClassificationResult or None
            The cached result, or None on cache miss.
        """
        ...

    @abstractmethod
    async def put(self, content: str, result: ClassificationResult) -> None:
        """Store a classification result in the cache.

        Parameters
        ----------
        content:
            The raw content string (will be hashed internally for the key).
        result:
            The classification result to cache.
        """
        ...


class BudgetStorageProtocol(ABC):
    """Abstract interface for durable budget spend tracking.

    A restart must not reset the budget. Implementations persist the
    running spend (file-backed counter, DB row, Redis key, etc.).
    """

    @abstractmethod
    async def load_spent(self) -> float:
        """Load the current cumulative spend in INR.

        Returns
        -------
        float
            Total INR spent so far.
        """
        ...

    @abstractmethod
    async def save_spent(self, amount_inr: float) -> None:
        """Persist the updated cumulative spend.

        Parameters
        ----------
        amount_inr:
            The new total INR spent.
        """
        ...
