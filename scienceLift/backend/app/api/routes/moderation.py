"""
Moderation endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import User, Comment, ResearchPaper
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/moderation", tags=["moderation"])


@router.get("/comments/flagged")
def get_flagged_comments(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get flagged comments (admin only)."""
    # Check if user is admin
    if not getattr(current_user, 'is_admin', False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access moderation endpoints"
        )
    
    # TODO: Implement flagged comments retrieval
    # For now, return empty list
    return {"flagged_comments": []}


@router.post("/comments/{comment_id}/flag")
def flag_comment(
    comment_id: int,
    reason: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Flag a comment for moderation review."""
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    # TODO: Store flag in database
    logger.info(f"User {current_user.id} flagged comment {comment_id} for reason: {reason}")
    
    return {"status": "flagged", "comment_id": comment_id}


@router.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a comment (owner or admin only)."""
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    # Check permissions
    is_owner = comment.user_id == current_user.id
    is_admin = getattr(current_user, 'is_admin', False)
    
    if not (is_owner or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this comment"
        )
    
    db.delete(comment)
    db.commit()
    
    logger.info(f"Comment {comment_id} deleted by user {current_user.id}")
    return {"status": "deleted"}


@router.get("/papers/{paper_id}/report-count")
def get_paper_report_count(
    paper_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get number of reports for a paper (admin only)."""
    if not getattr(current_user, 'is_admin', False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access this endpoint"
        )
    
    paper = db.query(ResearchPaper).filter(ResearchPaper.id == paper_id).first()
    if not paper:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paper not found"
        )
    
    # TODO: Implement report counting
    return {"paper_id": paper_id, "report_count": 0}


@router.post("/papers/{paper_id}/report")
def report_paper(
    paper_id: int,
    reason: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Report a paper for policy violation."""
    paper = db.query(ResearchPaper).filter(ResearchPaper.id == paper_id).first()
    if not paper:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paper not found"
        )
    
    # TODO: Store report in database
    logger.info(f"User {current_user.id} reported paper {paper_id} for reason: {reason}")
    
    return {"status": "reported", "paper_id": paper_id}


@router.get("/stats")
def get_moderation_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get moderation statistics (admin only)."""
    if not getattr(current_user, 'is_admin', False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access this endpoint"
        )
    
    # Count comments
    total_comments = db.query(Comment).count()
    
    # Return stats
    return {
        "total_comments": total_comments,
        "flagged_count": 0,  # TODO: Implement
        "reports_pending": 0  # TODO: Implement
    }
