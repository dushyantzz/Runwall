"""Database connection and session management."""

import asyncio
from typing import Optional, AsyncGenerator
from sqlalchemy.ext.asyncio import (
    create_async_engine, AsyncSession, async_sessionmaker
)
from sqlalchemy.orm import declarative_base
from sqlalchemy import event
import structlog

from .models import Base

logger = structlog.get_logger()


class DatabaseManager:
    """Manages database connections and sessions."""
    
    def __init__(self, database_url: str):
        self.database_url = database_url
        self.engine = None
        self.session_factory = None
    
    async def initialize(self):
        """Initialize database connection and create tables."""
        logger.info("Initializing database connection", url=self.database_url)
        
        # Create async engine
        self.engine = create_async_engine(
            self.database_url,
            echo=False,  # Set to True for SQL logging in development
            pool_pre_ping=True,
            pool_recycle=3600,
            connect_args=(
                {"check_same_thread": False} 
                if "sqlite" in self.database_url 
                else {}
            )
        )
        
        # Create session factory
        self.session_factory = async_sessionmaker(
            self.engine,
            class_=AsyncSession,
            expire_on_commit=False
        )
        
        # Create tables
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        logger.info("Database initialized successfully")
    
    async def cleanup(self):
        """Clean up database connections."""
        if self.engine:
            await self.engine.dispose()
            logger.info("Database connections closed")
    
    async def get_session(self) -> AsyncSession:
        """Get a database session."""
        if not self.session_factory:
            raise RuntimeError("Database not initialized")
        return self.session_factory()
    
    async def get_session_context(self) -> AsyncGenerator[AsyncSession, None]:
        """Get a database session as async context manager."""
        async with self.get_session() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()
    
    async def health_check(self) -> bool:
        """Check database health."""
        try:
            async with self.get_session() as session:
                await session.execute("SELECT 1")
                return True
        except Exception as e:
            logger.error("Database health check failed", error=str(e))
            return False


# Global database manager instance
db_manager: Optional[DatabaseManager] = None


def get_db_manager() -> DatabaseManager:
    """Get the global database manager instance."""
    if db_manager is None:
        raise RuntimeError("Database manager not initialized")
    return db_manager


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting database session in FastAPI routes."""
    async with get_db_manager().get_session_context() as session:
        yield session