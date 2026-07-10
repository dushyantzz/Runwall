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
                else {"statement_cache_size": 0}
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
        
        # Seed default policy rules if table is empty
        async with self.session_factory() as session:
            from sqlalchemy import select, func
            from .models import PolicyRule as DBPolicyRule
            stmt = select(func.count()).select_from(DBPolicyRule)
            res = await session.execute(stmt)
            count = res.scalar()
            if count == 0:
                logger.info("Database is empty. Seeding default policy rules.")
                from secure_mcp_server.governance.policy_evaluator import get_default_policy_rules
                default_rules = get_default_policy_rules()
                for r in default_rules:
                    db_rule = DBPolicyRule(
                        id=r.rule_id,
                        name=r.name,
                        description=r.description,
                        priority=r.priority,
                        conditions=r.conditions,
                        action=r.action.value,
                        action_params=r.action_params,
                        is_active=r.is_active,
                        tenant_id=r.tenant_id or "default",
                        version=r.version
                    )
                    session.add(db_rule)
                await session.commit()
                logger.info("Successfully seeded default policy rules.")

        # Seed default service accounts if table is empty
        async with self.session_factory() as session:
            from .models import ServiceAccount as DBServiceAccount
            stmt = select(func.count()).select_from(DBServiceAccount)
            res = await session.execute(stmt)
            count = res.scalar()
            if count == 0:
                logger.info("Database is empty. Seeding default service accounts.")
                demo_sa1 = DBServiceAccount(
                    name="default-agent-sa",
                    description="Default Service Account for Automated Agents",
                    tenant_id="default"
                )
                demo_sa2 = DBServiceAccount(
                    name="production-gateway-sa",
                    description="Production M2M Gateway Account",
                    tenant_id="default"
                )
                demo_sa3 = DBServiceAccount(
                    name="admin-gateway-sa",
                    description="Admin M2M Service Account with elevated privileges",
                    tenant_id="default"
                )
                session.add(demo_sa1)
                session.add(demo_sa2)
                session.add(demo_sa3)
                await session.commit()
                logger.info("Successfully seeded default service accounts.")
        
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
    
    from contextlib import asynccontextmanager
    
    @asynccontextmanager
    async def get_session_context(self) -> AsyncGenerator[AsyncSession, None]:
        """Get a database session as async context manager."""
        session = await self.get_session()
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

def set_db_manager(manager: DatabaseManager):
    """Set the global database manager instance."""
    global db_manager
    db_manager = manager

def get_db_manager() -> DatabaseManager:
    """Get the global database manager instance."""
    if db_manager is None:
        raise RuntimeError("Database manager not initialized")
    return db_manager

async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting database session in FastAPI routes."""
    async with get_db_manager().get_session_context() as session:
        yield session