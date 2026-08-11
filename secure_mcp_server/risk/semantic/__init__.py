"""
Indic-Aware Semantic Risk Layer.

Adds a supplementary semantic risk classifier powered by Sarvam AI's Indic
LLM that runs alongside (never instead of) the existing OPA policy engine.
It produces a risk signal that gets fused into the final risk score.

Public API::

    from secure_mcp_server.risk.semantic import (
        SemanticRiskClassifier,
        SemanticRiskConfig,
        RiskFusion,
        LanguageDetector,
        SarvamClient,
        ClassificationResult,
        LanguageProfile,
        RiskSignal,
    )
"""

from .models import ClassificationResult, LanguageProfile, RiskSignal, RiskSignalSource
from .exceptions import (
    SemanticRiskError,
    SarvamAPIError,
    SarvamTimeoutError,
    SarvamRateLimitError,
    BudgetExhaustedError,
    MalformedResponseError,
)
from .language_detector import LanguageDetector
from .sarvam_client import SarvamClient
from .cache import InMemorySemanticCache
from .budget_guard import BudgetGuard, FileBudgetStorage
from .classifier import SemanticRiskClassifier
from .fusion import RiskFusion, FailMode
from .config import SemanticRiskConfig

__all__ = [
    # Core classes
    "SemanticRiskClassifier",
    "SemanticRiskConfig",
    "RiskFusion",
    "FailMode",
    "LanguageDetector",
    "SarvamClient",
    "InMemorySemanticCache",
    "BudgetGuard",
    "FileBudgetStorage",
    # Data models
    "ClassificationResult",
    "LanguageProfile",
    "RiskSignal",
    "RiskSignalSource",
    # Exceptions
    "SemanticRiskError",
    "SarvamAPIError",
    "SarvamTimeoutError",
    "SarvamRateLimitError",
    "BudgetExhaustedError",
    "MalformedResponseError",
]
