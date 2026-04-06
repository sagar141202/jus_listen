"""
Search API routes with caching.
"""

from fastapi import APIRouter, HTTPException, Query, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.services import (
    ContentNotFoundError,
    YTMusicError,
    YTMusicRateLimitError,
    search_music,
)

router = APIRouter(prefix="/search", tags=["search"])

# Rate limiter for search endpoints
limiter = Limiter(key_func=get_remote_address)


@router.get("")
@limiter.limit("60/minute")
async def search(
    request: Request,
    q: str = Query(..., description="Search query", min_length=1, max_length=200),
    type: str = Query("all", description="Search type: songs, albums, artists, playlists, all"),
    limit: int = Query(20, ge=1, le=50, description="Number of results"),
):
    """
    Search for music on YouTube Music with caching (10min TTL).

    Args:
        q: Search query string (1-200 characters)
        type: Type of content to search for (songs, albums, artists, playlists, all)
        limit: Maximum number of results (1-50)

    Returns:
        dict: Search results with songs, albums, artists, playlists, and top result

    Raises:
        HTTPException: 400 for invalid type, 429 for rate limit, 500 for other errors
    """
    # Validate search type
    valid_types = ["songs", "albums", "artists", "playlists", "all"]
    if type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": f"Invalid search type '{type}'. Must be one of: {', '.join(valid_types)}",
                "code": "INVALID_SEARCH_TYPE",
                "valid_types": valid_types,
            },
        )

    try:
        # Perform search with caching handled by service
        results = await search_music(query=q, search_type=type, limit=limit)

        # Serialize dataclasses to dictionaries
        response_data = {
            "songs": [
                {
                    "videoId": s.video_id,
                    "title": s.title,
                    "artist": s.artist,
                    "artistId": s.artist_id,
                    "album": s.album,
                    "albumId": s.album_id,
                    "duration": s.duration,
                    "thumbnail": s.thumbnail,
                    "explicit": s.explicit,
                    "year": s.year,
                }
                for s in results.songs
            ],
            "albums": [
                {
                    "albumId": a.album_id,
                    "title": a.title,
                    "artist": a.artist,
                    "artistId": a.artist_id,
                    "year": a.year,
                    "thumbnail": a.thumbnail,
                    "trackCount": a.track_count,
                    "duration": a.duration,
                }
                for a in results.albums
            ],
            "artists": [
                {
                    "artistId": ar.artist_id,
                    "name": ar.name,
                    "thumbnail": ar.thumbnail,
                    "description": ar.description,
                    "views": ar.views,
                    "songsCount": ar.songs_count,
                    "subscribers": ar.subscribers,
                }
                for ar in results.artists
            ],
            "playlists": [
                {
                    "playlistId": p.playlist_id,
                    "title": p.title,
                    "author": p.author,
                    "thumbnail": p.thumbnail,
                    "trackCount": p.track_count,
                    "description": p.description,
                }
                for p in results.playlists
            ],
            "topResult": None,
        }

        # Add top result if exists
        if results.top_result:
            tr = results.top_result
            if hasattr(tr, "video_id"):  # Song
                response_data["topResult"] = {
                    "type": "song",
                    "videoId": tr.video_id,
                    "title": tr.title,
                    "artist": tr.artist,
                    "artistId": tr.artist_id,
                    "album": tr.album,
                    "albumId": tr.album_id,
                    "duration": tr.duration,
                    "thumbnail": tr.thumbnail,
                    "explicit": tr.explicit,
                    "year": tr.year,
                }
            elif hasattr(tr, "album_id"):  # Album
                response_data["topResult"] = {
                    "type": "album",
                    "albumId": tr.album_id,
                    "title": tr.title,
                    "artist": tr.artist,
                    "artistId": tr.artist_id,
                    "year": tr.year,
                    "thumbnail": tr.thumbnail,
                    "trackCount": tr.track_count,
                    "duration": tr.duration,
                }
            elif hasattr(tr, "artist_id"):  # Artist
                response_data["topResult"] = {
                    "type": "artist",
                    "artistId": tr.artist_id,
                    "name": tr.name,
                    "thumbnail": tr.thumbnail,
                    "description": tr.description,
                    "views": tr.views,
                    "songsCount": tr.songs_count,
                    "subscribers": tr.subscribers,
                }
            elif hasattr(tr, "playlist_id"):  # Playlist
                response_data["topResult"] = {
                    "type": "playlist",
                    "playlistId": tr.playlist_id,
                    "title": tr.title,
                    "author": tr.author,
                    "thumbnail": tr.thumbnail,
                    "trackCount": tr.track_count,
                    "description": tr.description,
                }

        return {
            "data": response_data,
            "meta": {
                "query": q,
                "type": type,
                "limit": limit,
                "results": {
                    "songs": len(results.songs),
                    "albums": len(results.albums),
                    "artists": len(results.artists),
                    "playlists": len(results.playlists),
                },
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
    except ContentNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": e.message,
                "code": e.code,
                "retryable": False,
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
                "error": f"Search failed: {str(e)}",
                "code": "SEARCH_FAILED",
                "retryable": True,
            },
        ) from e
