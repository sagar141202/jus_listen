"""
Stream API routes for audio streaming.
"""

from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import RedirectResponse

from app.services.cache_service import (
    cache_stream_url,
    get_cached_stream_url,
)
from app.services.ytdlp_service import extract_audio_stream

router = APIRouter(prefix="/stream", tags=["stream"])


@router.get("/{video_id}")
async def stream_audio(video_id: str, request: Request):
    """
    Get audio stream URL for a YouTube video.

    Args:
        video_id: YouTube video ID
        request: FastAPI request object (for Range header passthrough)

    Returns:
        RedirectResponse: 302 redirect to the audio stream URL

    Raises:
        HTTPException: If video not found, geo-blocked, or rate limited
    """
    # Check cache first
    cached = get_cached_stream_url(video_id)
    if cached:
        stream_url = cached.get("url")
        if stream_url:
            return RedirectResponse(
                url=stream_url,
                status_code=status.HTTP_302_FOUND,
            )

    # Extract fresh stream URL
    try:
        result = await extract_audio_stream(video_id)
        stream_url = result.get("url")

        if not stream_url:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "error": "Could not extract stream URL",
                    "code": "EXTRACTION_FAILED",
                    "retryable": True,
                },
            )

        # Cache the URL
        cache_stream_url(video_id, stream_url)

        # Return redirect to stream URL
        response = RedirectResponse(
            url=stream_url,
            status_code=status.HTTP_302_FOUND,
        )

        # Pass Range header if present (for seeking support)
        range_header = request.headers.get("Range")
        if range_header:
            response.headers["Range"] = range_header

        return response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": f"Failed to get stream: {str(e)}",
                "code": "STREAM_ERROR",
                "retryable": True,
            },
        )
