"""Authentication endpoints."""

from datetime import timedelta
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Form
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
import structlog

from ..core.security import SecurityManager
from ..config import get_settings

logger = structlog.get_logger()
router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")


class Token(BaseModel):
    """Token response model."""
    access_token: str
    token_type: str
    expires_in: int
    refresh_token: Optional[str] = None


class UserCreate(BaseModel):
    """User creation model."""
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class UserResponse(BaseModel):
    """User response model."""
    id: str
    username: str
    email: str
    full_name: Optional[str] = None
    is_active: bool
    is_admin: bool
    tenant_id: str


class APIKeyCreate(BaseModel):
    """API key creation model."""
    name: str
    permissions: Optional[list] = None
    expires_days: Optional[int] = None


class APIKeyResponse(BaseModel):
    """API key response model."""
    key: str
    name: str
    prefix: str
    created_at: str


def get_security_manager() -> SecurityManager:
    """Get security manager dependency."""
    settings = get_settings()
    return SecurityManager(settings)


@router.post("/token", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    security_manager: SecurityManager = Depends(get_security_manager)
) -> Token:
    """Authenticate user and return access token."""
    # In production, validate against database
    # For demo purposes, use hardcoded admin user
    if form_data.username == "admin" and form_data.password == "admin123":
        user_data = {"sub": "admin", "username": "admin", "is_admin": True}
        
        settings = get_settings()
        access_token = security_manager.create_access_token(user_data)
        refresh_token = security_manager.create_refresh_token(user_data)
        
        security_manager.audit_log("login", "admin", {"method": "password"})
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            expires_in=settings.access_token_expire_minutes * 60,
            refresh_token=refresh_token
        )
    
    # Invalid credentials
    security_manager.audit_log("login_failed", form_data.username, {"method": "password"})
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect username or password",
        headers={"WWW-Authenticate": "Bearer"},
    )


@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token: str = Form(...),
    security_manager: SecurityManager = Depends(get_security_manager)
) -> Token:
    """Refresh access token using refresh token."""
    payload = security_manager.verify_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Create new access token
    user_data = {"sub": payload["sub"], "username": payload.get("username")}
    settings = get_settings()
    new_access_token = security_manager.create_access_token(user_data)
    
    return Token(
        access_token=new_access_token,
        token_type="bearer",
        expires_in=settings.access_token_expire_minutes * 60
    )


@router.post("/logout")
async def logout(
    token: str = Depends(oauth2_scheme),
    security_manager: SecurityManager = Depends(get_security_manager)
) -> Dict[str, str]:
    """Logout user and revoke token."""
    payload = security_manager.verify_token(token)
    if payload:
        security_manager.revoke_token(token)
        security_manager.audit_log("logout", payload.get("sub"), {})
    
    return {"message": "Successfully logged out"}


@router.post("/register", response_model=UserResponse)
async def register(
    user_data: UserCreate,
    security_manager: SecurityManager = Depends(get_security_manager)
) -> UserResponse:
    """Register a new user."""
    # In production, this would create user in database
    # For demo, return mock response
    hashed_password = security_manager.hash_password(user_data.password)
    
    security_manager.audit_log("user_registration", user_data.username, {
        "email": user_data.email
    })
    
    return UserResponse(
        id="user_123",
        username=user_data.username,
        email=user_data.email,
        full_name=user_data.full_name,
        is_active=True,
        is_admin=False,
        tenant_id="default"
    )


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    security_manager: SecurityManager = Depends(get_security_manager)
) -> dict:
    """Get current authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = security_manager.verify_token(token)
    if payload is None:
        raise credentials_exception
    
    return payload


@router.post("/api-keys", response_model=APIKeyResponse)
async def create_api_key(
    api_key_data: APIKeyCreate,
    current_user: dict = Depends(get_current_user),
    security_manager: SecurityManager = Depends(get_security_manager)
) -> APIKeyResponse:
    """Create a new API key for the authenticated user."""
    user_id = current_user["sub"]
    api_key = security_manager.generate_api_key(user_id, api_key_data.name)
    
    security_manager.audit_log("api_key_created", user_id, {
        "key_name": api_key_data.name,
        "permissions": api_key_data.permissions
    })
    
    return APIKeyResponse(
        key=api_key,
        name=api_key_data.name,
        prefix=api_key[:8] + "...",
        created_at="2025-10-30T01:00:00Z"
    )


@router.get("/me", response_model=UserResponse)
async def get_user_info(
    current_user: dict = Depends(get_current_user)
) -> UserResponse:
    """Get current user information."""
    return UserResponse(
        id=current_user["sub"],
        username=current_user.get("username", "unknown"),
        email=current_user.get("email", "user@example.com"),
        full_name=current_user.get("full_name"),
        is_active=True,
        is_admin=current_user.get("is_admin", False),
        tenant_id=current_user.get("tenant_id", "default")
    )