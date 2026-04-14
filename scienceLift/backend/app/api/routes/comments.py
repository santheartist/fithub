from fastapi import APIRouter

router = APIRouter(prefix="/api/comments", tags=["comments"])


@router.get("/")
def get_comments():
    return []
