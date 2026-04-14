"""API route handlers."""

from app.api.routes.auth import router as auth_router
from app.api.routes.users import router as users_router
from app.api.routes.papers import router as papers_router
from app.api.routes.comments import router as comments_router
from app.api.routes.moderation import router as moderation_router
from app.api.routes.saved_reposts import router as saved_reposts_router
from app.api.routes.profile_settings import router as profile_settings_router
from app.api.routes.interactions import router as interactions_router
from app.api.routes.ai import router as ai_router

__all__ = [
    "auth_router",
    "users_router", 
    "papers_router",
    "comments_router",
    "moderation_router",
    "saved_reposts_router",
    "profile_settings_router",
    "interactions_router",
    "ai_router"
]
