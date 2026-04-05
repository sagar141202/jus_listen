"""
Browse API routes for home feed, artists, albums, playlists.
"""

from fastapi import APIRouter, HTTPException, status
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.services import (
    ContentNotFoundError,
    YTMusicError,
    YTMusicRateLimitError,
    get_home_feed,
)

router = APIRouter(prefix="/browse", tags=["browse"])

# Rate limiter for browse endpoints
limiter = Limiter(key_func=get_remote_address)


@router.get("/home")
@limiter.limit("60/minute")
async def browse_home():
    """
    Get home feed with quick picks, listen again, trending.

    Returns:
        dict: Home feed with sections (quick_picks, listen_again, trending, etc.)

    Raises:
        HTTPException: 429 for rate limit, 500 for other errors
    """
    try:
        # Get home feed with caching handled by service (30min TTL)
        sections = await get_home_feed()

        # Serialize sections to dictionaries
        response_sections = []
        for section in sections:
            serialized_contents = []

            for content in section.contents:
                if hasattr(content, "video_id"):  # Song
                    serialized_contents.append({
                        "type": "song",
                        "videoId": content.video_id,
                        "title": content.title,
                        "artist": content.artist,
                        "artistId": content.artist_id,
                        "album": content.album,
                        "albumId": content.album_id,
                        "duration": content.duration,
                        "thumbnail": content.thumbnail,
                        "explicit": content.explicit,
                        "year": content.year,
                    })
                elif hasattr(content, "album_id"):  # Album
                    serialized_contents.append({
                        "type": "album",
                        "albumId": content.album_id,
                        "title": content.title,
                        "artist": content.artist,
                        "artistId": content.artist_id,
                        "year": content.year,
                        "thumbnail": content.thumbnail,
                        "trackCount": content.track_count,
                        "duration": content.duration,
                    })
                elif hasattr(content, "artist_id"):  # Artist
                    serialized_contents.append({
                        "type": "artist",
                        "artistId": content.artist_id,
                        "name": content.name,
                        "thumbnail": content.thumbnail,
                        "description": content.description,
                        "views": content.views,
                        "songsCount": content.songs_count,
                        "subscribers": content.subscribers,
                    })
                elif hasattr(content, "playlist_id"):  # Playlist
                    serialized_contents.append({
                        "type": "playlist",
                        "playlistId": content.playlist_id,
                        "title": content.title,
                        "author": content.author,
                        "thumbnail": content.thumbnail,
                        "trackCount": content.track_count,
                        "description": content.description,
                    })

            response_sections.append({
                "title": section.title,
                "type": section.section_type,
                "contents": serialized_contents,
            })

        return {
            "data": {
                "sections": response_sections,
            },
            "meta": {
                "sectionCount": len(response_sections),
                "sectionTypes": list(set(s["type"] for s in response_sections)),
            },
        }

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
                "error": f"Failed to get home feed: {str(e)}",
                "code": "HOME_FEED_FAILED",
                "retryable": True,
            },
        ) from e


@router.get("/song/{video_id}")
async def browse_song(video_id: str):
    """Get song details with queue suggestions."""
    return {"data": {"song": None, "queue": [], "related": []}}


@router.get("/artist/{artist_id}")
async def browse_artist(artist_id: str):
    """Get artist details."""
    return {"data": {"artist": None}}


@router.get("/album/{album_id}")
async def browse_album(album_id: str):
    """Get album details."""
    return {"data": {"album": None}}


@router.get("/playlist/{playlist_id}")
async def browse_playlist(playlist_id: str):
    """Get playlist details."""
    return {"data": {"playlist": None}}
