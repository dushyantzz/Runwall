"""Monitoring and metrics collection for Secure MCP Server."""

import time
from typing import Any, Dict, List, Optional
from collections import defaultdict, deque
import structlog

logger = structlog.get_logger()


class MetricsCollector:
    """Lightweight metrics and health tracker (no external server needed)."""

    def __init__(self):
        self.request_count: int = 0
        self.tool_counts: Dict[str, int] = defaultdict(int)
        self.tool_durations: Dict[str, List[float]] = defaultdict(list)
        self.rate_limit_hits: int = 0
        self.errors: int = 0
        self.custom: Dict[str, Any] = {}
        self.history: deque = deque(maxlen=1000)

    def record_request(self):
        self.request_count += 1
        self.history.append({"t": time.time(), "event": "request"})

    def record_tool_execution(self, tool: str, status: str, duration: float):
        self.tool_counts[f"{tool}:{status}"] += 1
        self.tool_durations[tool].append(duration)
        self.history.append({
            "t": time.time(),
            "event": "tool",
            "tool": tool,
            "status": status,
            "duration": duration,
        })

    def record_rate_limit_hit(self):
        self.rate_limit_hits += 1
        self.history.append({"t": time.time(), "event": "rate_limit"})

    def record_error(self, error_type: str):
        self.errors += 1
        self.history.append({"t": time.time(), "event": "error", "type": error_type})

    def get_current_metrics(self) -> Dict[str, Any]:
        return {
            "requests": self.request_count,
            "rate_limit_hits": self.rate_limit_hits,
            "errors": self.errors,
            "tools": {k: v for k, v in self.tool_counts.items()},
            "avg_tool_duration": {
                tool: (sum(durations) / len(durations)) if durations else 0.0
                for tool, durations in self.tool_durations.items()
            },
            "last_events": list(self.history)[-20:],
            "timestamp": time.time(),
        }

    def get_performance_metrics(self, metric_type: str = "all") -> Dict[str, Any]:
        data = self.get_current_metrics()
        if metric_type == "tools":
            return {
                "tools": data["tools"],
                "avg_tool_duration": data["avg_tool_duration"],
            }
        if metric_type == "sessions":
            # Placeholder for future session metrics
            return {"sessions": {}}
        if metric_type == "system":
            # Keep simple to avoid system libs
            return {"system": {"uptime_estimate": len(self.history) * 0.5}}
        return data
