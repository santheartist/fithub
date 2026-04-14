"""
User profile API routes.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.schemas import UserResponse, UserUpdate, UserProfileResponse
from app.services.user_service import UserService
from app.api.routes.auth import get_current_user
from app.models.models import User as UserModel

router = APIRouter(prefix="/users", tags=["users"])


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


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    current_user = Depends(get_current_user),
    request: Request = None
):
    """Get current user profile."""
    picture_url = None
    banner_url = None
    if request:
        picture_url = get_full_picture_url(current_user.profile_picture_url, request)
        banner_url = get_full_picture_url(current_user.banner_picture_url, request)
    else:
        picture_url = current_user.profile_picture_url
        banner_url = current_user.banner_picture_url
    
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        bio=current_user.bio,
        profile_picture_url=picture_url,
        banner_picture_url=banner_url,
        is_admin=current_user.is_admin,
        created_at=current_user.created_at
    )


@router.put("/me", response_model=UserResponse)
def update_current_user(
    user_update: UserUpdate,
    current_user = Depends(get_current_user),
    request: Request = None,
    db: Session = Depends(get_db)
):
    """Update current user profile."""
    updated_user = UserService.update_user(db, current_user.id, user_update)
    
    picture_url = None
    banner_url = None
    if request:
        picture_url = get_full_picture_url(updated_user.profile_picture_url, request)
        banner_url = get_full_picture_url(updated_user.banner_picture_url, request)
    else:
        picture_url = updated_user.profile_picture_url
        banner_url = updated_user.banner_picture_url
    
    return UserResponse(
        id=updated_user.id,
        username=updated_user.username,
        email=updated_user.email,
        bio=updated_user.bio,
        profile_picture_url=picture_url,
        banner_picture_url=banner_url,
        is_admin=updated_user.is_admin,
        created_at=updated_user.created_at
    )


@router.get("/{user_id}", response_model=UserProfileResponse)
def get_user_profile(user_id: int, request: Request, db: Session = Depends(get_db)):
    """Get user profile by ID."""
    user = UserService.get_user_by_id(db, user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    profile = UserService.get_user_profile(db, user_id)
    
    # Convert relative paths to full URLs
    picture_url = get_full_picture_url(user.profile_picture_url, request)
    banner_url = get_full_picture_url(user.banner_picture_url, request)
    
    return UserProfileResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        bio=user.bio,
        profile_picture_url=picture_url,
        banner_picture_url=banner_url,
        is_admin=user.is_admin,
        created_at=user.created_at,
        likes_count=profile.get("likes_count", 0),
        comments_count=profile.get("comments_count", 0),
        reposts_count=profile.get("reposts_count", 0)
    )
