"""Main MCP server implementation using FastMCP."""

import asyncio
import os
import signal
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastmcp import FastMCP
from mcp.types import Resource, Tool
import structlog
import uvicorn
from fastapi import Request
from secure_mcp_server.api.app import app as api_app

from .config import Settings, get_settings
from .auth import AuthManager
from .tools import ToolRegistry
from .security import SecurityManager
from .monitoring import MetricsCollector
from .database import DatabaseManager
from .context import ContextManager
from .governance import (
    IntentClassifier,
    RiskScorer,
    PolicyEvaluator,
    PolicyDecisionType,
)



# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

from secure_mcp_server.database.connection import DatabaseManager, set_db_manager

logger = structlog.get_logger()


class SecureMCPServer:
    """Secure MCP Server with authentication and monitoring."""
    
    def __init__(self, settings: Optional[Settings] = None):
        self.settings = settings or get_settings()
        self.mcp = FastMCP(name="Secure MCP Server Framework")
        self.running = False
        
        # Initialize core components
        self.database_manager = DatabaseManager(self.settings.database_url)
        set_db_manager(self.database_manager)
        
        self.auth_manager = AuthManager(self.settings)
        self.security_manager = SecurityManager(self.settings)
        self.metrics_collector = MetricsCollector()
        self.context_manager = ContextManager(self.settings)
        
        # Initialize governance components
        from secure_mcp_server.governance.quota_manager import QuotaManager
        self.quota_manager = QuotaManager(self.settings)
        
        self.intent_classifier = IntentClassifier()
        self.risk_scorer = RiskScorer(
            weights=self.settings.risk_score_weights,
            high_risk_threshold=self.settings.high_risk_threshold,
            critical_risk_threshold=self.settings.critical_risk_threshold,
        )
        
        # Resolve default policy action from settings
        try:
            default_action = PolicyDecisionType(self.settings.default_policy_action)
        except ValueError:
            default_action = PolicyDecisionType.DENY
        
        self.policy_evaluator = PolicyEvaluator(
            default_action=default_action,
        )
        
        # Initialize tool registry with governance
        self.tool_registry = ToolRegistry(
            auth_manager=self.auth_manager,
            security_manager=self.security_manager,
            metrics_collector=self.metrics_collector,
            context_manager=self.context_manager,
            intent_classifier=self.intent_classifier,
            risk_scorer=self.risk_scorer,
            policy_evaluator=self.policy_evaluator,
            quota_manager=self.quota_manager,
            enable_governance=self.settings.enable_intent_policy,
        )
        
        # Setup MCP server
        self._setup_server()
    
    def _setup_server(self):
        """Setup MCP server with security middleware and tools."""
        
        # Define middleware functions
        async def auth_middleware(request, call_next):
            """Authentication middleware for all MCP requests."""
            self.mcp.current_request = request
            # Extract user context from request if available
            user_context = await self.auth_manager.get_user_context(request)
            
            # Anomaly detection for API keys
            token = None
            auth_header = getattr(request, "headers", {}).get("Authorization", "")
            if auth_header.startswith("Bearer mcp_"):
                token = auth_header[7:]
            else:
                query_params = getattr(request, "query_params", {})
                q_token = query_params.get("token") or query_params.get("api_key") or query_params.get("apiKey") or query_params.get("authorization")
                if q_token:
                    if q_token.startswith("Bearer "):
                        q_token = q_token[7:]
                    if q_token.startswith("mcp_"):
                        token = q_token

            if token:
                request_ip = getattr(request, "client", [None])[0] if hasattr(request, "client") else None
                if not request_ip:
                    request_ip = getattr(request, "headers", {}).get("x-forwarded-for", "").split(",")[0].strip() or None
                await self.security_manager.check_key_anomaly(token, request_ip)
            
            # Add user context to request context if available
            try:
                request.user_context = user_context
            except Exception:
                if hasattr(request, 'fastmcp_context') and request.fastmcp_context is not None:
                    request.fastmcp_context.user_context = user_context
            
            # Log request
            logger.info(
                "MCP request received",
                method=getattr(request, 'method', 'unknown'),
                user_id=user_context.get('user_id') if user_context else None,
                tenant_id=user_context.get('tenant_id', 'default') if user_context else 'default'
            )
            
            # Record metrics
            self.metrics_collector.record_request()
            
            # Continue with request
            response = await call_next(request)
            
            return response
            
        async def security_middleware(request, call_next):
            """Security middleware for input validation and rate limiting."""
            # Rate limiting
            client_id = getattr(request, 'client_id', 'anonymous')
            if not await self.security_manager.check_rate_limit(client_id):
                self.metrics_collector.record_rate_limit_hit()
                raise Exception("Rate limit exceeded")
            
            # Input sanitization: Only sanitize parameters for tool executions
            method = getattr(request, 'method', '')
            if method == 'tools/call' and hasattr(request, 'params'):
                request.params = self.security_manager.sanitize_input(request.params)
            
            response = await call_next(request)
            return response
        
        # Register middleware
        self.mcp.middleware = [auth_middleware, security_middleware]  # FastMCP uses a middleware list
        
        # Register all tools
        self._register_tools()
        
        # Register resources
        self._register_resources()
        
        # Register prompts
        self._register_prompts()
    
    def _register_tools(self):
        """Register all available tools."""
        from secure_mcp_server.admin import register_admin_tools
        register_admin_tools(self.mcp)
        
        @self.mcp.tool()
        async def ping() -> str:
            """Simple health check tool with zero dependencies."""
            return "pong"

        @self.mcp.tool()
        async def echo(text: Optional[str] = None) -> str:
            """Echo back the provided text."""
            return await self.tool_registry.execute_tool(
                'echo', 
                {'text': text}, 
                self.mcp.current_request
            )
        
        @self.mcp.tool()
        async def calculator(expression: Optional[str] = None) -> str:
            """Perform mathematical calculations safely."""
            return await self.tool_registry.execute_tool(
                'calculator', 
                {'expression': expression}, 
                self.mcp.current_request
            )
        
        @self.mcp.tool()
        async def text_processor(text: Optional[str] = None, operation: Optional[str] = None) -> str:
            """Process text with various operations."""
            return await self.tool_registry.execute_tool(
                'text_processor', 
                {'text': text, 'operation': operation}, 
                self.mcp.current_request
            )
        
        @self.mcp.tool()
        async def secure_hash(text: str, algorithm: str = "sha256") -> str:
            """Generate secure hash of text."""
            return await self.tool_registry.execute_tool(
                'secure_hash', 
                {'text': text, 'algorithm': algorithm}, 
                self.mcp.current_request
            )
        
        @self.mcp.tool()
        async def uuid_generator(version: int = 4) -> str:
            """Generate UUID."""
            return await self.tool_registry.execute_tool(
                'uuid_generator', 
                {'version': version}, 
                self.mcp.current_request
            )
        
        @self.mcp.tool() 
        async def datetime_info(timezone: str = "UTC", format_type: str = "iso") -> str:
            """Get current date and time information."""
            return await self.tool_registry.execute_tool(
                'datetime_info', 
                {'timezone': timezone, 'format_type': format_type}, 
                self.mcp.current_request
            )
        
        @self.mcp.tool()
        async def system_info() -> str:
            """Get system information (requires admin privileges)."""
            return await self.tool_registry.execute_tool(
                'system_info', 
                {}, 
                self.mcp.current_request
            )
        
        @self.mcp.tool()
        async def context_summary(session_id: str) -> str:
            """Get context summary for a session."""
            return await self.tool_registry.execute_tool(
                'context_summary', 
                {'session_id': session_id}, 
                self.mcp.current_request
            )
    
    def _register_resources(self):
        """Register MCP resources."""
        
        @self.mcp.resource("config://settings")
        async def get_server_config() -> str:
            """Get server configuration (admin only)."""
            # Check admin privileges
            user_context = self._get_current_user_context()
            if not self._check_admin_access(user_context):
                raise Exception("Admin privileges required")
            
            config = {
                "version": "1.0.0",
                "max_context_length": self.settings.max_context_length,
                "session_timeout_minutes": self.settings.session_timeout_minutes,
                "enable_multi_tenant": self.settings.enable_multi_tenant
            }
            
            return str(config)
        
        @self.mcp.resource("metrics://current")
        async def get_metrics() -> str:
            """Get current metrics (admin only)."""
            # Check admin privileges
            user_context = self._get_current_user_context()
            if not self._check_admin_access(user_context):
                raise Exception("Admin privileges required")
            
            metrics = await self.metrics_collector.get_current_metrics()
            return str(metrics)
    
    def _register_prompts(self):
        """Register MCP prompts."""
        
        @self.mcp.prompt("security-audit")
        async def security_audit_prompt(
            time_range: str = "24h", 
            severity: str = "all"
        ) -> List[Dict[str, Any]]:
            """Generate security audit prompt with recent security events."""
            # Check admin privileges
            user_context = self._get_current_user_context()
            if not self._check_admin_access(user_context):
                raise Exception("Admin privileges required")
            
            events = await self.security_manager.get_audit_events(
                time_range=time_range,
                severity=severity
            )
            
            return [
                {
                    "role": "system",
                    "content": f"Security Audit Report for {time_range}\n\nAnalyze the following security events and provide recommendations:"
                },
                {
                    "role": "user", 
                    "content": f"Security Events:\n{events}"
                }
            ]
        
        @self.mcp.prompt("performance-analysis")
        async def performance_analysis_prompt(
            metric_type: str = "all"
        ) -> List[Dict[str, Any]]:
            """Generate performance analysis prompt with system metrics."""
            metrics = await self.metrics_collector.get_performance_metrics(
                metric_type=metric_type
            )
            
            return [
                {
                    "role": "system",
                    "content": "Analyze the following performance metrics and suggest optimizations:"
                },
                {
                    "role": "user",
                    "content": f"Performance Metrics:\n{metrics}"
                }
            ]
    
    def _get_current_user_context(self) -> Dict[str, Any]:
        """Extract user context from current request."""
        req = self.mcp.current_request
        if not req:
            return {}
        user_ctx = getattr(req, "user_context", None)
        if not user_ctx and hasattr(req, "fastmcp_context") and req.fastmcp_context:
            user_ctx = getattr(req.fastmcp_context, "user_context", {})
        return user_ctx or {}

    def _check_admin_access(self, user_context: Dict[str, Any]) -> bool:
        """Check if user context represents an admin or has admin permissions."""
        if not user_context:
            return False
        if user_context.get("is_admin", False):
            return True
        # Check permissions list
        permissions = user_context.get("permissions", [])
        return "*" in permissions or "admin" in permissions or "admin-gateway" in permissions

    async def initialize(self):
        """Initialize all server components."""
        logger.info("Initializing server components")
        
        # Initialize components in parallel
        await self.database_manager.initialize()
        await self.context_manager.initialize()
        await self.tool_registry.initialize()
        await self.quota_manager.initialize()
        
        logger.info("Server initialization complete")
    
    async def start(self):
        """Start the server."""
        if self.running:
            logger.warning("Server is already running")
            return
        
        logger.info("Starting server")
        self.running = True
        
        # Initialize internal FastMCP server
        # Note: FastMCP doesn't have a start() method, it's ready after initialization
        logger.info("Server started successfully")
    
    async def stop(self):
        """Stop the server."""
        if not self.running:
            logger.warning("Server is not running")
            return
        
        logger.info("Stopping server")
        self.running = False
        
        # Perform cleanup
        await self.cleanup()
        
        logger.info("Server stopped successfully")
    
    async def cleanup(self):
        """Cleanup server resources."""
        logger.info("Starting cleanup")
        
        try:
            # Cleanup components in parallel
            await asyncio.gather(
                self.context_manager.cleanup(),
                self.database_manager.cleanup(),
                # No need for mcp.shutdown() as FastMCP doesn't require explicit cleanup
                return_exceptions=True
            )
        except Exception as e:
            logger.error("Cleanup error", error=str(e))
        
        logger.info("Cleanup complete")


async def amain():
    """Async entry point for the secure MCP server."""
    try:
        # Load settings
        logger.info("Loading settings")
        settings = get_settings()
        
        # Create server
        logger.info("Creating MCP server")
        server = SecureMCPServer(settings)
        
        # Initialize server
        logger.info("Initializing server")
        await server.initialize()
        
        # Start server
        logger.info("Starting server")
        await server.start()
        
        # Initialize and route the Streamable HTTP app
        logger.info("Routing /mcp directly to Streamable HTTP app")
        mcp_http_app = server.mcp.http_app(transport="streamable-http")
        for route in mcp_http_app.routes:
            if route.path == "/mcp":
                api_app.routes.append(route)

        # Mount MCP SSE application at root to expose /sse and /messages
        # (legacy compatibility for older MCP clients)
        logger.info("Mounting MCP SSE app onto REST API app (legacy)")
        mcp_sse_app = server.mcp.http_app(transport="sse")
        api_app.mount("/", mcp_sse_app)

        # Set up combined ASGI lifespan to initialize FastMCP task groups
        from contextlib import asynccontextmanager
        from fastapi import FastAPI

        @asynccontextmanager
        async def combined_lifespan(app: FastAPI):
            logger.info("Executing combined FastAPI and FastMCP lifespans")
            async with mcp_http_app.router.lifespan_context(mcp_http_app):
                async with mcp_sse_app.router.lifespan_context(mcp_sse_app):
                    yield

        api_app.router.lifespan_context = combined_lifespan
        
        # Start API server in the background
        port = int(os.environ.get("PORT", 8000))
        logger.info(f"Starting REST API Control Plane on port {port}")
        config = uvicorn.Config(api_app, host="0.0.0.0", port=port, log_level="info")
        api_server = uvicorn.Server(config)
        
        # Keep server running
        try:
            # api_server.serve() is async and blocks until stopped
            await api_server.serve()
        except asyncio.CancelledError:
            logger.info("Server shutdown requested")
            await server.stop()
            
    except KeyboardInterrupt:
        logger.info("Server shutdown requested")
        if 'server' in locals():
            await server.stop()
    except Exception as e:
        logger.error("Server run error", error=str(e), exc_info=True)
        if 'server' in locals():
            await server.stop()
        raise


def main():
    """Main entry point for the secure MCP server."""
    # Configure event loop policy for Windows
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    
    # Setup signal handlers
    def signal_handler(signum, frame):
        raise KeyboardInterrupt
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        asyncio.run(amain())
    except KeyboardInterrupt:
        logger.info("Server shutdown initiated")
        sys.exit(0)
    except Exception as e:
        logger.error("Fatal error", error=str(e), exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()