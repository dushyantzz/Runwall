"""
Semantic Risk Layer — Budget Guard.

Tracks cumulative credit spend against the configured ₹50,000 budget
(or whatever remaining balance is configured).  Each classification call
carries token usage info that this module converts to an INR cost estimate
and decrements from the running budget.

- At 90% threshold: emits a warning log.
- At 100%: raises ``BudgetExhaustedError`` — callers must handle this by
  falling back to structural-only scoring, not by crashing.

Spend state is persisted to a file so a restart doesn't reset the budget.
The storage backend is injectable via ``BudgetStorageProtocol`` so it can
be swapped to Redis/DB later.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Optional

import structlog

from .exceptions import BudgetExhaustedError
from .interfaces import BudgetStorageProtocol
from .models import ClassificationResult

logger = structlog.get_logger()

# ---------------------------------------------------------------------------
# Cost estimation
# ---------------------------------------------------------------------------
# Sarvam pricing (approximate): ₹0.015 per 1K input tokens, ₹0.06 per 1K output tokens
# For simplicity, we use an average cost per token
_COST_PER_1K_TOKENS_INR = 0.04  # Blended avg across input + output


def estimate_cost_inr(tokens_used: int) -> float:
    """Estimate INR cost for a given number of tokens."""
    return (tokens_used / 1000.0) * _COST_PER_1K_TOKENS_INR


# ---------------------------------------------------------------------------
# File-backed budget storage (default implementation)
# ---------------------------------------------------------------------------

class FileBudgetStorage(BudgetStorageProtocol):
    """Persists budget spend to a JSON file.

    Survives restarts — a process restart doesn't reset the budget.

    Parameters
    ----------
    file_path:
        Path to the budget state file.  Created if it doesn't exist.
    """

    def __init__(self, file_path: str | Path) -> None:
        self._path = Path(file_path)

    async def load_spent(self) -> float:
        if not self._path.exists():
            return 0.0
        try:
            data = json.loads(self._path.read_text(encoding="utf-8"))
            return float(data.get("spent_inr", 0.0))
        except (json.JSONDecodeError, ValueError, KeyError):
            return 0.0

    async def save_spent(self, amount_inr: float) -> None:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        data = {"spent_inr": amount_inr}
        self._path.write_text(json.dumps(data), encoding="utf-8")


# ---------------------------------------------------------------------------
# Budget Guard
# ---------------------------------------------------------------------------

class BudgetGuard:
    """Tracks cumulative Sarvam credit spend against a configured budget.

    Parameters
    ----------
    budget_total_inr:
        Total budget in INR (e.g. 50000.0 for ₹50,000).
    storage:
        Injectable backend for persisting spend state.
    warning_threshold:
        Fraction (0–1) of budget at which to emit a warning (default: 0.90).
    """

    def __init__(
        self,
        budget_total_inr: float = 50_000.0,
        storage: Optional[BudgetStorageProtocol] = None,
        warning_threshold: float = 0.90,
    ) -> None:
        self._budget = budget_total_inr
        self._warning_threshold = warning_threshold
        self._storage = storage
        self._spent: float = 0.0
        self._initialized = False
        self._warning_emitted = False

    async def initialize(self) -> None:
        """Load persisted spend state from storage."""
        if self._storage is not None:
            self._spent = await self._storage.load_spent()
        self._initialized = True
        logger.info(
            "Budget guard initialized",
            spent_inr=self._spent,
            budget_inr=self._budget,
            remaining_inr=self._budget - self._spent,
        )

    @property
    def spent_inr(self) -> float:
        return self._spent

    @property
    def budget_inr(self) -> float:
        return self._budget

    @property
    def remaining_inr(self) -> float:
        return max(0.0, self._budget - self._spent)

    @property
    def utilization(self) -> float:
        """Budget utilization as a fraction (0–1)."""
        if self._budget <= 0:
            return 1.0
        return min(self._spent / self._budget, 1.0)

    async def check_budget(self) -> None:
        """Check if budget is available for a new API call.

        Raises
        ------
        BudgetExhaustedError
            When the budget is fully spent (utilization >= 1.0).
        """
        if not self._initialized:
            await self.initialize()

        if self._spent >= self._budget:
            raise BudgetExhaustedError(
                spent_inr=self._spent,
                budget_inr=self._budget,
            )

    async def record_spend(self, result: ClassificationResult) -> None:
        """Record the cost of a classification call.

        Parameters
        ----------
        result:
            The classification result containing token usage info.
        """
        if not self._initialized:
            await self.initialize()

        cost = estimate_cost_inr(result.tokens_used)
        self._spent += cost

        # Persist
        if self._storage is not None:
            await self._storage.save_spent(self._spent)

        # Warning at threshold
        if (
            not self._warning_emitted
            and self.utilization >= self._warning_threshold
        ):
            self._warning_emitted = True
            logger.warning(
                "Sarvam budget warning: approaching limit",
                spent_inr=round(self._spent, 2),
                budget_inr=self._budget,
                utilization_pct=round(self.utilization * 100, 1),
            )

        logger.debug(
            "Budget spend recorded",
            cost_inr=round(cost, 4),
            total_spent_inr=round(self._spent, 2),
            remaining_inr=round(self.remaining_inr, 2),
            tokens_used=result.tokens_used,
        )
