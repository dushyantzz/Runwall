"""Tests for the fusion logic — weighting, fail-open, fail-closed."""

import pytest

from secure_mcp_server.risk.semantic.fusion import FailMode, RiskFusion
from secure_mcp_server.risk.semantic.models import ClassificationResult


def _make_result(risk_score: float = 0.5, degraded: bool = False, reason: str = "") -> ClassificationResult:
    return ClassificationResult(
        risk_score=risk_score,
        reasoning="test",
        model_used="sarvam-105b",
        tokens_used=100,
        degraded=degraded,
        degraded_reason=reason,
    )


class TestWeightedFusion:
    def test_default_weighting(self):
        """Default: structural 0.6, semantic 0.4."""
        fusion = RiskFusion(semantic_weight=0.4)
        result = fusion.fuse(0.5, _make_result(risk_score=0.8))
        # 0.6 * 0.5 + 0.4 * 0.8 = 0.30 + 0.32 = 0.62
        assert abs(result - 0.62) < 0.001

    def test_zero_semantic_weight(self):
        """With semantic_weight=0, structural score dominates."""
        fusion = RiskFusion(semantic_weight=0.0)
        result = fusion.fuse(0.5, _make_result(risk_score=1.0))
        assert result == 0.5

    def test_full_semantic_weight(self):
        """With semantic_weight=1, semantic score dominates."""
        fusion = RiskFusion(semantic_weight=1.0)
        result = fusion.fuse(0.5, _make_result(risk_score=0.9))
        assert result == 0.9

    def test_both_zero(self):
        fusion = RiskFusion(semantic_weight=0.5)
        result = fusion.fuse(0.0, _make_result(risk_score=0.0))
        assert result == 0.0

    def test_both_max(self):
        fusion = RiskFusion(semantic_weight=0.5)
        result = fusion.fuse(1.0, _make_result(risk_score=1.0))
        assert result == 1.0


class TestNoSemanticSignal:
    def test_none_semantic_uses_structural_only(self):
        fusion = RiskFusion(semantic_weight=0.4)
        result = fusion.fuse(0.7, None)
        assert result == 0.7


class TestFailOpen:
    def test_degraded_ignores_semantic(self):
        """Fail-open: degraded semantic signal → use structural only."""
        fusion = RiskFusion(semantic_weight=0.4, fail_mode=FailMode.OPEN)
        degraded = _make_result(risk_score=0.0, degraded=True, reason="timeout")

        result = fusion.fuse(0.5, degraded)
        assert result == 0.5  # Structural only

    def test_degraded_does_not_increase_score(self):
        fusion = RiskFusion(semantic_weight=0.4, fail_mode=FailMode.OPEN)
        degraded = _make_result(degraded=True, reason="budget exhausted")

        result = fusion.fuse(0.3, degraded)
        assert result == 0.3  # No penalty


class TestFailClosed:
    def test_degraded_adds_penalty(self):
        """Fail-closed: degraded semantic signal → structural + penalty."""
        fusion = RiskFusion(semantic_weight=0.4, fail_mode=FailMode.CLOSED)
        degraded = _make_result(degraded=True, reason="Sarvam down")

        result = fusion.fuse(0.5, degraded)
        assert result == 0.65  # 0.5 + 0.15 penalty

    def test_penalty_capped_at_1(self):
        """Penalty should not push score above 1.0."""
        fusion = RiskFusion(semantic_weight=0.4, fail_mode=FailMode.CLOSED)
        degraded = _make_result(degraded=True, reason="outage")

        result = fusion.fuse(0.95, degraded)
        assert result == 1.0  # Capped


class TestClamping:
    def test_score_clamped_to_0_1(self):
        fusion = RiskFusion(semantic_weight=0.4)
        # Both high → should not exceed 1.0
        result = fusion.fuse(1.0, _make_result(risk_score=1.0))
        assert 0.0 <= result <= 1.0


class TestInvalidConfig:
    def test_negative_weight_raises(self):
        with pytest.raises(ValueError):
            RiskFusion(semantic_weight=-0.1)

    def test_weight_over_1_raises(self):
        with pytest.raises(ValueError):
            RiskFusion(semantic_weight=1.1)
