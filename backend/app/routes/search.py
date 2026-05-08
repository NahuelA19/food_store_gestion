"""Search and filtering endpoint."""

from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.schemas.product import ProductDetailResponse
from app.schemas.search import SearchParams, SearchResponse
from app.services.search_service import (
    calculate_pagination_info,
    search_products,
    validate_search_params,
)

router = APIRouter(prefix="/products", tags=["search"])


@router.get("/search", response_model=SearchResponse)
async def search_and_filter_products(
    q: str | None = None,
    category_id: int | None = None,
    min_price: Decimal | None = None,
    max_price: Decimal | None = None,
    in_stock: bool | None = None,
    min_stock: int | None = None,
    page: int = 1,
    limit: int = 20,
    sort_by: str = "relevance",
    order: str = "asc",
    db: AsyncSession = Depends(get_db),
) -> SearchResponse:
    """
    Search and filter products with full-text search and advanced filtering.

    Query Parameters:
    - q: Full-text search query (1-500 chars)
    - category_id: Filter by category ID
    - min_price: Minimum price filter
    - max_price: Maximum price filter
    - in_stock: Filter by availability (true/false)
    - min_stock: Minimum stock quantity filter
    - page: Page number (default: 1)
    - limit: Items per page (1-100, default: 20)
    - sort_by: Sort field (relevance, name, price, created_at)
    - order: Sort order (asc, desc)
    """

    # Validate sort_by
    if sort_by not in ("relevance", "name", "price", "created_at"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid sort_by: must be relevance, name, price, or created_at",
        )

    # Validate order
    if order not in ("asc", "desc"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid order: must be 'asc' or 'desc'",
        )

    # Validate pagination
    if page < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="page must be >= 1",
        )

    if limit < 1 or limit > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="limit must be between 1 and 100",
        )

    # Validate search params (price range, category existence, etc.)
    errors = await validate_search_params(
        db=db,
        category_id=category_id,
        min_price=min_price,
        max_price=max_price,
    )
    if errors:
        # Return first error
        error_msg = next(iter(errors.values()))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg,
        )

    # Execute search
    products, pagination = await search_products(
        db=db,
        q=q,
        category_id=category_id,
        min_price=min_price,
        max_price=max_price,
        in_stock=in_stock,
        min_stock=min_stock,
        page=page,
        limit=limit,
        sort_by=sort_by,
        order=order,
    )

    # Serialize products
    items = [ProductDetailResponse.model_validate(p) for p in products]

    return SearchResponse(
        items=items,
        pagination=pagination,
    )
