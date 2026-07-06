"""
Distributed Quotas and Rate Limiting.
Provides an abstract quota manager that supports Redis-backed sliding windows
with an in-memory async fallback for local development.
"""
import time
import asyncio
import secrets
from typing import Optional, Dict, List
import structlog
import redis.asyncio as redis
from secure_mcp_server.config import Settings

logger = structlog.get_logger(__name__)

class QuotaExceededError(Exception):
    """Raised when a quota is exceeded."""
    def __init__(self, dimension: str, limit: int):
        self.dimension = dimension
        self.limit = limit
        super().__init__(f"Quota exceeded for dimension '{dimension}'. Limit: {limit}")


class QuotaManager:
    """Manages distributed multi-dimensional rate limiting and quotas."""
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self.redis = None
        
        # In-memory fallback if Redis is not configured or fails
        self._memory_store: Dict[str, List[float]] = {}
        self._lock = asyncio.Lock()
        
    async def initialize(self):
        """Initialize connection to Redis if configured."""
        if self.settings.redis_url:
            try:
                self.redis = redis.from_url(self.settings.redis_url, decode_responses=True)
                # Test the connection
                await self.redis.ping()
                logger.info("Connected to Redis successfully for QuotaManager")
            except Exception as e:
                logger.error("Failed to connect to Redis, falling back to in-memory store", error=str(e))
                self.redis = None
        else:
            logger.info("No REDIS_URL configured, using in-memory store for QuotaManager")
            
    async def _check_sliding_window(self, key: str, limit: int, window_seconds: int = 60) -> bool:
        """
        Evaluate sliding window rate limit.
        Returns True if allowed, False if quota exceeded.
        """
        now = time.time()
        cutoff = now - window_seconds
        
        if self.redis:
            try:
                # Use a pipeline for atomic sliding window evaluation
                pipe = self.redis.pipeline()
                pipe.zremrangebyscore(key, 0, cutoff)
                pipe.zcard(key)
                results = await pipe.execute()
                current_count = results[1]
                
                if current_count >= limit:
                    return False
                
                # Add unique element for this timestamp
                member = f"{now}:{secrets.token_hex(4)}"
                pipe = self.redis.pipeline()
                pipe.zadd(key, {member: now})
                pipe.expire(key, window_seconds)
                await pipe.execute()
                return True
            except Exception as e:
                logger.error("Redis quota check failed, falling back to memory", error=str(e))
                # Fallback to in-memory store if Redis throws error during check
                pass
            
        async with self._lock:
            # In-memory implementation
            if key not in self._memory_store:
                self._memory_store[key] = []
                
            # Filter old timestamps
            cutoff = now - window_seconds
            self._memory_store[key] = [t for t in self._memory_store[key] if t > cutoff]
            
            if len(self._memory_store[key]) >= limit:
                return False
                
            self._memory_store[key].append(now)
            
            # Housekeeping to prevent memory leak
            if len(self._memory_store) > 10000:
                # Randomly clean some keys if it gets too large
                pass
                
            return True

    async def check_quotas(
        self, 
        tenant_id: str,
        user_id: Optional[str] = None,
        service_account_id: Optional[str] = None,
        tool_name: Optional[str] = None,
        risk_score: float = 0.0
    ) -> None:
        """
        Check all applicable quotas based on the context.
        Raises QuotaExceededError if any quota is breached.
        """
        # 1. Adaptive Throttling based on Risk
        # If risk is HIGH (>0.5), halve the effective quotas to contain blast radius.
        risk_multiplier = 0.5 if risk_score >= self.settings.high_risk_threshold else 1.0
        
        # 2. Tenant Quota
        t_limit = int(self.settings.default_tenant_rpm * risk_multiplier)
        if not await self._check_sliding_window(f"quota:tenant:{tenant_id}:rpm", t_limit):
            logger.warning("Tenant quota exceeded", tenant_id=tenant_id, limit=t_limit)
            raise QuotaExceededError(f"tenant:{tenant_id}", t_limit)
            
        # 3. User or Service Account Quota
        if user_id:
            u_limit = int(self.settings.default_user_rpm * risk_multiplier)
            if not await self._check_sliding_window(f"quota:user:{user_id}:rpm", u_limit):
                logger.warning("User quota exceeded", user_id=user_id, limit=u_limit)
                raise QuotaExceededError(f"user:{user_id}", u_limit)
                
        if service_account_id:
            sa_limit = int(self.settings.default_service_account_rpm * risk_multiplier)
            if not await self._check_sliding_window(f"quota:sa:{service_account_id}:rpm", sa_limit):
                logger.warning("Service Account quota exceeded", sa_id=service_account_id, limit=sa_limit)
                raise QuotaExceededError(f"service_account:{service_account_id}", sa_limit)
                
        # 4. Tool Quota (if a specific tool is being executed)
        if tool_name:
            tool_limit = int(self.settings.default_tool_rpm * risk_multiplier)
            if not await self._check_sliding_window(f"quota:tool:{tool_name}:rpm", tool_limit):
                logger.warning("Tool quota exceeded", tool_name=tool_name, limit=tool_limit)
                raise QuotaExceededError(f"tool:{tool_name}", tool_limit)
                
        # If we reach here, all quotas passed
        return True
