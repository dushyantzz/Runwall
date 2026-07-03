"""Context management for Secure MCP Server."""

import asyncio
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from dataclasses import dataclass, field
import structlog

logger = structlog.get_logger()


@dataclass
class ContextItem:
    id: str
    type: str
    data: Dict[str, Any]
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_accessed: datetime = field(default_factory=datetime.utcnow)
    access_count: int = 0
    token_cost: int = 0
    priority: int = 2  # 1=high,2=med,3=low


@dataclass
class SessionContext:
    session_id: str
    user_id: Optional[str]
    tenant_id: str
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_activity: datetime = field(default_factory=datetime.utcnow)
    items: Dict[str, ContextItem] = field(default_factory=dict)
    total_tokens: int = 0
    max_tokens: int = 8192
    active_tools: List[str] = field(default_factory=list)


class ContextManager:
    """Manages session contexts, token budgets, and eviction."""

    def __init__(self, settings):
        self.settings = settings
        self.sessions: Dict[str, SessionContext] = {}
        self._cleanup_task: Optional[asyncio.Task] = None

    async def initialize(self):
        self._cleanup_task = asyncio.create_task(self._periodic_cleanup())
        logger.info("ContextManager initialized")

    async def cleanup(self):
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
        logger.info("ContextManager cleaned up")

    async def create_session(self, session_id: str, user_id: Optional[str], tenant_id: str = "default") -> SessionContext:
        ctx = SessionContext(
            session_id=session_id,
            user_id=user_id,
            tenant_id=tenant_id,
            max_tokens=getattr(self.settings, "max_context_length", 8192),
        )
        self.sessions[session_id] = ctx
        logger.info("Session created", session_id=session_id, user_id=user_id)
        return ctx

    async def get_session(self, session_id: str) -> Optional[SessionContext]:
        ctx = self.sessions.get(session_id)
        if ctx:
            ctx.last_activity = datetime.utcnow()
        return ctx

    async def add_item(self, session_id: str, item_type: str, data: Dict[str, Any], token_cost: int = 0, priority: int = 2) -> str:
        import uuid
        ctx = await self.get_session(session_id)
        if not ctx:
            raise ValueError("Session not found")
        item_id = str(uuid.uuid4())
        if ctx.total_tokens + token_cost > ctx.max_tokens:
            await self._evict_for_space(ctx, token_cost)
        ctx.items[item_id] = ContextItem(id=item_id, type=item_type, data=data, token_cost=token_cost, priority=priority)
        ctx.total_tokens += token_cost
        return item_id

    async def get_context_summary(self, session_id: str) -> Dict[str, Any]:
        ctx = await self.get_session(session_id)
        if not ctx:
            return {"error": "session_not_found", "session_id": session_id}
        counts: Dict[str, int] = {}
        for it in ctx.items.values():
            counts[it.type] = counts.get(it.type, 0) + 1
        return {
            "session_id": session_id,
            "user_id": ctx.user_id,
            "tenant_id": ctx.tenant_id,
            "total_items": len(ctx.items),
            "total_tokens": ctx.total_tokens,
            "max_tokens": ctx.max_tokens,
            "by_type": counts,
            "active_tools": ctx.active_tools,
            "created_at": ctx.created_at.isoformat(),
            "last_activity": ctx.last_activity.isoformat(),
        }

    async def _evict_for_space(self, ctx: SessionContext, need: int):
        # Evict lowest priority and least recently accessed until enough space
        by_priority = sorted(ctx.items.values(), key=lambda x: (x.priority, x.last_accessed))
        to_free = need
        for it in reversed(by_priority):
            if to_free <= 0:
                break
            removed = ctx.items.pop(it.id, None)
            if removed:
                ctx.total_tokens -= removed.token_cost
                to_free -= removed.token_cost
                logger.info("Evicted context item", item_id=removed.id, token_cost=removed.token_cost)

    async def _periodic_cleanup(self):
        timeout = timedelta(minutes=getattr(self.settings, "session_timeout_minutes", 60))
        while True:
            try:
                await asyncio.sleep(300)
                now = datetime.utcnow()
                expired = [sid for sid, s in self.sessions.items() if now - s.last_activity > timeout]
                for sid in expired:
                    del self.sessions[sid]
                    logger.info("Session expired", session_id=sid)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("Context cleanup error", error=str(e))
