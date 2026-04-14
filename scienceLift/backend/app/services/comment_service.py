"""
Comment-related business logic and service functions.
"""

from sqlalchemy.orm import Session
from app.models.models import Comment, CommentLike
from typing import Optional, List
import logging

logger = logging.getLogger(__name__)


class CommentService:
    """Service for comment-related operations."""
    
    @staticmethod
    def get_paper_comments(db: Session, paper_id: int, skip: int = 0, limit: int = 10) -> List[Comment]:
        """Get comments for a paper (root comments only)."""
        from sqlalchemy.orm import joinedload
        return db.query(Comment).options(
            joinedload(Comment.author),
            joinedload(Comment.likes)
        ).filter(
            Comment.paper_id == paper_id,
            Comment.parent_comment_id == None
        ).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_comment_by_id(db: Session, comment_id: int) -> Optional[Comment]:
        """Get a specific comment by ID."""
        return db.query(Comment).filter(Comment.id == comment_id).first()
    
    @staticmethod
    def create_comment(db: Session, paper_id: int, author_id: int, content: str, parent_comment_id: Optional[int] = None) -> Comment:
        """Create a new comment."""
        comment = Comment(
            paper_id=paper_id,
            author_id=author_id,
            content=content,
            parent_comment_id=parent_comment_id
        )
        db.add(comment)
        db.commit()
        db.refresh(comment)
        return comment
    
    @staticmethod
    def update_comment(db: Session, comment_id: int, content: str) -> Optional[Comment]:
        """Update a comment."""
        comment = CommentService.get_comment_by_id(db, comment_id)
        if comment:
            comment.content = content
            comment.is_edited = True
            db.commit()
            db.refresh(comment)
        return comment
    
    @staticmethod
    def delete_comment(db: Session, comment_id: int) -> bool:
        """Delete a comment."""
        comment = CommentService.get_comment_by_id(db, comment_id)
        if comment:
            db.delete(comment)
            db.commit()
            return True
        return False
