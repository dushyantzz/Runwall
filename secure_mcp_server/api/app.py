from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
from fastapi.security import HTTPBasic, HTTPBasicCredentials

from secure_mcp_server.api.routes import policies, approvals, audit, dashboard
from secure_mcp_server.config import get_settings

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
