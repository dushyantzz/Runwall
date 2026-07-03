"""Main FastAPI application for MCP Server."""

import asyncio
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from prometheus_client import make_asgi_app
import structlog

from .config import get_settings, Settings
from .core.mcp_protocol import MCPProtocolHandler
from .core.security import SecurityManager
from .core.context_manager import ContextManager
from .core.tool_manager import ToolManager
from .core.monitoring import MetricsCollector
from .database.connection import DatabaseManager
from .api import auth, tools, admin, health
from .middleware.security import SecurityMiddleware
from .middleware.logging import LoggingMiddleware
from .middleware.rate_limiting import RateLimitMiddleware

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager."""
    settings = get_settings()
    
    # Initialize core components
    logger.info("Starting MCP Server Framework", version="0.1.0")
    
    # Initialize database
    db_manager = DatabaseManager(settings.database_url)
    await db_manager.initialize()
    app.state.db_manager = db_manager
    
    # Initialize security manager
    security_manager = SecurityManager(settings)
    app.state.security_manager = security_manager
    
    # Initialize context manager
    context_manager = ContextManager(settings)
    await context_manager.initialize()
    app.state.context_manager = context_manager
    
    # Initialize tool manager
    tool_manager = ToolManager(settings)
    await tool_manager.initialize()
    app.state.tool_manager = tool_manager
    
    # Initialize MCP protocol handler
    mcp_handler = MCPProtocolHandler(
        security_manager=security_manager,
        context_manager=context_manager,
        tool_manager=tool_manager
    )
    app.state.mcp_handler = mcp_handler
    
    # Initialize metrics collector
    metrics_collector = MetricsCollector()
    app.state.metrics_collector = metrics_collector
    
    logger.info("MCP Server Framework initialized successfully")
    
    yield
    
    # Cleanup
    logger.info("Shutting down MCP Server Framework")
    await context_manager.cleanup()
    await db_manager.cleanup()
    logger.info("MCP Server Framework shutdown complete")


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    settings = get_settings()
    
    app = FastAPI(
        title="Secure MCP Server Framework",
        description="A comprehensive, secure, and context-optimized Model Context Protocol (MCP) Server Framework",
        version="0.1.0",
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
        lifespan=lifespan
    )
    
    # Add security middleware
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["*"] if settings.debug else ["localhost", "127.0.0.1"]
    )
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Add custom middleware
    app.add_middleware(SecurityMiddleware)
    app.add_middleware(LoggingMiddleware)
    app.add_middleware(RateLimitMiddleware)
    
    # Include routers
    app.include_router(health.router, prefix="/health", tags=["health"])
    app.include_router(auth.router, prefix="/auth", tags=["authentication"])
    app.include_router(tools.router, prefix="/tools", tags=["tools"])
    app.include_router(admin.router, prefix="/admin", tags=["admin"])
    
    # Add Prometheus metrics endpoint
    metrics_app = make_asgi_app()
    app.mount("/metrics", metrics_app)
    
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request, exc):
        """Handle HTTP exceptions with structured logging."""
        logger.error(
            "HTTP exception occurred",
            status_code=exc.status_code,
            detail=exc.detail,
            path=request.url.path
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail, "type": "http_exception"}
        )
    
    @app.exception_handler(Exception)
    async def general_exception_handler(request, exc):
        """Handle general exceptions with structured logging."""
        logger.error(
            "Unhandled exception occurred",
            exception=str(exc),
            exception_type=type(exc).__name__,
            path=request.url.path
        )
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error", "type": "internal_error"}
        )
    
    return app


# Create the FastAPI app instance
app = create_app()


if __name__ == "__main__":
    import uvicorn
    settings = get_settings()
    uvicorn.run(
        "mcp_server.main:app",
        host=settings.server_host,
        port=settings.server_port,
        reload=settings.debug,
        log_level=settings.log_level.lower()
    )