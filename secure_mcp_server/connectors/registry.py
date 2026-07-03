"""
Connector Registry.

Manages the lifecycle of multiple system connectors and integrates their dynamically 
generated tools into the central ToolRegistry.
"""
from typing import Dict, Any, List
import structlog

from .base import BaseConnector

logger = structlog.get_logger(__name__)

class ConnectorManager:
    """Manages system connectors and tool registration."""
    
    def __init__(self):
        self.connectors: Dict[str, BaseConnector] = {}
        
    def register_connector(self, name: str, connector: BaseConnector) -> None:
        """Register a new connector instance."""
        self.connectors[name] = connector
        logger.info("Connector registered", connector_name=name)
        
    async def initialize_all(self) -> None:
        """Initialize all registered connectors."""
        for name, connector in self.connectors.items():
            try:
                await connector.initialize()
                logger.info("Connector initialized", connector_name=name)
            except Exception as e:
                logger.error("Failed to initialize connector", connector_name=name, error=str(e))
                
    async def shutdown_all(self) -> None:
        """Shutdown all registered connectors."""
        for name, connector in self.connectors.items():
            try:
                await connector.shutdown()
                logger.info("Connector shut down", connector_name=name)
            except Exception as e:
                logger.error("Failed to shutdown connector", connector_name=name, error=str(e))
                
    def inject_tools(self, tool_registry: Any) -> None:
        """Inject all connector tools into the target ToolRegistry."""
        for name, connector in self.connectors.items():
            tools = connector.get_tools()
            metadata = connector.get_metadata()
            
            for tool_name, tool_func in tools.items():
                if tool_name in metadata:
                    meta = metadata[tool_name]
                    # Convert ConnectorMetadata dataclass to dictionary expected by ToolRegistry
                    meta_dict = {
                        "name": meta.name,
                        "description": meta.description,
                        "category": meta.category,
                        "sensitivity_level": meta.sensitivity_level,
                        "intent_category": meta.intent_category,
                        "resource_types": meta.resource_types,
                        "rate_limit_per_hour": meta.rate_limit_per_hour,
                        "timeout_seconds": meta.timeout_seconds,
                        "is_reversible": meta.is_reversible,
                        "permissions_required": meta.permissions_required or []
                    }
                    if meta.compensation_handler:
                        meta_dict["compensation_handler"] = meta.compensation_handler
                        
                    tool_registry.tools[tool_name] = tool_func
                    tool_registry.tool_metadata[tool_name] = meta_dict
                    logger.debug("Injected connector tool", tool_name=tool_name, connector=name)
        
        logger.info("Finished injecting connector tools into registry")

# Global singleton
connector_manager = ConnectorManager()
