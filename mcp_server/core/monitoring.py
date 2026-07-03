"""Monitoring and metrics collection for MCP Server."""

import time
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from collections import defaultdict, deque
import structlog
from prometheus_client import (
    Counter, Histogram, Gauge, Summary, 
    CollectorRegistry, generate_latest
)

logger = structlog.get_logger()


class MetricsCollector:
    """Collects and manages application metrics."""
    
    def __init__(self, registry: Optional[CollectorRegistry] = None):
        self.registry = registry or CollectorRegistry()
        
        # Request metrics
        self.request_count = Counter(
            'mcp_requests_total',
            'Total number of MCP requests',
            ['method', 'status'],
            registry=self.registry
        )
        
        self.request_duration = Histogram(
            'mcp_request_duration_seconds',
            'Time spent processing MCP requests',
            ['method'],
            registry=self.registry
        )
        
        # Tool execution metrics
        self.tool_executions = Counter(
            'mcp_tool_executions_total',
            'Total number of tool executions',
            ['tool_name', 'status'],
            registry=self.registry
        )
        
        self.tool_execution_duration = Histogram(
            'mcp_tool_execution_duration_seconds',
            'Time spent executing tools',
            ['tool_name'],
            registry=self.registry
        )
        
        # Session metrics
        self.active_sessions = Gauge(
            'mcp_active_sessions',
            'Number of active sessions',
            registry=self.registry
        )
        
        self.session_duration = Histogram(
            'mcp_session_duration_seconds',
            'Duration of sessions',
            registry=self.registry
        )
        
        # Context metrics
        self.context_items = Gauge(
            'mcp_context_items_total',
            'Total number of context items',
            ['session_id'],
            registry=self.registry
        )
        
        self.context_tokens = Gauge(
            'mcp_context_tokens_total',
            'Total number of context tokens',
            ['session_id'],
            registry=self.registry
        )
        
        # Security metrics
        self.auth_attempts = Counter(
            'mcp_auth_attempts_total',
            'Total authentication attempts',
            ['status'],
            registry=self.registry
        )
        
        self.rate_limit_hits = Counter(
            'mcp_rate_limit_hits_total',
            'Total rate limit hits',
            ['endpoint'],
            registry=self.registry
        )
        
        # System metrics
        self.memory_usage = Gauge(
            'mcp_memory_usage_bytes',
            'Memory usage in bytes',
            registry=self.registry
        )
        
        # Error metrics
        self.errors = Counter(
            'mcp_errors_total',
            'Total number of errors',
            ['error_type'],
            registry=self.registry
        )
        
        # Custom metrics storage
        self.custom_metrics: Dict[str, Any] = {}
        self.anomaly_detection_data = defaultdict(lambda: deque(maxlen=1000))
    
    def record_request(self, method: str, status: str, duration: float):
        """Record a request metric."""
        self.request_count.labels(method=method, status=status).inc()
        self.request_duration.labels(method=method).observe(duration)
    
    def record_tool_execution(self, tool_name: str, status: str, duration: float):
        """Record a tool execution metric."""
        self.tool_executions.labels(tool_name=tool_name, status=status).inc()
        self.tool_execution_duration.labels(tool_name=tool_name).observe(duration)
        
        # Store for anomaly detection
        self.anomaly_detection_data[f"tool_duration_{tool_name}"].append({
            'timestamp': time.time(),
            'value': duration,
            'status': status
        })
    
    def update_active_sessions(self, count: int):
        """Update active sessions gauge."""
        self.active_sessions.set(count)
    
    def record_session_duration(self, duration: float):
        """Record session duration."""
        self.session_duration.observe(duration)
    
    def update_context_metrics(self, session_id: str, items: int, tokens: int):
        """Update context metrics for a session."""
        self.context_items.labels(session_id=session_id).set(items)
        self.context_tokens.labels(session_id=session_id).set(tokens)
    
    def record_auth_attempt(self, status: str):
        """Record authentication attempt."""
        self.auth_attempts.labels(status=status).inc()
    
    def record_rate_limit_hit(self, endpoint: str):
        """Record rate limit hit."""
        self.rate_limit_hits.labels(endpoint=endpoint).inc()
    
    def update_memory_usage(self, bytes_used: int):
        """Update memory usage metric."""
        self.memory_usage.set(bytes_used)
    
    def record_error(self, error_type: str):
        """Record an error."""
        self.errors.labels(error_type=error_type).inc()
    
    def get_metrics(self) -> str:
        """Get Prometheus formatted metrics."""
        return generate_latest(self.registry).decode('utf-8')
    
    def get_custom_metric(self, name: str) -> Any:
        """Get a custom metric value."""
        return self.custom_metrics.get(name)
    
    def set_custom_metric(self, name: str, value: Any):
        """Set a custom metric value."""
        self.custom_metrics[name] = value
    
    async def detect_anomalies(self) -> List[Dict[str, Any]]:
        """Detect anomalies in metrics data."""
        anomalies = []
        
        for metric_name, data_points in self.anomaly_detection_data.items():
            if len(data_points) < 50:  # Need enough data points
                continue
            
            # Simple anomaly detection using z-score
            recent_values = [dp['value'] for dp in list(data_points)[-20:]]
            historical_values = [dp['value'] for dp in list(data_points)[:-20]]
            
            if not historical_values:
                continue
            
            # Calculate mean and standard deviation
            hist_mean = sum(historical_values) / len(historical_values)
            hist_variance = sum((x - hist_mean) ** 2 for x in historical_values) / len(historical_values)
            hist_std = hist_variance ** 0.5
            
            if hist_std == 0:
                continue
            
            # Check recent values for anomalies
            for value in recent_values[-5:]:  # Check last 5 values
                z_score = abs(value - hist_mean) / hist_std
                
                if z_score > 3:  # 3 sigma rule
                    anomalies.append({
                        'metric': metric_name,
                        'value': value,
                        'z_score': z_score,
                        'mean': hist_mean,
                        'std': hist_std,
                        'timestamp': time.time(),
                        'severity': 'high' if z_score > 4 else 'medium'
                    })
        
        return anomalies
    
    def get_health_status(self) -> Dict[str, Any]:
        """Get overall health status."""
        # Calculate error rate
        total_requests = sum(
            metric.samples[0].value 
            for metric in self.request_count.collect()
            for sample in metric.samples
        )
        
        total_errors = sum(
            metric.samples[0].value 
            for metric in self.errors.collect()
            for sample in metric.samples
        )
        
        error_rate = (total_errors / max(total_requests, 1)) * 100
        
        # Determine health status
        if error_rate > 10:
            status = "unhealthy"
        elif error_rate > 5:
            status = "degraded"
        else:
            status = "healthy"
        
        return {
            'status': status,
            'error_rate': error_rate,
            'total_requests': total_requests,
            'total_errors': total_errors,
            'active_sessions': self.active_sessions._value._value,
            'timestamp': datetime.utcnow().isoformat()
        }


class PerformanceMonitor:
    """Monitors system performance and resource usage."""
    
    def __init__(self, metrics_collector: MetricsCollector):
        self.metrics_collector = metrics_collector
        self.monitoring_task: Optional[asyncio.Task] = None
    
    async def start_monitoring(self):
        """Start performance monitoring."""
        self.monitoring_task = asyncio.create_task(self._monitor_loop())
        logger.info("Performance monitoring started")
    
    async def stop_monitoring(self):
        """Stop performance monitoring."""
        if self.monitoring_task:
            self.monitoring_task.cancel()
            try:
                await self.monitoring_task
            except asyncio.CancelledError:
                pass
        logger.info("Performance monitoring stopped")
    
    async def _monitor_loop(self):
        """Main monitoring loop."""
        while True:
            try:
                await asyncio.sleep(30)  # Monitor every 30 seconds
                
                # Monitor memory usage
                import psutil
                process = psutil.Process()
                memory_usage = process.memory_info().rss
                self.metrics_collector.update_memory_usage(memory_usage)
                
                # Check for anomalies
                anomalies = await self.metrics_collector.detect_anomalies()
                if anomalies:
                    logger.warning(
                        "Anomalies detected",
                        anomaly_count=len(anomalies),
                        anomalies=[a for a in anomalies if a['severity'] == 'high']
                    )
                
                # Log health status periodically
                health = self.metrics_collector.get_health_status()
                if health['status'] != 'healthy':
                    logger.warning("System health degraded", **health)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("Error in monitoring loop", error=str(e))


class AlertManager:
    """Manages alerts and notifications."""
    
    def __init__(self):
        self.alert_rules: List[Dict[str, Any]] = []
        self.active_alerts: Dict[str, Dict[str, Any]] = {}
        self.alert_history: deque = deque(maxlen=1000)
    
    def add_alert_rule(
        self, 
        name: str, 
        condition: str, 
        threshold: float, 
        duration: int = 300,
        severity: str = "warning"
    ):
        """Add an alert rule."""
        rule = {
            'name': name,
            'condition': condition,
            'threshold': threshold,
            'duration': duration,  # seconds
            'severity': severity,
            'created_at': time.time()
        }
        self.alert_rules.append(rule)
        logger.info(f"Alert rule added: {name}")
    
    async def evaluate_alerts(self, metrics_collector: MetricsCollector):
        """Evaluate all alert rules against current metrics."""
        current_time = time.time()
        
        for rule in self.alert_rules:
            try:
                # Simple condition evaluation (expand this for production)
                if rule['condition'] == 'error_rate_high':
                    health = metrics_collector.get_health_status()
                    value = health['error_rate']
                    triggered = value > rule['threshold']
                
                elif rule['condition'] == 'memory_usage_high':
                    value = metrics_collector.memory_usage._value._value
                    # Convert to MB for threshold comparison
                    value_mb = value / (1024 * 1024)
                    triggered = value_mb > rule['threshold']
                
                else:
                    continue
                
                alert_key = rule['name']
                
                if triggered:
                    if alert_key not in self.active_alerts:
                        # New alert
                        alert = {
                            'rule': rule,
                            'value': value,
                            'triggered_at': current_time,
                            'status': 'firing'
                        }
                        self.active_alerts[alert_key] = alert
                        await self._send_alert(alert)
                    
                    else:
                        # Update existing alert
                        self.active_alerts[alert_key]['value'] = value
                
                else:
                    if alert_key in self.active_alerts:
                        # Resolve alert
                        alert = self.active_alerts.pop(alert_key)
                        alert['status'] = 'resolved'
                        alert['resolved_at'] = current_time
                        await self._send_alert_resolution(alert)
                        
                        # Add to history
                        self.alert_history.append(alert)
            
            except Exception as e:
                logger.error(f"Error evaluating alert rule {rule['name']}", error=str(e))
    
    async def _send_alert(self, alert: Dict[str, Any]):
        """Send alert notification."""
        logger.warning(
            "ALERT TRIGGERED",
            alert_name=alert['rule']['name'],
            condition=alert['rule']['condition'],
            threshold=alert['rule']['threshold'],
            current_value=alert['value'],
            severity=alert['rule']['severity']
        )
        
        # In production, send to notification channels (email, Slack, etc.)
    
    async def _send_alert_resolution(self, alert: Dict[str, Any]):
        """Send alert resolution notification."""
        duration = alert['resolved_at'] - alert['triggered_at']
        
        logger.info(
            "ALERT RESOLVED",
            alert_name=alert['rule']['name'],
            duration_seconds=duration
        )
    
    def get_active_alerts(self) -> List[Dict[str, Any]]:
        """Get list of active alerts."""
        return list(self.active_alerts.values())
    
    def get_alert_history(self) -> List[Dict[str, Any]]:
        """Get alert history."""
        return list(self.alert_history)