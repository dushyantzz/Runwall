"""Security management for MCP Server."""

import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
import jwt
from passlib.context import CryptContext
from passlib.hash import bcrypt
import structlog

from ..config import Settings

logger = structlog.get_logger()


class SecurityManager:
    """Handles authentication, authorization, and security policies."""
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.active_tokens: Dict[str, Dict[str, Any]] = {}
        
        # Security policies
        self.max_failed_attempts = 5
        self.lockout_duration = timedelta(minutes=15)
        self.failed_attempts: Dict[str, Dict[str, Any]] = {}
    
    def hash_password(self, password: str) -> str:
        """Hash a password using bcrypt."""
        return self.pwd_context.hash(password)
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash."""
        return self.pwd_context.verify(plain_password, hashed_password)
    
    def create_access_token(
        self, 
        data: Dict[str, Any], 
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """Create a new access token."""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(
                minutes=self.settings.access_token_expire_minutes
            )
        
        to_encode.update({"exp": expire, "type": "access"})
        token = jwt.encode(
            to_encode, 
            self.settings.secret_key, 
            algorithm=self.settings.algorithm
        )
        
        # Store token metadata
        token_id = hashlib.sha256(token.encode()).hexdigest()[:16]
        self.active_tokens[token_id] = {
            "user_id": data.get("sub"),
            "created_at": datetime.utcnow(),
            "expires_at": expire,
            "type": "access"
        }
        
        return token
    
    def create_refresh_token(self, data: Dict[str, Any]) -> str:
        """Create a new refresh token."""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(
            days=self.settings.refresh_token_expire_days
        )
        
        to_encode.update({"exp": expire, "type": "refresh"})
        token = jwt.encode(
            to_encode, 
            self.settings.secret_key, 
            algorithm=self.settings.algorithm
        )
        
        # Store token metadata
        token_id = hashlib.sha256(token.encode()).hexdigest()[:16]
        self.active_tokens[token_id] = {
            "user_id": data.get("sub"),
            "created_at": datetime.utcnow(),
            "expires_at": expire,
            "type": "refresh"
        }
        
        return token
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify and decode a JWT token."""
        try:
            payload = jwt.decode(
                token, 
                self.settings.secret_key, 
                algorithms=[self.settings.algorithm]
            )
            
            # Check if token is revoked
            token_id = hashlib.sha256(token.encode()).hexdigest()[:16]
            if token_id not in self.active_tokens:
                return None
            
            return payload
            
        except jwt.ExpiredSignatureError:
            logger.warning("Token has expired")
            return None
        except jwt.JWTError as e:
            logger.warning("Token validation failed", error=str(e))
            return None
    
    def revoke_token(self, token: str) -> bool:
        """Revoke a token."""
        token_id = hashlib.sha256(token.encode()).hexdigest()[:16]
        if token_id in self.active_tokens:
            del self.active_tokens[token_id]
            logger.info("Token revoked", token_id=token_id)
            return True
        return False
    
    def generate_api_key(self, user_id: str, name: str) -> str:
        """Generate a new API key for a user."""
        # Create a secure random API key
        api_key = f"mcp_{secrets.token_urlsafe(32)}"
        
        # Store API key metadata (in production, this would be in database)
        # For now, we'll use in-memory storage
        api_key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        
        logger.info(
            "API key generated", 
            user_id=user_id, 
            name=name, 
            key_hash=api_key_hash[:8]
        )
        
        return api_key
    
    def validate_api_key(self, api_key: str) -> Optional[Dict[str, Any]]:
        """Validate an API key and return user info."""
        if not api_key.startswith("mcp_"):
            return None
        
        # In production, this would lookup the key in database
        # For now, return a mock user for valid format
        return {
            "user_id": "api_user",
            "permissions": ["tool:execute", "resource:read"]
        }
    
    async def check_rate_limit(self, identifier: str, limit: int = 100, window: int = 3600) -> bool:
        """Check if request is within rate limit."""
        # Simple in-memory rate limiting
        # In production, use Redis or similar
        current_time = datetime.utcnow().timestamp()
        
        if identifier not in self.failed_attempts:
            self.failed_attempts[identifier] = {"count": 0, "window_start": current_time}
            return True
        
        data = self.failed_attempts[identifier]
        
        # Reset window if expired
        if current_time - data["window_start"] > window:
            data["count"] = 0
            data["window_start"] = current_time
        
        # Check limit
        if data["count"] >= limit:
            return False
        
        data["count"] += 1
        return True
    
    async def check_tool_permission(self, user_id: Optional[str], tool_name: Optional[str]) -> bool:
        """Check if user has permission to execute a tool."""
        if not user_id or not tool_name:
            return False
        
        # In production, this would check database permissions
        # For now, implement basic permission logic
        
        # Admin users can execute all tools
        if user_id == "admin":
            return True
        
        # Regular users can execute safe tools
        safe_tools = [
            "echo", "calculator", "text_processor", "date_time", 
            "weather", "translator", "web_search"
        ]
        
        return tool_name in safe_tools
    
    def sanitize_input(self, input_data: Any) -> Any:
        """Sanitize user input to prevent injection attacks."""
        if isinstance(input_data, str):
            # Remove potentially dangerous characters
            dangerous_chars = ["<", ">", "&", '"', "'", ";"]
            for char in dangerous_chars:
                input_data = input_data.replace(char, "")
            return input_data.strip()
        
        elif isinstance(input_data, dict):
            return {k: self.sanitize_input(v) for k, v in input_data.items()}
        
        elif isinstance(input_data, list):
            return [self.sanitize_input(item) for item in input_data]
        
        return input_data
    
    def audit_log(self, event: str, user_id: str, details: Dict[str, Any]):
        """Log security-relevant events for auditing."""
        logger.info(
            "Security audit event",
            event=event,
            user_id=user_id,
            timestamp=datetime.utcnow().isoformat(),
            **details
        )
    
    async def cleanup_expired_tokens(self):
        """Clean up expired tokens from memory."""
        current_time = datetime.utcnow()
        expired_tokens = [
            token_id for token_id, data in self.active_tokens.items()
            if data["expires_at"] < current_time
        ]
        
        for token_id in expired_tokens:
            del self.active_tokens[token_id]
        
        if expired_tokens:
            logger.info(f"Cleaned up {len(expired_tokens)} expired tokens")