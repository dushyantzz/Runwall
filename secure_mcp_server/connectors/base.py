"""Base Connector Abstraction."""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Callable, Optional
from dataclasses import dataclass

@dataclass
class ConnectorMetadata:
    """Metadata describing a connector's governance profile."""
    name: str
    description: str
    category: str
    sensitivity_level: str
    intent_category: str
    resource_types: List[str]
    rate_limit_per_hour: int
    timeout_seconds: int
    is_reversible: bool
    compensation_handler: Optional[str] = None
    permissions_required: List[str] = None

class BaseConnector(ABC):
    """Abstract base class for all Tool Connectors."""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.metadata: Dict[str, ConnectorMetadata] = {}
        self.tools: Dict[str, Callable] = {}
        
    @abstractmethod
    async def initialize(self) -> None:
        """Initialize the connector (e.g., connect to DB, authenticate)."""
        pass
        
    @abstractmethod
    async def shutdown(self) -> None:
        """Clean up resources."""
        pass
        
    def get_tools(self) -> Dict[str, Callable]:
        """Return the dictionary of callable tool functions exposed by this connector."""
        return self.tools
        
    def get_metadata(self) -> Dict[str, ConnectorMetadata]:
        """Return the metadata for the exposed tools."""
        return self.metadata
