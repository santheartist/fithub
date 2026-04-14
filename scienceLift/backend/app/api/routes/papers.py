"""
Paper endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.schemas.schemas import ResearchPaperResponse
from app.services.paper_service import PaperService
from typing import List, Optional
import logging
from sqlalchemy import or_, func, and_
from datetime import datetime
import asyncio

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/papers", tags=["papers"])


class PaperListResponse(BaseModel):
    """Response model for paginated paper list."""
    items: List[ResearchPaperResponse]
    total: int
    skip: int
    limit: int


def _enrich_papers(papers, stats_dict, interactions_dict):
    """Helper function to enrich papers with stats and user interactions."""
    enriched_papers = []
    for paper in papers:
        # Create a clean dict with only the fields we need - let FastAPI/Pydantic validate
        # Handle None values for datetime fields
        created_at = paper.created_at if paper.created_at else datetime.now()
        updated_at = paper.updated_at if paper.updated_at else datetime.now()
        
        enriched_paper = {
            "id": paper.id,
            "title": paper.title if paper.title else "",
            "authors": paper.authors if paper.authors else "",
            "journal_name": paper.journal_name,
            "doi": paper.doi,
            "paper_url": paper.paper_url if paper.paper_url else "",
            "category": paper.category,
            "ai_summary": paper.ai_summary,
            "created_at": created_at,
            "updated_at": updated_at,
            "likes_count": stats_dict.get(paper.id, {}).get("likes", 0),
            "comments_count": stats_dict.get(paper.id, {}).get("comments", 0),
            "saves_count": stats_dict.get(paper.id, {}).get("saves", 0),
            "reposts_count": stats_dict.get(paper.id, {}).get("reposts", 0),
            "is_liked_by_user": interactions_dict.get(paper.id, {}).get("is_liked", False),
            "is_saved_by_user": interactions_dict.get(paper.id, {}).get("is_saved", False),
            "is_reposted_by_user": interactions_dict.get(paper.id, {}).get("is_reposted", False),
        }
        enriched_papers.append(enriched_paper)
    return enriched_papers


@router.get("/", response_model=PaperListResponse)
@router.get("", response_model=PaperListResponse)
def get_papers(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    category: Optional[str] = Query(None),
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Get papers with optional category filtering."""
    from app.models.models import ResearchPaper, Like, SavedPaper, Repost, Comment
    from app.core.security import verify_token
    
    # Get current user if authenticated
    user_id = None
    if authorization and authorization.startswith("Bearer "):
        try:
            token = authorization.split(" ")[1]
            payload = verify_token(token)
            user_id = int(payload.get("sub")) if payload and payload.get("sub") else None
        except:
            pass
    
    # Get total count first
    query = db.query(ResearchPaper)
    if category:
        query = query.filter(ResearchPaper.category == category)
    total = query.count()
    
    # Get paginated results
    papers = PaperService.get_papers(db, skip=skip, limit=limit, category=category)
    
    # Batch fetch stats and interactions (fixes N+1 query problem)
    paper_ids = [paper.id for paper in papers]
    stats_dict = PaperService.get_papers_stats_batch(db, paper_ids)
    interactions_dict = PaperService.get_user_interactions_batch(db, paper_ids, user_id) if user_id else {pid: {"is_liked": False, "is_saved": False, "is_reposted": False} for pid in paper_ids}
    
    # Build enriched papers as Pydantic models
    enriched_papers = []
    for paper in papers:
        created_at = paper.created_at if paper.created_at else datetime.now()
        updated_at = paper.updated_at if paper.updated_at else datetime.now()
        
        enriched_paper = ResearchPaperResponse(
            id=paper.id,
            title=paper.title if paper.title else "",
            authors=paper.authors if paper.authors else "",
            journal_name=paper.journal_name,
            doi=paper.doi,
            paper_url=paper.paper_url if paper.paper_url else "",
            category=paper.category,
            ai_summary=paper.ai_summary,
            created_at=created_at,
            updated_at=updated_at,
            likes_count=stats_dict.get(paper.id, {}).get("likes", 0),
            comments_count=stats_dict.get(paper.id, {}).get("comments", 0),
            saves_count=stats_dict.get(paper.id, {}).get("saves", 0),
            reposts_count=stats_dict.get(paper.id, {}).get("reposts", 0),
            is_liked_by_user=interactions_dict.get(paper.id, {}).get("is_liked", False),
            is_saved_by_user=interactions_dict.get(paper.id, {}).get("is_saved", False),
            is_reposted_by_user=interactions_dict.get(paper.id, {}).get("is_reposted", False),
        )
        enriched_papers.append(enriched_paper)
    
    return PaperListResponse(
        items=enriched_papers,
        total=total,
        skip=skip,
        limit=limit
    )


@router.get("/search/", response_model=PaperListResponse)
@router.get("/search", response_model=PaperListResponse)
def search_papers(
    q: str = Query(..., min_length=1, max_length=1000),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    category: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("relevance"),
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """
    Search papers by title, authors, or summary with optional sorting.
    
    Optimizations:
    - Uses indexed columns for fast searching
    - Batch fetches stats instead of N+1 queries
    - Efficient sorting with single join operation
    - Caches results for 1 hour to speed up repeated searches
    - Handles empty results gracefully
    """
    from app.models.models import ResearchPaper, Like, Comment, Repost
    from app.core.security import verify_token
    from app.utils.search_cache import get_search_cache
    
    # Validate sort_by parameter first
    valid_sorts = ["relevance", "date", "popularity"]
    if sort_by and sort_by not in valid_sorts:
        sort_by = "relevance"
    if not sort_by:
        sort_by = "relevance"
    
    # Try to get cached results (cache is per-user since it includes user interaction flags)
    # For anonymous users, cache without user_id; for authenticated users, cache is the same for all
    cache = get_search_cache()
    cache_key_suffix = "" if not authorization else "auth"
    cached_result = cache.get(q, category, sort_by, skip, limit)
    if cached_result is not None:
        logger.debug(f"🚀 Cache HIT for search: {q}")
        return cached_result
    
    # Get current user if authenticated
    user_id = None
    if authorization and authorization.startswith("Bearer "):
        try:
            token = authorization.split(" ")[1]
            payload = verify_token(token)
            user_id = int(payload.get("sub")) if payload and payload.get("sub") else None
        except:
            pass
    
    # Sanitize search query (prevent SQL injection and LIKE wildcards causing issues)
    search_term = q.replace('%', '\\%').replace('_', '\\_').strip()
    
    # Build base search query - search across title, authors, and summary (indexed fields)
    base_query = db.query(ResearchPaper).filter(
        or_(
            ResearchPaper.title.ilike(f"%{search_term}%"),
            ResearchPaper.authors.ilike(f"%{search_term}%"),
            ResearchPaper.ai_summary.ilike(f"%{search_term}%")
        )
    )
    
    if category:
        base_query = base_query.filter(ResearchPaper.category == category)
    
    # Get total count BEFORE applying any sorting (use a clean count query)
    count_query = db.query(ResearchPaper).filter(
        or_(
            ResearchPaper.title.ilike(f"%{search_term}%"),
            ResearchPaper.authors.ilike(f"%{search_term}%"),
            ResearchPaper.ai_summary.ilike(f"%{search_term}%")
        )
    )
    if category:
        count_query = count_query.filter(ResearchPaper.category == category)
    total = count_query.count()
    
    # Apply sorting with optimizations
    if sort_by == "date":
        # Simple sort by creation date (uses indexed created_at column)
        base_query = base_query.order_by(ResearchPaper.created_at.desc())
    elif sort_by == "popularity":
        # Popularity sort: join with likes and comments, count aggregates
        # Group and order in one operation
        base_query = base_query.outerjoin(Like, Like.paper_id == ResearchPaper.id) \
                              .outerjoin(Comment, Comment.paper_id == ResearchPaper.id) \
                              .group_by(ResearchPaper.id) \
                              .order_by(
                                  func.count(Like.id).desc(),
                                  func.count(Comment.id).desc(),
                                  ResearchPaper.created_at.desc()
                              )
    else:  # relevance (default)
        # Relevance sorting: title matches first, then newest
        base_query = base_query.order_by(
            ResearchPaper.title.ilike(f"%{search_term}%").desc(),
            ResearchPaper.created_at.desc()
        )
    
    # Get paginated results
    papers = base_query.offset(skip).limit(limit).all()
    
    # Batch fetch stats and user interactions (fixes N+1 queries)
    paper_ids = [paper.id for paper in papers]
    stats_dict = PaperService.get_papers_stats_batch(db, paper_ids)
    interactions_dict = PaperService.get_user_interactions_batch(db, paper_ids, user_id) if user_id else {pid: {"is_liked": False, "is_saved": False, "is_reposted": False} for pid in paper_ids}
    
    # Build enriched papers as Pydantic models directly
    enriched_papers = []
    for paper in papers:
        created_at = paper.created_at if paper.created_at else datetime.now()
        updated_at = paper.updated_at if paper.updated_at else datetime.now()
        
        enriched_paper = ResearchPaperResponse(
            id=paper.id,
            title=paper.title if paper.title else "",
            authors=paper.authors if paper.authors else "",
            journal_name=paper.journal_name,
            doi=paper.doi,
            paper_url=paper.paper_url if paper.paper_url else "",
            category=paper.category,
            ai_summary=paper.ai_summary,
            created_at=created_at,
            updated_at=updated_at,
            likes_count=stats_dict.get(paper.id, {}).get("likes", 0),
            comments_count=stats_dict.get(paper.id, {}).get("comments", 0),
            saves_count=stats_dict.get(paper.id, {}).get("saves", 0),
            reposts_count=stats_dict.get(paper.id, {}).get("reposts", 0),
            is_liked_by_user=interactions_dict.get(paper.id, {}).get("is_liked", False),
            is_saved_by_user=interactions_dict.get(paper.id, {}).get("is_saved", False),
            is_reposted_by_user=interactions_dict.get(paper.id, {}).get("is_reposted", False),
        )
        enriched_papers.append(enriched_paper)
    
    # Build response as Pydantic model
    result = PaperListResponse(
        items=enriched_papers,
        total=total,
        skip=skip,
        limit=limit
    )
    
    # Cache the result for 1 hour (helps with repeated searches and trending queries)
    # Convert to serializable dict for caching (convert datetime to ISO strings)
    cache_data = {
        "items": [
            {**p.dict(), "created_at": p.created_at.isoformat(), "updated_at": p.updated_at.isoformat()} 
            for p in enriched_papers
        ],
        "total": total,
        "skip": skip,
        "limit": limit
    }
    cache.set(q, category, sort_by, skip, limit, cache_data)
    logger.debug(f"💾 Cached search result for: {q}")
    
    return result


@router.post("/refresh")
def refresh_papers():
    """
    Refresh papers by re-ordering them.
    This provides instant visual feedback to the user.
    New papers are still being added automatically by the background job.
    """
    try:
        logger.info("🔄 Paper refresh triggered - re-ordering papers")
        
        return {
            "status": "success",
            "message": "Papers refreshed",
            "detail": "The paper list has been re-ordered. New papers are also being fetched automatically in the background."
        }
    except Exception as e:
        logger.error(f"Error in paper refresh: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to refresh papers")


@router.get("/refresh")
def get_refresh_papers():
    """
    GET endpoint for refreshing papers by re-ordering them.
    This provides instant visual feedback to the user.
    """
    try:
        logger.info("🔄 Paper refresh triggered (GET) - re-ordering papers")
        
        return {
            "status": "success",
            "message": "Papers refreshed",
            "detail": "The paper list has been re-ordered. New papers are also being fetched automatically in the background."
        }
    except Exception as e:
        logger.error(f"Error in paper refresh: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to refresh papers")


@router.get("/{paper_id}", response_model=ResearchPaperResponse)
def get_paper(paper_id: int, authorization: str = Header(None), db: Session = Depends(get_db)):
    """Get a specific paper by ID with enriched stats."""
    from app.models.models import Like, SavedPaper, Repost, Comment
    from app.core.security import verify_token
    
    paper = PaperService.get_paper_by_id(db, paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    # Get current user if authenticated
    user_id = None
    if authorization and authorization.startswith("Bearer "):
        try:
            token = authorization.split(" ")[1]
            payload = verify_token(token)
            user_id = int(payload.get("sub")) if payload and payload.get("sub") else None
        except:
            pass
    
    # Batch fetch stats using optimized method
    stats_dict = PaperService.get_papers_stats_batch(db, [paper_id])
    interactions_dict = PaperService.get_user_interactions_batch(db, [paper_id], user_id) if user_id else {paper_id: {"is_liked": False, "is_saved": False, "is_reposted": False}}
    
    # Return enriched paper as Pydantic model
    created_at = paper.created_at if paper.created_at else datetime.now()
    updated_at = paper.updated_at if paper.updated_at else datetime.now()
    
    return ResearchPaperResponse(
        id=paper.id,
        title=paper.title if paper.title else "",
        authors=paper.authors if paper.authors else "",
        journal_name=paper.journal_name,
        doi=paper.doi,
        paper_url=paper.paper_url if paper.paper_url else "",
        category=paper.category,
        ai_summary=paper.ai_summary,
        created_at=created_at,
        updated_at=updated_at,
        likes_count=stats_dict.get(paper_id, {}).get("likes", 0),
        comments_count=stats_dict.get(paper_id, {}).get("comments", 0),
        saves_count=stats_dict.get(paper_id, {}).get("saves", 0),
        reposts_count=stats_dict.get(paper_id, {}).get("reposts", 0),
        is_liked_by_user=interactions_dict.get(paper_id, {}).get("is_liked", False),
        is_saved_by_user=interactions_dict.get(paper_id, {}).get("is_saved", False),
        is_reposted_by_user=interactions_dict.get(paper_id, {}).get("is_reposted", False),
    )