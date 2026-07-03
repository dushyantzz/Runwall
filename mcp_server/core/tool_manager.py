"""Tool management for MCP Server."""

import asyncio
import importlib
import inspect
import json
from datetime import datetime
from typing import Dict, Any, Optional, List, Callable
from dataclasses import dataclass
from pathlib import Path
import structlog

from ..config import Settings

logger = structlog.get_logger()


@dataclass
class Tool:
    """Represents a tool that can be executed."""
    name: str
    description: str
    category: str
    input_schema: Dict[str, Any]
    function: Callable
    is_active: bool = True
    permissions: List[str] = None
    rate_limit: int = 100  # requests per hour
    timeout: int = 30  # seconds
    
    def __post_init__(self):
        if self.permissions is None:
            self.permissions = []


class ToolManager:
    """Manages tools and their execution."""
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self.tools: Dict[str, Tool] = {}
        self.tool_usage: Dict[str, Dict[str, Any]] = {}
        self.tool_stats: Dict[str, Dict[str, Any]] = {}
    
    async def initialize(self):
        """Initialize the tool manager."""
        logger.info("Initializing Tool Manager")
        
        # Load built-in tools
        await self._load_builtin_tools()
        
        # Load custom tools from plugins directory
        await self._load_custom_tools()
        
        logger.info(f"Tool Manager initialized with {len(self.tools)} tools")
    
    async def _load_builtin_tools(self):
        """Load built-in tools."""
        # Echo tool
        await self.register_tool(
            name="echo",
            description="Echo back the input message",
            category="utility",
            input_schema={
                "type": "object",
                "properties": {
                    "message": {"type": "string", "description": "Message to echo"}
                },
                "required": ["message"]
            },
            function=self._echo_tool
        )
        
        # Calculator tool
        await self.register_tool(
            name="calculator",
            description="Perform basic mathematical calculations",
            category="utility",
            input_schema={
                "type": "object",
                "properties": {
                    "expression": {
                        "type": "string", 
                        "description": "Mathematical expression to evaluate"
                    }
                },
                "required": ["expression"]
            },
            function=self._calculator_tool
        )
        
        # Text processor tool
        await self.register_tool(
            name="text_processor",
            description="Process text with various operations",
            category="text",
            input_schema={
                "type": "object",
                "properties": {
                    "text": {"type": "string", "description": "Text to process"},
                    "operation": {
                        "type": "string", 
                        "enum": ["uppercase", "lowercase", "reverse", "word_count"],
                        "description": "Operation to perform"
                    }
                },
                "required": ["text", "operation"]
            },
            function=self._text_processor_tool
        )
        
        # Date/time tool
        await self.register_tool(
            name="date_time",
            description="Get current date and time information",
            category="utility",
            input_schema={
                "type": "object",
                "properties": {
                    "format": {
                        "type": "string", 
                        "description": "Date format (iso, readable, timestamp)",
                        "default": "iso"
                    },
                    "timezone": {
                        "type": "string", 
                        "description": "Timezone (UTC, local)",
                        "default": "UTC"
                    }
                }
            },
            function=self._date_time_tool
        )
    
    async def _load_custom_tools(self):
        """Load custom tools from plugins directory."""
        plugins_dir = Path("plugins")
        if not plugins_dir.exists():
            return
        
        for plugin_file in plugins_dir.glob("*.py"):
            if plugin_file.name.startswith("_"):
                continue
                
            try:
                # Dynamically import plugin module
                spec = importlib.util.spec_from_file_location(
                    plugin_file.stem, plugin_file
                )
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                
                # Look for tool registration function
                if hasattr(module, "register_tools"):
                    await module.register_tools(self)
                    logger.info(f"Loaded custom tools from {plugin_file.name}")
                    
            except Exception as e:
                logger.error(
                    f"Failed to load plugin {plugin_file.name}", 
                    error=str(e)
                )
    
    async def register_tool(
        self,
        name: str,
        description: str,
        category: str,
        input_schema: Dict[str, Any],
        function: Callable,
        permissions: Optional[List[str]] = None,
        rate_limit: int = 100,
        timeout: int = 30
    ):
        """Register a new tool."""
        if name in self.tools:
            logger.warning(f"Tool {name} already exists, overriding")
        
        tool = Tool(
            name=name,
            description=description,
            category=category,
            input_schema=input_schema,
            function=function,
            permissions=permissions or [],
            rate_limit=rate_limit,
            timeout=timeout
        )
        
        self.tools[name] = tool
        self.tool_stats[name] = {
            "registered_at": datetime.utcnow().isoformat(),
            "execution_count": 0,
            "success_count": 0,
            "error_count": 0,
            "avg_execution_time": 0.0
        }
        
        logger.info(f"Tool registered: {name}")
    
    async def unregister_tool(self, name: str) -> bool:
        """Unregister a tool."""
        if name in self.tools:
            del self.tools[name]
            if name in self.tool_stats:
                del self.tool_stats[name]
            logger.info(f"Tool unregistered: {name}")
            return True
        return False
    
    async def get_available_tools(
        self, 
        user_id: Optional[str] = None, 
        tenant_id: str = "default"
    ) -> List[Tool]:
        """Get list of available tools for a user/tenant."""
        available_tools = []
        
        for tool in self.tools.values():
            if not tool.is_active:
                continue
            
            # Check permissions (simplified for demo)
            # In production, this would check against database permissions
            if tool.permissions and user_id != "admin":
                # Skip tools with special permissions for non-admin users
                if any(perm.startswith("admin:") for perm in tool.permissions):
                    continue
            
            available_tools.append(tool)
        
        return available_tools
    
    async def execute_tool(
        self,
        tool_name: str,
        arguments: Dict[str, Any],
        user_id: Optional[str] = None,
        tenant_id: str = "default",
        session_id: Optional[str] = None
    ) -> Any:
        """Execute a tool with given arguments."""
        if tool_name not in self.tools:
            raise ValueError(f"Tool '{tool_name}' not found")
        
        tool = self.tools[tool_name]
        
        if not tool.is_active:
            raise ValueError(f"Tool '{tool_name}' is not active")
        
        # Check rate limiting
        if not await self._check_rate_limit(tool_name, user_id):
            raise ValueError(f"Rate limit exceeded for tool '{tool_name}'")
        
        # Validate input schema
        try:
            self._validate_input(arguments, tool.input_schema)
        except Exception as e:
            raise ValueError(f"Input validation failed: {str(e)}")
        
        # Record execution start
        start_time = datetime.utcnow()
        
        try:
            # Execute tool function with timeout
            if asyncio.iscoroutinefunction(tool.function):
                result = await asyncio.wait_for(
                    tool.function(arguments),
                    timeout=tool.timeout
                )
            else:
                result = await asyncio.wait_for(
                    asyncio.get_event_loop().run_in_executor(
                        None, tool.function, arguments
                    ),
                    timeout=tool.timeout
                )
            
            # Record successful execution
            execution_time = (datetime.utcnow() - start_time).total_seconds()
            await self._record_execution(tool_name, True, execution_time)
            
            logger.info(
                "Tool executed successfully",
                tool_name=tool_name,
                user_id=user_id,
                session_id=session_id,
                execution_time=execution_time
            )
            
            return result
            
        except asyncio.TimeoutError:
            await self._record_execution(tool_name, False, tool.timeout)
            raise ValueError(f"Tool '{tool_name}' execution timed out")
        
        except Exception as e:
            execution_time = (datetime.utcnow() - start_time).total_seconds()
            await self._record_execution(tool_name, False, execution_time)
            
            logger.error(
                "Tool execution failed",
                tool_name=tool_name,
                user_id=user_id,
                session_id=session_id,
                error=str(e)
            )
            
            raise ValueError(f"Tool execution failed: {str(e)}")
    
    async def list_tools(self) -> List[Tool]:
        """List all registered tools."""
        return list(self.tools.values())
    
    async def get_tool_stats(self, tool_name: Optional[str] = None) -> Dict[str, Any]:
        """Get tool execution statistics."""
        if tool_name:
            return self.tool_stats.get(tool_name, {})
        return self.tool_stats
    
    def _validate_input(self, data: Dict[str, Any], schema: Dict[str, Any]):
        """Validate input data against JSON schema."""
        # Simplified validation - in production, use jsonschema library
        if schema.get("type") == "object":
            properties = schema.get("properties", {})
            required = schema.get("required", [])
            
            # Check required fields
            for field in required:
                if field not in data:
                    raise ValueError(f"Required field '{field}' missing")
            
            # Check field types
            for field, value in data.items():
                if field in properties:
                    field_schema = properties[field]
                    expected_type = field_schema.get("type")
                    
                    if expected_type == "string" and not isinstance(value, str):
                        raise ValueError(f"Field '{field}' must be a string")
                    elif expected_type == "number" and not isinstance(value, (int, float)):
                        raise ValueError(f"Field '{field}' must be a number")
                    elif expected_type == "boolean" and not isinstance(value, bool):
                        raise ValueError(f"Field '{field}' must be a boolean")
    
    async def _check_rate_limit(self, tool_name: str, user_id: Optional[str]) -> bool:
        """Check if tool execution is within rate limits."""
        # Simplified rate limiting - in production, use Redis
        key = f"{tool_name}:{user_id or 'anonymous'}"
        current_time = datetime.utcnow()
        
        if key not in self.tool_usage:
            self.tool_usage[key] = {"count": 0, "window_start": current_time}
        
        usage = self.tool_usage[key]
        tool = self.tools[tool_name]
        
        # Reset window if an hour has passed
        if (current_time - usage["window_start"]).total_seconds() > 3600:
            usage["count"] = 0
            usage["window_start"] = current_time
        
        if usage["count"] >= tool.rate_limit:
            return False
        
        usage["count"] += 1
        return True
    
    async def _record_execution(self, tool_name: str, success: bool, execution_time: float):
        """Record tool execution statistics."""
        if tool_name not in self.tool_stats:
            return
        
        stats = self.tool_stats[tool_name]
        stats["execution_count"] += 1
        
        if success:
            stats["success_count"] += 1
        else:
            stats["error_count"] += 1
        
        # Update average execution time
        total_time = stats["avg_execution_time"] * (stats["execution_count"] - 1)
        stats["avg_execution_time"] = (total_time + execution_time) / stats["execution_count"]
    
    # Built-in tool implementations
    async def _echo_tool(self, args: Dict[str, Any]) -> str:
        """Echo tool implementation."""
        return args.get("message", "")
    
    async def _calculator_tool(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Calculator tool implementation."""
        try:
            expression = args.get("expression", "")
            # Safe evaluation (in production, use a proper math parser)
            allowed_chars = set('0123456789+-*/.() ')
            if not all(c in allowed_chars for c in expression):
                raise ValueError("Invalid characters in expression")
            
            result = eval(expression)  # Note: Use safer alternative in production
            return {"result": result, "expression": expression}
        except Exception as e:
            return {"error": str(e), "expression": expression}
    
    async def _text_processor_tool(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Text processor tool implementation."""
        text = args.get("text", "")
        operation = args.get("operation", "uppercase")
        
        if operation == "uppercase":
            result = text.upper()
        elif operation == "lowercase":
            result = text.lower()
        elif operation == "reverse":
            result = text[::-1]
        elif operation == "word_count":
            result = len(text.split())
        else:
            result = text
        
        return {"result": result, "operation": operation, "original": text}
    
    async def _date_time_tool(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Date/time tool implementation."""
        format_type = args.get("format", "iso")
        timezone = args.get("timezone", "UTC")
        
        now = datetime.utcnow()
        
        if format_type == "iso":
            formatted = now.isoformat()
        elif format_type == "readable":
            formatted = now.strftime("%Y-%m-%d %H:%M:%S")
        elif format_type == "timestamp":
            formatted = str(int(now.timestamp()))
        else:
            formatted = now.isoformat()
        
        return {
            "datetime": formatted,
            "format": format_type,
            "timezone": timezone,
            "timestamp": int(now.timestamp())
        }