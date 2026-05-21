"""Application configuration."""

from typing import Any

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Server
    environment: str = "development"
    debug: bool = True
    host: str = "0.0.0.0"
    port: int = 8000

    # API
    api_title: str = "Food Store API"
    api_version: str = "0.1.0"
    base_url: str = "http://localhost:8000"  # Backend base URL (used for uploads, API)
    frontend_url: str = "http://localhost:5173"  # Frontend URL (MP back_urls redirect here)

    # Database
    database_url: str
    test_database_url: str = ""

    # Security
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 15

    # Logging
    log_level: str = "INFO"

    # Payment (MercadoPago)
    mp_access_token: str = ""
    mp_public_key: str = ""
    mp_webhook_secret: str = ""
    mp_notification_url: str = "http://localhost:8000/api/v1/payments/webhook"

    # CORS
    allowed_origins: list[str] | str = (
        "http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://localhost:3000"
    )

    def __init__(self, **data: Any) -> None:
        """Initialize settings with environment variable parsing."""
        super().__init__(**data)
        # Parse ALLOWED_ORIGINS if it's a string
        if isinstance(self.allowed_origins, str):
            self.allowed_origins = [origin.strip() for origin in self.allowed_origins.split(",")]


# Global settings instance
settings = Settings()
