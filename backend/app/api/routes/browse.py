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
    get_artist_details,
    get_home_feed,
    get_song_details,
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
@limiter.limit("60/minute")
async def browse_song(video_id: str):
    """
    Get song details with queue suggestions.

    Args:
        video_id: YouTube video ID

    Returns:
        dict: Song details with main song, queue suggestions, and related songs

    Raises:
        HTTPException: 404 for not found, 429 for rate limit, 500 for other errors
    """
    try:
        # Get song details with queue suggestions
        details = await get_song_details(video_id)

        # Serialize song data
        def serialize_song(song):
            return {
                "videoId": song.video_id,
                "title": song.title,
                "artist": song.artist,
                "artistId": song.artist_id,
                "album": song.album,
                "albumId": song.album_id,
                "duration": song.duration,
                "thumbnail": song.thumbnail,
                "explicit": song.explicit,
                "year": song.year,
            }

        return {
            "data": {
                "song": serialize_song(details.song),
                "queue": [serialize_song(s) for s in details.queue],
                "related": [serialize_song(s) for s in details.related],
            },
            "meta": {
                "videoId": video_id,
                "queueCount": len(details.queue),
                "relatedCount": len(details.related),
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
                "error": f"Failed to get song details: {str(e)}",
                "code": "SONG_DETAILS_FAILED",
                "retryable": True,
            },
        ) from e


@router.get("/artist/{artist_id}")
@limiter.limit("60/minute")
async def browse_artist(artist_id: str):
    """
    Get artist details.

    Args:
        artist_id: YouTube Music artist ID

    Returns:
        dict: Artist details with top songs, albums, singles, and similar artists

    Raises:
        HTTPException: 404 for not found, 429 for rate limit, 500 for other errors
    """
    try:
        # Get artist details
        details = await get_artist_details(artist_id)
        artist = details.artist

        # Serialize song data helper
        def serialize_song(song):
            return {
                "videoId": song.video_id,
                "title": song.title,
                "artist": song.artist,
                "artistId": song.artist_id,
                "album": song.album,
                "albumId": song.album_id,
                "duration": song.duration,
                "thumbnail": song.thumbnail,
                "explicit": song.explicit,
                "year": song.year,
            }

        # Serialize album data helper
        def serialize_album(album):
            return {
                "albumId": album.album_id,
                "title": album.title,
                "artist": album.artist,
                "artistId": album.artist_id,
                "year": album.year,
                "thumbnail": album.thumbnail,
                "trackCount": album.track_count,
                "duration": album.duration,
            }

        return {
            "data": {
                "artist": {
                    "artistId": artist.artist_id,
                    "name": artist.name,
                    "thumbnail": artist.thumbnail,
                    "description": artist.description,
                    "views": artist.views,
                    "songsCount": artist.songs_count,
                    "subscribers": artist.subscribers,
                },
                "topSongs": [serialize_song(s) for s in details.top_songs],
                "albums": [serialize_album(a) for a in details.albums],
                "singles": [serialize_song(s) for s in details.singles],
                "similarArtists": [
                    {
                        "artistId": ar.artist_id,
                        "name": ar.name,
                        "thumbnail": ar.thumbnail,
                    }
                    for ar in details.similar_artists
                ],
            },
            "meta": {
                "artistId": artist_id,
                "topSongsCount": len(details.top_songs),
                "albumsCount": len(details.albums),
                "singlesCount": len(details.singles),
                "similarArtistsCount": len(details.similar_artists),
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
                "error": f"Failed to get artist details: {str(e)}",
                "code": "ARTIST_DETAILS_FAILED",
                "retryable": True,
            },
        ) from e


@router.get("/album/{album_id}")
async def browse_album(album_id: str):
    """Get album details."""
    return {"data": {"album": None}}


@router.get("/playlist/{playlist_id}")
async def browse_playlist(playlist_id: str):
    """Get playlist details."""
    return {"data": {"playlist": None}}
