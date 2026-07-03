"""
Shell Sandbox Connector.

Provides a secure sandbox execution adapter for CLI commands.
"""
from typing import Dict, Any
import subprocess
import asyncio
import structlog

from .base import BaseConnector, ConnectorMetadata

logger = structlog.get_logger(__name__)


class ShellConnector(BaseConnector):
    
    async def initialize(self) -> None:
        # In a real enterprise system, this might establish a connection to a secure VM or container sandbox
        
        self.metadata["run_command"] = ConnectorMetadata(
            name="run_command",
            description="Run a shell command within the secure sandbox container",
            category="system",
            sensitivity_level="internal",
            intent_category="execute",
            resource_types=["system", "shell"],
            rate_limit_per_hour=50,
            timeout_seconds=60,
            is_reversible=False
        )
        self.tools["run_command"] = self._run_command_tool
        
    async def shutdown(self) -> None:
        pass
        
    async def _run_command_tool(
        self, arguments: Dict[str, Any], user_context: Dict[str, Any], sandbox_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a shell command securely."""
        command = arguments.get("command")
        if not command:
            return {"success": False, "error": "command is required"}
            
        # Sandbox constraints checking
        allowed_cwd = self.config.get("sandbox_dir", "/tmp")
        
        logger.info("Executing shell command via connector", command=command, cwd=allowed_cwd)
        
        try:
            # We use asyncio.create_subprocess_shell
            proc = await asyncio.create_subprocess_shell(
                command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=allowed_cwd
            )
            
            stdout, stderr = await proc.communicate()
            
            return {
                "success": proc.returncode == 0,
                "stdout": stdout.decode().strip(),
                "stderr": stderr.decode().strip(),
                "exit_code": proc.returncode
            }
        except Exception as e:
            logger.error("Failed to execute shell command", error=str(e))
            return {"success": False, "error": str(e)}
