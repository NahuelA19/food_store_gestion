"""Branch Pydantic schemas for validation and serialization."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class BranchCreate(BaseModel):
    """Branch creation schema."""

    name: str = Field(..., min_length=1, max_length=255)
    address: str | None = Field(None, max_length=500)
    phone: str | None = Field(None, max_length=50)
    email: str | None = Field(None, max_length=255)


class BranchUpdate(BaseModel):
    """Branch update schema (all fields optional)."""

    name: str | None = Field(None, min_length=1, max_length=255)
    address: str | None = Field(None, max_length=500)
    phone: str | None = Field(None, max_length=50)
    email: str | None = Field(None, max_length=255)
    is_active: bool | None = None


class BranchResponse(BaseModel):
    """Branch response model."""

    id: int
    name: str
    address: str | None = None
    phone: str | None = None
    email: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BranchListResponse(BaseModel):
    """Paginated branch list response."""

    items: list[BranchResponse]
    total: int
