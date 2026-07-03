"""MCP Protocol handler implementation."""

import json
import asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime
import structlog
from pydantic import BaseModel, Field

from .security import SecurityManager
from .context_manager import ContextManager
from .tool_manager import ToolManager

logger = structlog.get_logger()


class MCPMessage(BaseModel):
    """Base MCP message structure."""
    jsonrpc: str = Field(default="2.0")
    id: Optional[str] = None
    method: Optional[str] = None
    params: Optional[Dict[str, Any]] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[Dict[str, Any]] = None


class MCPError(BaseModel):
    """MCP error structure."""
    code: int
    message: str
    data: Optional[Dict[str, Any]] = None


class MCPProtocolHandler:
    """Handles MCP protocol messages and routing."""
    
    def __init__(
        self,
        security_manager: SecurityManager,
        context_manager: ContextManager,
        tool_manager: ToolManager
    ):
        self.security_manager = security_manager
        self.context_manager = context_manager
        self.tool_manager = tool_manager
        self.active_sessions: Dict[str, Dict[str, Any]] = {}
        
        # Register protocol handlers
        self.handlers = {
            "initialize": self._handle_initialize,
            "tools/list": self._handle_list_tools,
            "tools/call": self._handle_call_tool,
            "resources/list": self._handle_list_resources,
            "resources/read": self._handle_read_resource,
            "prompts/list": self._handle_list_prompts,
            "prompts/get": self._handle_get_prompt,
            "logging/setLevel": self._handle_set_log_level,
        }
    
    async def handle_message(self, message: Dict[str, Any], session_id: str) -> Dict[str, Any]:
        """Process incoming MCP message."""
        try:
            # Parse and validate message
            mcp_message = MCPMessage(**message)
            
            # Log incoming message
            logger.info(
                "Received MCP message",
                session_id=session_id,
                method=mcp_message.method,
                message_id=mcp_message.id
            )
            
            # Security validation
            if not await self._validate_message_security(mcp_message, session_id):
                return self._create_error_response(
                    mcp_message.id,
                    -32600,  # Invalid Request
                    "Security validation failed"
                )
            
            # Route to appropriate handler
            if mcp_message.method in self.handlers:
                result = await self.handlers[mcp_message.method](
                    mcp_message.params or {}, session_id
                )
                return self._create_success_response(mcp_message.id, result)
            else:
                return self._create_error_response(
                    mcp_message.id,
                    -32601,  # Method not found
                    f"Method '{mcp_message.method}' not found"
                )
                
        except Exception as e:
            logger.error(
                "Error handling MCP message",
                session_id=session_id,
                error=str(e),
                message=message
            )
            return self._create_error_response(
                None,
                -32603,  # Internal error
                "Internal server error"
            )
    
    async def _validate_message_security(self, message: MCPMessage, session_id: str) -> bool:
        """Validate message security and permissions."""
        # Check if session exists and is valid
        if session_id not in self.active_sessions:
            return False
        
        session = self.active_sessions[session_id]
        
        # Check session timeout
        if datetime.now().timestamp() - session.get("last_activity", 0) > 3600:  # 1 hour
            await self._cleanup_session(session_id)
            return False
        
        # Update last activity
        session["last_activity"] = datetime.now().timestamp()
        
        # Method-specific security checks
        if message.method == "tools/call":
            tool_name = message.params.get("name") if message.params else None
            if not await self.security_manager.check_tool_permission(
                session.get("user_id"), tool_name
            ):
                return False
        
        return True
    
    async def _handle_initialize(self, params: Dict[str, Any], session_id: str) -> Dict[str, Any]:
        """Handle MCP initialize request."""
        # Create new session
        self.active_sessions[session_id] = {
            "created_at": datetime.now().timestamp(),
            "last_activity": datetime.now().timestamp(),
            "client_info": params.get("clientInfo", {}),
            "capabilities": params.get("capabilities", {}),
            "user_id": params.get("user_id"),
            "tenant_id": params.get("tenant_id", "default")
        }
        
        # Initialize context for session
        await self.context_manager.create_session_context(session_id)
        
        return {
            "protocolVersion": "2024-11-05",
            "capabilities": {
                "tools": {"listChanged": True},
                "resources": {"subscribe": True, "listChanged": True},
                "prompts": {"listChanged": True},
                "logging": {}
            },
            "serverInfo": {
                "name": "Secure MCP Server Framework",
                "version": "0.1.0"
            }
        }
    
    async def _handle_list_tools(self, params: Dict[str, Any], session_id: str) -> Dict[str, Any]:
        """Handle tools/list request."""
        session = self.active_sessions.get(session_id, {})
        tenant_id = session.get("tenant_id", "default")
        user_id = session.get("user_id")
        
        # Get available tools for user/tenant
        tools = await self.tool_manager.get_available_tools(user_id, tenant_id)
        
        return {
            "tools": [
                {
                    "name": tool.name,
                    "description": tool.description,
                    "inputSchema": tool.input_schema
                }
                for tool in tools
            ]
        }
    
    async def _handle_call_tool(self, params: Dict[str, Any], session_id: str) -> Dict[str, Any]:
        """Handle tools/call request."""
        tool_name = params.get("name")
        arguments = params.get("arguments", {})
        
        if not tool_name:
            raise ValueError("Tool name is required")
        
        session = self.active_sessions.get(session_id, {})
        user_id = session.get("user_id")
        tenant_id = session.get("tenant_id", "default")
        
        # Execute tool with context
        result = await self.tool_manager.execute_tool(
            tool_name=tool_name,
            arguments=arguments,
            user_id=user_id,
            tenant_id=tenant_id,
            session_id=session_id
        )
        
        return {
            "content": [
                {
                    "type": "text",
                    "text": json.dumps(result) if isinstance(result, dict) else str(result)
                }
            ]
        }
    
    async def _handle_list_resources(self, params: Dict[str, Any], session_id: str) -> Dict[str, Any]:
        """Handle resources/list request."""
        # Placeholder for resource management
        return {"resources": []}
    
    async def _handle_read_resource(self, params: Dict[str, Any], session_id: str) -> Dict[str, Any]:
        """Handle resources/read request."""
        # Placeholder for resource reading
        return {"contents": []}
    
    async def _handle_list_prompts(self, params: Dict[str, Any], session_id: str) -> Dict[str, Any]:
        """Handle prompts/list request."""
        # Placeholder for prompt management
        return {"prompts": []}
    
    async def _handle_get_prompt(self, params: Dict[str, Any], session_id: str) -> Dict[str, Any]:
        """Handle prompts/get request."""
        # Placeholder for prompt retrieval
        return {"messages": []}
    
    async def _handle_set_log_level(self, params: Dict[str, Any], session_id: str) -> Dict[str, Any]:
        """Handle logging/setLevel request."""
        level = params.get("level", "info")
        logger.info("Log level set", level=level, session_id=session_id)
        return {}
    
    def _create_success_response(self, message_id: Optional[str], result: Dict[str, Any]) -> Dict[str, Any]:
        """Create successful MCP response."""
        return {
            "jsonrpc": "2.0",
            "id": message_id,
            "result": result
        }
    
    def _create_error_response(
        self, 
        message_id: Optional[str], 
        code: int, 
        message: str, 
        data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create error MCP response."""
        error = {"code": code, "message": message}
        if data:
            error["data"] = data
            
        return {
            "jsonrpc": "2.0",
            "id": message_id,
            "error": error
        }
    
    async def _cleanup_session(self, session_id: str):
        """Clean up expired session."""
        if session_id in self.active_sessions:
            await self.context_manager.cleanup_session_context(session_id)
            del self.active_sessions[session_id]
            logger.info("Session cleaned up", session_id=session_id)
    
    async def cleanup_expired_sessions(self):
        """Clean up all expired sessions."""
        current_time = datetime.now().timestamp()
        expired_sessions = [
            session_id for session_id, session in self.active_sessions.items()
            if current_time - session.get("last_activity", 0) > 3600
        ]
        
        for session_id in expired_sessions:
            await self._cleanup_session(session_id)