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

    # Enforce API Key Authentication Middleware for MCP endpoints
    @app.middleware("http")
    async def mcp_token_auth_middleware(request: Request, call_next):
        path = request.url.path
        
        # Protect MCP protocol endpoints: /mcp, /sse, /messages, and root /
        mcp_paths = ["/mcp", "/sse", "/messages"]
        is_mcp_request = any(path.startswith(p) for p in mcp_paths) or path == "/"
        
        if is_mcp_request and not path.startswith("/api/v1") and path not in ("/health", "/docs", "/redoc", "/openapi.json"):
            token = None
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header[7:]
            else:
                query_params = request.query_params
                q_token = (
                    query_params.get("token") 
                    or query_params.get("api_key") 
                    or query_params.get("apiKey") 
                    or query_params.get("authorization")
                )
                if q_token:
                    if q_token.startswith("Bearer "):
                        q_token = q_token[7:]
                    token = q_token

            authorized = False
            if token and token.startswith("mcp_"):
                from secure_mcp_server.auth import AuthManager
                from secure_mcp_server.config import get_settings
                
                settings = get_settings()
                auth_manager = AuthManager(settings)
                
                request_ip = request.client.host if request.client else None
                if not request_ip:
                    forwarded = request.headers.get("x-forwarded-for")
                    if forwarded:
                        request_ip = forwarded.split(",")[0].strip()
                
                try:
                    ctx = await auth_manager.validate_api_key(
                        api_key=token,
                        request_ip=request_ip,
                        environment=settings.environment
                    )
                    if ctx:
                        authorized = True
                        # Inject context into request state for downstream uses
                        request.state.user_context = ctx
                except Exception:
                    pass

            if not authorized:
                return JSONResponse(
                    status_code=401,
                    content={
                        "error": "Unauthorized",
                        "detail": "A valid Runwall API Key ('token' query parameter or Bearer token) is required to access the MCP endpoints."
                    }
                )

        return await call_next(request)

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
