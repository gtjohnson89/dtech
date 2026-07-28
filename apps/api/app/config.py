from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).resolve().parents[1] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    DATABASE_URL: str = "postgresql://postgres:postgres@127.0.0.1:5432/dtech"
    SECRET_KEY: str = "dev-secret"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    CORS_ORIGINS: str = "http://localhost:5174"
    APP_PUBLIC_URL: str = "http://localhost:5174"
    API_PUBLIC_URL: str = "http://127.0.0.1:8000"
    DEBUG: bool = True
    DEV_RETURN_MAGIC_LINK: bool = True
    ADMIN_EMAILS: str = ""
    BOT_SERVICE_TOKEN: str = "dev-bot-token-change-me"
    EMAIL_DELIVERY_ENABLED: bool = False
    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_FROM: str | None = None
    SMTP_USE_TLS: bool = True
    ALGORITHM: str = "HS256"
    MAGIC_LINK_EXPIRE_MINUTES: int = 30
    SUGGESTION_MAX_LENGTH: int = 500

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def admin_email_set(self) -> set[str]:
        return {e.strip().lower() for e in self.ADMIN_EMAILS.split(",") if e.strip()}


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
