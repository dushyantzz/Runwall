from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from typing import Dict, Any, Optional, List, Set, Tuple
import json
import time

from secure_mcp_server.api.routes import policies, approvals, audit, dashboard, keys
from secure_mcp_server.api.routes.payment import router as payment_router
from secure_mcp_server.api.quickstart import generate_quickstart_html
from secure_mcp_server.config import get_settings
from secure_mcp_server.billing.cron import start_billing_cron
from secure_mcp_server.billing.plan_enforcement import (
    resolve_api_key,
    resolve_plan,
    enforce_rate_limit,
    SubscriptionRecordMissingError,
    SubscriptionInactiveError,
    RateLimitExceededError,
    DailyLimitExceededError,
)
from secure_mcp_server.database import get_db_manager

security = HTTPBasic()

def authenticate_admin(credentials: HTTPBasicCredentials = Depends(security)):
    settings = get_settings()
    correct_username = credentials.username == settings.admin_username
    correct_password = credentials.password == settings.admin_password
    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start billing cron in background
    cron_task = start_billing_cron()

    # Dynamic combined lifespan for FastMCP task groups
    mcp_http_app = getattr(app.state, "mcp_http_app", None)
    mcp_sse_app = getattr(app.state, "mcp_sse_app", None)
    
    if mcp_http_app and mcp_sse_app:
        async with mcp_http_app.router.lifespan_context(mcp_http_app):
            async with mcp_sse_app.router.lifespan_context(mcp_sse_app):
                yield
    elif mcp_http_app:
        async with mcp_http_app.router.lifespan_context(mcp_http_app):
            yield
    elif mcp_sse_app:
        async with mcp_sse_app.router.lifespan_context(mcp_sse_app):
            yield
    else:
        yield

    cron_task.cancel()


async def _send_asgi_json(send, status_code: int, payload: dict, extra_headers: list = None):
    """Utility to return exact JSON responses directly from ASGI middleware."""
    body = json.dumps(payload).encode("utf-8")
    headers = [
        (b"content-type", b"application/json"),
        (b"content-length", str(len(body)).encode("ascii")),
    ]
    if extra_headers:
        headers.extend(extra_headers)
    await send({
        "type": "http.response.start",
        "status": status_code,
        "headers": headers,
    })
    await send({
        "type": "http.response.body",
        "body": body,
    })


# In-memory store for active authenticated SSE sessions (session_id -> context, expiry)
_authenticated_sse_sessions: Dict[str, Any] = {}

class MCPAuthASGIMiddleware:
    """
    ASGI Middleware to strictly enforce API Key authentication and plan-tier limits
    on MCP HTTP/SSE endpoints (/mcp, /sse, /messages).
    
    Error Contract:
      - Missing/malformed Authorization header → 401 {"error": "missing_api_key"}
      - Invalid or revoked API key             → 401 {"error": "invalid_api_key"}
      - Valid key with missing subscription    → 500 {"error": "subscription_record_missing"}
      - Subscription inactive (past_due/etc.)  → 402 {"error": "subscription_inactive"}
      - Rate limit exceeded (RPM)              → 429 {"error": "rate_limit_exceeded", "retry_after": n}
      - Daily tool-call cap reached            → 429 {"error": "daily_limit_exceeded"}
    """
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] not in ("http", "websocket"):
            await self.app(scope, receive, send)
            return

        path = scope.get("path", "")
        # Protect MCP protocol endpoints only: /mcp, /sse, /messages
        mcp_paths = ("/mcp", "/sse", "/messages")
        is_mcp_request = any(path == p or path.startswith(p + "/") for p in mcp_paths)

        # Paths that should never require MCP API-key auth
        public_paths = ("/health", "/docs", "/redoc", "/openapi.json",
                        "/robots.txt", "/favicon.ico", "/sitemap.xml")

        if is_mcp_request and not path.startswith("/api/") and path not in public_paths and path != "/":
            # Extract query parameters
            query_string = scope.get("query_string", b"").decode("utf-8")
            from urllib.parse import parse_qs
            params = parse_qs(query_string)
            session_id = params.get("session_id", [None])[0]
            
            # Extract headers
            headers = scope.get("headers", [])
            auth_header_val = None
            for key, val in headers:
                if key == b"authorization":
                    auth_header_val = val.decode("utf-8")
                    break

            token = None
            if auth_header_val and auth_header_val.startswith("Bearer "):
                token = auth_header_val[7:].strip()
            else:
                q_token_list = params.get("token") or params.get("api_key") or params.get("apiKey") or params.get("authorization")
                if q_token_list:
                    q_token = q_token_list[0].strip()
                    if q_token.startswith("Bearer "):
                        q_token = q_token[7:].strip()
                    token = q_token

            # If this is a /messages call for an active SSE session that was already authenticated during /sse handshake
            if not token and path.startswith("/messages") and session_id:
                cached = _authenticated_sse_sessions.get(session_id)
                if cached and cached.get("expires_at", 0) > time.time():
                    scope["user_context"] = cached.get("user_context")
                    scope["plan_context"] = cached.get("plan_context")
                    await self.app(scope, receive, send)
                    return

            # Hard Rule: Missing / empty token -> 401 missing_api_key immediately
            if not token:
                await _send_asgi_json(send, 401, {"error": "missing_api_key"})
                return

            settings = get_settings()
            client = scope.get("client")
            request_ip = client[0] if client else None
            for key, val in headers:
                if key == b"x-forwarded-for":
                    request_ip = val.decode("utf-8").split(",")[0].strip()
                    break

            db_manager = get_db_manager()
            async with db_manager.get_session_context() as db_session:
                # 1. Resolve API key
                api_key_record = await resolve_api_key(
                    raw_key=token,
                    db=db_session,
                    request_ip=request_ip,
                    environment=settings.environment,
                )

                if not api_key_record:
                    await _send_asgi_json(send, 401, {"error": "invalid_api_key"})
                    return

                # 2. Resolve Plan
                try:
                    plan_ctx = await resolve_plan(api_key=api_key_record, db=db_session)
                except SubscriptionRecordMissingError:
                    await _send_asgi_json(send, 500, {"error": "subscription_record_missing"})
                    return
                except SubscriptionInactiveError:
                    await _send_asgi_json(send, 402, {"error": "subscription_inactive"})
                    return

                # 3. Enforce Rate Limits
                try:
                    await enforce_rate_limit(plan=plan_ctx, key_id=api_key_record.id)
                except RateLimitExceededError as rle:
                    await _send_asgi_json(
                        send, 
                        429, 
                        {"error": "rate_limit_exceeded", "retry_after": rle.retry_after},
                        extra_headers=[(b"retry-after", str(rle.retry_after).encode("ascii"))]
                    )
                    return
                except DailyLimitExceededError:
                    await _send_asgi_json(send, 429, {"error": "daily_limit_exceeded"})
                    return

                # Attach resolved context to ASGI scope
                scope["user_context"] = {
                    "user_id": plan_ctx.user_id,
                    "tier": plan_ctx.tier,
                    "api_key_id": api_key_record.id,
                    "tenant_id": api_key_record.tenant_id,
                    "permissions": api_key_record.permissions or ["*"],
                    "is_admin": plan_ctx.tier == "enterprise",
                }
                scope["plan_context"] = plan_ctx

                if session_id:
                    _authenticated_sse_sessions[session_id] = {
                        "user_context": scope["user_context"],
                        "plan_context": plan_ctx,
                        "expires_at": time.time() + 3600,
                    }

        await self.app(scope, receive, send)

def create_app() -> FastAPI:
    """Create and configure the FastAPI application for the Control Plane."""
    app = FastAPI(
        title="Runwall MCP Gateway API",
        description="REST API Control Plane and Public Gateway for AI Agent execution governance.",
        version="1.0.0",
        docs_url=None,
        redoc_url=None,
        lifespan=lifespan
    )

    # Register ASGI custom auth middleware
    app.add_middleware(MCPAuthASGIMiddleware)

    # Add CORS middleware for UI access
    allowed_origins = [origin for origin in get_settings().allowed_origins if origin != "*"]
    if not allowed_origins:
        allowed_origins = [
            "http://localhost:5173",
            "http://localhost:4173",
            "http://localhost:3000",
            "https://runwall.in",
            "https://www.runwall.in",
            "https://runwall.vercel.app",
            "https://mcp.runwall.in"
        ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_origin_regex=r"https://.*\.vercel\.app|https://.*\.runwall\.in|http://localhost:\d+",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register Routers
    app.include_router(keys.router, prefix="/api/keys", tags=["API Keys"])
    app.include_router(keys.router, prefix="/api/v1/keys", tags=["API Keys"])
    app.include_router(policies.router, prefix="/api/v1/policies", tags=["Policies"])
    app.include_router(approvals.router, prefix="/api/v1/approvals", tags=["Approvals"])
    app.include_router(audit.router, prefix="/api/v1/audit", tags=["Audit"])
    app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["Dashboard"])
    app.include_router(payment_router, prefix="/api/v1", tags=["Billing & Payments"])

    @app.get("/", response_class=HTMLResponse, include_in_schema=False)
    async def quickstart_page():
        """Public Human-Facing Quickstart Documentation and Config Generator."""
        return HTMLResponse(content=generate_quickstart_html(), status_code=200)

    @app.get("/docs", include_in_schema=False)
    async def get_swagger_documentation(username: str = Depends(authenticate_admin)):
        return get_swagger_ui_html(
            openapi_url="/openapi.json",
            title=app.title + " - Swagger UI"
        )

    @app.get("/redoc", include_in_schema=False)
    async def get_redoc_documentation(username: str = Depends(authenticate_admin)):
        return get_redoc_html(
            openapi_url="/openapi.json",
            title=app.title + " - ReDoc"
        )

    @app.get("/health")
    async def health_check():
        return {"status": "healthy"}

    return app

# Expose app instance
app = create_app()
