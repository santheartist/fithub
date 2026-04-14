"""
Profile settings endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_token, verify_password
from app.models.models import User, UserPreferences
from app.schemas.schemas import UserResponse, UserPreferencesResponse, UserPreferencesUpdate
from pydantic import BaseModel
import logging
import os
import uuid
from pathlib import Path

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/profile", tags=["profile"])

# Allowed image file types (MIME types and extensions)
ALLOWED_IMAGE_TYPES = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/gif": [".gif"],
    "image/webp": [".webp"],
    "image/svg+xml": [".svg"],
    "image/bmp": [".bmp"],
    "image/tiff": [".tiff", ".tif"],
    "image/x-icon": [".ico"]
}

# Max file sizes (in bytes)
MAX_PROFILE_PIC_SIZE = 5 * 1024 * 1024  # 5MB
MAX_BANNER_SIZE = 10 * 1024 * 1024  # 10MB

def validate_image_file(file: UploadFile, max_size: int) -> tuple[bool, str]:
    """Validate image file type and size."""
    # Check file size
    if file.file._file.seek(0, 2) > max_size:  # Seek to end to get size
        file.file.seek(0)  # Reset to beginning
        return False, f"File too large. Maximum size: {max_size / 1024 / 1024}MB"
    
    file.file.seek(0)
    
    # Check MIME type
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        allowed_types = ", ".join(ALLOWED_IMAGE_TYPES.keys())
        return False, f"Invalid file type. Allowed types: {allowed_types}"
    
    # Check file extension matches MIME type
    file_ext = Path(file.filename).suffix.lower()
    allowed_exts = ALLOWED_IMAGE_TYPES.get(file.content_type, [])
    
    if file_ext not in allowed_exts:
        return False, f"File extension {file_ext} doesn't match content type {file.content_type}"
    
    return True, ""


class ProfileSettingsUpdate(BaseModel):
    """Schema for updating profile settings."""
    username: str | None = None
    email: str | None = None
    bio: str | None = None


def get_current_user_id(authorization: str = Header(None)) -> int:
    """Extract user ID from authorization header."""
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


@router.get("/me/profile", response_model=UserResponse)
def get_current_user_profile(
    request: Request,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Get current user's profile."""
    user_id = get_current_user_id(authorization)
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Convert relative paths to full URLs
    picture_url = get_full_picture_url(user.profile_picture_url, request)
    banner_url = get_full_picture_url(user.banner_picture_url, request)
    
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        bio=user.bio,
        profile_picture_url=picture_url,
        banner_picture_url=banner_url,
        is_admin=user.is_admin,
        created_at=user.created_at
    )


@router.put("/me/settings", response_model=UserResponse)
def update_profile_settings(
    settings: ProfileSettingsUpdate,
    request: Request,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Update current user's profile settings."""
    user_id = get_current_user_id(authorization)
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update fields if provided
    if settings.username is not None:
        # Check if username is already taken
        existing = db.query(User).filter(User.username == settings.username, User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")
        user.username = settings.username
    
    if settings.email is not None:
        # Check if email is already taken
        existing = db.query(User).filter(User.email == settings.email, User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already taken")
        user.email = settings.email
    
    if settings.bio is not None:
        user.bio = settings.bio
    
    db.commit()
    db.refresh(user)
    
    # Convert relative paths to full URLs
    picture_url = get_full_picture_url(user.profile_picture_url, request)
    banner_url = get_full_picture_url(user.banner_picture_url, request)
    
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        bio=user.bio,
        profile_picture_url=picture_url,
        banner_picture_url=banner_url,
        is_admin=user.is_admin,
        created_at=user.created_at
    )


class UploadResponse(BaseModel):
    """Response schema for file upload."""
    profile_picture_url: str = None
    banner_picture_url: str = None


@router.post("/me/upload-picture")
async def upload_profile_picture(
    request: Request,
    file: UploadFile = File(...),
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Upload profile picture for current user."""
    user_id = get_current_user_id(authorization)
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Validate file
    is_valid, error_msg = validate_image_file(file, MAX_PROFILE_PIC_SIZE)
    if not is_valid:
        logger.warning(f"Invalid profile picture upload attempt: {error_msg}")
        raise HTTPException(status_code=400, detail=error_msg)
    
    try:
        # Create uploads directory if it doesn't exist
        upload_dir = Path("uploads/profiles")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename preserving extension
        file_ext = Path(file.filename).suffix.lower()
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = upload_dir / unique_filename
        
        logger.info(f"Saving profile picture: {unique_filename} (MIME: {file.content_type})")
        
        # Save file
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        
        logger.info(f"Profile picture saved: {file_path}")
        
        # Construct full URL for frontend access
        # Use request base URL to get the backend server address
        relative_path = f"/uploads/profiles/{unique_filename}"
        base_url = str(request.base_url).rstrip('/')
        full_picture_url = f"{base_url}{relative_path}"
        
        # Store relative path in database
        user.profile_picture_url = relative_path
        db.commit()
        db.refresh(user)
        
        logger.info(f"Profile picture uploaded for user {user_id}: {full_picture_url}")
        
        return {
            "profile_picture_url": full_picture_url,
            "filename": unique_filename,
            "message": "Profile picture uploaded successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading profile picture: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error uploading file: {str(e)}"
        )


@router.post("/me/upload-banner")
async def upload_banner_picture(
    request: Request,
    file: UploadFile = File(...),
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Upload banner picture for current user."""
    user_id = get_current_user_id(authorization)
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Validate file
    is_valid, error_msg = validate_image_file(file, MAX_BANNER_SIZE)
    if not is_valid:
        logger.warning(f"Invalid banner upload attempt: {error_msg}")
        raise HTTPException(status_code=400, detail=error_msg)
    
    try:
        # Create uploads directory if it doesn't exist
        upload_dir = Path("uploads/banners")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename preserving extension
        file_ext = Path(file.filename).suffix.lower()
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = upload_dir / unique_filename
        
        logger.info(f"Saving banner picture: {unique_filename} (MIME: {file.content_type})")
        
        # Save file
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        
        logger.info(f"Banner picture saved: {file_path}")
        
        # Construct full URL for frontend access
        # Use request base URL to get the backend server address
        relative_path = f"/uploads/banners/{unique_filename}"
        base_url = str(request.base_url).rstrip('/')
        full_banner_url = f"{base_url}{relative_path}"
        
        # Store relative path in database
        user.banner_picture_url = relative_path
        db.commit()
        db.refresh(user)
        
        logger.info(f"Banner picture uploaded for user {user_id}: {full_banner_url}")
        
        return {
            "banner_picture_url": full_banner_url,
            "filename": unique_filename,
            "message": "Banner picture uploaded successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading banner picture: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error uploading file: {str(e)}"
        )


# ===== User Preferences/Theme Endpoints =====

@router.get("/me/preferences", response_model=UserPreferencesResponse)
def get_user_preferences(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Get current user's theme and color preferences."""
    user_id = get_current_user_id(authorization)
    
    # Get or create user preferences
    preferences = db.query(UserPreferences).filter(UserPreferences.user_id == user_id).first()
    
    if not preferences:
        # Create default preferences if they don't exist
        preferences = UserPreferences(
            user_id=user_id,
            theme_mode="light",
            primary_color="#0066cc",
            accent_color="#f5f5f5",
            text_primary_color="#1a1a1a",
            text_secondary_color="#666666",
            bg_primary_color="#ffffff",
            bg_secondary_color="#f5f5f5"
        )
        db.add(preferences)
        db.commit()
        db.refresh(preferences)
    
    return UserPreferencesResponse.from_orm(preferences)


@router.put("/me/preferences", response_model=UserPreferencesResponse)
def update_user_preferences(
    preferences_update: UserPreferencesUpdate,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Update current user's theme and color preferences."""
    user_id = get_current_user_id(authorization)
    
    # Get or create user preferences
    preferences = db.query(UserPreferences).filter(UserPreferences.user_id == user_id).first()
    
    if not preferences:
        preferences = UserPreferences(user_id=user_id)
        db.add(preferences)
    
    # Update only the provided fields
    if preferences_update.theme_mode is not None:
        preferences.theme_mode = preferences_update.theme_mode
    if preferences_update.primary_color is not None:
        preferences.primary_color = preferences_update.primary_color
    if preferences_update.accent_color is not None:
        preferences.accent_color = preferences_update.accent_color
    if preferences_update.text_primary_color is not None:
        preferences.text_primary_color = preferences_update.text_primary_color
    if preferences_update.text_secondary_color is not None:
        preferences.text_secondary_color = preferences_update.text_secondary_color
    if preferences_update.bg_primary_color is not None:
        preferences.bg_primary_color = preferences_update.bg_primary_color
    if preferences_update.bg_secondary_color is not None:
        preferences.bg_secondary_color = preferences_update.bg_secondary_color
    
    db.commit()
    db.refresh(preferences)
    
    return UserPreferencesResponse.from_orm(preferences)


# ===== Account Deletion Endpoint =====

class DeleteAccountRequest(BaseModel):
    """Request schema for account deletion."""
    password: str


@router.delete("/me/account")
def delete_user_account(
    request_data: DeleteAccountRequest,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Delete current user's account permanently (with password verification)."""
    user_id = get_current_user_id(authorization)
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify password
    if not verify_password(request_data.password, user.password_hash):
        logger.warning(f"Failed account deletion attempt for user {user_id}: incorrect password")
        raise HTTPException(status_code=401, detail="Incorrect password")
    
    try:
        logger.info(f"Deleting user account: {user_id} ({user.username})")
        
        # Delete all user-related data (cascade delete should handle most, but be explicit)
        # 1. Delete user preferences
        db.query(UserPreferences).filter(UserPreferences.user_id == user_id).delete()
        
        # 2. Delete the user (cascade delete will handle related data)
        db.delete(user)
        db.commit()
        
        logger.info(f"Successfully deleted user account: {user_id}")
        return {
            "message": "Account deleted successfully",
            "user_id": user_id
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting user account {user_id}: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Error deleting account. Please try again."
        )
