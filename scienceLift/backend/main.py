"""
Main FastAPI application entry point.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import logging
import sys
import os
from pathlib import Path

# Add app directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.core.database import Base, engine
from app.api.routes import (
    auth_router, users_router, papers_router, 
    comments_router, moderation_router, saved_reposts_router,
    profile_settings_router, interactions_router, ai_router
)
from app.jobs.paper_jobs import start_scheduler, stop_scheduler

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create database tables
try:
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    logger.info("✓ Database schema initialized successfully")
except Exception as e:
    logger.error(f"✗ Failed to initialize database schema: {e}")
    raise

# Log configuration status
logger.info("=" * 80)
logger.info("Application Configuration")
logger.info("=" * 80)

# Log database type
if settings.DATABASE_URL.startswith('sqlite'):
    logger.info(f"Database: SQLite (Local Development)")
else:
    # Mask password in PostgreSQL connection string for logging
    db_url_masked = settings.DATABASE_URL.split('@')[0] + '@****' if '@' in settings.DATABASE_URL else 'PostgreSQL'
    logger.info(f"Database: PostgreSQL (Production)")
    logger.info(f"Connection: {db_url_masked}")

logger.info(f"Debug Mode: {settings.DEBUG}")
logger.info(f"API Prefix: {settings.API_PREFIX}")
if settings.OPENAI_API_KEY and len(settings.OPENAI_API_KEY) > 10:
    logger.info(f"✓ OpenAI API Key configured (length: {len(settings.OPENAI_API_KEY)})")
else:
    logger.warning("✗ OpenAI API Key NOT configured - AI features will be limited")
logger.info("=" * 80)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage application lifespan.
    """
    logger.info("Application startup")
    logger.info("Starting background job scheduler for paper aggregation...")
    start_scheduler()
    
    yield
    
    logger.info("Application shutdown")
    logger.info("Stopping background job scheduler...")
    stop_scheduler()


# Create FastAPI application
app = FastAPI(
    title="ScienceLift API",
    description="AI-Powered Fitness Research Aggregation and Discussion Platform",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include routers
app.include_router(auth_router, prefix=settings.API_PREFIX)
app.include_router(users_router, prefix=settings.API_PREFIX)
app.include_router(papers_router, prefix=settings.API_PREFIX)
app.include_router(comments_router, prefix=settings.API_PREFIX)
app.include_router(moderation_router, prefix=settings.API_PREFIX)
app.include_router(saved_reposts_router, prefix=settings.API_PREFIX)
app.include_router(profile_settings_router, prefix=settings.API_PREFIX)
app.include_router(interactions_router, prefix=settings.API_PREFIX)
app.include_router(ai_router, prefix=settings.API_PREFIX)

# Mount static files for uploads
# Create uploads directory if it doesn't exist
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/health", tags=["health"])
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.get("/uploads/{folder}/{filename}", tags=["files"])
def get_upload_file(folder: str, filename: str):
    """Serve uploaded files with proper headers."""
    # Validate folder
    if folder not in ["profiles", "banners"]:
        raise HTTPException(status_code=404, detail="Invalid folder")
    
    file_path = Path("uploads") / folder / filename
    
    if not file_path.exists():
        logger.warning(f"File not found: {file_path}")
        raise HTTPException(status_code=404, detail="File not found")
    
    # Log file serving
    logger.info(f"Serving file: {file_path}")
    
    # Serve with proper headers
    return FileResponse(
        path=file_path,
        headers={
            "Cache-Control": "max-age=31536000, immutable",
            "Access-Control-Allow-Origin": "*",
        }
    )


@app.get("/", tags=["root"])
def root():
    """Root endpoint."""
    return {
        "message": "Welcome to ScienceLift API",
        "docs": "/docs",
        "openapi": "/openapi.json"
    }


@app.get("/debug/trigger-paper-import", tags=["debug"])
async def trigger_paper_import():
    """Manually trigger paper aggregation job for testing."""
    from app.jobs.paper_jobs import aggregate_papers_job
    try:
        logger.info("Manually triggering paper aggregation...")
        await aggregate_papers_job()
        return {"status": "success", "message": "Paper aggregation job completed"}
    except Exception as e:
        logger.error(f"Manual paper import error: {str(e)}", exc_info=True)
        return {"status": "error", "message": str(e)}


@app.get("/debug/users", tags=["debug"])
def debug_list_users():
    """Debug endpoint to list all users in database."""
    from app.core.database import SessionLocal
    from app.models.models import User
    
    db = SessionLocal()
    try:
        users = db.query(User).all()
        return {
            "total_users": len(users),
            "users": [
                {
                    "id": u.id,
                    "username": u.username,
                    "email": u.email,
                    "password_hash": u.password_hash[:20] + "...",
                    "is_active": u.is_active,
                    "created_at": u.created_at
                }
                for u in users
            ]
        }
    finally:
        db.close()


@app.get("/debug/test-password", tags=["debug"])
def debug_test_password(email: str, password: str):
    """Debug endpoint to test password verification."""
    from app.core.database import SessionLocal
    from app.models.models import User
    from app.core.security import verify_password
    
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            return {"found": False, "message": f"User not found with email: {email}"}
        
        is_valid = verify_password(password, user.password_hash)
        
        return {
            "found": True,
            "email": user.email,
            "username": user.username,
            "password_matches": is_valid,
            "hash_preview": user.password_hash[:30] + "..."
        }
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False
    )
