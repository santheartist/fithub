"""
User-related business logic and service functions.
"""

from sqlalchemy.orm import Session
from app.models.models import User
from app.core.security import hash_password, verify_password
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class UserService:
    """Service for user-related operations."""
    
    @staticmethod
    def get_user_by_username(db: Session, username: str) -> Optional[User]:
        """Get user by username."""
        return db.query(User).filter(User.username == username).first()
    
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """Get user by email."""
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        """Get user by ID."""
        return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    def create_user(db: Session, username: str, email: str, password: str) -> User:
        """Create a new user."""
        hashed_password = hash_password(password)
        user = User(
            username=username,
            email=email,
            password_hash=hashed_password
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def verify_password(db: Session, user_id: int, password: str) -> bool:
        """Verify a password for a user."""
        user = UserService.get_user_by_id(db, user_id)
        if not user:
            return False
        return verify_password(password, user.password_hash)
    
    @staticmethod
    def update_user_profile(db: Session, user_id: int, **kwargs) -> Optional[User]:
        """Update user profile information."""
        user = UserService.get_user_by_id(db, user_id)
        if not user:
            return None
        
        for key, value in kwargs.items():
            if hasattr(user, key) and key not in ['id', 'password_hash', 'created_at']:
                setattr(user, key, value)
        
        db.commit()
        db.refresh(user)
        return user
