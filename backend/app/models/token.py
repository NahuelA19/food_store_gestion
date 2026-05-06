"""Token and authentication response models."""

from pydantic import BaseModel, Field


class Token(BaseModel):
    """JWT token response."""

    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field("bearer", description="Token type (always 'bearer')")


class TokenData(BaseModel):
    """Decoded JWT token claims."""

    user_id: int = Field(..., description="User ID from token")
    email: str = Field(..., description="User email from token")
