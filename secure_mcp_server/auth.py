"""
Authentication and session management for MCP server.

Provides Enterprise Identity features:
- Database-backed authentication (no hardcoded users)
- Real password hashing (bcrypt)
- Short-lived access tokens and rotating refresh tokens
- JTI-based token revocation
- Session state tracking with metadata
- Account lockout on failed logins
- OIDC/SAML abstractions for future expansion
"""

import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional, Tuple, List
import bcrypt
import jwt
import structlog
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from .config import Settings
from .database import get_db_manager
from .database.models import User, Session, APIKey, TokenRevocation

logger = structlog.get_logger()


class AuthManager:
    """Manages authentication, token lifecycle, and user context via Database."""
    
    def __init__(self, settings: Settings):
        self.settings = settings
    
    # ------------------------------------------------------------------
    # Password Utilities
    # ------------------------------------------------------------------

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
    
    # ------------------------------------------------------------------
    # Token Lifecycle (Access / Refresh)
    # ------------------------------------------------------------------

    async def create_tokens(self, user: User, session_id: str) -> Tuple[str, str]:
        """Create a short-lived access token and a longer-lived refresh token."""
        now = datetime.now(timezone.utc)
        
        # Access Token (e.g., 15 mins)
        access_exp = now + timedelta(minutes=self.settings.access_token_expire_minutes)
        access_jti = str(uuid.uuid4())
        access_payload = {
            "sub": str(user.id),
            "username": user.username,
            "session_id": session_id,
            "jti": access_jti,
            "type": "access",
            "exp": access_exp,
            "iat": now,
        }
        access_token = jwt.encode(
            access_payload, 
            self.settings.secret_key, 
            algorithm=self.settings.algorithm
        )
        
        # Refresh Token (e.g., 7 days)
        refresh_exp = now + timedelta(days=7)
        refresh_jti = str(uuid.uuid4())
        refresh_payload = {
            "sub": str(user.id),
            "session_id": session_id,
            "jti": refresh_jti,
            "type": "refresh",
            "exp": refresh_exp,
            "iat": now,
        }
        refresh_token = jwt.encode(
            refresh_payload, 
            self.settings.secret_key, 
            algorithm=self.settings.algorithm
        )
        
        return access_token, refresh_token
    
    async def verify_token(self, token: str, token_type: str = "access") -> Optional[Dict[str, Any]]:
        """Verify and decode a JWT token, ensuring it hasn't been revoked."""
        try:
            payload = jwt.decode(
                token, 
                self.settings.secret_key, 
                algorithms=[self.settings.algorithm]
            )
            
            if payload.get("type") != token_type:
                logger.warning("Token type mismatch", expected=token_type, actual=payload.get("type"))
                return None
            
            jti = payload.get("jti")
            if not jti:
                return None
                
            # Check revocation in DB
            db_manager = get_db_manager()
            async with db_manager.get_session_context() as session:
                stmt = select(TokenRevocation).where(TokenRevocation.jti == jti)
                result = await session.execute(stmt)
                revoked = result.scalar_one_or_none()
                if revoked:
                    logger.warning("Attempted to use revoked token", jti=jti)
                    return None
                    
            return payload
            
        except jwt.ExpiredSignatureError:
            logger.debug("Token has expired")
            return None
        except jwt.JWTError as e:
            logger.warning("Token validation failed", error=str(e))
            return None
            
    async def revoke_token(self, token: str, reason: str = "logout") -> bool:
        """Revoke a specific token by adding its JTI to the revocation list."""
        try:
            # Decode without verification just to get JTI and expiry
            payload = jwt.decode(
                token, 
                self.settings.secret_key, 
                algorithms=[self.settings.algorithm],
                options={"verify_exp": False}
            )
            
            jti = payload.get("jti")
            exp = payload.get("exp")
            user_id = payload.get("sub")
            session_id = payload.get("session_id")
            
            if not jti or not exp:
                return False
                
            expires_at = datetime.fromtimestamp(exp, tz=timezone.utc)
            
            db_manager = get_db_manager()
            async with db_manager.get_session_context() as db_session:
                # Check if already revoked
                stmt = select(TokenRevocation).where(TokenRevocation.jti == jti)
                result = await db_session.execute(stmt)
                if result.scalar_one_or_none():
                    return True
                    
                revocation = TokenRevocation(
                    jti=jti,
                    user_id=int(user_id) if user_id and user_id.isdigit() else None,
                    session_id=session_id,
                    expires_at=expires_at,
                    reason=reason
                )
                db_session.add(revocation)
                
            logger.info("Token revoked", jti=jti, reason=reason)
            return True
            
        except Exception as e:
            logger.error("Failed to revoke token", error=str(e))
            return False

    # ------------------------------------------------------------------
    # Authentication Workflows
    # ------------------------------------------------------------------

    async def authenticate_user(
        self, 
        username: str, 
        password: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Optional[Tuple[User, str, str]]:
        """
        Authenticate user, tracking failed attempts/lockouts, 
        and return (User, access_token, refresh_token).
        """
        db_manager = get_db_manager()
        async with db_manager.get_session_context() as db_session:
            stmt = select(User).where(User.username == username)
            result = await db_session.execute(stmt)
            user = result.scalar_one_or_none()
            
            now = datetime.now(timezone.utc)
            
            if not user or not user.is_active:
                logger.warning("Login failed: User not found or inactive", username=username)
                return None
                
            # Check lockout
            if user.locked_until:
                locked_until = user.locked_until
                if locked_until.tzinfo is None:
                    locked_until = locked_until.replace(tzinfo=timezone.utc)
                if locked_until > now:
                    logger.warning("Login failed: Account locked", username=username)
                    return None
                
            if not self.verify_password(password, user.hashed_password):
                # Increment failed attempts
                user.failed_login_attempts += 1
                if user.failed_login_attempts >= 5:
                    user.locked_until = now + timedelta(minutes=15)
                    logger.warning("Account locked due to failed attempts", username=username)
                db_session.add(user)
                return None
                
            # Success! Reset failed attempts
            user.failed_login_attempts = 0
            user.locked_until = None
            user.last_login = now
            
            # Create Session
            session_id = str(uuid.uuid4())
            new_session = Session(
                id=session_id,
                user_id=user.id,
                tenant_id=user.tenant_id,
                ip_address=ip_address,
                user_agent=user_agent,
                expires_at=now + timedelta(days=7),
                is_active=True
            )
            db_session.add(new_session)
            db_session.add(user)
            
            # Generate Tokens
            access_token, refresh_token = await self.create_tokens(user, session_id)
            
            logger.info("User authenticated successfully", username=username, session_id=session_id)
            return user, access_token, refresh_token

    async def logout_user(self, access_token: str, refresh_token: Optional[str] = None) -> bool:
        """Log out user by revoking tokens and deactivating session."""
        payload = await self.verify_token(access_token, "access")
        if not payload:
            return False
            
        session_id = payload.get("session_id")
        
        # Revoke access token
        await self.revoke_token(access_token, reason="logout")
        
        # Revoke refresh token if provided
        if refresh_token:
            await self.revoke_token(refresh_token, reason="logout")
            
        # Deactivate DB session
        if session_id:
            db_manager = get_db_manager()
            async with db_manager.get_session_context() as db_session:
                stmt = update(Session).where(Session.id == session_id).values(is_active=False)
                await db_session.execute(stmt)
                
        logger.info("User logged out", session_id=session_id)
        return True

    # ------------------------------------------------------------------
    # SSO Abstractions (Stubs for Phase 1)
    # ------------------------------------------------------------------

    async def sso_provision_user(self, provider: str, identity_data: Dict[str, Any]) -> User:
        """
        Just-In-Time (JIT) provisioning for SSO users (OIDC/SAML).
        Expected identity_data keys: email, name, subject_id, groups.
        """
        db_manager = get_db_manager()
        async with db_manager.get_session_context() as db_session:
            # Check if exists
            email = identity_data.get("email")
            stmt = select(User).where(User.email == email)
            result = await db_session.execute(stmt)
            user = result.scalar_one_or_none()
            
            if not user:
                # Provision new user
                user = User(
                    username=identity_data.get("subject_id") or email,
                    email=email,
                    full_name=identity_data.get("name"),
                    auth_provider=provider,
                    # dummy password for SSO users
                    hashed_password=self.hash_password(secrets.token_urlsafe(32)),
                    is_active=True,
                )
                db_session.add(user)
                await db_session.flush()
                logger.info("JIT provisioned new SSO user", email=email, provider=provider)
                
            return user

    # ------------------------------------------------------------------
    # API Keys
    # ------------------------------------------------------------------
    
    async def create_api_key(
        self, 
        name: str,
        user_id: Optional[int] = None, 
        service_account_id: Optional[int] = None,
        tenant_id: str = "default",
        permissions: Optional[List[str]] = None,
        allowed_ips: Optional[List[str]] = None,
        environment: str = "production"
    ) -> str:
        """Create a new API key for a user or service account with hashed storage."""
        if not user_id and not service_account_id:
            raise ValueError("Must provide either user_id or service_account_id")
            
        raw_secret = secrets.token_urlsafe(32)
        api_key = f"mcp_{raw_secret}"
        key_hash = hashlib.sha256(raw_secret.encode()).hexdigest()
        prefix = raw_secret[:8]
        
        db_manager = get_db_manager()
        async with db_manager.get_session_context() as db_session:
            new_key = APIKey(
                tenant_id=tenant_id,
                user_id=user_id,
                service_account_id=service_account_id,
                name=name,
                key_hash=key_hash,
                prefix=prefix,
                permissions=permissions or [],
                allowed_ips=allowed_ips or [],
                environment=environment,
                is_active=True
            )
            db_session.add(new_key)
            
        logger.info("API key created", user_id=user_id, service_account_id=service_account_id, name=name)
        return api_key
    
    async def validate_api_key(
        self, 
        api_key: str,
        request_ip: Optional[str] = None,
        environment: str = "production"
    ) -> Optional[Dict[str, Any]]:
        """Validate an API key and return a unified identity context."""
        if not api_key.startswith("mcp_"):
            return None
            
        raw_secret = api_key[4:]
        key_hash = hashlib.sha256(raw_secret.encode()).hexdigest()
        
        db_manager = get_db_manager()
        async with db_manager.get_session_context() as db_session:
            stmt = select(APIKey).where(APIKey.key_hash == key_hash, APIKey.is_active == True)
            result = await db_session.execute(stmt)
            key_record = result.scalar_one_or_none()
            
            if not key_record:
                return None
                
            # Validate Environment
            if key_record.environment != environment and key_record.environment != "*":
                logger.warning("API Key environment mismatch", expected=key_record.environment, actual=environment)
                return None
                
            # Validate IP Allowlist
            if key_record.allowed_ips and request_ip:
                import ipaddress
                ip_obj = ipaddress.ip_address(request_ip)
                allowed = False
                for cidr in key_record.allowed_ips:
                    try:
                        if ip_obj in ipaddress.ip_network(cidr):
                            allowed = True
                            break
                    except ValueError:
                        continue
                if not allowed:
                    logger.warning("API Key IP not allowed", ip=request_ip)
                    return None
                    
            key_record.last_used = datetime.now(timezone.utc)
            db_session.add(key_record)
            
            # Resolve identity
            if key_record.user_id:
                from .database.models import User
                stmt = select(User).where(User.id == key_record.user_id, User.is_active == True)
                result = await db_session.execute(stmt)
                user = result.scalar_one_or_none()
                if user:
                    ctx = self._build_context(user)
                    ctx["api_key_permissions"] = key_record.permissions
                    return ctx
            elif key_record.service_account_id:
                from .database.models import ServiceAccount
                stmt = select(ServiceAccount).where(ServiceAccount.id == key_record.service_account_id, ServiceAccount.is_active == True)
                result = await db_session.execute(stmt)
                sa = result.scalar_one_or_none()
                if sa:
                    is_sa_admin = "admin" in sa.name.lower()
                    return {
                        "user_id": f"sa_{sa.id}",
                        "username": sa.name,
                        "is_admin": is_sa_admin,
                        "tenant_id": sa.tenant_id,
                        "role": "admin" if is_sa_admin else "service_account",
                        "permissions": ["*"] if is_sa_admin else key_record.permissions,
                        "api_key_permissions": key_record.permissions
                    }
            
            return None

    async def revoke_api_key(self, key_id: int) -> bool:
        """Emergency revoke an API key."""
        db_manager = get_db_manager()
        async with db_manager.get_session_context() as db_session:
            stmt = select(APIKey).where(APIKey.id == key_id)
            result = await db_session.execute(stmt)
            key_record = result.scalar_one_or_none()
            if key_record:
                key_record.is_active = False
                db_session.add(key_record)
                logger.warning("API key revoked", key_id=key_id)
                return True
        return False
        
    async def rotate_api_key(self, key_id: int) -> Optional[str]:
        """Rotate an API key: generate new secret, disable old one."""
        db_manager = get_db_manager()
        async with db_manager.get_session_context() as db_session:
            stmt = select(APIKey).where(APIKey.id == key_id)
            result = await db_session.execute(stmt)
            old_key = result.scalar_one_or_none()
            
            if not old_key or not old_key.is_active:
                return None
                
            old_key.is_active = False
            db_session.add(old_key)
            
            raw_secret = secrets.token_urlsafe(32)
            api_key = f"mcp_{raw_secret}"
            key_hash = hashlib.sha256(raw_secret.encode()).hexdigest()
            prefix = raw_secret[:8]
            
            new_key = APIKey(
                tenant_id=old_key.tenant_id,
                user_id=old_key.user_id,
                service_account_id=old_key.service_account_id,
                name=old_key.name + " (Rotated)",
                key_hash=key_hash,
                prefix=prefix,
                permissions=old_key.permissions,
                allowed_ips=old_key.allowed_ips,
                environment=old_key.environment,
                is_active=True
            )
            db_session.add(new_key)
            logger.info("API key rotated", old_key_id=key_id, user_id=old_key.user_id)
            
        return api_key
    
    # ------------------------------------------------------------------
    # Context & Permissions
    # ------------------------------------------------------------------

    async def get_user_context(self, request) -> Optional[Dict[str, Any]]:
        """
        Extract user context from MCP request headers/tokens/query params.
        """
        token = None
        auth_header = getattr(request, "headers", {}).get("Authorization") if request else None
        
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:]
        elif request:
            # Fallback to query parameters (needed for SSE/EventSource which doesn't support headers)
            query_params = getattr(request, "query_params", {})
            token = (
                query_params.get("token") 
                or query_params.get("api_key") 
                or query_params.get("apiKey") 
                or query_params.get("authorization")
            )
            if token and token.startswith("Bearer "):
                token = token[7:]

        if token:
            # Check if it's an API key
            if token.startswith("mcp_"):
                request_ip = getattr(request, "client", [None])[0] if hasattr(request, "client") else None
                if not request_ip:
                    forwarded = getattr(request, "headers", {}).get("x-forwarded-for")
                    if forwarded:
                        request_ip = forwarded.split(",")[0].strip()
                        
                context = await self.validate_api_key(
                    api_key=token, 
                    request_ip=request_ip, 
                    environment=self.settings.environment if hasattr(self.settings, 'environment') else "production"
                )
                if context:
                    return context
                    
            # Check if it's a JWT access token
            else:
                payload = await self.verify_token(token, "access")
                if payload:
                    db_manager = get_db_manager()
                    async with db_manager.get_session_context() as db_session:
                        stmt = select(User).where(User.id == int(payload["sub"]))
                        res = await db_session.execute(stmt)
                        user = res.scalar_one_or_none()
                        if user and user.is_active:
                            return self._build_context(user)
        
        # Fallback to local admin ONLY if running locally without HTTP headers/query params (e.g. true local stdio)
        # If it's an HTTP request (has headers or query_params) but authentication failed/missing, do NOT grant admin.
        is_http = False
        if request:
            has_headers = bool(getattr(request, "headers", None))
            has_query = bool(getattr(request, "query_params", None))
            is_http = has_headers or has_query

        if not is_http:
            return {
                "user_id": "local_admin",
                "username": "local_admin",
                "is_admin": True,
                "tenant_id": "default",
                "role": "admin",
                "permissions": ["*"]
            }
            
        return None

    def _build_context(self, user: User) -> Dict[str, Any]:
        """Build a standardized context dictionary from a User model."""
        return {
            "user_id": str(user.id),
            "username": user.username,
            "is_admin": user.is_admin,
            "tenant_id": user.tenant_id,
            "role": "admin" if user.is_admin else "user",
            # We would load actual permissions from DB in a real system
            "permissions": ["*"] if user.is_admin else []
        }
    
    def check_permission(self, user_context: Dict[str, Any], permission: str) -> bool:
        """Check if user has a specific permission."""
        if not user_context:
            return False
            
        if user_context.get("is_admin", False):
            return True
            
        user_permissions = user_context.get("permissions", [])
        return permission in user_permissions or "*" in user_permissions