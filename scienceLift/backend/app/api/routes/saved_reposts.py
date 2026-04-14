from fastapi import APIRouter

router = APIRouter(prefix="/api/saved", tags=["saved"])


@router.get("/")
def get_saved_papers():
    return []
