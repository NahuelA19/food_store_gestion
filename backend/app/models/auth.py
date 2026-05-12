"""Authentication request and response models."""

from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    """User registration request."""

    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, description="User password (min 8 chars)")
    first_name: Optional[str] = Field(
        None, min_length=1, max_length=50, description="First name (optional)"
    )
    last_name: Optional[str] = Field(
        None, min_length=1, max_length=50, description="Last name (optional)"
    )
    phone: Optional[str] = Field(None, max_length=20, description="Phone number (optional)")

    @field_validator("email")
    @classmethod
    def email_must_be_valid(cls, v: str) -> str:
        """Validate email format."""
        if not v or "@" not in v:
            raise ValueError("Invalid email format")
        return v.lower()

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        """Validate phone format if provided."""
        if v is None:
            return None
        if len(v) < 7 or len(v) > 20:
            raise ValueError("Phone must be 7-20 characters")
        import re

        if not re.match(r"^\+?[0-9\-\(\)\s]{7,20}$", v):
            raise ValueError("Phone must contain only +, -, (), space, and digits")
        return v


class LoginRequest(BaseModel):
    """User login request."""

    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")


class AuthResponse(BaseModel):
    """Authentication response with user info and token."""

    model_config = ConfigDict(from_attributes=True)

    id: int = Field(..., description="User ID")
    email: str = Field(..., description="User email")
    first_name: Optional[str] = Field(None, description="First name")
    last_name: Optional[str] = Field(None, description="Last name")
    phone: Optional[str] = Field(None, description="Phone number")
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str | None = Field(None, description="JWT refresh token")
    token_type: str = Field("bearer", description="Token type")


class RefreshTokenRequest(BaseModel):
    """Refresh token request body."""

    refresh_token: str = Field(..., description="Refresh token")


class RefreshTokenResponse(BaseModel):
    """Token refresh response with new token pair."""

    access_token: str = Field(..., description="New JWT access token")
    refresh_token: str = Field(..., description="New refresh token")
    token_type: str = Field("bearer", description="Token type")
