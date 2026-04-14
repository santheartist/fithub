"""
Pydantic schemas for request/response validation.
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List  
from datetime import datetime
from app.models.models import CategoryEnum


# ===== User Schemas =====
class UserBase(BaseModel):
    """Base user schema."""
    username: str
    email: EmailStr


class UserCreate(UserBase):
    """Schema for user registration."""
    password: str


class UserUpdate(BaseModel):
    """Schema for user profile updates."""
    bio: Optional[str] = None
    profile_picture_url: Optional[str] = None
    banner_picture_url: Optional[str] = None


class UserResponse(UserBase):
    """Schema for user responses."""
    id: int
    bio: Optional[str]
    profile_picture_url: Optional[str]
    banner_picture_url: Optional[str]
    is_admin: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserProfileResponse(UserBase):
    """Schema for user profile responses (includes additional fields)."""
    id: int
    bio: Optional[str]
    profile_picture_url: Optional[str]
    banner_picture_url: Optional[str]
    is_admin: bool
    created_at: datetime
    likes_count: int = 0
    comments_count: int = 0
    reposts_count: int = 0
    
    class Config:
        from_attributes = True


# ===== User Preferences Schemas =====
class UserPreferencesBase(BaseModel):
    """Base user preferences schema."""
    theme_mode: str = "light"
    primary_color: str = "#0066cc"
    accent_color: str = "#f5f5f5"
    text_primary_color: str = "#1a1a1a"
    text_secondary_color: str = "#666666"
    bg_primary_color: str = "#ffffff"
    bg_secondary_color: str = "#f5f5f5"


class UserPreferencesUpdate(BaseModel):
    """Schema for updating user preferences."""
    theme_mode: Optional[str] = None
    primary_color: Optional[str] = None
    accent_color: Optional[str] = None
    text_primary_color: Optional[str] = None
    text_secondary_color: Optional[str] = None
    bg_primary_color: Optional[str] = None
    bg_secondary_color: Optional[str] = None


class UserPreferencesResponse(UserPreferencesBase):
    """Schema for user preferences responses."""
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ===== Paper Schemas =====
class ResearchPaperBase(BaseModel):
    """Base research paper schema."""
    title: str
    authors: str
    journal_name: Optional[str] = None
    doi: Optional[str] = None
    paper_url: str
    category: CategoryEnum


class ResearchPaperCreate(ResearchPaperBase):
    """Schema for creating a paper."""
    pass


class ResearchPaperResponse(ResearchPaperBase):
    """Schema for paper responses."""
    id: int
    ai_summary: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    likes_count: int = 0
    comments_count: int = 0
    saves_count: int = 0
    reposts_count: int = 0
    is_liked_by_user: bool = False
    is_saved_by_user: bool = False
    is_reposted_by_user: bool = False
    
    class Config:
        from_attributes = True


# ===== Comment Schemas =====
class CommentBase(BaseModel):
    """Base comment schema."""
    content: str


class CommentCreate(CommentBase):
    """Schema for creating a comment."""
    parent_comment_id: Optional[int] = None


class CommentResponse(CommentBase):
    """Schema for comment responses."""
    id: int
    paper_id: int
    author_id: int
    author: Optional['UserResponse'] = None
    is_edited: bool
    parent_comment_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    likes_count: int = 0
    is_liked_by_user: bool = False
    
    class Config:
        from_attributes = True


# ===== Like Schemas =====
class LikeBase(BaseModel):
    """Base like schema."""
    paper_id: int


class LikeResponse(LikeBase):
    """Schema for like responses."""
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ===== Saved Paper Schemas =====
class SavedPaperBase(BaseModel):
    """Base saved paper schema."""
    paper_id: int


class SavedPaperResponse(SavedPaperBase):
    """Schema for saved paper responses."""
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ===== Repost Schemas =====
class RepostBase(BaseModel):
    """Base repost schema."""
    paper_id: int
    message: Optional[str] = None


class RepostCreate(RepostBase):
    """Schema for creating a repost."""
    pass


class RepostResponse(RepostBase):
    """Schema for repost responses."""
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ===== Auth Schemas =====
class TokenResponse(BaseModel):
    """Schema for token responses."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: Optional[UserResponse] = None


class RefreshTokenRequest(BaseModel):
    """Schema for refresh token request."""
    refresh_token: str


# ===== Chat Schemas =====
class ChatMessageBase(BaseModel):
    """Base chat message schema."""
    role: str  # 'user' or 'assistant'
    content: str


class ChatMessageResponse(ChatMessageBase):
    """Schema for chat message responses."""
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class ChatMessageRequest(BaseModel):
    """Schema for user message request."""
    message: str


class ChatConversationResponse(BaseModel):
    """Schema for chat conversation responses."""
    id: int
    paper_id: int
    title: Optional[str]
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessageResponse] = []
    
    class Config:
        from_attributes = True


class ChatResponse(BaseModel):
    """Schema for AI chat response."""
    response: str
    conversation_id: int


class PaperSummaryRequest(BaseModel):
    """Schema for requesting paper summary."""
    style: str = Field(default="balanced", description="Summary style: technical, simple, or balanced")


class PaperSummaryResponse(BaseModel):
    """Schema for paper summary response."""
    summary: str
    style: str


class PaperTrendAnalysisResponse(BaseModel):
    """Schema for trend analysis response."""
    analysis: str
    paper_count: int


class PaperComparisonRequest(BaseModel):
    """Schema for requesting paper comparison."""
    paper_ids: List[int] = Field(..., min_items=2, max_items=5)


class PaperComparisonResponse(BaseModel):
    """Schema for paper comparison response."""
    comparison: str
    papers_compared: int


class ResearchQuestionsResponse(BaseModel):
    """Schema for research questions response."""
    questions: List[str]
    paper_id: int
