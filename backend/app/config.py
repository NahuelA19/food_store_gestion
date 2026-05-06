"""Application configuration."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings from environment variables."""

    # Server
    environment: str = "development"
    debug: bool = True
    host: str = "0.0.0.0"
    port: int = 8000

    # API
    api_title: str = "Food Store API"
    api_version: str = "0.1.0"

    # Database
    database_url: str

    # Security
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 15

    # Logging
    log_level: str = "INFO"

    # CORS
    allowed_origins: list[str] | str = "http://localhost:5173,http://localhost:3000"

    def __init__(self, **data):
        """Initialize settings with environment variable parsing."""
        super().__init__(**data)
        # Parse ALLOWED_ORIGINS if it's a string
        if isinstance(self.allowed_origins, str):
            self.allowed_origins = [origin.strip() for origin in self.allowed_origins.split(",")]

    class Config:
        """Pydantic config."""

        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Global settings instance
settings = Settings()
