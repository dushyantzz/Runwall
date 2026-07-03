"""
Taint Tracking Engine for execution governance.

This module provides the capability to track whether an AI agent's session
has been exposed to untrusted or sensitive data sources, ensuring that subsequent
actions taken by the agent are governed by the policy engine according to its
taint exposure.
"""

from enum import Enum
from typing import List, Optional, Set
import structlog
from sqlalchemy.future import select

from secure_mcp_server.database import get_db_manager, Session as DBSession

logger = structlog.get_logger(__name__)


class TaintLabel(str, Enum):
    """Canonical taint labels."""
    EXTERNAL_WEB = "EXTERNAL_WEB"
    EMAIL = "EMAIL"
    USER_UPLOAD = "USER_UPLOAD"
    UNTRUSTED_API = "UNTRUSTED_API"
    SENSITIVE_PII = "SENSITIVE_PII"
    FINANCIAL_DATA = "FINANCIAL_DATA"


class TaintManager:
    """Manages the taint state of active sessions."""

    async def get_session_taints(self, session_id: str) -> List[str]:
        """Fetch all taint labels associated with a session."""
        if not session_id:
            return []
            
        try:
            async with get_db_manager().get_session_context() as db:
                stmt = select(DBSession).where(DBSession.id == session_id)
                result = await db.execute(stmt)
                session = result.scalars().first()
                if session and session.taint_labels:
                    return list(session.taint_labels)
        except Exception as e:
            logger.error("Failed to fetch session taints", session_id=session_id, error=str(e))
        
        return []

    async def add_taint(self, session_id: str, label: str) -> bool:
        """Append a taint label to a session."""
        if not session_id or not label:
            return False
            
        try:
            async with get_db_manager().get_session_context() as db:
                stmt = select(DBSession).where(DBSession.id == session_id)
                result = await db.execute(stmt)
                session = result.scalars().first()
                
                if session:
                    current_taints = set(session.taint_labels or [])
                    if label not in current_taints:
                        current_taints.add(label)
                        session.taint_labels = list(current_taints)
                        await db.commit()
                        logger.warning("Session tainted", session_id=session_id, label=label)
                        return True
        except Exception as e:
            logger.error("Failed to add taint to session", session_id=session_id, label=label, error=str(e))
            
        return False
        
    def check_tool_taint_source(self, tool_name: str, tool_metadata: dict) -> Optional[str]:
        """
        Check if a tool is a known taint source and return the corresponding label.
        In production, this could be driven by the database tool registry.
        """
        # Hardcoded for demonstration.
        # In a real app, `tool_metadata` would contain `taint_source: "EXTERNAL_WEB"`
        taint_map = {
            "fetch_webpage": TaintLabel.EXTERNAL_WEB,
            "read_email": TaintLabel.EMAIL,
            "download_attachment": TaintLabel.USER_UPLOAD,
            "query_external_api": TaintLabel.UNTRUSTED_API,
            "get_billing_data": TaintLabel.FINANCIAL_DATA,
        }
        
        # Override with metadata if present
        if tool_metadata and "taint_source" in tool_metadata:
            return tool_metadata["taint_source"]
            
        return taint_map.get(tool_name)
