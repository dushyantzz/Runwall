"""Rate limiting middleware for MCP Server."""

import time
from collections import defaultdict
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
import structlog

logger = structlog.get_logger()


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple in-memory sliding-window rate limiter."""

    WINDOW_SECONDS = 60
    MAX_REQUESTS = 120

    _buckets: dict = defaultdict(list)

    async def dispatch(self, request: Request, call_next) -> Response:
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()

        # Evict entries outside the current window
        self._buckets[client_ip] = [
            ts for ts in self._buckets[client_ip]
            if now - ts < self.WINDOW_SECONDS
        ]

        if len(self._buckets[client_ip]) >= self.MAX_REQUESTS:
            logger.warning("rate_limit_exceeded", client=client_ip)
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests"},
            )

        self._buckets[client_ip].append(now)
        return await call_next(request)
