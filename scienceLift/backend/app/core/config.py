"""
Configuration settings for the application.
Loads environment variables with proper defaults and validation.
"""

from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List
import json
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database
    DATABASE_URL: str = "sqlite:///./scienceLift.db"
    
    # JWT
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 hours for development
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    
    # API Keys
    OPENAI_API_KEY: str = ""
    CROSSREF_EMAIL: str = "sanchitpanda490@gmail.com"
    NLM_API_KEY: str = "951d55d8d51dc86852251ada4339ccb79308"
    GOOGLE_SCHOLAR_API_KEY: str = "86ea0ba4485ffff75a64df040c750ae7fb8455e13da606ab71c7bb70fcb6fdf2"
    
    # Server
    DEBUG: bool = True
    BASE_URL: str = "http://localhost:8000"
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001", "http://localhost:8000"]
    API_PREFIX: str = "/api/v1"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # AWS S3
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_S3_BUCKET_NAME: str = "scienceLift-bucket"
    AWS_REGION: str = "us-east-1"
    
    @field_validator('CORS_ORIGINS', mode='before')
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse CORS_ORIGINS from JSON string or list."""
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return [v]
        return v
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"  # Ignore extra env variables not defined in model


settings = Settings()
