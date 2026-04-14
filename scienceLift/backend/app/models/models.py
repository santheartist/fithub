"""
SQLAlchemy ORM models for database tables.
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Table, Float, Enum as SQLEnum, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum
from datetime import datetime


# Association tables for many-to-many relationships
paper_tags = Table(
    'paper_tags',
    Base.metadata,
    Column('paper_id', Integer, ForeignKey('research_papers.id', ondelete='CASCADE')),
    Column('tag_id', Integer, ForeignKey('tags.id', ondelete='CASCADE'))
)

user_saved_papers = Table(
    'user_saved_papers',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE')),
    Column('paper_id', Integer, ForeignKey('research_papers.id', ondelete='CASCADE'))
)

user_reposted_papers = Table(
    'user_reposted_papers',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE')),
    Column('paper_id', Integer, ForeignKey('research_papers.id', ondelete='CASCADE'))
)


class CategoryEnum(str, enum.Enum):
    """Enum for research paper categories."""
    HYPERTROPHY = "Hypertrophy"
    STRENGTH = "Strength"
    NUTRITION = "Nutrition"
    RECOVERY = "Recovery"
    INJURY_PREVENTION = "Injury Prevention"


class ReportTypeEnum(str, enum.Enum):
    """Enum for report types."""
    SPAM = "spam"
    INAPPROPRIATE = "inappropriate"
    HARASSMENT = "harassment"
    MISINFORMATION = "misinformation"
    OTHER = "other"


class User(Base):
    """User account model."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(300), nullable=False)
    bio = Column(Text, nullable=True)
    profile_picture_url = Column(String(500), nullable=True)
    banner_picture_url = Column(String(500), nullable=True)
    is_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    comments = relationship("Comment", back_populates="author", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="user", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="reporter", cascade="all, delete-orphan")
    saved_papers = relationship("SavedPaper", back_populates="user", cascade="all, delete-orphan")
    reposts = relationship("Repost", back_populates="user", cascade="all, delete-orphan")
    preferences = relationship("UserPreferences", back_populates="user", uselist=False, cascade="all, delete-orphan")


class ResearchPaper(Base):
    """Research paper model - link-based with AI summaries."""
    __tablename__ = "research_papers"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), index=True, nullable=False)
    authors = Column(Text, nullable=False, index=True)  # JSON or comma-separated - INDEXED for faster search
    journal_name = Column(String(255), nullable=True)
    doi = Column(String(255), unique=True, nullable=True, index=True)
    paper_url = Column(String(500), nullable=False)  # Link to external paper
    ai_summary = Column(Text, nullable=True, index=True)  # Our AI-generated summary - INDEXED for faster search
    category = Column(SQLEnum(CategoryEnum), index=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), index=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    comments = relationship("Comment", back_populates="paper", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="paper", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="paper", cascade="all, delete-orphan")
    tags = relationship("Tag", secondary=paper_tags, back_populates="papers")
    saved_by = relationship("SavedPaper", back_populates="paper", cascade="all, delete-orphan")
    reposted_by = relationship("Repost", back_populates="paper", cascade="all, delete-orphan")


class Comment(Base):
    """Comment model for paper discussions."""
    __tablename__ = "comments"
    
    id = Column(Integer, primary_key=True, index=True)
    paper_id = Column(Integer, ForeignKey('research_papers.id', ondelete='CASCADE'), nullable=False, index=True)
    author_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    content = Column(Text, nullable=False)
    parent_comment_id = Column(Integer, ForeignKey('comments.id', ondelete='CASCADE'), nullable=True)
    is_edited = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now(), index=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    paper = relationship("ResearchPaper", back_populates="comments")
    author = relationship("User", back_populates="comments")
    likes = relationship("CommentLike", back_populates="comment", cascade="all, delete-orphan")
    replies = relationship("Comment", remote_side=[parent_comment_id], cascade="all, delete-orphan")


class Like(Base):
    """Like model for paper likes."""
    __tablename__ = "likes"
    __table_args__ = (UniqueConstraint('paper_id', 'user_id', name='uq_paper_like'),)
    
    id = Column(Integer, primary_key=True, index=True)
    paper_id = Column(Integer, ForeignKey('research_papers.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    paper = relationship("ResearchPaper", back_populates="likes")
    user = relationship("User", back_populates="likes")


class CommentLike(Base):
    """Like model for comment likes."""
    __tablename__ = "comment_likes"
    __table_args__ = (UniqueConstraint('comment_id', 'user_id', name='uq_comment_like'),)
    
    id = Column(Integer, primary_key=True, index=True)
    comment_id = Column(Integer, ForeignKey('comments.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    comment = relationship("Comment", back_populates="likes")


class SavedPaper(Base):
    """Model for users saving papers."""
    __tablename__ = "saved_papers"
    __table_args__ = (UniqueConstraint('user_id', 'paper_id', name='uq_saved_paper'),)
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    paper_id = Column(Integer, ForeignKey('research_papers.id', ondelete='CASCADE'), nullable=False, index=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="saved_papers")
    paper = relationship("ResearchPaper", back_populates="saved_by")


class Repost(Base):
    """Model for users reposting papers."""
    __tablename__ = "reposts"
    __table_args__ = (UniqueConstraint('user_id', 'paper_id', name='uq_repost'),)
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    paper_id = Column(Integer, ForeignKey('research_papers.id', ondelete='CASCADE'), nullable=False, index=True)
    message = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="reposts")
    paper = relationship("ResearchPaper", back_populates="reposted_by")


class Tag(Base):
    """Tag model for categorizing papers."""
    __tablename__ = "tags"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    papers = relationship("ResearchPaper", secondary=paper_tags, back_populates="tags")


class Report(Base):
    """Report model for flagging inappropriate content."""
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    paper_id = Column(Integer, ForeignKey('research_papers.id', ondelete='CASCADE'), nullable=True)
    comment_id = Column(Integer, ForeignKey('comments.id', ondelete='CASCADE'), nullable=True)
    report_type = Column(SQLEnum(ReportTypeEnum), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(20), default="pending")  # pending, reviewed, resolved
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    reporter = relationship("User", back_populates="reports")
    paper = relationship("ResearchPaper", back_populates="reports")


class ChatConversation(Base):
    """Chat conversation model for tracking AI conversations about papers."""
    __tablename__ = "chat_conversations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    paper_id = Column(Integer, ForeignKey('research_papers.id', ondelete='CASCADE'), nullable=False, index=True)
    title = Column(String(255), nullable=True)  # Auto-generated title from first question
    created_at = Column(DateTime, server_default=func.now(), index=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User")
    paper = relationship("ResearchPaper")
    messages = relationship("ChatMessage", back_populates="conversation", cascade="all, delete-orphan")


class ChatMessage(Base):
    """Individual chat messages in a conversation."""
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey('chat_conversations.id', ondelete='CASCADE'), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), index=True)
    
    # Relationships
    conversation = relationship("ChatConversation", back_populates="messages")


class UserPreferences(Base):
    """User theme and color preferences model."""
    __tablename__ = "user_preferences"
    __table_args__ = (UniqueConstraint('user_id', name='uq_user_preferences'),)
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True, index=True)
    theme_mode = Column(String(20), default="light")  # 'light' or 'dark'
    primary_color = Column(String(7), default="#0066cc")  # Hex color code
    accent_color = Column(String(7), default="#f5f5f5")  # Accent color
    text_primary_color = Column(String(7), default="#1a1a1a")  # Text primary
    text_secondary_color = Column(String(7), default="#666666")  # Text secondary
    bg_primary_color = Column(String(7), default="#ffffff")  # Background primary
    bg_secondary_color = Column(String(7), default="#f5f5f5")  # Background secondary
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="preferences")
