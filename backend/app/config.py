"""
Application configuration.
"""

from functools import lru_cache
from typing import List

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
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    # YouTube Music
    YTM_COOKIE: str = ""

    # Application
    BACKEND_URL: str = "http://localhost:8000"
    DEBUG: bool = False

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

        @classmethod
        def parse_env_var(cls, field_name: str, raw_val: str):
            """Parse environment variables."""
            if field_name == "CORS_ORIGINS":
                return [origin.strip() for origin in raw_val.split(",")]
            return raw_val


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
