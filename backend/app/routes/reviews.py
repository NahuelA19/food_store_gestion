"""Public review API routes for the Food Store."""

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.uow import UnitOfWork
from app.dependencies import get_current_user, get_uow
from app.models.user import User
from app.schemas.review import (
    ReviewCreate,
    ReviewListResponse,
    ReviewResponse,
    ReviewUpdate,
)
from app.services import review_service

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    body: ReviewCreate,
    uow: UnitOfWork = Depends(get_uow),
    current_user: User = Depends(get_current_user),
) -> ReviewResponse:
    """Create a new review for a product."""
    review = await review_service.create_review(
        uow=uow,
        user_id=current_user.id,
        data=body,
    )
    response = ReviewResponse.model_validate(review)
    response.user_name = current_user.name or current_user.email
    return response


@router.get("/product/{product_id}", response_model=ReviewListResponse)
async def list_product_reviews(
    product_id: int,
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=50),
    uow: UnitOfWork = Depends(get_uow),
) -> ReviewListResponse:
    """List approved reviews for a product with pagination and summary."""
    return await review_service.get_product_reviews(
        uow=uow,
        product_id=product_id,
        page=page,
        per_page=per_page,
        include_pending=False,
    )


@router.put("/{review_id}", response_model=ReviewResponse)
async def update_review(
    review_id: int,
    body: ReviewUpdate,
    uow: UnitOfWork = Depends(get_uow),
    current_user: User = Depends(get_current_user),
) -> ReviewResponse:
    """Update your own review."""
    review = await review_service.update_review(
        uow=uow,
        review_id=review_id,
        user_id=current_user.id,
        data=body,
    )
    response = ReviewResponse.model_validate(review)
    response.user_name = current_user.name or current_user.email
    return response


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: int,
    uow: UnitOfWork = Depends(get_uow),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete your own review."""
    await review_service.delete_review(
        uow=uow,
        review_id=review_id,
        user_id=current_user.id,
    )


@router.get("/recent", response_model=list[ReviewResponse])
async def get_recent_reviews(
    limit: int = Query(5, ge=1, le=20),
    uow: UnitOfWork = Depends(get_uow),
) -> list[ReviewResponse]:
    """Get most recent approved reviews across all products."""
    return await review_service.get_recent_reviews(uow=uow, limit=limit)
