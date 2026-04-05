"""
yt-dlp service with ThreadPoolExecutor for async stream extraction.
Handles edge cases: geo-blocked (451), deleted (404), rate limit (429).
"""

from __future__ import annotations

import asyncio
import re
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from datetime import datetime, timedelta
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


@dataclass
class StreamInfo:
    """Stream information returned by yt-dlp extraction."""

    video_id: str
    stream_url: str
    format: str
    bitrate: int | None
    expires_at: datetime
    duration: int | None = None  # in seconds
    title: str | None = None
    artist: str | None = None
    thumbnail: str | None = None


class YtdlpError(Exception):
    """Base exception for yt-dlp errors."""

    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class VideoNotFoundError(YtdlpError):
    """Video deleted or not found (404)."""

    def __init__(self, video_id: str):
        super().__init__(f"Video {video_id} not found or deleted", 404)


class GeoBlockedError(YtdlpError):
    """Video geo-blocked (451)."""

    def __init__(self, video_id: str, country: str | None = None):
        msg = f"Video {video_id} is not available"
        if country:
            msg += f" in {country}"
        super().__init__(msg, 451)


class RateLimitError(YtdlpError):
    """Rate limited by YouTube (429)."""

    def __init__(self, video_id: str):
        super().__init__(f"Rate limited while accessing {video_id}. Please try again later.", 429)


class AgeRestrictedError(YtdlpError):
    """Video is age-restricted (403)."""

    def __init__(self, video_id: str):
        super().__init__(f"Video {video_id} is age-restricted", 403)


def _parse_ytdlp_error(stderr: str, video_id: str) -> YtdlpError:
    """
    Parse yt-dlp stderr and return appropriate exception type.

    Args:
        stderr: Error output from yt-dlp
        video_id: YouTube video ID

    Returns:
        Appropriate YtdlpError subclass
    """
    stderr_lower = stderr.lower()

    # Check for specific error patterns
    if any(
        pattern in stderr_lower
        for pattern in [
            "video unavailable",
            "removed",
            "private video",
            "deleted",
            "not found",
            "content warning",
            "removed by",
        ]
    ):
        return VideoNotFoundError(video_id)

    if any(
        pattern in stderr_lower
        for pattern in [
            "unavailable in your country",
            "not available in",
            "geo-blocked",
            "geoblock",
            "blocked",
            "451",
        ]
    ):
        return GeoBlockedError(video_id)

    if any(
        pattern in stderr_lower
        for pattern in [
            "rate limit",
            "too many requests",
            "429",
            "ip blocked",
            "sign in",
            "verify you're not a robot",
        ]
    ):
        return RateLimitError(video_id)

    if any(
        pattern in stderr_lower
        for pattern in [
            "age-restricted",
            "age restricted",
            "mature content",
            "sign in to confirm",
        ]
    ):
        return AgeRestrictedError(video_id)

    # Generic error
    return YtdlpError(f"yt-dlp extraction failed: {stderr[:200]}", 500)


def _extract_stream_sync(video_id: str) -> StreamInfo:
    """
    Synchronously extract audio stream URL from YouTube.

    Args:
        video_id: YouTube video ID

    Returns:
        StreamInfo with extracted stream details

    Raises:
        YtdlpError: If extraction fails
    """
    url = f"https://www.youtube.com/watch?v={video_id}"

    ydl_opts = {
        **YTDLP_OPTIONS,
        "format_sort": ["abr"],  # Sort by audio bitrate
        "extractor_args": {
            "youtube": {
                "player_client": ["android"],
                "player_skip": ["webpage", "configs", "js"],
            }
        },
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

            if not info:
                raise VideoNotFoundError(video_id)

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
                raise YtdlpError(f"No audio stream available for {video_id}", 404)

            # Sort by bitrate (highest first)
            audio_formats.sort(key=lambda x: x.get("abr", 0) or 0, reverse=True)
            best_format = audio_formats[0]

            stream_url = best_format.get("url")
            if not stream_url:
                raise YtdlpError(f"No stream URL found for {video_id}", 404)

            # Parse format info
            fmt = best_format.get("ext", best_format.get("format_id", "unknown"))
            bitrate = int(best_format.get("tbr", 0)) if best_format.get("tbr") else None
            duration = int(info.get("duration", 0)) if info.get("duration") else None

            # Stream URLs expire in ~6 hours from YouTube
            expires_at = datetime.utcnow() + timedelta(hours=6)

            return StreamInfo(
                video_id=video_id,
                stream_url=stream_url,
                format=fmt,
                bitrate=bitrate,
                expires_at=expires_at,
                duration=duration,
                title=info.get("title"),
                artist=info.get("artist") or info.get("channel"),
                thumbnail=info.get("thumbnail"),
            )

    except yt_dlp.utils.DownloadError as e:
        error_msg = str(e)
        raise _parse_ytdlp_error(error_msg, video_id) from e
    except Exception as e:
        raise YtdlpError(f"Extraction failed: {str(e)[:200]}", 500) from e


async def extract_stream(video_id: str) -> StreamInfo:
    """
    Async wrapper for yt-dlp extraction using ThreadPoolExecutor.

    Args:
        video_id: YouTube video ID

    Returns:
        StreamInfo with stream details

    Raises:
        YtdlpError: If extraction fails with specific error types
    """
    loop = asyncio.get_event_loop()

    try:
        # Run blocking yt-dlp in thread pool
        result = await asyncio.wait_for(
            loop.run_in_executor(executor, _extract_stream_sync, video_id),
            timeout=30.0
        )
        return result
    except TimeoutError:
        raise YtdlpError("Extraction timed out. Please try again.", 504) from None


# Backward compatibility alias
async def extract_audio_stream(video_id: str) -> dict:
    """
    Async wrapper for audio stream extraction (backward compatibility).

    Args:
        video_id: YouTube video ID

    Returns:
        dict with stream information

    Raises:
        HTTPException: Translated from YtdlpError
    """
    try:
        result = await extract_stream(video_id)
        return {
            "url": result.stream_url,
            "format": result.format,
            "bitrate": result.bitrate,
            "duration": result.duration,
            "title": result.title,
            "artist": result.artist,
            "thumbnail": result.thumbnail,
            "expires_at": result.expires_at.isoformat(),
        }
    except YtdlpError as e:
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR

        if isinstance(e, VideoNotFoundError):
            status_code = status.HTTP_404_NOT_FOUND
        elif isinstance(e, GeoBlockedError):
            status_code = status.HTTP_451_UNAVAILABLE_FOR_LEGAL_REASONS
        elif isinstance(e, RateLimitError):
            status_code = status.HTTP_429_TOO_MANY_REQUESTS
        elif isinstance(e, AgeRestrictedError):
            status_code = status.HTTP_403_FORBIDDEN

        raise HTTPException(
            status_code=status_code,
            detail={
                "error": e.message,
                "code": type(e).__name__.upper(),
                "retryable": status_code in [500, 429, 504],
            },
        ) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": f"Failed to extract stream: {str(e)}",
                "code": "EXTRACTION_FAILED",
                "retryable": True,
            },
        ) from e


def cleanup():
    """Clean up thread pool executor."""
    executor.shutdown(wait=False)
