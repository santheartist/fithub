"""
Paper interaction endpoints (likes, saves, reposts, comments).
"""

from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.core.security import verify_token
from app.models.models import Like, SavedPaper, Repost, ResearchPaper, User
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/papers", tags=["interactions"])


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


@router.post("/{paper_id}/like")
def like_paper(
    paper_id: int,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Like a paper."""
    user_id = get_current_user_id(authorization)
    
    # Check if paper exists
    paper = db.query(ResearchPaper).filter(ResearchPaper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    # Check if already liked
    existing_like = db.query(Like).filter(
        Like.paper_id == paper_id,
        Like.user_id == user_id
    ).first()
    
    if existing_like:
        raise HTTPException(status_code=400, detail="Paper already liked")
    
    # Create like
    like = Like(paper_id=paper_id, user_id=user_id)
    db.add(like)
    db.commit()
    
    return {"message": "Paper liked"}


@router.delete("/{paper_id}/like")
def unlike_paper(
    paper_id: int,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Unlike a paper."""
    user_id = get_current_user_id(authorization)
    
    like = db.query(Like).filter(
        Like.paper_id == paper_id,
        Like.user_id == user_id
    ).first()
    
    if not like:
        raise HTTPException(status_code=404, detail="Like not found")
    
    db.delete(like)
    db.commit()
    
    return {"message": "Paper unliked"}


@router.post("/user/save/{paper_id}")
def save_paper(
    paper_id: int,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Save a paper."""
    user_id = get_current_user_id(authorization)
    
    # Check if paper exists
    paper = db.query(ResearchPaper).filter(ResearchPaper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    # Check if already saved
    existing_save = db.query(SavedPaper).filter(
        SavedPaper.paper_id == paper_id,
        SavedPaper.user_id == user_id
    ).first()
    
    if existing_save:
        raise HTTPException(status_code=400, detail="Paper already saved")
    
    # Create save
    saved = SavedPaper(paper_id=paper_id, user_id=user_id)
    db.add(saved)
    db.commit()
    
    return {"message": "Paper saved"}


@router.delete("/user/save/{paper_id}")
def unsave_paper(
    paper_id: int,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Unsave a paper."""
    user_id = get_current_user_id(authorization)
    
    saved = db.query(SavedPaper).filter(
        SavedPaper.paper_id == paper_id,
        SavedPaper.user_id == user_id
    ).first()
    
    if not saved:
        raise HTTPException(status_code=404, detail="Saved paper not found")
    
    db.delete(saved)
    db.commit()
    
    return {"message": "Paper removed from saved"}


@router.post("/user/repost/{paper_id}")
def repost_paper(
    paper_id: int,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Repost a paper."""
    user_id = get_current_user_id(authorization)
    
    # Check if paper exists
    paper = db.query(ResearchPaper).filter(ResearchPaper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    # Check if already reposted
    existing_repost = db.query(Repost).filter(
        Repost.paper_id == paper_id,
        Repost.user_id == user_id
    ).first()
    
    if existing_repost:
        raise HTTPException(status_code=400, detail="Paper already reposted")
    
    # Create repost
    repost = Repost(paper_id=paper_id, user_id=user_id)
    db.add(repost)
    db.commit()
    
    return {"message": "Paper reposted"}


@router.delete("/user/repost/{paper_id}")
def unrepost_paper(
    paper_id: int,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Unrepost a paper."""
    user_id = get_current_user_id(authorization)
    
    repost = db.query(Repost).filter(
        Repost.paper_id == paper_id,
        Repost.user_id == user_id
    ).first()
    
    if not repost:
        raise HTTPException(status_code=404, detail="Repost not found")
    
    db.delete(repost)
    db.commit()
    
    return {"message": "Paper unreposted"}
