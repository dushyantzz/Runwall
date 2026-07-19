from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
from fastapi.security import HTTPBasic, HTTPBasicCredentials

from secure_mcp_server.api.routes import policies, approvals, audit, dashboard
from secure_mcp_server.api.routes.payment import router as payment_router
from secure_mcp_server.config import get_settings
from secure_mcp_server.billing.cron import start_billing_cron

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

class MCPAuthASGIMiddleware:
    """ASGI Middleware to enforce API Key authentication on MCP HTTP/SSE endpoints."""
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] not in ("http", "websocket"):
            await self.app(scope, receive, send)
            return

        path = scope.get("path", "")
        # Protect MCP protocol endpoints: /mcp, /sse, /messages, and root /
        mcp_paths = ["/mcp", "/sse", "/messages"]
        is_mcp_request = any(path.startswith(p) for p in mcp_paths) or path == "/"

        if is_mcp_request and not path.startswith("/api/v1") and path not in ("/health", "/docs", "/redoc", "/openapi.json"):
            # Extract query parameters
            query_string = scope.get("query_string", b"").decode("utf-8")
            from urllib.parse import parse_qs
            params = parse_qs(query_string)
            
            # Extract headers
            headers = scope.get("headers", [])
            auth_header_val = None
            for key, val in headers:
                if key == b"authorization":
                    auth_header_val = val.decode("utf-8")
                    break

            token = None
            if auth_header_val and auth_header_val.startswith("Bearer "):
                token = auth_header_val[7:]
            else:
                q_token_list = params.get("token") or params.get("api_key") or params.get("apiKey") or params.get("authorization")
                if q_token_list:
                    q_token = q_token_list[0]
                    if q_token.startswith("Bearer "):
                        q_token = q_token[7:]
                    token = q_token

            authorized = False
            if token and token.startswith("mcp_"):
                from secure_mcp_server.auth import AuthManager
                from secure_mcp_server.config import get_settings
                
                settings = get_settings()
                auth_manager = AuthManager(settings)
                
                client = scope.get("client")
                request_ip = client[0] if client else None
                for key, val in headers:
                    if key == b"x-forwarded-for":
                        request_ip = val.decode("utf-8").split(",")[0].strip()
                        break

                try:
                    ctx = await auth_manager.validate_api_key(
                        api_key=token,
                        request_ip=request_ip,
                        environment=settings.environment
                    )
                    if ctx:
                        authorized = True
                        scope["user_context"] = ctx
                except Exception:
                    pass

            if not authorized:
                # Return 401 response directly via ASGI
                import json
                body_dict = {
                    "error": "Unauthorized",
                    "detail": "A valid Runwall API Key ('token' query parameter or Bearer token) is required to access the MCP endpoints."
                }
                body = json.dumps(body_dict).encode("utf-8")
                await send({
                    "type": "http.response.start",
                    "status": 401,
                    "headers": [
                        (b"content-type", b"application/json"),
                        (b"content-length", str(len(body)).encode("ascii")),
                    ]
                })
                await send({
                    "type": "http.response.body",
                    "body": body,
                })
                return

        await self.app(scope, receive, send)

def create_app() -> FastAPI:
    """Create and configure the FastAPI application for the Control Plane."""
    app = FastAPI(
        title="Execution Governance Platform API",
        description="REST API Control Plane for managing AI Agent execution policies, approvals, and audits.",
        version="1.0.0",
        docs_url=None,
        redoc_url=None,
        lifespan=lifespan
    )

    # Register ASGI custom auth middleware
    app.add_middleware(MCPAuthASGIMiddleware)

    # Add CORS middleware for UI access
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"], # For demo/development
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register Routers
    app.include_router(policies.router, prefix="/api/v1/policies", tags=["Policies"])
    app.include_router(approvals.router, prefix="/api/v1/approvals", tags=["Approvals"])
    app.include_router(audit.router, prefix="/api/v1/audit", tags=["Audit"])
    app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["Dashboard"])
    app.include_router(payment_router, prefix="/api/v1", tags=["Billing & Payments"])

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
