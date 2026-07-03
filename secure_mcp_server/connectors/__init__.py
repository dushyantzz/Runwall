"""
Connector Architecture module.
"""
from .base import BaseConnector, ConnectorMetadata
from .registry import ConnectorManager, connector_manager
from .rest_api import RestAPIConnector
from .database import DatabaseConnector
from .shell import ShellConnector

__all__ = [
    "BaseConnector",
    "ConnectorMetadata",
    "ConnectorManager",
    "connector_manager",
    "RestAPIConnector",
    "DatabaseConnector",
    "ShellConnector",
]
