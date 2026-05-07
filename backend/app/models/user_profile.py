"""Pydantic models for user profiles and preferences."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class UserProfile(BaseModel):
    """User profile information."""

    first_name: str = Field(..., min_length=1, max_length=50, description="First name")
    last_name: str = Field(..., min_length=1, max_length=50, description="Last name")
    phone: Optional[str] = Field(None, max_length=20, description="Phone number")

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        """Validate phone format: 7-20 chars, allows +, -, (), space."""
        if v is None:
            return None
        if len(v) < 7 or len(v) > 20:
            raise ValueError("Phone must be 7-20 characters")
        # Allow +, -, (), space, and digits
        import re

        if not re.match(r"^\+?[0-9\-\(\)\s]{7,20}$", v):
            raise ValueError("Phone must contain only +, -, (), space, and digits")
        return v


class UserProfileUpdate(BaseModel):
    """User profile update request (all fields optional)."""

    first_name: Optional[str] = Field(None, min_length=1, max_length=50, description="First name")
    last_name: Optional[str] = Field(None, min_length=1, max_length=50, description="Last name")
    phone: Optional[str] = Field(None, max_length=20, description="Phone number")

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        """Validate phone format: 7-20 chars, allows +, -, (), space."""
        if v is None:
            return None
        if len(v) < 7 or len(v) > 20:
            raise ValueError("Phone must be 7-20 characters")
        # Allow +, -, (), space, and digits
        import re

        if not re.match(r"^\+?[0-9\-\(\)\s]{7,20}$", v):
            raise ValueError("Phone must contain only +, -, (), space, and digits")
        return v


class UserPreference(BaseModel):
    """Single user preference."""

    pref_key: str = Field(..., description="Preference key (e.g., language, theme, notifications)")
    pref_value: str = Field(..., description="Preference value")


class UserPreferenceUpdate(BaseModel):
    """User preference update request."""

    language: Optional[str] = Field(None, description="Language preference (en, es, fr, de)")
    theme: Optional[str] = Field(None, description="Theme preference (light, dark, auto)")
    notifications: Optional[str] = Field(
        None, description="Notification preference (email, push, off)"
    )

    @field_validator("language")
    @classmethod
    def validate_language(cls, v: Optional[str]) -> Optional[str]:
        """Validate language is in allowed list."""
        if v is None:
            return None
        allowed = ["en", "es", "fr", "de"]
        if v not in allowed:
            raise ValueError(f"Language must be one of: {', '.join(allowed)}")
        return v

    @field_validator("theme")
    @classmethod
    def validate_theme(cls, v: Optional[str]) -> Optional[str]:
        """Validate theme is in allowed list."""
        if v is None:
            return None
        allowed = ["light", "dark", "auto"]
        if v not in allowed:
            raise ValueError(f"Theme must be one of: {', '.join(allowed)}")
        return v

    @field_validator("notifications")
    @classmethod
    def validate_notifications(cls, v: Optional[str]) -> Optional[str]:
        """Validate notifications is in allowed list."""
        if v is None:
            return None
        allowed = ["email", "push", "off"]
        if v not in allowed:
            raise ValueError(f"Notifications must be one of: {', '.join(allowed)}")
        return v


class UserResponse(BaseModel):
    """Full user response for authenticated endpoints."""

    id: int
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserPublicResponse(BaseModel):
    """Public user profile response (limited fields)."""

    id: int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserPreferencesResponse(BaseModel):
    """All user preferences response."""

    language: str
    theme: str
    notifications: str

    model_config = {"from_attributes": True}
