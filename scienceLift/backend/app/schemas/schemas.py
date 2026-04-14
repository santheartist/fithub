from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class UserBase(BaseModel):
    username: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    bio: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None


class User(UserBase):
    id: int
    profile_picture: Optional[str] = None
    banner_picture: Optional[str] = None
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class PaperBase(BaseModel):
    title: str
    abstract: str
    authors: str
    doi: Optional[str] = None
    paper_url: Optional[str] = None
    publication_date: Optional[datetime] = None
    source: str
    journal: Optional[str] = None


class PaperCreate(PaperBase):
    pass


class Paper(PaperBase):
    id: int
    citations: int
    rating: float
    ai_summary: Optional[str] = None
    ai_relevance_score: Optional[float] = None
    author_id: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class CommentBase(BaseModel):
    content: str


class CommentCreate(CommentBase):
    paper_id: int


class Comment(CommentBase):
    id: int
    author_id: int
    paper_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class AIQueryRequest(BaseModel):
    paper_id: int
    query: str
    model: Optional[str] = "gpt-4"


class AIQueryResponse(BaseModel):
    response: str
    model: str


class LoginRequest(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None
