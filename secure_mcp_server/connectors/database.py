"""
Database Connector.

Exposes SQL execution tools tied to a specific database configuration.
"""
from typing import Dict, Any
import structlog
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

from .base import BaseConnector, ConnectorMetadata

logger = structlog.get_logger(__name__)


class DatabaseConnector(BaseConnector):
    
    async def initialize(self) -> None:
        db_url = self.config.get("url", "sqlite+aiosqlite:///:memory:")
        self.engine = create_async_engine(db_url, echo=False)
        self.async_session_maker = sessionmaker(
            self.engine, class_=AsyncSession, expire_on_commit=False
        )
        
        self.metadata["sql_query"] = ConnectorMetadata(
            name="sql_query",
            description="Execute a SELECT SQL query against the connected database",
            category="database",
            sensitivity_level="internal",
            intent_category="read",
            resource_types=["database"],
            rate_limit_per_hour=2000,
            timeout_seconds=30,
            is_reversible=True
        )
        self.tools["sql_query"] = self._sql_query_tool
        
        self.metadata["sql_execute"] = ConnectorMetadata(
            name="sql_execute",
            description="Execute a mutating SQL statement (INSERT, UPDATE, DELETE)",
            category="database",
            sensitivity_level="restricted",
            intent_category="write",
            resource_types=["database"],
            rate_limit_per_hour=500,
            timeout_seconds=30,
            is_reversible=False
        )
        self.tools["sql_execute"] = self._sql_execute_tool
        
    async def shutdown(self) -> None:
        if hasattr(self, "engine"):
            await self.engine.dispose()
            
    async def _sql_query_tool(
        self, arguments: Dict[str, Any], user_context: Dict[str, Any], sandbox_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a SELECT query."""
        query = arguments.get("query")
        if not query:
            return {"success": False, "error": "query is required"}
            
        logger.info("Executing SQL query via connector")
        
        try:
            async with self.async_session_maker() as session:
                result = await session.execute(text(query))
                rows = result.fetchall()
                # Extremely naive serialization for demonstration
                return {
                    "success": True,
                    "rows_returned": len(rows),
                    "data": [tuple(row) for row in rows][:100] # Cap output
                }
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def _sql_execute_tool(
        self, arguments: Dict[str, Any], user_context: Dict[str, Any], sandbox_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a mutating SQL statement."""
        statement = arguments.get("statement")
        if not statement:
            return {"success": False, "error": "statement is required"}
            
        logger.warning("Executing SQL mutation via connector", statement=statement)
        
        try:
            async with self.async_session_maker() as session:
                result = await session.execute(text(statement))
                await session.commit()
                return {
                    "success": True,
                    "rows_affected": result.rowcount
                }
        except Exception as e:
            return {"success": False, "error": str(e)}
