"""Authentication and authorization management for MCP server."""

import hashlib
import secrets
from datetime import datetime, timedelta, UTC
from typing import Dict, Any, Optional
import bcrypt
import jwt
import structlog

from .config import Settings

logger = structlog.get_logger()


class AuthManager:
    """Manages authentication and user context for MCP requests."""
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self.active_tokens: Dict[str, Dict[str, Any]] = {}
        
        # Create default admin user
        self.users = {
            settings.admin_username: {
                "id": "admin",
                "username": settings.admin_username,
                "email": settings.admin_email,
                "hashed_password": self.hash_password(settings.admin_password),
                "is_admin": True,
                "is_active": True,
                "tenant_id": settings.default_tenant,
                "created_at": datetime.now(UTC)
            }
        }
        
        # API keys storage
        self.api_keys: Dict[str, Dict[str, Any]] = {}
    
    def hash_password(self, password: str) -> str:
        """Hash a password using bcrypt."""
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash."""
        return bcrypt.checkpw(
            plain_password.encode('utf-8'), 
            hashed_password.encode('utf-8')
        )
    
    def create_access_token(self, data: Dict[str, Any]) -> str:
        """Create a new access token."""
        to_encode = data.copy()
        expire = datetime.now(UTC) + timedelta(
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
            "created_at": datetime.now(UTC),
            "expires_at": expire,
            "type": "access"
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
    
    def authenticate_user(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        """Authenticate user with username and password."""
        user = self.users.get(username)
        if not user:
            return None
        
        if not user["is_active"]:
            return None
        
        if not self.verify_password(password, user["hashed_password"]):
            return None
        
        return user
    
    def create_api_key(self, user_id: str, name: str) -> str:
        """Create a new API key for a user."""
        api_key = f"mcp_{secrets.token_urlsafe(32)}"
        
        self.api_keys[api_key] = {
            "user_id": user_id,
            "name": name,
            "created_at": datetime.now(UTC),
            "last_used": None,
            "is_active": True
        }
        
        logger.info("API key created", user_id=user_id, name=name)
        return api_key
    
    def validate_api_key(self, api_key: str) -> Optional[Dict[str, Any]]:
        """Validate an API key and return user info."""
        key_info = self.api_keys.get(api_key)
        if not key_info or not key_info["is_active"]:
            return None
        
        # Update last used timestamp
        key_info["last_used"] = datetime.now(UTC)
        
        # Get user info
        user_id = key_info["user_id"]
        for user in self.users.values():
            if user["id"] == user_id:
                return user
        
        return None
    
    async def get_user_context(self, request) -> Optional[Dict[str, Any]]:
        """Extract user context from MCP request."""
        # Try to extract authentication from request
        # This is a simplified implementation
        # In production, you'd extract from request headers or session
        
        # For demo purposes, return admin user context
        # In real implementation, parse JWT from request headers
        return {
            "user_id": "admin",
            "username": self.settings.admin_username,
            "is_admin": True,
            "tenant_id": self.settings.default_tenant,
            "permissions": ["*"]  # Admin has all permissions
        }
    
    def check_permission(self, user_context: Dict[str, Any], permission: str) -> bool:
        """Check if user has a specific permission."""
        if not user_context:
            return False
        
        # Admin has all permissions
        if user_context.get("is_admin", False):
            return True
        
        # Check specific permissions
        user_permissions = user_context.get("permissions", [])
        return permission in user_permissions or "*" in user_permissions
    
    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID."""
        for user in self.users.values():
            if user["id"] == user_id:
                return user
        return None