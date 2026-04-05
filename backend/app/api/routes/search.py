"""
Search API routes.
"""

from fastapi import APIRouter, Query

router = APIRouter(prefix="/search", tags=["search"])


@router.get("")
async def search(
    q: str = Query(..., description="Search query"),
    type: str = Query("all", description="Search type: songs, albums, artists, playlists, all"),
    limit: int = Query(20, ge=1, le=50, description="Number of results"),
):
    """
    Search for music on YouTube Music.

    Args:
        q: Search query
        type: Type of content to search for
        limit: Maximum number of results

    Returns:
        dict: Search results
    """
    return {
        "data": {
            "songs": [],
            "albums": [],
            "artists": [],
            "playlists": [],
            "topResult": None,
        },
        "meta": {
            "query": q,
            "type": type,
            "limit": limit,
        },
    }
