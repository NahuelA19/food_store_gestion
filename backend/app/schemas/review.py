"""Review Pydantic schemas for validation and serialization."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ReviewCreate(BaseModel):
    """Review creation schema."""

    product_id: int = Field(..., gt=0)
    rating: int = Field(..., ge=1, le=5)
    title: str | None = Field(None, max_length=200)
    comment: str | None = None


class ReviewUpdate(BaseModel):
    """Review update schema (all fields optional)."""

    rating: int | None = Field(None, ge=1, le=5)
    title: str | None = Field(None, max_length=200)
    comment: str | None = None


class ReviewResponse(BaseModel):
    """Review response model with user info."""

    id: int
    product_id: int
    user_id: int
    user_name: str = ""
    rating: int
    title: str | None = None
    comment: str | None = None
    is_approved: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReviewModeration(BaseModel):
    """Review moderation schema for admin actions."""

    action: Literal["approve", "reject"]
    rejection_reason: str | None = Field(None, max_length=500)


class ReviewSummary(BaseModel):
    """Review aggregation summary."""

    average_rating: float | None = None
    total_count: int = 0
    distribution: dict[int, int] = {}


class ReviewListResponse(BaseModel):
    """Paginated review list with summary."""

    reviews: list[ReviewResponse]
    total: int
    page: int
    per_page: int
    average_rating: float | None = None
    total_reviews: int = 0
