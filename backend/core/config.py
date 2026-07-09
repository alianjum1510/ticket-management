from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Ticket Dashboard API"
    API_PREFIX: str = "/api"
    ENVIRONMENT: Literal["local", "staging", "production"] = "local"

    DATABASE_URL: str = "sqlite+aiosqlite:///./app.db"
    SQL_ECHO: bool = False

    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    LOG_LEVEL: str = "INFO"

    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
