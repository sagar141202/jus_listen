"""
Browse API routes for home feed, artists, albums, playlists.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/browse", tags=["browse"])


@router.get("/home")
async def browse_home():
    """Get home feed with quick picks, listen again, trending."""
    return {"data": {"sections": []}}


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
