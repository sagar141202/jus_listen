"""
Lyrics API routes.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/lyrics", tags=["lyrics"])


@router.get("/{video_id}")
async def get_lyrics(video_id: str):
    """Get lyrics for a song."""
    return {
        "data": {
            "videoId": video_id,
            "synced": False,
            "lines": [],
        }
    }
