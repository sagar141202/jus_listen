"""
YouTube Music API service wrapper for ytmusicapi.
Provides search, browse, and content retrieval functionality.
"""

from __future__ import annotations

import asyncio
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Optional

from ytmusicapi import YTMusic

from app.config import settings
from app.services import cache_service

# Thread pool for ytmusicapi operations (CPU-bound / network)
executor = ThreadPoolExecutor(max_workers=4, thread_name_prefix="ytmusic_")


class SearchType(str, Enum):
    """Search type enumeration."""

    SONGS = "songs"
    ALBUMS = "albums"
    ARTISTS = "artists"
    PLAYLISTS = "playlists"
    ALL = "all"


class YTMusicError(Exception):
    """Base exception for YTMusic errors."""

    def __init__(self, message: str, status_code: int = 500, code: str = "YTMUSIC_ERROR"):
        self.message = message
        self.status_code = status_code
        self.code = code
        super().__init__(self.message)


class ContentNotFoundError(YTMusicError):
    """Content not found error."""

    def __init__(self, content_type: str, content_id: str):
        super().__init__(
            message=f"{content_type} '{content_id}' not found",
            status_code=404,
            code="CONTENT_NOT_FOUND",
        )


class YTMusicRateLimitError(YTMusicError):
    """Rate limited by YouTube Music."""

    def __init__(self, message: str = "Rate limited by YouTube Music"):
        super().__init__(
            message=message,
            status_code=429,
            code="RATE_LIMITED",
        )


class YTMusicAuthError(YTMusicError):
    """Authentication error with YouTube Music."""

    def __init__(self, message: str = "YouTube Music authentication failed"):
        super().__init__(
            message=message,
            status_code=401,
            code="AUTH_ERROR",
        )


@dataclass
class Song:
    """Song data model."""

    video_id: str
    title: str
    artist: str
    artist_id: str | None = None
    album: str | None = None
    album_id: str | None = None
    duration: int | None = None  # in seconds
    thumbnail: str | None = None
    explicit: bool = False
    year: int | None = None


@dataclass
class Artist:
    """Artist data model."""

    artist_id: str
    name: str
    thumbnail: str | None = None
    description: str | None = None
    views: str | None = None  # formatted string like "1.2B"
    songs_count: int | None = None
    subscribers: str | None = None  # formatted string like "10M"


@dataclass
class Album:
    """Album data model."""

    album_id: str
    title: str
    artist: str
    artist_id: str | None = None
    year: int | None = None
    thumbnail: str | None = None
    track_count: int | None = None
    duration: str | None = None  # formatted like "45:30"
    description: str | None = None


@dataclass
class Playlist:
    """Playlist data model."""

    playlist_id: str
    title: str
    author: str
    thumbnail: str | None = None
    track_count: int | None = None
    description: str | None = None


@dataclass
class SongDetails:
    """Detailed song information with queue suggestions."""

    song: Song
    related: list[Song] = field(default_factory=list)
    queue: list[Song] = field(default_factory=list)


@dataclass
class ArtistDetails:
    """Detailed artist information."""

    artist: Artist
    top_songs: list[Song] = field(default_factory=list)
    albums: list[Album] = field(default_factory=list)
    singles: list[Song] = field(default_factory=list)
    similar_artists: list[Artist] = field(default_factory=list)


@dataclass
class AlbumDetails:
    """Detailed album information."""

    album: Album
    tracks: list[Song] = field(default_factory=list)
    description: str | None = None


@dataclass
class PlaylistDetails:
    """Detailed playlist information."""

    playlist: Playlist
    tracks: list[Song] = field(default_factory=list)


@dataclass
class Lyrics:
    """Lyrics data model."""

    video_id: str
    lyrics: str | None = None
    source: str | None = None
    is_synced: bool = False
    lines: list[dict] = field(default_factory=list)


@dataclass
class HomeSection:
    """Home feed section."""

    title: str
    contents: list[Song | Album | Playlist | Artist]
    section_type: str  # "quick_picks", "listen_again", "trending", etc.


@dataclass
class SearchResults:
    """Search results container."""

    songs: list[Song] = field(default_factory=list)
    albums: list[Album] = field(default_factory=list)
    artists: list[Artist] = field(default_factory=list)
    playlists: list[Playlist] = field(default_factory=list)
    top_result: Song | Album | Artist | Playlist | None = None


class YTMusicService:
    """
    YouTube Music API service.

    Wraps ytmusicapi with async support, caching, and structured data models.
    """

    _instance: Optional[YTMusicService] = None
    _client: Optional[YTMusic] = None

    def __new__(cls) -> YTMusicService:
        """Singleton pattern for YTMusic service."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def _get_client(self) -> YTMusic:
        """
        Get or create YTMusic client.

        Returns:
            YTMusic client instance
        """
        if self._client is None:
            try:
                # Initialize with optional OAuth credentials
                if settings.YTM_COOKIE:
                    self._client = YTMusic(settings.YTM_COOKIE)
                else:
                    self._client = YTMusic()
            except Exception as e:
                raise YTMusicAuthError(f"Failed to initialize YTMusic: {str(e)}") from e
        return self._client

    def _reset_client(self) -> None:
        """Reset the client (useful after auth errors)."""
        self._client = None

    def _transform_song(self, data: dict) -> Song:
        """
        Transform ytmusicapi song data to Song model.

        Args:
            data: Raw song data from ytmusicapi

        Returns:
            Song model
        """
        # Handle different data structures from search vs browse
        video_id = data.get("videoId") or data.get("video_id")
        title = data.get("title", "Unknown Title")

        # Extract artist info
        artists = data.get("artists", [])
        artist = artists[0].get("name", "Unknown Artist") if artists else "Unknown Artist"
        artist_id = artists[0].get("id") if artists else None

        # Extract album info
        album_data = data.get("album", {})
        album = album_data.get("name") if isinstance(album_data, dict) else None
        album_id = album_data.get("id") if isinstance(album_data, dict) else None

        # Parse duration
        duration = data.get("duration_seconds")
        if duration is None and "duration" in data:
            duration_str = data["duration"]
            if isinstance(duration_str, str) and ":" in duration_str:
                # Parse MM:SS or HH:MM:SS format
                parts = duration_str.split(":")
                if len(parts) == 2:
                    duration = int(parts[0]) * 60 + int(parts[1])
                elif len(parts) == 3:
                    duration = int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])

        # Get thumbnail (highest quality available)
        thumbnails = data.get("thumbnails", [])
        thumbnail = None
        if thumbnails:
            # Get the highest resolution thumbnail
            thumbnail = max(thumbnails, key=lambda x: x.get("width", 0) * x.get("height", 0))
            thumbnail = thumbnail.get("url")

        return Song(
            video_id=video_id,
            title=title,
            artist=artist,
            artist_id=artist_id,
            album=album,
            album_id=album_id,
            duration=duration,
            thumbnail=thumbnail,
            explicit=data.get("isExplicit", False),
            year=data.get("year"),
        )

    def _transform_artist(self, data: dict) -> Artist:
        """
        Transform ytmusicapi artist data to Artist model.

        Args:
            data: Raw artist data from ytmusicapi

        Returns:
            Artist model
        """
        artist_id = data.get("channelId") or data.get("browseId")
        thumbnails = data.get("thumbnails", [])
        thumbnail = None
        if thumbnails:
            thumbnail = max(thumbnails, key=lambda x: x.get("width", 0) * x.get("height", 0))
            thumbnail = thumbnail.get("url")

        return Artist(
            artist_id=artist_id,
            name=data.get("artist", data.get("name", "Unknown Artist")),
            thumbnail=thumbnail,
            description=data.get("description"),
            views=data.get("views"),
            songs_count=data.get("songsCount"),
            subscribers=data.get("subscribers"),
        )

    def _transform_album(self, data: dict) -> Album:
        """
        Transform ytmusicapi album data to Album model.

        Args:
            data: Raw album data from ytmusicapi

        Returns:
            Album model
        """
        album_id = data.get("browseId") or data.get("audioPlaylistId")

        # Get artist info
        artists = data.get("artists", [])
        artist = artists[0].get("name", "Unknown Artist") if artists else "Unknown Artist"
        artist_id = artists[0].get("id") if artists else None

        thumbnails = data.get("thumbnails", [])
        thumbnail = None
        if thumbnails:
            thumbnail = max(thumbnails, key=lambda x: x.get("width", 0) * x.get("height", 0))
            thumbnail = thumbnail.get("url")

        # Parse year
        year = data.get("year")
        if isinstance(year, str) and year.isdigit():
            year = int(year)

        return Album(
            album_id=album_id,
            title=data.get("title", "Unknown Album"),
            artist=artist,
            artist_id=artist_id,
            year=year,
            thumbnail=thumbnail,
            track_count=data.get("trackCount") or data.get("songCount"),
            duration=data.get("duration"),
            description=data.get("description"),
        )

    def _transform_playlist(self, data: dict) -> Playlist:
        """
        Transform ytmusicapi playlist data to Playlist model.

        Args:
            data: Raw playlist data from ytmusicapi

        Returns:
            Playlist model
        """
        playlist_id = data.get("playlistId") or data.get("browseId")
        author = data.get("author", "Unknown")
        if isinstance(author, dict):
            author = author.get("name", "Unknown")

        thumbnails = data.get("thumbnails", [])
        thumbnail = None
        if thumbnails:
            thumbnail = max(thumbnails, key=lambda x: x.get("width", 0) * x.get("height", 0))
            thumbnail = thumbnail.get("url")

        # Parse track count
        track_count = data.get("trackCount") or data.get("songCount")
        if track_count is None and "count" in data:
            count_str = str(data["count"])
            # Extract number from strings like "50 songs"
            import re

            match = re.search(r"(\d+)", count_str)
            if match:
                track_count = int(match.group(1))

        return Playlist(
            playlist_id=playlist_id,
            title=data.get("title", "Unknown Playlist"),
            author=author,
            thumbnail=thumbnail,
            track_count=track_count,
            description=data.get("description"),
        )

    def _search_sync(self, query: str, search_type: str, limit: int) -> SearchResults:
        """
        Synchronous search operation.

        Args:
            query: Search query
            search_type: Type of content to search for
            limit: Maximum number of results

        Returns:
            SearchResults with songs, albums, artists, playlists
        """
        client = self._get_client()
        results = SearchResults()

        # Map search types to ytmusicapi filters
        filter_map = {
            "songs": "songs",
            "albums": "albums",
            "artists": "artists",
            "playlists": "playlists",
        }

        try:
            if search_type == "all":
                # Search for all types
                search_results = client.search(query, limit=limit)

                for item in search_results:
                    result_type = item.get("resultType", item.get("category", "")).lower()

                    if result_type in ["song", "video"]:
                        results.songs.append(self._transform_song(item))
                    elif result_type == "artist":
                        results.artists.append(self._transform_artist(item))
                    elif result_type == "album":
                        results.albums.append(self._transform_album(item))
                    elif result_type == "playlist":
                        results.playlists.append(self._transform_playlist(item))

                # Set top result if available
                if search_results:
                    first = search_results[0]
                    result_type = first.get("resultType", first.get("category", "")).lower()
                    if result_type in ["song", "video"]:
                        results.top_result = self._transform_song(first)
                    elif result_type == "artist":
                        results.top_result = self._transform_artist(first)
                    elif result_type == "album":
                        results.top_result = self._transform_album(first)
                    elif result_type == "playlist":
                        results.top_result = self._transform_playlist(first)
            else:
                # Search for specific type
                ytm_filter = filter_map.get(search_type)
                search_results = client.search(query, filter=ytm_filter, limit=limit)

                if search_type == "songs":
                    results.songs = [self._transform_song(item) for item in search_results]
                elif search_type == "artists":
                    results.artists = [self._transform_artist(item) for item in search_results]
                elif search_type == "albums":
                    results.albums = [self._transform_album(item) for item in search_results]
                elif search_type == "playlists":
                    results.playlists = [
                        self._transform_playlist(item) for item in search_results
                    ]

                # Set top result
                if search_results:
                    if search_type == "songs":
                        results.top_result = self._transform_song(search_results[0])
                    elif search_type == "artists":
                        results.top_result = self._transform_artist(search_results[0])
                    elif search_type == "albums":
                        results.top_result = self._transform_album(search_results[0])
                    elif search_type == "playlists":
                        results.top_result = self._transform_playlist(search_results[0])

        except Exception as e:
            error_msg = str(e).lower()
            if "rate limit" in error_msg or "429" in error_msg:
                raise YTMusicRateLimitError() from e
            raise YTMusicError(f"Search failed: {str(e)}") from e

        return results

    def _get_home_sync(self) -> list[HomeSection]:
        """
        Synchronous home feed retrieval.

        Returns:
            List of home sections
        """
        client = self._get_client()
        sections: list[HomeSection] = []

        try:
            home_data = client.get_home(limit=10)

            for section in home_data:
                section_title = section.get("title", "Unknown")
                section_type = "unknown"

                # Determine section type from title or contents
                title_lower = section_title.lower()
                if "quick" in title_lower or "pick" in title_lower:
                    section_type = "quick_picks"
                elif "listen" in title_lower or "again" in title_lower:
                    section_type = "listen_again"
                elif "trending" in title_lower or "hot" in title_lower:
                    section_type = "trending"
                elif "new" in title_lower or "release" in title_lower:
                    section_type = "new_releases"
                elif "mix" in title_lower:
                    section_type = "mixes"

                contents: list[Any] = []
                items = section.get("contents", [])

                for item in items:
                    content_type = item.get("type", "").lower()

                    if content_type == "song":
                        contents.append(self._transform_song(item))
                    elif content_type == "album":
                        contents.append(self._transform_album(item))
                    elif content_type == "playlist":
                        contents.append(self._transform_playlist(item))
                    elif content_type == "artist":
                        contents.append(self._transform_artist(item))
                    elif "videoId" in item:
                        # Likely a song without explicit type
                        contents.append(self._transform_song(item))

                if contents:
                    sections.append(
                        HomeSection(
                            title=section_title,
                            contents=contents,
                            section_type=section_type,
                        )
                    )

        except Exception as e:
            error_msg = str(e).lower()
            if "rate limit" in error_msg or "429" in error_msg:
                raise YTMusicRateLimitError() from e
            raise YTMusicError(f"Failed to get home feed: {str(e)}") from e

        return sections

    def _get_song_sync(self, video_id: str) -> SongDetails:
        """
        Synchronous song details retrieval.

        Args:
            video_id: YouTube video ID

        Returns:
            SongDetails with song info, related songs, and queue
        """
        client = self._get_client()

        try:
            # Get watch playlist (includes queue and related)
            watch_data = client.get_watch_playlist(video_id, limit=25)

            tracks = watch_data.get("tracks", [])
            if not tracks:
                raise ContentNotFoundError("Song", video_id)

            # First track is the main song
            main_song = self._transform_song(tracks[0])

            # Remaining tracks are queue/related
            related_songs: list[Song] = []
            queue_songs: list[Song] = []

            for track in tracks[1:]:
                song = self._transform_song(track)
                # Alternate between queue and related for variety
                if len(queue_songs) <= len(related_songs):
                    queue_songs.append(song)
                else:
                    related_songs.append(song)

            return SongDetails(
                song=main_song,
                related=related_songs,
                queue=queue_songs,
            )

        except ContentNotFoundError:
            raise
        except Exception as e:
            error_msg = str(e).lower()
            if "rate limit" in error_msg or "429" in error_msg:
                raise YTMusicRateLimitError() from e
            raise YTMusicError(f"Failed to get song details: {str(e)}") from e

    def _get_artist_sync(self, artist_id: str) -> ArtistDetails:
        """
        Synchronous artist details retrieval.

        Args:
            artist_id: YouTube Music artist ID

        Returns:
            ArtistDetails with artist info, songs, albums, etc.
        """
        client = self._get_client()

        try:
            # Get artist data
            artist_data = client.get_artist(artist_id)

            if not artist_data:
                raise ContentNotFoundError("Artist", artist_id)

            artist = self._transform_artist(artist_data)

            # Get top songs
            top_songs: list[Song] = []
            songs_data = artist_data.get("songs", {})
            if songs_data:
                for song_item in songs_data.get("results", [])[:10]:
                    top_songs.append(self._transform_song(song_item))

            # Get albums
            albums: list[Album] = []
            albums_data = artist_data.get("albums", {})
            if albums_data:
                for album_item in albums_data.get("results", [])[:10]:
                    albums.append(self._transform_album(album_item))

            # Get singles
            singles: list[Song] = []
            singles_data = artist_data.get("singles", {})
            if singles_data:
                for single_item in singles_data.get("results", [])[:10]:
                    if "videoId" in single_item:
                        singles.append(self._transform_song(single_item))

            # Get similar artists
            similar_artists: list[Artist] = []
            related_data = artist_data.get("related", {})
            if related_data:
                for related_item in related_data.get("results", [])[:5]:
                    similar_artists.append(self._transform_artist(related_item))

            return ArtistDetails(
                artist=artist,
                top_songs=top_songs,
                albums=albums,
                singles=singles,
                similar_artists=similar_artists,
            )

        except ContentNotFoundError:
            raise
        except Exception as e:
            error_msg = str(e).lower()
            if "rate limit" in error_msg or "429" in error_msg:
                raise YTMusicRateLimitError() from e
            raise YTMusicError(f"Failed to get artist details: {str(e)}") from e

    def _get_album_sync(self, album_id: str) -> AlbumDetails:
        """
        Synchronous album details retrieval.

        Args:
            album_id: YouTube Music album ID

        Returns:
            AlbumDetails with album info and tracks
        """
        client = self._get_client()

        try:
            album_data = client.get_album(album_id)

            if not album_data:
                raise ContentNotFoundError("Album", album_id)

            # Transform album data
            album = self._transform_album(album_data)

            # Get tracks
            tracks: list[Song] = []
            tracks_data = album_data.get("tracks", [])
            for track in tracks_data:
                tracks.append(self._transform_song(track))

            return AlbumDetails(
                album=album,
                tracks=tracks,
                description=album_data.get("description"),
            )

        except ContentNotFoundError:
            raise
        except Exception as e:
            error_msg = str(e).lower()
            if "rate limit" in error_msg or "429" in error_msg:
                raise YTMusicRateLimitError() from e
            raise YTMusicError(f"Failed to get album details: {str(e)}") from e

    def _get_playlist_sync(self, playlist_id: str) -> PlaylistDetails:
        """
        Synchronous playlist details retrieval.

        Args:
            playlist_id: YouTube Music playlist ID

        Returns:
            PlaylistDetails with playlist info and tracks
        """
        client = self._get_client()

        try:
            playlist_data = client.get_playlist(playlist_id)

            if not playlist_data:
                raise ContentNotFoundError("Playlist", playlist_id)

            # Transform playlist data
            playlist = self._transform_playlist(playlist_data)

            # Get tracks
            tracks: list[Song] = []
            tracks_data = playlist_data.get("tracks", [])
            for track in tracks_data:
                tracks.append(self._transform_song(track))

            return PlaylistDetails(
                playlist=playlist,
                tracks=tracks,
            )

        except ContentNotFoundError:
            raise
        except Exception as e:
            error_msg = str(e).lower()
            if "rate limit" in error_msg or "429" in error_msg:
                raise YTMusicRateLimitError() from e
            raise YTMusicError(f"Failed to get playlist details: {str(e)}") from e

    def _get_lyrics_sync(self, video_id: str) -> Lyrics:
        """
        Synchronous lyrics retrieval.

        Args:
            video_id: YouTube video ID

        Returns:
            Lyrics data
        """
        client = self._get_client()

        try:
            # First get watch data to find lyrics browse ID
            watch_data = client.get_watch_playlist(video_id)
            lyrics_browse_id = watch_data.get("lyrics")

            if not lyrics_browse_id:
                # Try getting from song info
                song_info = client.get_song(video_id)
                if song_info:
                    lyrics_browse_id = song_info.get("lyrics")

            if not lyrics_browse_id:
                return Lyrics(video_id=video_id, lyrics=None, is_synced=False)

            # Get lyrics
            lyrics_data = client.get_lyrics(lyrics_browse_id)

            if not lyrics_data:
                return Lyrics(video_id=video_id, lyrics=None, is_synced=False)

            # Parse lyrics lines
            lyrics_text = lyrics_data.get("lyrics", "")
            lines: list[dict] = []

            if lyrics_text:
                for line in lyrics_text.split("\n"):
                    line = line.strip()
                    if line:
                        lines.append({"text": line, "startTime": None})

            # Check if lyrics are synced (have timestamps)
            is_synced = lyrics_data.get("synced", False)

            return Lyrics(
                video_id=video_id,
                lyrics=lyrics_text if lyrics_text else None,
                source=lyrics_data.get("source"),
                is_synced=is_synced,
                lines=lines,
            )

        except Exception as e:
            error_msg = str(e).lower()
            if "rate limit" in error_msg or "429" in error_msg:
                raise YTMusicRateLimitError() from e
            # Return empty lyrics on error rather than failing
            return Lyrics(video_id=video_id, lyrics=None, is_synced=False)

    # Async public methods

    async def search(
        self, query: str, search_type: str = "all", limit: int = 20
    ) -> SearchResults:
        """
        Search for music on YouTube Music.

        Args:
            query: Search query string
            search_type: Type of content (songs, albums, artists, playlists, all)
            limit: Maximum number of results

        Returns:
            SearchResults with songs, albums, artists, playlists
        """
        # Check cache first
        cached = cache_service.get_cached_search(query, search_type)
        if cached:
            return SearchResults(
                songs=[Song(**s) for s in cached.get("songs", [])],
                albums=[Album(**a) for a in cached.get("albums", [])],
                artists=[Artist(**a) for a in cached.get("artists", [])],
                playlists=[Playlist(**p) for p in cached.get("playlists", [])],
                top_result=cached.get("top_result"),
            )

        loop = asyncio.get_event_loop()
        try:
            result = await asyncio.wait_for(
                loop.run_in_executor(executor, self._search_sync, query, search_type, limit),
                timeout=30.0,
            )

            # Cache results
            cache_service.cache_search(
                query,
                search_type,
                {
                    "songs": [vars(s) for s in result.songs],
                    "albums": [vars(a) for a in result.albums],
                    "artists": [vars(a) for a in result.artists],
                    "playlists": [vars(p) for p in result.playlists],
                    "top_result": vars(result.top_result) if result.top_result else None,
                },
            )

            return result
        except asyncio.TimeoutError:
            raise YTMusicError("Search timed out", status_code=504) from None

    async def get_home(self) -> list[HomeSection]:
        """
        Get home feed with personalized recommendations.

        Returns:
            List of home sections (quick picks, listen again, trending, etc.)
        """
        # Check cache first
        cached = cache_service.get_cached_home()
        if cached:
            return [
                HomeSection(
                    title=s["title"],
                    contents=s["contents"],
                    section_type=s["section_type"],
                )
                for s in cached
            ]

        loop = asyncio.get_event_loop()
        try:
            result = await asyncio.wait_for(
                loop.run_in_executor(executor, self._get_home_sync),
                timeout=30.0,
            )

            # Cache results
            cache_service.cache_home(
                [
                    {
                        "title": s.title,
                        "contents": [
                            vars(c) if hasattr(c, "__dict__") else c for c in s.contents
                        ],
                        "section_type": s.section_type,
                    }
                    for s in result
                ]
            )

            return result
        except asyncio.TimeoutError:
            raise YTMusicError("Home feed request timed out", status_code=504) from None

    async def get_song(self, video_id: str) -> SongDetails:
        """
        Get song details with queue suggestions.

        Args:
            video_id: YouTube video ID

        Returns:
            SongDetails with song info, related songs, and queue
        """
        loop = asyncio.get_event_loop()
        try:
            result = await asyncio.wait_for(
                loop.run_in_executor(executor, self._get_song_sync, video_id),
                timeout=30.0,
            )
            return result
        except asyncio.TimeoutError:
            raise YTMusicError("Song request timed out", status_code=504) from None

    async def get_artist(self, artist_id: str) -> ArtistDetails:
        """
        Get artist details.

        Args:
            artist_id: YouTube Music artist ID

        Returns:
            ArtistDetails with artist info, songs, albums, etc.
        """
        loop = asyncio.get_event_loop()
        try:
            result = await asyncio.wait_for(
                loop.run_in_executor(executor, self._get_artist_sync, artist_id),
                timeout=30.0,
            )
            return result
        except asyncio.TimeoutError:
            raise YTMusicError("Artist request timed out", status_code=504) from None

    async def get_album(self, album_id: str) -> AlbumDetails:
        """
        Get album details.

        Args:
            album_id: YouTube Music album ID

        Returns:
            AlbumDetails with album info and tracks
        """
        loop = asyncio.get_event_loop()
        try:
            result = await asyncio.wait_for(
                loop.run_in_executor(executor, self._get_album_sync, album_id),
                timeout=30.0,
            )
            return result
        except asyncio.TimeoutError:
            raise YTMusicError("Album request timed out", status_code=504) from None

    async def get_playlist(self, playlist_id: str) -> PlaylistDetails:
        """
        Get playlist details.

        Args:
            playlist_id: YouTube Music playlist ID

        Returns:
            PlaylistDetails with playlist info and tracks
        """
        loop = asyncio.get_event_loop()
        try:
            result = await asyncio.wait_for(
                loop.run_in_executor(executor, self._get_playlist_sync, playlist_id),
                timeout=30.0,
            )
            return result
        except asyncio.TimeoutError:
            raise YTMusicError("Playlist request timed out", status_code=504) from None

    async def get_lyrics(self, video_id: str) -> Lyrics:
        """
        Get lyrics for a song.

        Args:
            video_id: YouTube video ID

        Returns:
            Lyrics data
        """
        # Check cache first
        cached = cache_service.get_cached_lyrics(video_id)
        if cached:
            return Lyrics(
                video_id=cached["video_id"],
                lyrics=cached.get("lyrics"),
                source=cached.get("source"),
                is_synced=cached.get("is_synced", False),
                lines=cached.get("lines", []),
            )

        loop = asyncio.get_event_loop()
        try:
            result = await asyncio.wait_for(
                loop.run_in_executor(executor, self._get_lyrics_sync, video_id),
                timeout=30.0,
            )

            # Cache results
            cache_service.cache_lyrics(
                video_id,
                {
                    "video_id": result.video_id,
                    "lyrics": result.lyrics,
                    "source": result.source,
                    "is_synced": result.is_synced,
                    "lines": result.lines,
                },
            )

            return result
        except asyncio.TimeoutError:
            raise YTMusicError("Lyrics request timed out", status_code=504) from None


# Singleton instance
ytmusic_service = YTMusicService()


# Convenience functions for direct use


async def search_music(query: str, search_type: str = "all", limit: int = 20) -> SearchResults:
    """Search for music on YouTube Music."""
    return await ytmusic_service.search(query, search_type, limit)


async def get_home_feed() -> list[HomeSection]:
    """Get home feed with recommendations."""
    return await ytmusic_service.get_home()


async def get_song_details(video_id: str) -> SongDetails:
    """Get song details with queue suggestions."""
    return await ytmusic_service.get_song(video_id)


async def get_artist_details(artist_id: str) -> ArtistDetails:
    """Get artist details."""
    return await ytmusic_service.get_artist(artist_id)


async def get_album_details(album_id: str) -> AlbumDetails:
    """Get album details."""
    return await ytmusic_service.get_album(album_id)


async def get_playlist_details(playlist_id: str) -> PlaylistDetails:
    """Get playlist details."""
    return await ytmusic_service.get_playlist(playlist_id)


async def get_song_lyrics(video_id: str) -> Lyrics:
    """Get lyrics for a song."""
    return await ytmusic_service.get_lyrics(video_id)


def cleanup():
    """Clean up thread pool executor."""
    executor.shutdown(wait=False)
