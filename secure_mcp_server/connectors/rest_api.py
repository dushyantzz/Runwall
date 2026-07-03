"""
REST API Connector.

Provides HTTP client tools mapped directly from an OpenAPI-like definition.
"""
from typing import Dict, Any
import structlog
import httpx

from .base import BaseConnector, ConnectorMetadata

logger = structlog.get_logger(__name__)


class RestAPIConnector(BaseConnector):
    
    async def initialize(self) -> None:
        self.base_url = self.config.get("base_url", "https://api.example.com")
        self.headers = {"Authorization": f"Bearer {self.config.get('api_key', 'mock_key')}"}
        
        self.metadata["http_get"] = ConnectorMetadata(
            name="http_get",
            description=f"Send an HTTP GET request to {self.base_url}",
            category="network",
            sensitivity_level="public",
            intent_category="read",
            resource_types=["network", "api"],
            rate_limit_per_hour=1000,
            timeout_seconds=10,
            is_reversible=True,
            compensation_handler=None # Can't typically rollback a GET
        )
        self.tools["http_get"] = self._http_get_tool
        
        self.metadata["http_post"] = ConnectorMetadata(
            name="http_post",
            description=f"Send an HTTP POST request to {self.base_url}",
            category="network",
            sensitivity_level="internal",
            intent_category="write",
            resource_types=["network", "api"],
            rate_limit_per_hour=500,
            timeout_seconds=15,
            is_reversible=False # Hard to generically rollback POST without explicit compensate endpoints
        )
        self.tools["http_post"] = self._http_post_tool
        
    async def shutdown(self) -> None:
        pass
        
    async def _http_get_tool(
        self, arguments: Dict[str, Any], user_context: Dict[str, Any], sandbox_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a GET request."""
        path = arguments.get("path", "/")
        url = f"{self.base_url}{path}"
        
        logger.info("Executing HTTP GET via connector", url=url)
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=self.headers, params=arguments.get("params", {}))
                
            return {
                "success": response.is_success,
                "status_code": response.status_code,
                "data": response.text[:1000] # truncate for safety
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
            
    async def _http_post_tool(
        self, arguments: Dict[str, Any], user_context: Dict[str, Any], sandbox_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a POST request."""
        path = arguments.get("path", "/")
        url = f"{self.base_url}{path}"
        
        logger.info("Executing HTTP POST via connector", url=url)
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, headers=self.headers, json=arguments.get("body", {}))
                
            return {
                "success": response.is_success,
                "status_code": response.status_code,
                "data": response.text[:1000]
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
