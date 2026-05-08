"""Search and filtering schemas."""

from decimal import Decimal

from pydantic import BaseModel, Field, field_validator


class PaginationInfo(BaseModel):
    """Pagination information for search results."""

    total: int = Field(..., ge=0, description="Total matching items")
    page: int = Field(..., ge=1, description="Current page number")
    limit: int = Field(..., ge=1, le=100, description="Items per page")
    total_pages: int = Field(..., ge=0, description="Total number of pages")
    has_next: bool = Field(..., description="Whether there is a next page")
    has_previous: bool = Field(..., description="Whether there is a previous page")


class SearchParams(BaseModel):
    """Search and filtering parameters."""

    q: str | None = Field(None, min_length=1, max_length=500, description="Full-text search query")
    category_id: int | None = Field(None, gt=0, description="Filter by category ID")
    min_price: Decimal | None = Field(None, ge=Decimal("0"), description="Minimum price filter")
    max_price: Decimal | None = Field(None, ge=Decimal("0"), description="Maximum price filter")
    in_stock: bool | None = Field(None, description="Availability filter")
    min_stock: int | None = Field(None, gt=0, description="Minimum stock quantity filter")
    page: int = Field(1, ge=1, description="Page number")
    limit: int = Field(20, ge=1, le=100, description="Items per page")
    sort_by: str = Field("relevance", description="Sort field: relevance, name, price, created_at")
    order: str = Field("asc", description="Sort order: asc or desc")

    @field_validator("sort_by")
    @classmethod
    def validate_sort_by(cls, v: str) -> str:
        """Validate sort_by is one of allowed values."""
        if v not in ("relevance", "name", "price", "created_at"):
            raise ValueError("sort_by must be one of: relevance, name, price, created_at")
        return v

    @field_validator("order")
    @classmethod
    def validate_order(cls, v: str) -> str:
        """Validate order is asc or desc."""
        if v not in ("asc", "desc"):
            raise ValueError("order must be 'asc' or 'desc'")
        return v

    @field_validator("max_price")
    @classmethod
    def validate_price_range(cls, v: Decimal | None, info) -> Decimal | None:
        """Ensure min_price <= max_price if both provided."""
        if v is not None and info.data.get("min_price") is not None:
            if info.data["min_price"] > v:
                raise ValueError("min_price must be <= max_price")
        return v


class SearchResponse(BaseModel):
    """Search results response."""

    items: list = Field(..., description="List of matching products")
    pagination: PaginationInfo = Field(..., description="Pagination information")
