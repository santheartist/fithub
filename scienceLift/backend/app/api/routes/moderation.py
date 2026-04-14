from fastapi import APIRouter

router = APIRouter(prefix="/api/moderation", tags=["moderation"])


@router.post("/report")
def report_content(content_id: int, reason: str):
    return {"status": "reported"}
