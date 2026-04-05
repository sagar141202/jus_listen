"""
User API routes for liked songs, history, playlists.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/user", tags=["user"])


@router.get("/liked")
async def get_liked_songs():
    """Get liked songs for authenticated user."""
    return {"data": {"songs": []}}


@router.post("/like/{video_id}")
async def like_song(video_id: str):
    """Like a song."""
    return {"data": {"success": True}}


@router.delete("/like/{video_id}")
async def unlike_song(video_id: str):
    """Unlike a song."""
    return {"data": {"success": True}}


@router.get("/history")
async def get_history():
    """Get listening history."""
    return {"data": {"history": []}}
