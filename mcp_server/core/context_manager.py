"""Context management for MCP Server sessions."""

import asyncio
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List, Set
import structlog
from dataclasses import dataclass, asdict

from ..config import Settings

logger = structlog.get_logger()


@dataclass
class ContextItem:
    """Represents a context item in a session."""
    id: str
    type: str  # 'tool', 'resource', 'conversation', 'state'
    data: Dict[str, Any]
    created_at: datetime
    last_accessed: datetime
    access_count: int = 0
    token_cost: int = 0
    priority: int = 1  # 1=high, 2=medium, 3=low


@dataclass
class SessionContext:
    """Represents the complete context for a session."""
    session_id: str
    user_id: Optional[str]
    tenant_id: str
    created_at: datetime
    last_activity: datetime
    items: Dict[str, ContextItem]
    total_tokens: int = 0
    max_tokens: int = 4096
    active_tools: Set[str] = None
    
    def __post_init__(self):
        if self.active_tools is None:
            self.active_tools = set()


class ContextManager:
    """Manages context and token usage for MCP sessions."""
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self.sessions: Dict[str, SessionContext] = {}
        self.cleanup_task: Optional[asyncio.Task] = None
    
    async def initialize(self):
        """Initialize the context manager."""
        logger.info("Initializing Context Manager")
        
        # Start cleanup task
        self.cleanup_task = asyncio.create_task(self._periodic_cleanup())
        
        logger.info("Context Manager initialized")
    
    async def cleanup(self):
        """Cleanup the context manager."""
        if self.cleanup_task:
            self.cleanup_task.cancel()
            try:
                await self.cleanup_task
            except asyncio.CancelledError:
                pass
        
        logger.info("Context Manager cleaned up")
    
    async def create_session_context(
        self, 
        session_id: str, 
        user_id: Optional[str] = None, 
        tenant_id: str = "default"
    ) -> SessionContext:
        """Create a new session context."""
        context = SessionContext(
            session_id=session_id,
            user_id=user_id,
            tenant_id=tenant_id,
            created_at=datetime.utcnow(),
            last_activity=datetime.utcnow(),
            items={},
            max_tokens=self.settings.max_context_length
        )
        
        self.sessions[session_id] = context
        
        logger.info(
            "Session context created",
            session_id=session_id,
            user_id=user_id,
            tenant_id=tenant_id
        )
        
        return context
    
    async def get_session_context(self, session_id: str) -> Optional[SessionContext]:
        """Get session context by ID."""
        context = self.sessions.get(session_id)
        if context:
            context.last_activity = datetime.utcnow()
        return context
    
    async def add_context_item(
        self, 
        session_id: str, 
        item_type: str, 
        data: Dict[str, Any],
        priority: int = 2,
        token_cost: int = 0
    ) -> str:
        """Add an item to session context."""
        context = await self.get_session_context(session_id)
        if not context:
            raise ValueError(f"Session {session_id} not found")
        
        # Generate unique item ID
        import uuid
        item_id = str(uuid.uuid4())
        
        # Create context item
        item = ContextItem(
            id=item_id,
            type=item_type,
            data=data,
            created_at=datetime.utcnow(),
            last_accessed=datetime.utcnow(),
            token_cost=token_cost,
            priority=priority
        )
        
        # Check if adding this item would exceed token limit
        if context.total_tokens + token_cost > context.max_tokens:
            await self._evict_low_priority_items(context, token_cost)
        
        # Add item to context
        context.items[item_id] = item
        context.total_tokens += token_cost
        
        logger.debug(
            "Context item added",
            session_id=session_id,
            item_id=item_id,
            item_type=item_type,
            token_cost=token_cost,
            total_tokens=context.total_tokens
        )
        
        return item_id
    
    async def get_context_item(self, session_id: str, item_id: str) -> Optional[ContextItem]:
        """Get a specific context item."""
        context = await self.get_session_context(session_id)
        if not context:
            return None
        
        item = context.items.get(item_id)
        if item:
            item.last_accessed = datetime.utcnow()
            item.access_count += 1
        
        return item
    
    async def remove_context_item(self, session_id: str, item_id: str) -> bool:
        """Remove a context item."""
        context = await self.get_session_context(session_id)
        if not context:
            return False
        
        item = context.items.pop(item_id, None)
        if item:
            context.total_tokens -= item.token_cost
            logger.debug(
                "Context item removed",
                session_id=session_id,
                item_id=item_id,
                token_cost=item.token_cost,
                total_tokens=context.total_tokens
            )
            return True
        
        return False
    
    async def get_context_summary(self, session_id: str) -> Dict[str, Any]:
        """Get a summary of the session context."""
        context = await self.get_session_context(session_id)
        if not context:
            return {}
        
        item_types = {}
        for item in context.items.values():
            item_types[item.type] = item_types.get(item.type, 0) + 1
        
        return {
            "session_id": session_id,
            "total_items": len(context.items),
            "total_tokens": context.total_tokens,
            "max_tokens": context.max_tokens,
            "token_usage_percent": (context.total_tokens / context.max_tokens) * 100,
            "item_types": item_types,
            "active_tools": list(context.active_tools),
            "created_at": context.created_at.isoformat(),
            "last_activity": context.last_activity.isoformat()
        }
    
    async def load_relevant_context(
        self, 
        session_id: str, 
        query: str, 
        max_items: int = 10
    ) -> List[ContextItem]:
        """Load relevant context items for a query."""
        context = await self.get_session_context(session_id)
        if not context:
            return []
        
        # Simple relevance scoring based on keywords
        query_words = set(query.lower().split())
        scored_items = []
        
        for item in context.items.values():
            # Calculate relevance score
            item_text = json.dumps(item.data).lower()
            item_words = set(item_text.split())
            
            # Keyword overlap score
            overlap = len(query_words.intersection(item_words))
            
            # Recency score (more recent = higher score)
            hours_old = (datetime.utcnow() - item.last_accessed).total_seconds() / 3600
            recency_score = max(0, 1 - hours_old / 24)  # Decay over 24 hours
            
            # Access frequency score
            frequency_score = min(1, item.access_count / 10)  # Cap at 10 accesses
            
            # Priority score (lower priority number = higher score)
            priority_score = (4 - item.priority) / 3
            
            # Combined score
            total_score = (
                overlap * 2 +  # Keyword overlap weighted heavily
                recency_score * 1.5 +
                frequency_score * 1.2 +
                priority_score * 1.0
            )
            
            scored_items.append((total_score, item))
        
        # Sort by score and return top items
        scored_items.sort(key=lambda x: x[0], reverse=True)
        relevant_items = [item for _, item in scored_items[:max_items]]
        
        # Update access times
        for item in relevant_items:
            item.last_accessed = datetime.utcnow()
            item.access_count += 1
        
        return relevant_items
    
    async def register_active_tool(self, session_id: str, tool_name: str):
        """Register a tool as active in the session."""
        context = await self.get_session_context(session_id)
        if context:
            context.active_tools.add(tool_name)
            
            # Limit active tools
            if len(context.active_tools) > self.settings.max_tools_per_session:
                # Remove least recently used tool
                context.active_tools.pop()
    
    async def unregister_active_tool(self, session_id: str, tool_name: str):
        """Unregister a tool from the session."""
        context = await self.get_session_context(session_id)
        if context:
            context.active_tools.discard(tool_name)
    
    async def cleanup_session_context(self, session_id: str):
        """Clean up a session context."""
        if session_id in self.sessions:
            del self.sessions[session_id]
            logger.info("Session context cleaned up", session_id=session_id)
    
    async def _evict_low_priority_items(self, context: SessionContext, needed_tokens: int):
        """Evict low priority items to make room for new ones."""
        # Sort items by priority (high priority first), then by last access
        items_by_priority = sorted(
            context.items.values(),
            key=lambda x: (x.priority, x.last_accessed)
        )
        
        tokens_to_free = needed_tokens
        items_to_remove = []
        
        # Remove items starting from lowest priority
        for item in reversed(items_by_priority):
            if tokens_to_free <= 0:
                break
            
            items_to_remove.append(item.id)
            tokens_to_free -= item.token_cost
        
        # Remove the selected items
        for item_id in items_to_remove:
            item = context.items.pop(item_id)
            context.total_tokens -= item.token_cost
            
            logger.debug(
                "Context item evicted",
                session_id=context.session_id,
                item_id=item_id,
                priority=item.priority,
                token_cost=item.token_cost
            )
    
    async def _periodic_cleanup(self):
        """Periodically clean up expired sessions and items."""
        while True:
            try:
                await asyncio.sleep(300)  # Run every 5 minutes
                
                current_time = datetime.utcnow()
                timeout = timedelta(minutes=self.settings.session_timeout_minutes)
                
                expired_sessions = [
                    session_id for session_id, context in self.sessions.items()
                    if current_time - context.last_activity > timeout
                ]
                
                for session_id in expired_sessions:
                    await self.cleanup_session_context(session_id)
                
                if expired_sessions:
                    logger.info(f"Cleaned up {len(expired_sessions)} expired sessions")
                    
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("Error in periodic cleanup", error=str(e))