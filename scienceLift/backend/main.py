from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.core.config import settings
from app.api.routes import auth, papers, users, ai, interactions, moderation, comments, saved_reposts, profile_settings
from app.models.models import User, ResearchPaper, Comment, AIInteraction, SearchCache

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FitHub API",
    description="Research Paper Aggregation Platform with AI Features",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(papers.router)
app.include_router(users.router)
app.include_router(ai.router)
app.include_router(interactions.router)
app.include_router(moderation.router)
app.include_router(comments.router)
app.include_router(saved_reposts.router)
app.include_router(profile_settings.router)


@app.get("/")
def read_root():
    return {"message": "FitHub API - Research Paper Aggregation Platform"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
