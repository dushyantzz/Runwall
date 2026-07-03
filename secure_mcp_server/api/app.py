from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from secure_mcp_server.api.routes import policies, approvals, audit

def create_app() -> FastAPI:
    """Create and configure the FastAPI application for the Control Plane."""
    app = FastAPI(
        title="Execution Governance Platform API",
        description="REST API Control Plane for managing AI Agent execution policies, approvals, and audits.",
        version="1.0.0"
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

    @app.get("/health")
    async def health_check():
        return {"status": "healthy"}

    return app

# Expose app instance
app = create_app()
