"""Background jobs for paper aggregation"""
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.models import ResearchPaper


def aggregate_papers():
    """Aggregate papers from multiple sources"""
    db = SessionLocal()
    try:
        # TODO: Implement paper aggregation from APIs
        pass
    finally:
        db.close()


def deduplicate_papers(db: Session):
    """Remove duplicate papers from database"""
    papers = db.query(ResearchPaper).all()
    
    processed = set()
    for paper in papers:
        # Check by DOI
        if paper.doi:
            key = f"doi_{paper.doi}"
            if key in processed:
                db.delete(paper)
            else:
                processed.add(key)
        # Check by URL
        elif paper.paper_url:
            key = f"url_{paper.paper_url}"
            if key in processed:
                db.delete(paper)
            else:
                processed.add(key)
    
    db.commit()
