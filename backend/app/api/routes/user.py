"""
User API routes for liked songs, history, playlists.
"""

from fastapi import APIRouter
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter(prefix="/user", tags=["user"])

# Rate limiter for user endpoints
limiter = Limiter(key_func=get_remote_address)


@router.get("/liked")
@limiter.limit("60/minute")
async def get_liked_songs():
    """Get liked songs for authenticated user."""
    return {"data": {"songs": []}}


@router.post("/like/{video_id}")
@limiter.limit("60/minute")
async def like_song(video_id: str):
    """Like a song."""
    return {"data": {"success": True}}


@router.delete("/like/{video_id}")
@limiter.limit("60/minute")
async def unlike_song(video_id: str):
    """Unlike a song."""
    return {"data": {"success": True}}


@router.get("/history")
@limiter.limit("60/minute")
async def get_history():
    """Get listening history."""
    return {"data": {"history": []}}
