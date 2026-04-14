from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Table, Float, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

# Association tables
user_followers = Table(
    'user_followers',
    Base.metadata,
    Column('follower_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('following_id', Integer, ForeignKey('users.id'), primary_key=True)
)

paper_reposts = Table(
    'paper_reposts',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('paper_id', Integer, ForeignKey('research_papers.id'), primary_key=True)
)

saved_papers = Table(
    'saved_papers',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('paper_id', Integer, ForeignKey('research_papers.id'), primary_key=True)
)


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    profile_picture = Column(String, nullable=True)
    banner_picture = Column(String, nullable=True)
    location = Column(String, nullable=True)
    website = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    papers = relationship("ResearchPaper", back_populates="author", foreign_keys="ResearchPaper.author_id")
    comments = relationship("Comment", back_populates="author")
    reposts = relationship("ResearchPaper", secondary=paper_reposts, back_populates="reposted_by")
    saved = relationship("ResearchPaper", secondary=saved_papers, back_populates="saved_by")
    followers = relationship("User", secondary=user_followers, primaryjoin=id==user_followers.c.following_id, 
                           secondaryjoin=id==user_followers.c.follower_id, back_populates="following")
    following = relationship("User", secondary=user_followers, primaryjoin=id==user_followers.c.follower_id, 
                            secondaryjoin=id==user_followers.c.following_id, back_populates="followers")


class ResearchPaper(Base):
    __tablename__ = "research_papers"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    abstract = Column(Text)
    authors = Column(String)
    doi = Column(String, unique=True, nullable=True, index=True)
    paper_url = Column(String, nullable=True)
    publication_date = Column(DateTime, nullable=True)
    source = Column(String)  # CrossRef, NLM, Google Scholar, DOAJ
    journal = Column(String, nullable=True)
    citations = Column(Integer, default=0)
    rating = Column(Float, default=0.0)
    ai_summary = Column(Text, nullable=True)
    ai_relevance_score = Column(Float, nullable=True)
    author_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    author = relationship("User", back_populates="papers", foreign_keys=[author_id])
    comments = relationship("Comment", back_populates="paper", cascade="all, delete-orphan")
    reposted_by = relationship("User", secondary=paper_reposts, back_populates="reposts")
    saved_by = relationship("User", secondary=saved_papers, back_populates="saved")


class Comment(Base):
    __tablename__ = "comments"
    
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text)
    author_id = Column(Integer, ForeignKey('users.id'))
    paper_id = Column(Integer, ForeignKey('research_papers.id'))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    author = relationship("User", back_populates="comments")
    paper = relationship("ResearchPaper", back_populates="comments")


class AIInteraction(Base):
    __tablename__ = "ai_interactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    paper_id = Column(Integer, ForeignKey('research_papers.id'))
    query = Column(Text)
    response = Column(Text)
    model = Column(String)  # GPT-4, Claude, Cohere
    created_at = Column(DateTime, default=datetime.utcnow)


class SearchCache(Base):
    __tablename__ = "search_cache"
    
    id = Column(Integer, primary_key=True, index=True)
    query = Column(String, unique=True, index=True)
    results = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
