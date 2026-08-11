"""Tests for the budget guard — happy path, exhausted budget, persistence."""

import json
import os
import tempfile
from pathlib import Path
from unittest.mock import AsyncMock

import pytest

from secure_mcp_server.risk.semantic.budget_guard import (
    BudgetGuard,
    FileBudgetStorage,
    estimate_cost_inr,
)
from secure_mcp_server.risk.semantic.exceptions import BudgetExhaustedError
from secure_mcp_server.risk.semantic.models import ClassificationResult


def _make_result(tokens_used: int = 1000) -> ClassificationResult:
    return ClassificationResult(
        risk_score=0.5,
        reasoning="test",
        model_used="sarvam-m4",
        tokens_used=tokens_used,
    )


class TestCostEstimation:
    def test_cost_for_1000_tokens(self):
        cost = estimate_cost_inr(1000)
        assert cost > 0
        assert cost < 1.0  # Should be a small fraction of a rupee

    def test_cost_for_zero_tokens(self):
        assert estimate_cost_inr(0) == 0.0


class TestBudgetGuardHappyPath:
    @pytest.mark.asyncio
    async def test_budget_check_passes_when_under_limit(self):
        guard = BudgetGuard(budget_total_inr=50000.0)
        await guard.initialize()

        # Should not raise
        await guard.check_budget()

    @pytest.mark.asyncio
    async def test_record_spend_updates_totals(self):
        guard = BudgetGuard(budget_total_inr=50000.0)
        await guard.initialize()

        result = _make_result(tokens_used=5000)
        await guard.record_spend(result)

        assert guard.spent_inr > 0
        assert guard.remaining_inr < 50000.0

    @pytest.mark.asyncio
    async def test_utilization_increases(self):
        guard = BudgetGuard(budget_total_inr=1.0)  # Tiny budget for testing
        await guard.initialize()

        result = _make_result(tokens_used=10000)
        await guard.record_spend(result)

        assert guard.utilization > 0


class TestBudgetExhausted:
    @pytest.mark.asyncio
    async def test_raises_when_budget_exhausted(self):
        """Budget guard must raise BudgetExhaustedError when fully spent."""
        guard = BudgetGuard(budget_total_inr=0.001)  # Almost nothing
        await guard.initialize()

        # Spend more than the budget
        result = _make_result(tokens_used=100000)
        await guard.record_spend(result)

        with pytest.raises(BudgetExhaustedError) as exc_info:
            await guard.check_budget()
        assert exc_info.value.spent_inr > 0
        assert exc_info.value.budget_inr == 0.001

    @pytest.mark.asyncio
    async def test_budget_zero_raises_immediately(self):
        guard = BudgetGuard(budget_total_inr=0.0)
        await guard.initialize()

        with pytest.raises(BudgetExhaustedError):
            await guard.check_budget()


class TestFilePersistence:
    @pytest.mark.asyncio
    async def test_save_and_load(self, tmp_path):
        file_path = tmp_path / "budget_state.json"
        storage = FileBudgetStorage(file_path)

        await storage.save_spent(42.5)
        loaded = await storage.load_spent()
        assert loaded == 42.5

    @pytest.mark.asyncio
    async def test_load_nonexistent_file(self, tmp_path):
        storage = FileBudgetStorage(tmp_path / "nonexistent.json")
        loaded = await storage.load_spent()
        assert loaded == 0.0

    @pytest.mark.asyncio
    async def test_load_corrupted_file(self, tmp_path):
        file_path = tmp_path / "corrupted.json"
        file_path.write_text("not json!!!")
        storage = FileBudgetStorage(file_path)
        loaded = await storage.load_spent()
        assert loaded == 0.0

    @pytest.mark.asyncio
    async def test_budget_guard_persists_spend(self, tmp_path):
        """A restart should not reset the budget — persistence is required."""
        file_path = tmp_path / "budget.json"
        storage = FileBudgetStorage(file_path)

        # First "session"
        guard1 = BudgetGuard(budget_total_inr=50000.0, storage=storage)
        await guard1.initialize()
        await guard1.record_spend(_make_result(tokens_used=10000))
        spent_after = guard1.spent_inr

        # Second "session" (simulates restart)
        guard2 = BudgetGuard(budget_total_inr=50000.0, storage=storage)
        await guard2.initialize()

        assert guard2.spent_inr == spent_after
        assert guard2.spent_inr > 0


class TestWarningThreshold:
    @pytest.mark.asyncio
    async def test_warning_emitted_at_threshold(self, tmp_path):
        """Warning should be emitted when budget utilization >= 90%."""
        storage = FileBudgetStorage(tmp_path / "budget.json")
        guard = BudgetGuard(
            budget_total_inr=1.0,
            storage=storage,
            warning_threshold=0.50,
        )
        await guard.initialize()

        # Push past 50% threshold
        result = _make_result(tokens_used=50000)
        await guard.record_spend(result)

        # The warning flag should be set
        assert guard._warning_emitted is True
