from fastapi import APIRouter

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.get("/settings")
def get_profile_settings():
    return {}


@router.put("/settings")
def update_profile_settings():
    return {"status": "updated"}
