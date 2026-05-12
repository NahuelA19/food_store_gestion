"""Search and filtering endpoint."""

from collections import Counter
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.uow import UnitOfWork
from app.dependencies import get_uow
from app.schemas.product import ProductDetailResponse
from app.schemas.review import ReviewSummary
from app.schemas.search import SearchResponse
from app.services.search_service import (
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
    uow: UnitOfWork = Depends(get_uow),
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
        uow=uow,
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
        uow=uow,
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

    # Serialize products, computing ReviewSummary from eager-loaded reviews
    # Matches get_review_summary() logic: only approved reviews, round to 1 decimal
    items = []
    for p in products:
        review_list = getattr(p, "reviews", []) or []
        approved = [r for r in review_list if hasattr(r, "is_approved") and r.is_approved]
        if approved:
            ratings = [r.rating for r in approved if hasattr(r, "rating")]
            summary = ReviewSummary(
                average_rating=round(sum(ratings) / len(ratings), 1) if ratings else None,
                total_count=len(approved),
                distribution=dict(Counter(r.rating for r in approved if hasattr(r, "rating"))),
            )
        else:
            summary = ReviewSummary(total_count=0)

        items.append(
            ProductDetailResponse(
                id=p.id,
                name=p.name,
                description=p.description,
                price=p.price,
                category_id=p.category_id,
                category=p.category,
                is_available=p.is_available,
                inventory=p.inventory,
                reviews=summary,
                created_at=p.created_at,
                updated_at=p.updated_at,
            )
        )

    return SearchResponse(
        items=items,
        pagination=pagination,
    )
