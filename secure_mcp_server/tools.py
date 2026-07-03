"""Tool registry and execution management."""

import asyncio
import hashlib
import math
import uuid
import time
import psutil
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Callable
import structlog

from .config import Settings
from .auth import AuthManager
from .security import SecurityManager
from .monitoring import MetricsCollector
from .context import ContextManager

logger = structlog.get_logger()


class ToolRegistry:
    """Registry for managing and executing MCP tools."""
    
    def __init__(
        self,
        auth_manager: AuthManager,
        security_manager: SecurityManager, 
        metrics_collector: MetricsCollector,
        context_manager: ContextManager
    ):
        self.auth_manager = auth_manager
        self.security_manager = security_manager
        self.metrics_collector = metrics_collector
        self.context_manager = context_manager
        
        # Tool implementations
        self.tools: Dict[str, Callable] = {}
        self.tool_metadata: Dict[str, Dict[str, Any]] = {}
        
    async def initialize(self):
        """Initialize tool registry with built-in tools."""
        logger.info("Initializing tool registry")
        
        # Register built-in tools
        await self._register_builtin_tools()
        
        logger.info(f"Tool registry initialized with {len(self.tools)} tools")
    
    async def _register_builtin_tools(self):
        """Register all built-in tools."""
        
        # Echo tool
        self.tools["echo"] = self._echo_tool
        self.tool_metadata["echo"] = {
            "name": "echo",
            "description": "Echo back the provided text",
            "category": "utility",
            "permissions_required": [],
            "rate_limit_per_hour": 1000,
            "timeout_seconds": 5
        }
        
        # Calculator tool
        self.tools["calculator"] = self._calculator_tool
        self.tool_metadata["calculator"] = {
            "name": "calculator",
            "description": "Perform safe mathematical calculations",
            "category": "utility",
            "permissions_required": [],
            "rate_limit_per_hour": 500,
            "timeout_seconds": 10
        }
        
        # Text processor tool
        self.tools["text_processor"] = self._text_processor_tool
        self.tool_metadata["text_processor"] = {
            "name": "text_processor",
            "description": "Process text with various operations",
            "category": "text",
            "permissions_required": [],
            "rate_limit_per_hour": 300,
            "timeout_seconds": 15
        }
        
        # Secure hash tool
        self.tools["secure_hash"] = self._secure_hash_tool
        self.tool_metadata["secure_hash"] = {
            "name": "secure_hash",
            "description": "Generate secure hashes of text",
            "category": "security",
            "permissions_required": [],
            "rate_limit_per_hour": 200,
            "timeout_seconds": 5
        }
        
        # UUID generator tool
        self.tools["uuid_generator"] = self._uuid_generator_tool
        self.tool_metadata["uuid_generator"] = {
            "name": "uuid_generator",
            "description": "Generate UUIDs",
            "category": "utility",
            "permissions_required": [],
            "rate_limit_per_hour": 1000,
            "timeout_seconds": 2
        }
        
        # DateTime info tool
        self.tools["datetime_info"] = self._datetime_info_tool
        self.tool_metadata["datetime_info"] = {
            "name": "datetime_info",
            "description": "Get current date and time information",
            "category": "utility",
            "permissions_required": [],
            "rate_limit_per_hour": 500,
            "timeout_seconds": 5
        }
        
        # System info tool (admin only)
        self.tools["system_info"] = self._system_info_tool
        self.tool_metadata["system_info"] = {
            "name": "system_info",
            "description": "Get system information (admin only)",
            "category": "admin",
            "permissions_required": ["admin"],
            "rate_limit_per_hour": 50,
            "timeout_seconds": 10
        }
        
        # Context summary tool
        self.tools["context_summary"] = self._context_summary_tool
        self.tool_metadata["context_summary"] = {
            "name": "context_summary",
            "description": "Get context summary for a session",
            "category": "context",
            "permissions_required": [],
            "rate_limit_per_hour": 100,
            "timeout_seconds": 5
        }
    
    async def execute_tool(
        self, 
        tool_name: str, 
        arguments: Dict[str, Any], 
        request
    ) -> Dict[str, Any]:
        """Execute a tool with security and monitoring."""
        start_time = time.time()
        
        try:
            # Get user context
            user_context = getattr(request, 'user_context', {})
            user_id = user_context.get('user_id', 'anonymous')
            
            # Validate tool exists
            if tool_name not in self.tools:
                raise ValueError(f"Tool '{tool_name}' not found")
            
            # Check permissions
            if not self.security_manager.validate_tool_access(user_context, tool_name):
                raise PermissionError(f"Access denied to tool '{tool_name}'")
            
            # Check rate limiting
            if not await self.security_manager.check_rate_limit(
                f"tool_{tool_name}_{user_id}",
                limit=self.tool_metadata[tool_name].get("rate_limit_per_hour", 100) // 60
            ):
                raise Exception(f"Rate limit exceeded for tool '{tool_name}'")
            
            # Sanitize input
            clean_arguments = self.security_manager.sanitize_input(arguments)
            
            # Create sandbox context
            sandbox_context = self.security_manager.create_sandbox_context()
            
            # Execute tool with timeout
            timeout = self.tool_metadata[tool_name].get("timeout_seconds", 30)
            tool_func = self.tools[tool_name]
            
            result = await asyncio.wait_for(
                tool_func(clean_arguments, user_context, sandbox_context),
                timeout=timeout
            )
            
            # Record successful execution
            execution_time = time.time() - start_time
            self.metrics_collector.record_tool_execution(
                tool_name, "success", execution_time
            )
            
            logger.info(
                "Tool executed successfully",
                tool_name=tool_name,
                user_id=user_id,
                execution_time=execution_time
            )
            
            return {
                "success": True,
                "result": result,
                "execution_time": execution_time,
                "tool_name": tool_name
            }
            
        except asyncio.TimeoutError:
            execution_time = time.time() - start_time
            self.metrics_collector.record_tool_execution(
                tool_name, "timeout", execution_time
            )
            
            logger.error(
                "Tool execution timed out",
                tool_name=tool_name,
                timeout=timeout
            )
            
            return {
                "success": False,
                "error": f"Tool execution timed out after {timeout} seconds",
                "execution_time": execution_time,
                "tool_name": tool_name
            }
            
        except Exception as e:
            execution_time = time.time() - start_time
            self.metrics_collector.record_tool_execution(
                tool_name, "error", execution_time
            )
            
            logger.error(
                "Tool execution failed",
                tool_name=tool_name,
                error=str(e),
                execution_time=execution_time
            )
            
            return {
                "success": False,
                "error": str(e),
                "execution_time": execution_time,
                "tool_name": tool_name
            }
    
    # Tool implementations
    
    async def _echo_tool(
        self, 
        args: Dict[str, Any], 
        user_context: Dict[str, Any], 
        sandbox: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Echo tool implementation."""
        text = args.get("text", "")
        return {
            "echoed_text": text,
            "length": len(text),
            "user_id": user_context.get("user_id", "anonymous")
        }
    
    async def _calculator_tool(
        self, 
        args: Dict[str, Any], 
        user_context: Dict[str, Any], 
        sandbox: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Safe calculator tool implementation."""
        expression = args.get("expression", "")
        
        try:
            # Safe evaluation using limited namespace
            allowed_names = {
                "__builtins__": {},
                "abs": abs, "round": round, "min": min, "max": max,
                "sum": sum, "pow": pow,
                "math": math
            }
            
            # Remove dangerous characters
            safe_chars = set('0123456789+-*/.() abcdefghijklmnopqrstuvwxyz')
            cleaned_expr = ''.join(c for c in expression.lower() if c in safe_chars)
            
            if not cleaned_expr.strip():
                raise ValueError("Empty or invalid expression")
            
            result = eval(cleaned_expr, allowed_names, {})
            
            return {
                "expression": expression,
                "result": result,
                "result_type": type(result).__name__
            }
            
        except Exception as e:
            return {
                "expression": expression,
                "error": str(e),
                "result": None
            }
    
    async def _text_processor_tool(
        self, 
        args: Dict[str, Any], 
        user_context: Dict[str, Any], 
        sandbox: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Text processing tool implementation."""
        text = args.get("text", "")
        operation = args.get("operation", "uppercase")
        
        operations = {
            "uppercase": lambda t: t.upper(),
            "lowercase": lambda t: t.lower(),
            "title_case": lambda t: t.title(),
            "reverse": lambda t: t[::-1],
            "word_count": lambda t: len(t.split()),
            "char_count": lambda t: len(t),
            "strip": lambda t: t.strip()
        }
        
        if operation not in operations:
            return {
                "text": text,
                "operation": operation,
                "error": f"Unknown operation: {operation}",
                "available_operations": list(operations.keys())
            }
        
        try:
            result = operations[operation](text)
            return {
                "original_text": text,
                "operation": operation,
                "result": result,
                "result_type": type(result).__name__
            }
        except Exception as e:
            return {
                "text": text,
                "operation": operation,
                "error": str(e)
            }
    
    async def _secure_hash_tool(
        self, 
        args: Dict[str, Any], 
        user_context: Dict[str, Any], 
        sandbox: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Secure hash tool implementation."""
        text = args.get("text", "")
        algorithm = args.get("algorithm", "sha256").lower()
        
        supported_algorithms = {
            "md5": hashlib.md5,
            "sha1": hashlib.sha1,
            "sha256": hashlib.sha256,
            "sha512": hashlib.sha512
        }
        
        if algorithm not in supported_algorithms:
            return {
                "text": text,
                "algorithm": algorithm,
                "error": f"Unsupported algorithm: {algorithm}",
                "supported_algorithms": list(supported_algorithms.keys())
            }
        
        try:
            hash_func = supported_algorithms[algorithm]
            hash_value = hash_func(text.encode('utf-8')).hexdigest()
            
            return {
                "text": text,
                "algorithm": algorithm,
                "hash": hash_value,
                "length": len(hash_value)
            }
            
        except Exception as e:
            return {
                "text": text,
                "algorithm": algorithm,
                "error": str(e)
            }
    
    async def _uuid_generator_tool(
        self, 
        args: Dict[str, Any], 
        user_context: Dict[str, Any], 
        sandbox: Dict[str, Any]
    ) -> Dict[str, Any]:
        """UUID generator tool implementation."""
        version = args.get("version", 4)
        
        try:
            if version == 1:
                generated_uuid = str(uuid.uuid1())
            elif version == 4:
                generated_uuid = str(uuid.uuid4())
            else:
                return {
                    "version": version,
                    "error": "Only UUID versions 1 and 4 are supported",
                    "supported_versions": [1, 4]
                }
            
            return {
                "uuid": generated_uuid,
                "version": version,
                "length": len(generated_uuid)
            }
            
        except Exception as e:
            return {
                "version": version,
                "error": str(e)
            }
    
    async def _datetime_info_tool(
        self, 
        args: Dict[str, Any], 
        user_context: Dict[str, Any], 
        sandbox: Dict[str, Any]
    ) -> Dict[str, Any]:
        """DateTime info tool implementation."""
        timezone_str = args.get("timezone", "UTC")
        format_type = args.get("format_type", "iso")
        
        try:
            if timezone_str.upper() == "UTC":
                now = datetime.now(timezone.utc)
            else:
                now = datetime.now()  # Local time
            
            formats = {
                "iso": now.isoformat(),
                "readable": now.strftime("%Y-%m-%d %H:%M:%S %Z"),
                "timestamp": str(int(now.timestamp())),
                "date_only": now.strftime("%Y-%m-%d"),
                "time_only": now.strftime("%H:%M:%S")
            }
            
            if format_type not in formats:
                format_type = "iso"
            
            return {
                "datetime": formats[format_type],
                "timezone": timezone_str,
                "format_type": format_type,
                "timestamp": int(now.timestamp()),
                "iso_format": now.isoformat(),
                "available_formats": list(formats.keys())
            }
            
        except Exception as e:
            return {
                "timezone": timezone_str,
                "format_type": format_type,
                "error": str(e)
            }
    
    async def _system_info_tool(
        self, 
        args: Dict[str, Any], 
        user_context: Dict[str, Any], 
        sandbox: Dict[str, Any]
    ) -> Dict[str, Any]:
        """System info tool implementation (admin only)."""
        if not user_context.get("is_admin", False):
            return {"error": "Admin privileges required"}
        
        try:
            # Get system information
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            return {
                "cpu": {
                    "percent": cpu_percent,
                    "count": psutil.cpu_count()
                },
                "memory": {
                    "total_gb": round(memory.total / (1024**3), 2),
                    "available_gb": round(memory.available / (1024**3), 2),
                    "percent_used": memory.percent
                },
                "disk": {
                    "total_gb": round(disk.total / (1024**3), 2),
                    "free_gb": round(disk.free / (1024**3), 2),
                    "percent_used": round((disk.used / disk.total) * 100, 1)
                },
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    async def _context_summary_tool(
        self, 
        args: Dict[str, Any], 
        user_context: Dict[str, Any], 
        sandbox: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Context summary tool implementation."""
        session_id = args.get("session_id", "default")
        
        try:
            summary = await self.context_manager.get_context_summary(session_id)
            return summary
        except Exception as e:
            return {
                "session_id": session_id,
                "error": str(e)
            }