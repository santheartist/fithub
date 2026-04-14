"""
AI-powered paper analysis and chat endpoints.
Provides chatbot, summaries, and analysis features via OpenAI.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List
import logging

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import (
    ResearchPaper,
    ChatConversation,
    ChatMessage
)
from app.schemas.schemas import (
    ChatMessageRequest,
    ChatResponse,
    ChatConversationResponse,
    PaperSummaryRequest,
    PaperSummaryResponse,
    PaperTrendAnalysisResponse,
    PaperComparisonRequest,
    PaperComparisonResponse,
    ResearchQuestionsResponse,
    ChatMessageResponse
)
from app.services.ai_service import AIService, ai_service

logger = logging.getLogger(__name__)
router = APIRouter(tags=["AI"])


# ===== Chat Endpoints =====
@router.post("/papers/{paper_id}/chat", response_model=ChatResponse)
async def chat_about_paper(
    paper_id: int,
    request: ChatMessageRequest,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
) -> dict:
    """
    Chat with AI about a specific paper.
    Creates or continues a conversation.
    """
    # Verify paper exists
    paper = db.query(ResearchPaper).filter(ResearchPaper.id == paper_id).first()
    if not paper:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paper not found"
        )
    
    try:
        # Get or create conversation
        conversation = db.query(ChatConversation).filter(
            ChatConversation.user_id == current_user_id,
            ChatConversation.paper_id == paper_id
        ).first()
        
        if not conversation:
            conversation = ChatConversation(
                user_id=current_user_id,
                paper_id=paper_id,
                title=request.message[:50] + "..." if len(request.message) > 50 else request.message
            )
            db.add(conversation)
            db.commit()
            db.refresh(conversation)
        
        # Build conversation history from previous messages
        history = []
        previous_messages = db.query(ChatMessage).filter(
            ChatMessage.conversation_id == conversation.id
        ).order_by(ChatMessage.created_at).all()
        
        for msg in previous_messages[-10:]:  # Include last 10 messages for context
            history.append({"role": msg.role, "content": msg.content})
        
        # Get AI response
        ai_response = await AIService.chat_about_paper(
            paper_title=paper.title,
            paper_abstract=paper.ai_summary or "",
            paper_content=paper.ai_summary or "",
            user_question=request.message,
            conversation_history=history[-4:] if history else None  # Last 4 messages for cost control
        )
        
        # Store user message
        user_msg = ChatMessage(
            conversation_id=conversation.id,
            role="user",
            content=request.message
        )
        db.add(user_msg)
        
        # Store AI response
        ai_msg = ChatMessage(
            conversation_id=conversation.id,
            role="assistant",
            content=ai_response
        )
        db.add(ai_msg)
        
        # Update conversation timestamp
        conversation.updated_at = __import__('datetime').datetime.now()
        
        db.commit()
        
        return {
            "response": ai_response,
            "conversation_id": conversation.id
        }
    
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing chat request"
        )


@router.get("/papers/{paper_id}/conversations", response_model=List[ChatConversationResponse])
async def get_paper_conversations(
    paper_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    """Get all conversations for a user-paper pair."""
    # Verify paper exists
    paper = db.query(ResearchPaper).filter(ResearchPaper.id == paper_id).first()
    if not paper:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paper not found"
        )
    
    conversations = db.query(ChatConversation).filter(
        ChatConversation.user_id == current_user_id,
        ChatConversation.paper_id == paper_id
    ).all()
    
    return conversations


@router.get("/conversations/{conversation_id}", response_model=ChatConversationResponse)
async def get_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    """Get a specific conversation with all its messages."""
    conversation = db.query(ChatConversation).filter(
        ChatConversation.id == conversation_id,
        ChatConversation.user_id == current_user_id
    ).first()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    return conversation


# ===== Summary Endpoints =====
@router.post("/papers/{paper_id}/summary", response_model=PaperSummaryResponse)
async def get_paper_summary(
    paper_id: int,
    request: PaperSummaryRequest,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    """
    Get AI-generated summary of a paper in requested style.
    Styles: 'technical', 'simple', 'balanced'
    """
    paper = db.query(ResearchPaper).filter(ResearchPaper.id == paper_id).first()
    if not paper:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paper not found"
        )
    
    # Validate style
    if request.style not in ["technical", "simple", "balanced"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid summary style. Use 'technical', 'simple', or 'balanced'"
        )
    
    try:
        summary = await AIService.generate_paper_summary(
            title=paper.title,
            authors=paper.authors,
            abstract=paper.ai_summary,
            summary_style=request.style
        )
        
        return {
            "summary": summary,
            "style": request.style
        }
    except Exception as e:
        logger.error(f"Error generating summary: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error generating summary"
        )


# ===== Analysis Endpoints =====
@router.post("/papers/analyze/trends", response_model=PaperTrendAnalysisResponse)
async def analyze_trends(
    category: Optional[str] = Query(None),
    limit: int = Query(5, le=10),
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    """Analyze trends in papers from a category."""
    query = db.query(ResearchPaper)
    
    if category:
        query = query.filter(ResearchPaper.category == category)
    
    papers = query.order_by(ResearchPaper.created_at.desc()).limit(limit).all()
    
    if not papers:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No papers found for analysis"
        )
    
    try:
        papers_dict = [
            {
                "title": p.title,
                "abstract": p.ai_summary or "",
                "authors": p.authors,
                "category": p.category
            }
            for p in papers
        ]
        
        analysis = await AIService.analyze_paper_trends(papers_dict)
        
        # Extract insights from analysis dict
        analysis_text = analysis.get("insights", "") if isinstance(analysis, dict) else str(analysis)
        
        return {
            "analysis": analysis_text,
            "paper_count": len(papers)
        }
    except Exception as e:
        logger.error(f"Error analyzing trends: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error analyzing trends"
        )


@router.post("/papers/compare", response_model=PaperComparisonResponse)
async def compare_papers(
    request: PaperComparisonRequest,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    """Compare multiple papers (2-5 papers)."""
    papers = db.query(ResearchPaper).filter(
        ResearchPaper.id.in_(request.paper_ids)
    ).all()
    
    if len(papers) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Need at least 2 papers to compare"
        )
    
    try:
        papers_dict = [
            {
                "title": p.title,
                "abstract": p.ai_summary or "",
                "authors": p.authors,
                "category": p.category
            }
            for p in papers
        ]
        
        comparison = await AIService.compare_papers(papers_dict)
        
        # Extract insights from comparison dict
        comparison_text = comparison.get("insights", "") if isinstance(comparison, dict) else str(comparison)
        
        return {
            "comparison": comparison_text,
            "papers_compared": len(papers)
        }
    except Exception as e:
        logger.error(f"Error comparing papers: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error comparing papers"
        )


@router.get("/papers/{paper_id}/research-questions", response_model=ResearchQuestionsResponse)
async def get_research_questions(
    paper_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    """Generate potential research questions based on a paper."""
    paper = db.query(ResearchPaper).filter(ResearchPaper.id == paper_id).first()
    if not paper:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paper not found"
        )
    
    try:
        questions = await AIService.generate_research_questions(
            title=paper.title,
            abstract=paper.ai_summary or ""
        )
        
        return {
            "questions": questions,
            "paper_id": paper_id
        }
    except Exception as e:
        logger.error(f"Error generating research questions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error generating research questions"
        )


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    """Delete a conversation and all its messages."""
    conversation = db.query(ChatConversation).filter(
        ChatConversation.id == conversation_id,
        ChatConversation.user_id == current_user_id
    ).first()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    db.delete(conversation)
    db.commit()
    
    return {"message": "Conversation deleted"}
