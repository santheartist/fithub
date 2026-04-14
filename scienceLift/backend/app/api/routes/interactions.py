from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import ResearchPaper, User

router = APIRouter(prefix="/api/interactions", tags=["interactions"])


@router.post("/{paper_id}/like")
def like_paper(paper_id: int, user_id: int, db: Session = Depends(get_db)):
    paper = db.query(ResearchPaper).filter(ResearchPaper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    return {"status": "liked"}


@router.post("/{paper_id}/repost")
def repost_paper(paper_id: int, user_id: int, db: Session = Depends(get_db)):
    paper = db.query(ResearchPaper).filter(ResearchPaper.id == paper_id).first()
    user = db.query(User).filter(User.id == user_id).first()
    
    if not paper or not user:
        raise HTTPException(status_code=404, detail="Paper or user not found")
    
    if paper not in user.reposts:
        user.reposts.append(paper)
        db.commit()
    
    return {"status": "reposted"}


@router.post("/{paper_id}/save")
def save_paper(paper_id: int, user_id: int, db: Session = Depends(get_db)):
    paper = db.query(ResearchPaper).filter(ResearchPaper.id == paper_id).first()
    user = db.query(User).filter(User.id == user_id).first()
    
    if not paper or not user:
        raise HTTPException(status_code=404, detail="Paper or user not found")
    
    if paper not in user.saved:
        user.saved.append(paper)
        db.commit()
    
    return {"status": "saved"}
