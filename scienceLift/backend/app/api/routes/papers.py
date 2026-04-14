from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import ResearchPaper, Comment
from app.schemas.schemas import Paper, PaperCreate, Comment as CommentSchema, CommentCreate
from typing import List

router = APIRouter(prefix="/api/papers", tags=["papers"])


@router.get("/", response_model=List[Paper])
def get_papers(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    papers = db.query(ResearchPaper).offset(skip).limit(limit).all()
    return papers


@router.get("/{paper_id}", response_model=Paper)
def get_paper(paper_id: int, db: Session = Depends(get_db)):
    paper = db.query(ResearchPaper).filter(ResearchPaper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    return paper


@router.post("/", response_model=Paper)
def create_paper(paper: PaperCreate, db: Session = Depends(get_db)):
    db_paper = ResearchPaper(**paper.dict())
    db.add(db_paper)
    db.commit()
    db.refresh(db_paper)
    return db_paper


@router.post("/{paper_id}/comments", response_model=CommentSchema)
def add_comment(paper_id: int, comment: CommentCreate, db: Session = Depends(get_db)):
    paper = db.query(ResearchPaper).filter(ResearchPaper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    db_comment = Comment(**comment.dict())
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment


@router.get("/{paper_id}/comments", response_model=List[CommentSchema])
def get_comments(paper_id: int, db: Session = Depends(get_db)):
    comments = db.query(Comment).filter(Comment.paper_id == paper_id).all()
    return comments
