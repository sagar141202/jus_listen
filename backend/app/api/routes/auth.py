"""
Authentication API routes.
"""

from fastapi import APIRouter, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter(prefix="/auth", tags=["auth"])

# Rate limiter for auth endpoints
limiter = Limiter(key_func=get_remote_address)


@router.post("/google")
@limiter.limit("60/minute")
async def auth_google(request: Request):
    """Google OAuth exchange."""
    return {"data": {"token": None}}


@router.get("/me")
@limiter.limit("60/minute")
async def auth_me(request: Request):
    """Get current user from JWT."""
    return {"data": {"user": None}}


@router.post("/logout")
@limiter.limit("60/minute")
async def auth_logout(request: Request):
    """Logout user."""
    return {"data": {"success": True}}
