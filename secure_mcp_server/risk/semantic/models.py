"""
Semantic Risk Layer — Data Models.

Pure data shapes with zero I/O, zero network calls, zero business logic.
These are the value objects shared across the entire semantic risk module.
"""

from __future__ import annotations

from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class ScriptType(str, Enum):
    """Detected script family in the content."""

    LATIN = "latin"
    DEVANAGARI = "devanagari"
    MIXED = "mixed"
    OTHER = "other"


class LanguageProfile(BaseModel):
    """Result of language/script detection on tool-call content."""

    script: ScriptType = Field(
        ..., description="Dominant script family detected"
    )
    is_latin_only: bool = Field(
        ...,
        description=(
            "True when the content is unambiguously Latin-script English. "
            "When True, the Sarvam API call is skipped entirely."
        ),
    )
    confidence: float = Field(
        default=1.0,
        ge=0.0,
        le=1.0,
        description="Detector confidence in the classification",
    )
    detected_tokens: List[str] = Field(
        default_factory=list,
        description="Hinglish/transliterated tokens that triggered non-Latin detection",
    )


class ClassificationResult(BaseModel):
    """Result returned by the semantic risk classifier (Sarvam or any swapped provider)."""

    risk_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Semantic risk score (0 = benign, 1 = maximum risk)",
    )
    reasoning: str = Field(
        default="",
        description="Human-readable explanation of why this score was assigned",
    )
    flagged_patterns: List[str] = Field(
        default_factory=list,
        description="Specific patterns or phrases that contributed to the score",
    )
    model_used: str = Field(
        default="",
        description="Model identifier that produced this classification",
    )
    tokens_used: int = Field(
        default=0,
        ge=0,
        description="Total tokens consumed by this classification call",
    )
    degraded: bool = Field(
        default=False,
        description=(
            "True when the result is a fallback due to an error "
            "(Sarvam down, budget exhausted, malformed response). "
            "The fusion layer uses this flag to decide fail-open vs fail-closed."
        ),
    )
    degraded_reason: str = Field(
        default="",
        description="Why the result is degraded (empty when degraded=False)",
    )
    cached: bool = Field(
        default=False,
        description="True when this result was served from cache (no API call made)",
    )


class RiskSignalSource(str, Enum):
    """Origin of a risk signal fed into the fusion layer."""

    STRUCTURAL = "structural"
    SEMANTIC = "semantic"


class RiskSignal(BaseModel):
    """A single risk signal to be fused into the final risk score."""

    source: RiskSignalSource = Field(
        ..., description='Origin: "structural" (OPA) or "semantic" (Sarvam)'
    )
    score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Risk score from this source",
    )
    weight: float = Field(
        default=1.0,
        ge=0.0,
        le=1.0,
        description="Config-driven weight for this signal in the fusion formula",
    )
    degraded: bool = Field(
        default=False,
        description="True when the signal is from a degraded/fallback source",
    )
