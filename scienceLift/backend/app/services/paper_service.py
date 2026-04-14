"""
Paper-related business logic and service functions.
"""

from sqlalchemy.orm import Session
from app.models.models import ResearchPaper, Like, SavedPaper, Repost, Comment
from typing import Optional, List, Dict
from sqlalchemy import func
import logging

logger = logging.getLogger(__name__)


class PaperService:
    """Service for paper-related operations."""
    
    @staticmethod
    def get_papers(db: Session, skip: int = 0, limit: int = 10, category: Optional[str] = None):
        """Get papers with optional category filtering."""
        query = db.query(ResearchPaper)
        if category:
            query = query.filter(ResearchPaper.category == category)
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def get_paper_by_id(db: Session, paper_id: int):
        """Get a specific paper by ID."""
        return db.query(ResearchPaper).filter(ResearchPaper.id == paper_id).first()
    
    @staticmethod
    def search_papers(db: Session, query_str: str, skip: int = 0, limit: int = 10, category: Optional[str] = None):
        """Search papers by title or authors."""
        query = db.query(ResearchPaper).filter(
            (ResearchPaper.title.ilike(f"%{query_str}%")) |
            (ResearchPaper.authors.ilike(f"%{query_str}%"))
        )
        if category:
            query = query.filter(ResearchPaper.category == category)
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def update_ai_summary(db: Session, paper_id: int, summary: str):
        """Update the AI summary for a paper."""
        paper = db.query(ResearchPaper).filter(ResearchPaper.id == paper_id).first()
        if paper:
            paper.ai_summary = summary
            db.commit()
            db.refresh(paper)
        return paper
    
    @staticmethod
    def get_paper_stats(db: Session, paper_id: int):
        """Get stats for a paper (likes, comments, saves)."""
        likes_count = db.query(Like).filter(Like.paper_id == paper_id).count()
        comments_count = db.query(Comment).filter(Comment.paper_id == paper_id).count()
        saves_count = db.query(SavedPaper).filter(SavedPaper.paper_id == paper_id).count()
        reposts_count = db.query(Repost).filter(Repost.paper_id == paper_id).count()
        
        return {
            "likes": likes_count,
            "comments": comments_count,
            "saves": saves_count,
            "reposts": reposts_count
        }
    
    @staticmethod
    def get_papers_stats_batch(db: Session, paper_ids: List[int]) -> Dict[int, Dict]:
        """
        Efficiently fetch stats for multiple papers in batch.
        Fixes N+1 query problem by fetching all stats in 4 queries instead of N*4.
        """
        if not paper_ids:
            return {}
        
        # Fetch all likes counts in one query
        likes_data = db.query(
            Like.paper_id,
            func.count(Like.id).label('count')
        ).filter(Like.paper_id.in_(paper_ids)).group_by(Like.paper_id).all()
        
        # Fetch all comments counts in one query
        comments_data = db.query(
            Comment.paper_id,
            func.count(Comment.id).label('count')
        ).filter(Comment.paper_id.in_(paper_ids)).group_by(Comment.paper_id).all()
        
        # Fetch all saves counts in one query
        saves_data = db.query(
            SavedPaper.paper_id,
            func.count(SavedPaper.id).label('count')
        ).filter(SavedPaper.paper_id.in_(paper_ids)).group_by(SavedPaper.paper_id).all()
        
        # Fetch all reposts counts in one query
        reposts_data = db.query(
            Repost.paper_id,
            func.count(Repost.id).label('count')
        ).filter(Repost.paper_id.in_(paper_ids)).group_by(Repost.paper_id).all()
        
        # Build stats dictionary with defaults
        stats = {paper_id: {"likes": 0, "comments": 0, "saves": 0, "reposts": 0} for paper_id in paper_ids}
        
        # Populate counts
        for paper_id, count in likes_data:
            stats[paper_id]["likes"] = count
        for paper_id, count in comments_data:
            stats[paper_id]["comments"] = count
        for paper_id, count in saves_data:
            stats[paper_id]["saves"] = count
        for paper_id, count in reposts_data:
            stats[paper_id]["reposts"] = count
        
        return stats
    
    @staticmethod
    def get_user_interactions_batch(db: Session, paper_ids: List[int], user_id: int) -> Dict[int, Dict]:
        """
        Efficiently fetch user interactions for multiple papers.
        Fixes N+1 query problem by fetching all interactions in 3 queries.
        """
        if not paper_ids or not user_id:
            return {paper_id: {"is_liked": False, "is_saved": False, "is_reposted": False} for paper_id in paper_ids}
        
        # Initialize interactions dict
        interactions = {paper_id: {"is_liked": False, "is_saved": False, "is_reposted": False} for paper_id in paper_ids}
        
        # Fetch user's liked papers
        liked_papers = db.query(Like.paper_id).filter(
            Like.user_id == user_id,
            Like.paper_id.in_(paper_ids)
        ).all()
        
        # Fetch user's saved papers
        saved_papers = db.query(SavedPaper.paper_id).filter(
            SavedPaper.user_id == user_id,
            SavedPaper.paper_id.in_(paper_ids)
        ).all()
        
        # Fetch user's reposted papers
        reposted_papers = db.query(Repost.paper_id).filter(
            Repost.user_id == user_id,
            Repost.paper_id.in_(paper_ids)
        ).all()
        
        # Mark interactions
        for (paper_id,) in liked_papers:
            interactions[paper_id]["is_liked"] = True
        for (paper_id,) in saved_papers:
            interactions[paper_id]["is_saved"] = True
        for (paper_id,) in reposted_papers:
            interactions[paper_id]["is_reposted"] = True
        
        return interactions
