"""Admin review moderation API routes."""

from fastapi import APIRouter, Depends, Query, status

from app.core.uow import UnitOfWork
from app.dependencies import get_admin_user, get_uow
from app.models.user import User
from app.schemas.review import ReviewModeration, ReviewResponse
from app.services import review_service

router = APIRouter(prefix="/admin/reviews", tags=["admin-reviews"])


@router.get("/pending")
async def list_pending_reviews(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    uow: UnitOfWork = Depends(get_uow),
    _admin: User = Depends(get_admin_user),
) -> dict:
    """List all reviews pending moderation."""
    return await review_service.get_pending_reviews(
        uow=uow,
        page=page,
        per_page=per_page,
    )


@router.patch("/{review_id}/moderate", response_model=ReviewResponse)
async def moderate_review(
    review_id: int,
    body: ReviewModeration,
    uow: UnitOfWork = Depends(get_uow),
    current_admin: User = Depends(get_admin_user),
) -> ReviewResponse:
    """Approve or reject a review."""
    review = await review_service.moderate_review(
        uow=uow,
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
    uow: UnitOfWork = Depends(get_uow),
    _admin: User = Depends(get_admin_user),
) -> None:
    """Delete any review (admin only)."""
    await review_service.delete_review_admin(uow=uow, review_id=review_id)
