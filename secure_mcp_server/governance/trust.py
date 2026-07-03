"""
Tool Trust and Provenance Manager.

This module ensures tools exposed to the agent have not been tampered with
by tracking cryptographic hashes of their source code and descriptions.
"""
import hashlib
import inspect
from typing import Callable, Optional, Dict, Any
import structlog
from datetime import datetime, timezone
from sqlalchemy.future import select

from secure_mcp_server.database import get_db_manager, ToolManifest

logger = structlog.get_logger(__name__)


class ToolTrustManager:
    """Manages the cryptographic trust state of tools."""
    
    @staticmethod
    def compute_hash(content: str) -> str:
        """Compute SHA-256 hash of a string."""
        return hashlib.sha256(content.encode('utf-8')).hexdigest()
        
    @staticmethod
    def get_function_source(func: Callable) -> str:
        """Retrieve the source code of a function safely."""
        try:
            return inspect.getsource(func)
        except Exception:
            # Fallback if source isn't available (e.g., dynamically generated or built-in)
            return func.__name__

    async def verify_tool(self, tool_name: str, func: Callable, description: str) -> Dict[str, Any]:
        """
        Verify the tool against its stored trusted manifest.
        If it's the first time seeing the tool, stores it as the trusted baseline.
        Returns a status dictionary.
        """
        code_content = self.get_function_source(func)
        code_hash = self.compute_hash(code_content)
        desc_hash = self.compute_hash(description or "")
        
        try:
            async with get_db_manager().get_session_context() as db:
                stmt = select(ToolManifest).where(ToolManifest.tool_name == tool_name)
                result = await db.execute(stmt)
                manifest = result.scalars().first()
                
                if not manifest:
                    # First time seeing this tool, establish baseline
                    manifest = ToolManifest(
                        tool_name=tool_name,
                        description_hash=desc_hash,
                        code_hash=code_hash,
                        trust_status="TRUSTED"
                    )
                    db.add(manifest)
                    await db.commit()
                    logger.info("Established trust baseline for new tool", tool=tool_name)
                    return {"status": "TRUSTED", "reason": "Baseline established"}
                
                # Compare hashes
                if manifest.trust_status == "QUARANTINED":
                    return {"status": "QUARANTINED", "reason": "Tool is administratively quarantined"}
                    
                drift_detected = False
                reasons = []
                
                if manifest.code_hash != code_hash:
                    drift_detected = True
                    reasons.append("code_drift")
                    
                if manifest.description_hash != desc_hash:
                    drift_detected = True
                    reasons.append("description_drift")
                    
                if drift_detected:
                    # Automatically quarantine on drift
                    manifest.trust_status = "QUARANTINED"
                    await db.commit()
                    
                    reason_str = ", ".join(reasons)
                    logger.critical(
                        "Tool drift detected! Quarantining tool.", 
                        tool=tool_name, 
                        reasons=reason_str
                    )
                    return {"status": "QUARANTINED", "reason": f"Tampering detected: {reason_str}"}
                
                # Update last verified timestamp
                manifest.last_verified_at = datetime.now(timezone.utc)
                await db.commit()
                
                return {"status": "TRUSTED", "reason": "Hashes match baseline"}
                
        except Exception as e:
            logger.error("Failed to verify tool trust state", error=str(e), tool=tool_name)
            # Fail closed on database errors during security verification
            return {"status": "QUARANTINED", "reason": f"System error during verification: {str(e)}"}
