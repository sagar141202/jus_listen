"""
Lyrics API routes.
"""

from fastapi import APIRouter, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.services import (
    ContentNotFoundError,
    YTMusicError,
    YTMusicRateLimitError,
    get_song_lyrics,
)

router = APIRouter(prefix="/lyrics", tags=["lyrics"])

# Rate limiter for lyrics endpoints
limiter = Limiter(key_func=get_remote_address)


@router.get("/{video_id}")
@limiter.limit("60/minute")
async def get_lyrics(request: Request, video_id: str):
    """
    Get lyrics for a song.

    Args:
        video_id: YouTube video ID

    Returns:
        dict: Lyrics data with synced status and lines

    Raises:
        HTTPException: 404 for not found, 429 for rate limit, 500 for other errors
    """
    try:
        # Get lyrics from YTMusic service
        lyrics = await get_song_lyrics(video_id)

        return {
            "data": {
                "videoId": lyrics.video_id,
                "lyrics": lyrics.lyrics,
                "source": lyrics.source,
                "synced": lyrics.is_synced,
                "lines": lyrics.lines,
            },
            "meta": {
                "videoId": video_id,
                "hasLyrics": lyrics.lyrics is not None and len(lyrics.lyrics) > 0,
                "isSynced": lyrics.is_synced,
            },
        }

    except ContentNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": e.message,
                "code": e.code,
                "retryable": False,
            },
        ) from e
    except YTMusicRateLimitError as e:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": e.message,
                "code": e.code,
                "retryable": True,
            },
        ) from e
    except YTMusicError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": e.message,
                "code": e.code,
                "retryable": True,
            },
        ) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": f"Failed to get lyrics: {str(e)}",
                "code": "LYRICS_FAILED",
                "retryable": True,
            },
        ) from e
