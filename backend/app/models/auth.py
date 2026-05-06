"""Authentication request and response models."""

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    """User registration request."""

    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, description="User password (min 8 chars)")

    @field_validator("email")
    @classmethod
    def email_must_be_valid(cls, v: str) -> str:
        """Validate email format."""
        if not v or "@" not in v:
            raise ValueError("Invalid email format")
        return v.lower()


class LoginRequest(BaseModel):
    """User login request."""

    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")


class AuthResponse(BaseModel):
    """Authentication response with user info and token."""

    model_config = ConfigDict(from_attributes=True)

    id: int = Field(..., description="User ID")
    email: str = Field(..., description="User email")
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field("bearer", description="Token type")
