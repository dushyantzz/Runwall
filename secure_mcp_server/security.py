"""Security management and input validation."""

import re
import hashlib
import time
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from collections import defaultdict
import structlog

from .config import Settings

logger = structlog.get_logger()


class SecurityManager:
    """Manages security policies, input validation, and threat detection."""
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self.rate_limits: Dict[str, List[float]] = defaultdict(list)
        self.blocked_ips: set = set()
        self.audit_events: List[Dict[str, Any]] = []
        
        # Security patterns for input validation
        self.dangerous_patterns = [
            r'<script[^>]*>.*?</script>',  # XSS
            r'javascript:',  # JavaScript injection
            r'data:text/html',  # Data URL injection
            r'\b(union|select|insert|update|delete|drop|create|alter)\b',  # SQL injection
            r'\.\./',  # Path traversal
            r'<iframe[^>]*>',  # Iframe injection
            r'eval\s*\(',  # Code evaluation
            r'exec\s*\(',  # Code execution
        ]
        
        self.compiled_patterns = [re.compile(pattern, re.IGNORECASE) for pattern in self.dangerous_patterns]
    
    def sanitize_input(self, data: Any) -> Any:
        """Sanitize user input to prevent injection attacks."""
        if not self.settings.enable_input_sanitization:
            return data
        
        if isinstance(data, str):
            return self._sanitize_string(data)
        elif isinstance(data, dict):
            return {k: self.sanitize_input(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [self.sanitize_input(item) for item in data]
        else:
            return data
    
    def _sanitize_string(self, text: str) -> str:
        """Sanitize a string input."""
        # Check for dangerous patterns
        for pattern in self.compiled_patterns:
            if pattern.search(text):
                logger.warning("Dangerous pattern detected in input", pattern=pattern.pattern)
                # Remove or escape the dangerous content
                text = pattern.sub('', text)
        
        # HTML entity encoding for basic XSS prevention
        text = text.replace('&', '&amp;')
        text = text.replace('<', '&lt;')
        text = text.replace('>', '&gt;')
        text = text.replace('"', '&quot;')
        text = text.replace("'", '&#x27;')
        
        # Limit length to prevent DoS
        max_length = 10000
        if len(text) > max_length:
            text = text[:max_length]
            logger.warning("Input truncated due to length limit", original_length=len(text))
        
        return text.strip()
    
    async def check_rate_limit(
        self, 
        identifier: str, 
        limit: Optional[int] = None, 
        window_minutes: int = 1
    ) -> bool:
        """Check if request is within rate limits."""
        if not self.settings.enable_rate_limiting:
            return True
        
        if limit is None:
            limit = self.settings.rate_limit_requests_per_minute
        
        current_time = time.time()
        window_start = current_time - (window_minutes * 60)
        
        # Clean old entries
        self.rate_limits[identifier] = [
            timestamp for timestamp in self.rate_limits[identifier]
            if timestamp > window_start
        ]
        
        # Check limit
        if len(self.rate_limits[identifier]) >= limit:
            self._record_security_event(
                "rate_limit_exceeded",
                identifier,
                {"limit": limit, "window_minutes": window_minutes}
            )
            return False
        
        # Add current request
        self.rate_limits[identifier].append(current_time)
        return True
    
    def validate_tool_access(self, user_context: Dict[str, Any], tool_name: str) -> bool:
        """Validate if user can access a specific tool."""
        if not user_context:
            return False
        
        # Admin can access all tools
        if user_context.get("is_admin", False):
            return True
        
        # Check tool-specific permissions
        user_permissions = user_context.get("permissions", [])
        
        # System tools require admin access
        admin_only_tools = ["system_info"]
        if tool_name in admin_only_tools:
            return user_context.get("is_admin", False)
        
        # Default: allow basic tools for authenticated users
        basic_tools = [
            "echo", "calculator", "text_processor", 
            "secure_hash", "uuid_generator", "datetime_info"
        ]
        
        return tool_name in basic_tools
    
    def create_sandbox_context(self) -> Dict[str, Any]:
        """Create a sandboxed execution context for tools."""
        if not self.settings.enable_tool_sandboxing:
            return {"sandboxed": False}
        
        return {
            "sandboxed": True,
            "allowed_modules": [
                "math", "datetime", "uuid", "hashlib", 
                "json", "base64", "urllib.parse"
            ],
            "blocked_modules": [
                "os", "sys", "subprocess", "socket", 
                "threading", "multiprocessing", "ctypes"
            ],
            "max_execution_time": self.settings.tool_execution_timeout,
            "max_memory_mb": 100
        }
    
    def _record_security_event(
        self, 
        event_type: str, 
        identifier: str, 
        details: Dict[str, Any]
    ):
        """Record a security event for auditing."""
        if not self.settings.enable_audit_logging:
            return
        
        event = {
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": event_type,
            "identifier": identifier,
            "details": details
        }
        
        self.audit_events.append(event)
        
        # Keep only recent events (memory management)
        max_events = 10000
        if len(self.audit_events) > max_events:
            self.audit_events = self.audit_events[-max_events:]
        
        logger.warning("Security event recorded", **event)
    
    async def get_audit_events(
        self, 
        time_range: str = "24h", 
        severity: str = "all"
    ) -> List[Dict[str, Any]]:
        """Get audit events for security analysis."""
        # Parse time range
        if time_range == "1h":
            since = datetime.utcnow() - timedelta(hours=1)
        elif time_range == "24h":
            since = datetime.utcnow() - timedelta(hours=24)
        elif time_range == "7d":
            since = datetime.utcnow() - timedelta(days=7)
        else:
            since = datetime.utcnow() - timedelta(hours=24)
        
        # Filter events
        filtered_events = []
        for event in self.audit_events:
            event_time = datetime.fromisoformat(event["timestamp"])
            if event_time >= since:
                if severity == "all" or event.get("severity", "medium") == severity:
                    filtered_events.append(event)
        
        return filtered_events
    
    def detect_anomalies(self) -> List[Dict[str, Any]]:
        """Detect security anomalies in recent events."""
        anomalies = []
        
        # Analyze rate limit events
        rate_limit_events = [
            event for event in self.audit_events[-1000:]
            if event["event_type"] == "rate_limit_exceeded"
        ]
        
        if len(rate_limit_events) > 10:  # Threshold for concern
            anomalies.append({
                "type": "high_rate_limit_violations",
                "count": len(rate_limit_events),
                "severity": "high",
                "description": "Unusually high number of rate limit violations"
            })
        
        # Add more anomaly detection logic here
        
        return anomalies
    
    def get_security_score(self) -> Dict[str, Any]:
        """Calculate overall security score."""
        recent_events = self.audit_events[-100:]  # Last 100 events
        
        # Calculate metrics
        total_events = len(recent_events)
        high_severity_events = len([
            e for e in recent_events 
            if e.get("severity", "medium") == "high"
        ])
        
        # Calculate score (0-100)
        if total_events == 0:
            score = 100
        else:
            security_ratio = 1 - (high_severity_events / total_events)
            score = int(security_ratio * 100)
        
        return {
            "score": score,
            "status": "good" if score >= 80 else "warning" if score >= 60 else "critical",
            "total_events": total_events,
            "high_severity_events": high_severity_events,
            "recommendations": self._get_security_recommendations(score)
        }
    
    def _get_security_recommendations(self, score: int) -> List[str]:
        """Get security recommendations based on score."""
        recommendations = []
        
        if score < 60:
            recommendations.append("Review and strengthen authentication mechanisms")
            recommendations.append("Implement additional rate limiting")
            recommendations.append("Consider blocking suspicious IP addresses")
        
        if score < 80:
            recommendations.append("Monitor for unusual access patterns")
            recommendations.append("Review user permissions and access controls")
        
        recommendations.append("Regularly update security policies")
        recommendations.append("Enable comprehensive audit logging")
        
        return recommendations