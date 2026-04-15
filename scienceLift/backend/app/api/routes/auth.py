"""
Authentication endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Header, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.schemas.schemas import UserCreate, UserResponse, TokenResponse, RefreshTokenRequest
from app.services.user_service import UserService
from app.core.security import create_access_token, create_refresh_token, verify_token, hash_password, verify_password
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


def get_current_user(authorization: str = Header(None)):
    """
    Extract and verify current user from authorization header.
    Returns user_id which can be used to fetch user from DB in endpoint.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.split(" ")[1]
    payload = verify_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return int(user_id)


def get_full_picture_url(relative_path: str | None, request: Request) -> str | None:
    """Convert relative picture path to full URL."""
    if not relative_path:
        return None
    if relative_path.startswith('http://') or relative_path.startswith('https://'):
        return relative_path
    # Construct URL without the API route prefix
    scheme = request.url.scheme
    netloc = request.url.netloc
    return f"{scheme}://{netloc}{relative_path}"


def format_user_response(user, request: Request) -> dict:
    """Format user object with full URLs for pictures."""
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "bio": user.bio,
        "profile_picture_url": get_full_picture_url(user.profile_picture_url, request),
        "banner_picture_url": get_full_picture_url(user.banner_picture_url, request),
        "is_admin": user.is_admin,
        "created_at": user.created_at
    }


class LoginRequest(BaseModel):
    """Login request schema."""
    email: str
    password: str


@router.post("/register", response_model=TokenResponse)
def register(user_data: UserCreate, request: Request, db: Session = Depends(get_db)):
    """Register a new user."""
    try:
        logger.info(f"Registration attempt: {user_data.username} ({user_data.email})")
        
        # Check if user already exists
        if UserService.get_user_by_username(db, user_data.username):
            logger.warning(f"Registration failed: Username already exists - {user_data.username}")
            raise HTTPException(status_code=400, detail="Username already registered")
        
        if UserService.get_user_by_email(db, user_data.email):
            logger.warning(f"Registration failed: Email already exists - {user_data.email}")
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create user
        user = UserService.create_user(db, user_data.username, user_data.email, user_data.password)
        logger.info(f"✓ User registered successfully: {user.username} (ID: {user.id})")
        
        # Create tokens
        access_token = create_access_token({"sub": str(user.id)})
        refresh_token = create_refresh_token({"sub": str(user.id)})
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": format_user_response(user, request)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"✗ Registration error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Registration failed")


@router.post("/login", response_model=TokenResponse)
def login(credentials: LoginRequest, request: Request, db: Session = Depends(get_db)):
    """Login user and return tokens."""
    try:
        logger.info(f"Login attempt: {credentials.email}")
        
        # Find user by email
        user = UserService.get_user_by_email(db, credentials.email)
        if not user:
            logger.warning(f"Login failed: User not found - {credentials.email}")
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        if not verify_password(credentials.password, user.password_hash):
            logger.warning(f"Login failed: Invalid password for user - {credentials.email}")
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        logger.info(f"✓ Login successful: {user.username}")
        
        # Create tokens
        access_token = create_access_token({"sub": str(user.id)})
        refresh_token = create_refresh_token({"sub": str(user.id)})
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": format_user_response(user, request)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"✗ Login error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Login failed")


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(req: RefreshTokenRequest, request: Request, db: Session = Depends(get_db)):
    """Refresh access token using refresh token."""
    # Verify refresh token
    payload = verify_token(req.refresh_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Create new access token
    access_token = create_access_token({"sub": user_id})
    
    return {
        "access_token": access_token,
        "refresh_token": req.refresh_token,  # Return same refresh token
        "token_type": "bearer"
    }
