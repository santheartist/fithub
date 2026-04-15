"""
Saved papers endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.security import verify_token
from app.models.models import SavedPaper, Repost, ResearchPaper, Like, Comment
from typing import List
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/user", tags=["user"])


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


@router.get("/saved-papers")
def get_saved_papers(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category: str = Query(None),
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Get user's saved papers. Filters out papers without summaries."""
    user_id = get_current_user_id(authorization)
    
    query = db.query(SavedPaper).filter(SavedPaper.user_id == user_id)
    
    # FILTER: Only include papers with AI summaries generated
    query = query.join(ResearchPaper).filter(
        (ResearchPaper.ai_summary.isnot(None)) & 
        (ResearchPaper.ai_summary != "")
    )
    
    saved_papers = query.offset(skip).limit(limit).all()
    total = query.count()
    
    papers = [sp.paper for sp in saved_papers]
    
    return {
        "items": papers,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/reposts")  
def get_reposts(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category: str = Query(None),
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Get user's reposts with full paper details. Filters out papers without summaries."""
    user_id = get_current_user_id(authorization)
    
    query = db.query(Repost).filter(Repost.user_id == user_id).order_by(Repost.created_at.desc())
    
    # FILTER: Only include papers with AI summaries generated
    query = query.join(ResearchPaper).filter(
        (ResearchPaper.ai_summary.isnot(None)) & 
        (ResearchPaper.ai_summary != "")
    )
    
    reposts = query.offset(skip).limit(limit).all()
    total = query.count()
    
    # Return full repost objects with nested paper data
    reposts_data = []
    for repost in reposts:
        paper = repost.paper
        
        # Count likes, comments for this paper
        likes_count = db.query(func.count(Like.id)).filter(Like.paper_id == paper.id).scalar() or 0
        comments_count = db.query(func.count(Comment.id)).filter(Comment.paper_id == paper.id).scalar() or 0
        
        repost_item = {
            "id": repost.id,
            "created_at": repost.created_at.isoformat() if repost.created_at else None,
            "paper": {
                "id": paper.id,
                "title": paper.title,
                "authors": paper.authors,
                "category": paper.category,
                "journal_name": paper.journal_name,
                "publication_date": paper.publication_date if hasattr(paper, 'publication_date') else None,
                "doi": paper.doi,
                "paper_url": paper.paper_url,
                "pdf_url": paper.pdf_url if hasattr(paper, 'pdf_url') else None,
                "ai_summary": paper.ai_summary,
                "likes_count": likes_count,
                "comments_count": comments_count,
            }
        }
        reposts_data.append(repost_item)
    
    return {
        "items": reposts_data,
        "total": total,
        "skip": skip,
        "limit": limit
    }


# Save/Unsave Paper Endpoints
@router.post("/saved-papers/{paper_id}")
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
    existing = db.query(SavedPaper).filter(
        SavedPaper.user_id == user_id,
        SavedPaper.paper_id == paper_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Paper already saved")
    
    # Save the paper
    saved_paper = SavedPaper(user_id=user_id, paper_id=paper_id)
    db.add(saved_paper)
    db.commit()
    db.refresh(saved_paper)
    
    return {"status": "success", "message": "Paper saved"}


@router.delete("/saved-papers/{paper_id}")
def unsave_paper(
    paper_id: int,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Unsave a paper."""
    user_id = get_current_user_id(authorization)
    
    saved_paper = db.query(SavedPaper).filter(
        SavedPaper.user_id == user_id,
        SavedPaper.paper_id == paper_id
    ).first()
    
    if not saved_paper:
        raise HTTPException(status_code=404, detail="Saved paper not found")
    
    db.delete(saved_paper)
    db.commit()
    
    return {"status": "success", "message": "Paper unsaved"}


# Repost/Unrepost Paper Endpoints
@router.post("/reposts/{paper_id}")
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
    existing = db.query(Repost).filter(
        Repost.user_id == user_id,
        Repost.paper_id == paper_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Paper already reposted")
    
    # Repost the paper
    repost = Repost(user_id=user_id, paper_id=paper_id)
    db.add(repost)
    db.commit()
    db.refresh(repost)
    
    return {"status": "success", "message": "Paper reposted"}


@router.delete("/reposts/{paper_id}")
def unrepost_paper(
    paper_id: int,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Unrepost a paper."""
    user_id = get_current_user_id(authorization)
    
    repost = db.query(Repost).filter(
        Repost.user_id == user_id,
        Repost.paper_id == paper_id
    ).first()
    
    if not repost:
        raise HTTPException(status_code=404, detail="Repost not found")
    
    db.delete(repost)
    db.commit()
    
    return {"status": "success", "message": "Paper unreposted"}
