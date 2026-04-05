"""
Authentication API routes.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/google")
async def auth_google():
    """Google OAuth exchange."""
    return {"data": {"token": None}}


@router.get("/me")
async def auth_me():
    """Get current user from JWT."""
    return {"data": {"user": None}}


@router.post("/logout")
async def auth_logout():
    """Logout user."""
    return {"data": {"success": True}}
