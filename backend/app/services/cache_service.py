"""
Redis cache service for stream URLs and API responses.
"""

import json
from typing import Any, Optional

import redis
from app.config import settings

# Redis client
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

# Cache TTL constants
STREAM_URL_TTL = 6 * 60 * 60  # 6 hours
SEARCH_CACHE_TTL = 10 * 60  # 10 minutes
HOME_FEED_TTL = 30 * 60  # 30 minutes
LYRICS_TTL = 24 * 60 * 60  # 24 hours


def get_stream_key(video_id: str) -> str:
    """Generate Redis key for stream URL."""
    return f"stream:{video_id}"


def get_search_key(query: str, search_type: str) -> str:
    """Generate Redis key for search results."""
    return f"search:{search_type}:{query.lower().strip()}"


def get_home_key() -> str:
    """Generate Redis key for home feed."""
    return "browse:home"


def get_lyrics_key(video_id: str) -> str:
    """Generate Redis key for lyrics."""
    return f"lyrics:{video_id}"


def get_cached_stream_url(video_id: str) -> Optional[dict]:
    """
    Get cached stream URL for a video.

    Args:
        video_id: YouTube video ID

    Returns:
        dict with url and expires_at, or None if not found
    """
    key = get_stream_key(video_id)
    data = redis_client.get(key)
    if data:
        return json.loads(data)
    return None


def cache_stream_url(video_id: str, stream_url: str, ttl: int = STREAM_URL_TTL) -> None:
    """
    Cache stream URL for a video.

    Args:
        video_id: YouTube video ID
        stream_url: Direct audio stream URL
        ttl: Time to live in seconds
    """
    key = get_stream_key(video_id)
    data = json.dumps({"url": stream_url, "expires_at": ttl})
    redis_client.setex(key, ttl, data)


def get_cached_search(query: str, search_type: str) -> Optional[dict]:
    """Get cached search results."""
    key = get_search_key(query, search_type)
    data = redis_client.get(key)
    if data:
        return json.loads(data)
    return None


def cache_search(query: str, search_type: str, results: dict) -> None:
    """Cache search results."""
    key = get_search_key(query, search_type)
    redis_client.setex(key, SEARCH_CACHE_TTL, json.dumps(results))


def get_cached_home() -> Optional[list]:
    """Get cached home feed."""
    key = get_home_key()
    data = redis_client.get(key)
    if data:
        return json.loads(data)
    return None


def cache_home(feed: list) -> None:
    """Cache home feed."""
    key = get_home_key()
    redis_client.setex(key, HOME_FEED_TTL, json.dumps(feed))


def get_cached_lyrics(video_id: str) -> Optional[dict]:
    """Get cached lyrics."""
    key = get_lyrics_key(video_id)
    data = redis_client.get(key)
    if data:
        return json.loads(data)
    return None


def cache_lyrics(video_id: str, lyrics: dict) -> None:
    """Cache lyrics."""
    key = get_lyrics_key(video_id)
    redis_client.setex(key, LYRICS_TTL, json.dumps(lyrics))


def delete_cache(key: str) -> None:
    """Delete a cache key."""
    redis_client.delete(key)


def health_check() -> bool:
    """Check Redis connection health."""
    try:
        return redis_client.ping()
    except redis.ConnectionError:
        return False
