"""
Application configuration.
"""

from functools import lru_cache
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://tuniq:tuniq@localhost:5432/tuniq"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Security
    NEXTAUTH_SECRET: str = "your-secret-key-change-in-production"

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000"

    # YouTube Music
    YTM_COOKIE: str = ""

    # Application
    BACKEND_URL: str = "http://localhost:8000"
    DEBUG: bool = False

    @property
    def cors_origins_list(self) -> List[str]:
        """Get CORS origins as a list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
