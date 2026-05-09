"""Admin review moderation API routes."""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_admin_user, get_db
from app.models.user import User
from app.schemas.review import ReviewModeration, ReviewResponse
from app.services import review_service

router = APIRouter(prefix="/admin/reviews", tags=["admin-reviews"])


@router.get("/pending")
async def list_pending_reviews(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
) -> dict:
    """List all reviews pending moderation."""
    return await review_service.get_pending_reviews(
        db=db,
        page=page,
        per_page=per_page,
    )


@router.patch("/{review_id}/moderate", response_model=ReviewResponse)
async def moderate_review(
    review_id: int,
    body: ReviewModeration,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_admin_user),
) -> ReviewResponse:
    """Approve or reject a review."""
    review = await review_service.moderate_review(
        db=db,
        review_id=review_id,
        moderator_id=current_admin.id,
        data=body,
    )
    response = ReviewResponse.model_validate(review)
    response.user_name = review.user.name if review.user else "Unknown"
    return response


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_review(
    review_id: int,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
) -> None:
    """Delete any review (admin only)."""
    await review_service.delete_review_admin(db=db, review_id=review_id)
