"""
Stream router with yt-dlp integration.
GET /api/stream/{video_id} - Get stream URL (cached 6h)
GET /api/stream/{video_id}/proxy - Proxy audio stream with Range header support
"""

import dataclasses
from datetime import datetime
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.services.cache_service import (
    cache_stream_url,
    get_cached_stream_url,
)
from app.services.ytdlp_service import (
    AgeRestrictedError,
    GeoBlockedError,
    RateLimitError,
    VideoNotFoundError,
    YtdlpError,
    extract_stream,
    StreamInfo,
)

router = APIRouter(prefix="/stream", tags=["stream"])

# Rate limiter for stream endpoints
limiter = Limiter(key_func=get_remote_address)


class StreamResponse(BaseModel):
    """Stream URL response model."""

    video_id: str
    stream_url: str
    format: str
    bitrate: int | None
    expires_at: str
    duration: int | None = None
    title: str | None = None
    artist: str | None = None


class ErrorResponse(BaseModel):
    """Error response model."""

    error: str
    detail: str | None = None
    code: str | None = None


def _stream_info_to_dict(obj: Any) -> dict:
    """Convert StreamInfo dataclass to dict with datetime serialization."""
    if dataclasses.is_dataclass(obj):
        result = {}
        for f in dataclasses.fields(obj):
            val = getattr(obj, f.name)
            if isinstance(val, datetime):
                result[f.name] = val.isoformat()
            else:
                result[f.name] = val
        return result
    return dict(obj)


@router.get(
    "/{video_id}",
    response_model=StreamResponse,
    responses={
        404: {"model": ErrorResponse, "description": "Video not found"},
        451: {"model": ErrorResponse, "description": "Geo-blocked"},
        429: {"model": ErrorResponse, "description": "Rate limited"},
        403: {"model": ErrorResponse, "description": "Age restricted"},
        422: {"model": ErrorResponse, "description": "Stream unavailable"},
    },
)
@limiter.limit("60/minute")
async def get_stream(request: Request, video_id: str) -> dict:
    """
    Get stream URL for a YouTube video.

    Returns stream URL with 6-hour Redis caching.
    Handles edge cases: geo-blocked (451), deleted (404), rate limit (429).
    """
    # Check cache first
    cached = get_cached_stream_url(video_id)
    if cached:
        return cached

    # Extract fresh stream URL
    try:
        result = await extract_stream(video_id)
        result_dict = _stream_info_to_dict(result)
        cache_stream_url(video_id, result_dict["stream_url"])
        return result_dict

    except VideoNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "video_not_found", "detail": e.message, "code": "NOT_FOUND"},
        ) from e

    except GeoBlockedError as e:
        raise HTTPException(
            status_code=status.HTTP_451_UNAVAILABLE_FOR_LEGAL_REASONS,
            detail={"error": "geo_blocked", "detail": e.message, "code": "GEO_BLOCKED"},
        ) from e

    except RateLimitError as e:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={"error": "rate_limited", "detail": e.message, "code": "RATE_LIMITED"},
        ) from e

    except AgeRestrictedError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": "age_restricted", "detail": e.message, "code": "AGE_RESTRICTED"},
        ) from e

    except YtdlpError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": "stream_unavailable",
                "detail": e.message,
                "code": "EXTRACTION_FAILED",
            },
        ) from e

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "internal_error",
                "detail": "Failed to extract stream",
                "code": "INTERNAL_ERROR",
            },
        ) from e


@router.get(
    "/{video_id}/proxy",
    responses={
        404: {"model": ErrorResponse, "description": "Stream not found"},
        451: {"model": ErrorResponse, "description": "Geo-blocked"},
        429: {"model": ErrorResponse, "description": "Rate limited"},
    },
)
@limiter.limit("60/minute")
async def proxy_stream(video_id: str, request: Request) -> StreamingResponse:
    """
    Proxy audio stream with Range header support for seeking.

    Streams audio directly through the backend to avoid CORS issues.
    Supports HTTP Range requests for seeking/scrubbing.
    """
    # Get stream URL (from cache or fresh)
    cached = get_cached_stream_url(video_id)

    if cached and cached.get("stream_url"):
        url = cached["stream_url"]
    else:
        try:
            result = await extract_stream(video_id)
            cache_stream_url(video_id, result.stream_url)
            url = result.stream_url
        except YtdlpError as e:
            raise HTTPException(
                status_code=e.status_code,
                detail={"error": type(e).__name__.lower().replace("error", ""), "detail": str(e)},
            ) from e

    # Get Range header from client request
    range_header = request.headers.get("range", "bytes=0-")

    async def stream_audio():
        """Generator that streams audio chunks from YouTube."""
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                async with client.stream(
                    "GET",
                    url,
                    headers={
                        "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
                        "Accept": "*/*",
                        "Accept-Language": "en-US,en;q=0.9",
                        "Range": range_header,
                        "Referer": "https://www.youtube.com/",
                        "Origin": "https://www.youtube.com",
                    },
                ) as resp:
                    # Handle redirect
                    if resp.status_code in (301, 302, 303, 307, 308):
                        redirect_url = resp.headers.get("location")
                        if redirect_url:
                            async with client.stream(
                                "GET",
                                redirect_url,
                                headers={
                                    "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36",
                                    "Range": range_header,
                                },
                            ) as redirect_resp:
                                async for chunk in redirect_resp.aiter_bytes(chunk_size=65536):
                                    yield chunk
                            return

                    # Stream response body
                    if resp.status_code in (200, 206):
                        async for chunk in resp.aiter_bytes(chunk_size=65536):
                            yield chunk
                    else:
                        raise HTTPException(
                            status_code=502,
                            detail={"error": "upstream_error", "status": resp.status_code},
                        )

            except httpx.TimeoutException as e:
                raise HTTPException(
                    status_code=504,
                    detail={"error": "gateway_timeout", "detail": "Upstream timeout"},
                ) from e
            except Exception as e:
                raise HTTPException(
                    status_code=502,
                    detail={"error": "bad_gateway", "detail": "Failed to proxy stream"},
                ) from e

    return StreamingResponse(
        stream_audio(),
        media_type="audio/webm",
        headers={
            "Accept-Ranges": "bytes",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
        },
    )


@router.get("/{video_id}/health")
@limiter.limit("60/minute")
async def check_stream_health(request: Request, video_id: str) -> dict:
    """
    Check if a stream is healthy and available.

    Returns cached status or attempts fresh extraction.
    """
    cached = get_cached_stream_url(video_id)

    if cached:
        return {
            "video_id": video_id,
            "status": "cached",
            "expires_at": cached.get("expires_at"),
            "cached": True,
        }

    try:
        result = await extract_stream(video_id)
        cache_stream_url(video_id, result.stream_url)
        return {
            "video_id": video_id,
            "status": "available",
            "format": result.format,
            "cached": False,
        }
    except YtdlpError as e:
        return {
            "video_id": video_id,
            "status": "unavailable",
            "error": e.message,
            "code": type(e).__name__,
        }
