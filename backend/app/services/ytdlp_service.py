"""
yt-dlp service for audio stream extraction.
"""

import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import Optional

import yt_dlp
from fastapi import HTTPException, status

# Thread pool for yt-dlp operations (CPU-bound)
executor = ThreadPoolExecutor(max_workers=4, thread_name_prefix="ytdlp_")

# yt-dlp options for audio extraction
YTDLP_OPTIONS = {
    "format": "bestaudio/best",
    "quiet": True,
    "no_warnings": True,
    "extract_flat": False,
    "socket_timeout": 15,
    "retries": 3,
    "fragment_retries": 3,
    "file_access_retries": 3,
    "extractor_retries": 3,
}

# Format preferences (best audio quality)
AUDIO_FORMATS = [
    "opus",
    "webm",
    "m4a",
    "mp4",
]


class StreamExtractionError(Exception):
    """Custom exception for stream extraction errors."""

    def __init__(self, message: str, code: str, retryable: bool = True):
        self.message = message
        self.code = code
        self.retryable = retryable
        super().__init__(self.message)


def _extract_stream_sync(video_id: str) -> dict:
    """
    Synchronously extract audio stream URL from YouTube.

    Args:
        video_id: YouTube video ID

    Returns:
        dict with url, format info, and duration

    Raises:
        StreamExtractionError: For various failure modes
    """
    url = f"https://www.youtube.com/watch?v={video_id}"

    ydl_opts = {
        **YTDLP_OPTIONS,
        "format_sort": ["abr"],  # Sort by audio bitrate
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

            if not info:
                raise StreamExtractionError(
                    "Could not extract video information",
                    "EXTRACTION_FAILED",
                    retryable=True,
                )

            # Get best audio format
            formats = info.get("formats", [])
            audio_formats = [
                f for f in formats
                if f.get("acodec") != "none" and f.get("vcodec") == "none"
            ]

            if not audio_formats:
                # Fallback to any format with audio
                audio_formats = [f for f in formats if f.get("acodec") != "none"]

            if not audio_formats:
                raise StreamExtractionError(
                    "No audio stream available",
                    "NO_AUDIO_FORMAT",
                    retryable=False,
                )

            # Sort by bitrate (highest first)
            audio_formats.sort(key=lambda x: x.get("abr", 0) or 0, reverse=True)
            best_format = audio_formats[0]

            return {
                "url": best_format["url"],
                "format": best_format.get("ext", "unknown"),
                "bitrate": best_format.get("abr", 0),
                "duration": info.get("duration", 0),
                "title": info.get("title", ""),
                "thumbnail": info.get("thumbnail", ""),
            }

    except yt_dlp.utils.ExtractorError as e:
        error_msg = str(e).lower()

        if "private" in error_msg or "unavailable" in error_msg:
            raise StreamExtractionError(
                "This video is private or unavailable",
                "VIDEO_UNAVAILABLE",
                retryable=False,
            )
        elif "geoblocked" in error_msg or "not available" in error_msg:
            raise StreamExtractionError(
                "This video is not available in your region",
                "GEOBLOCKED",
                retryable=False,
            )
        elif "membership" in error_msg or "premium" in error_msg:
            raise StreamExtractionError(
                "This video requires membership or premium",
                "MEMBERSHIP_REQUIRED",
                retryable=False,
            )
        else:
            raise StreamExtractionError(
                f"Extraction error: {str(e)}",
                "EXTRACTION_ERROR",
                retryable=True,
            )

    except yt_dlp.utils.DownloadError as e:
        error_msg = str(e).lower()

        if "not found" in error_msg or "unavailable" in error_msg:
            raise StreamExtractionError(
                "Video not found",
                "VIDEO_NOT_FOUND",
                retryable=False,
            )
        elif "rate limit" in error_msg or "too many" in error_msg:
            raise StreamExtractionError(
                "Rate limited by YouTube. Please try again later.",
                "RATE_LIMITED",
                retryable=True,
            )
        elif "sign in" in error_msg or "login" in error_msg:
            raise StreamExtractionError(
                "This video requires authentication",
                "AUTH_REQUIRED",
                retryable=False,
            )
        else:
            raise StreamExtractionError(
                f"Download error: {str(e)}",
                "DOWNLOAD_ERROR",
                retryable=True,
            )

    except Exception as e:
        raise StreamExtractionError(
            f"Unexpected error: {str(e)}",
            "UNKNOWN_ERROR",
            retryable=True,
        )


async def extract_audio_stream(video_id: str) -> dict:
    """
    Async wrapper for audio stream extraction.

    Args:
        video_id: YouTube video ID

    Returns:
        dict with stream information

    Raises:
        HTTPException: Translated from StreamExtractionError
    """
    loop = asyncio.get_event_loop()

    try:
        # Run extraction in thread pool
        result = await asyncio.wait_for(
            loop.run_in_executor(executor, _extract_stream_sync, video_id),
            timeout=20.0,
        )
        return result

    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail={
                "error": "Stream extraction timed out",
                "code": "EXTRACTION_TIMEOUT",
                "retryable": True,
            },
        )

    except StreamExtractionError as e:
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR

        if e.code == "VIDEO_NOT_FOUND":
            status_code = status.HTTP_404_NOT_FOUND
        elif e.code == "GEOBLOCKED":
            status_code = status.HTTP_451_UNAVAILABLE_FOR_LEGAL_REASONS
        elif e.code == "RATE_LIMITED":
            status_code = status.HTTP_429_TOO_MANY_REQUESTS
        elif e.code in ["VIDEO_UNAVAILABLE", "MEMBERSHIP_REQUIRED", "AUTH_REQUIRED"]:
            status_code = status.HTTP_403_FORBIDDEN

        raise HTTPException(
            status_code=status_code,
            detail={
                "error": e.message,
                "code": e.code,
                "retryable": e.retryable,
            },
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": f"Failed to extract stream: {str(e)}",
                "code": "EXTRACTION_FAILED",
                "retryable": True,
            },
        )


def cleanup():
    """Clean up thread pool executor."""
    executor.shutdown(wait=False)
