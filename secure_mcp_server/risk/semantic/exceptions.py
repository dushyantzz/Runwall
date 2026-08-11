"""
Semantic Risk Layer — Typed Exception Hierarchy.

Every failure path in the semantic risk module raises one of these typed
exceptions.  No bare ``except:`` or silent swallowing anywhere downstream.
"""


class SemanticRiskError(Exception):
    """Base exception for all semantic risk layer errors."""

    def __init__(self, message: str = "Semantic risk layer error") -> None:
        self.message = message
        super().__init__(self.message)


class SarvamAPIError(SemanticRiskError):
    """Raised when the Sarvam API returns a non-transient error (auth, bad request, etc.)."""

    def __init__(
        self,
        message: str = "Sarvam API error",
        status_code: int | None = None,
        response_body: str = "",
    ) -> None:
        self.status_code = status_code
        self.response_body = response_body
        super().__init__(message)


class SarvamTimeoutError(SemanticRiskError):
    """Raised when the Sarvam API call times out after all retries."""

    def __init__(self, message: str = "Sarvam API call timed out") -> None:
        super().__init__(message)


class SarvamRateLimitError(SemanticRiskError):
    """Raised when Sarvam returns HTTP 429 — rate limit exceeded."""

    def __init__(
        self,
        message: str = "Sarvam API rate limit exceeded",
        retry_after: float | None = None,
    ) -> None:
        self.retry_after = retry_after
        super().__init__(message)


class BudgetExhaustedError(SemanticRiskError):
    """Raised when the configured Sarvam credit budget is exhausted.

    Callers must handle this by falling back to structural-only scoring,
    not by crashing the pipeline.
    """

    def __init__(
        self,
        message: str = "Sarvam credit budget exhausted",
        spent_inr: float = 0.0,
        budget_inr: float = 0.0,
    ) -> None:
        self.spent_inr = spent_inr
        self.budget_inr = budget_inr
        super().__init__(message)


class MalformedResponseError(SemanticRiskError):
    """Raised when Sarvam returns a response that cannot be parsed into a valid ClassificationResult."""

    def __init__(
        self,
        message: str = "Malformed response from Sarvam API",
        raw_response: str = "",
    ) -> None:
        self.raw_response = raw_response
        super().__init__(message)
