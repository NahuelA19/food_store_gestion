"""Review service layer with business logic."""

from math import ceil

from fastapi import HTTPException, status
from sqlalchemy import Select, func, select
from sqlalchemy.orm import selectinload

from app.core.uow import UnitOfWork

from app.models.product import Product
from app.models.review import Review
from app.models.user import User
from app.schemas.review import (
    ReviewCreate,
    ReviewListResponse,
    ReviewModeration,
    ReviewResponse,
    ReviewSummary,
    ReviewUpdate,
)


async def create_review(
    uow: UnitOfWork,
    user_id: int,
    data: ReviewCreate,
) -> Review:
    """Create a new review for a product.

    Checks product exists and user hasn't already reviewed this product.
    New reviews default to unmoderated (is_approved=False).
    """
    # Check product exists
    result = await uow.session.execute(select(Product).where(Product.id == data.product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {data.product_id} not found",
        )

    # Check for duplicate review
    result = await uow.session.execute(
        select(Review).where(
            Review.product_id == data.product_id,
            Review.user_id == user_id,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already reviewed this product",
        )

    review = Review(
        product_id=data.product_id,
        user_id=user_id,
        rating=data.rating,
        title=data.title,
        comment=data.comment,
        is_approved=False,
    )
    uow.session.add(review)
    await uow.flush()
    await uow.refresh(review)
    return review


async def get_product_reviews(
    uow: UnitOfWork,
    product_id: int,
    page: int = 1,
    per_page: int = 10,
    include_pending: bool = False,
) -> ReviewListResponse:
    """Get paginated reviews for a product.

    By default only returns approved reviews.
    Use include_pending=True (admin) to see all.
    """
    # Build query
    query = (
        select(Review)
        .options(selectinload(Review.user))
        .where(Review.product_id == product_id)
    )
    if not include_pending:
        query = query.where(Review.is_approved == True)

    # Get total count
    count_query = select(func.count()).select_from(Review).where(
        Review.product_id == product_id
    )
    if not include_pending:
        count_query = count_query.where(Review.is_approved == True)
    total_result = await uow.session.execute(count_query)
    total = total_result.scalar() or 0

    # Get review summary
    summary = await get_review_summary(uow, product_id, include_pending)

    # Apply ordering and pagination
    query = query.order_by(Review.created_at.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)

    result = await uow.session.execute(query)
    reviews = result.scalars().all()

    # Serialize
    review_responses = []
    for review in reviews:
        response = ReviewResponse.model_validate(review)
        response.user_name = review.user.name if review.user else "Unknown"
        review_responses.append(response)

    return ReviewListResponse(
        reviews=review_responses,
        total=total,
        page=page,
        per_page=per_page,
        average_rating=summary.average_rating,
        total_reviews=summary.total_count,
    )


async def get_review_summary(
    uow: UnitOfWork,
    product_id: int,
    include_pending: bool = False,
) -> ReviewSummary:
    """Get aggregated review summary for a product."""
    # Build base condition
    condition = Review.product_id == product_id
    if not include_pending:
        condition = (Review.product_id == product_id) & (Review.is_approved == True)

    # Get average rating and total count
    agg_query = select(
        func.avg(Review.rating).label("average"),
        func.count(Review.id).label("total"),
    ).where(condition)
    result = await uow.session.execute(agg_query)
    row = result.one()

    avg = float(row.average) if row.average is not None else None
    total = row.total or 0

    # Get distribution (count per star rating)
    dist_query = (
        select(Review.rating, func.count(Review.id).label("count"))
        .where(condition)
        .group_by(Review.rating)
        .order_by(Review.rating)
    )
    result = await uow.session.execute(dist_query)
    distribution = {r: 0 for r in range(1, 6)}
    for rating, count in result:
        distribution[rating] = count

    return ReviewSummary(
        average_rating=round(avg, 1) if avg is not None else None,
        total_count=total,
        distribution=distribution,
    )


async def get_review_by_id(
    uow: UnitOfWork,
    review_id: int,
) -> Review | None:
    """Get a single review by ID."""
    result = await uow.session.execute(
        select(Review)
        .options(selectinload(Review.user))
        .where(Review.id == review_id)
    )
    return result.scalar_one_or_none()


async def update_review(
    uow: UnitOfWork,
    review_id: int,
    user_id: int,
    data: ReviewUpdate,
) -> Review:
    """Update a review. Only the review owner can update."""
    review = await get_review_by_id(uow, review_id)
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found",
        )
    if review.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own reviews",
        )

    if data.rating is not None:
        review.rating = data.rating
    if data.title is not None:
        review.title = data.title
    if data.comment is not None:
        review.comment = data.comment

    # Reset moderation status on update
    review.is_approved = False
    review.moderated_by = None
    review.moderated_at = None
    review.rejection_reason = None

    uow.session.add(review)
    await uow.flush()
    await uow.refresh(review)
    return review


async def delete_review(
    uow: UnitOfWork,
    review_id: int,
    user_id: int,
) -> None:
    """Delete a review. Only the review owner can delete."""
    review = await get_review_by_id(uow, review_id)
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found",
        )
    if review.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own reviews",
        )

    await uow.session.delete(review)


async def moderate_review(
    uow: UnitOfWork,
    review_id: int,
    moderator_id: int,
    data: ReviewModeration,
) -> Review:
    """Moderate a review (approve or reject). Admin only."""
    review = await get_review_by_id(uow, review_id)
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found",
        )

    if data.action == "approve":
        review.is_approved = True
        review.rejection_reason = None
    else:  # reject
        review.is_approved = False
        review.rejection_reason = data.rejection_reason

    review.moderated_by = moderator_id
    from datetime import datetime, timezone
    review.moderated_at = datetime.now(timezone.utc)

    uow.session.add(review)
    await uow.flush()
    await uow.refresh(review)
    return review


async def get_pending_reviews(
    uow: UnitOfWork,
    page: int = 1,
    per_page: int = 20,
) -> dict:
    """Get all unmoderated reviews (admin)."""
    query = (
        select(Review)
        .options(selectinload(Review.user), selectinload(Review.product))
        .where(Review.is_approved == False, Review.moderated_by.is_(None))
        .order_by(Review.created_at.desc())
    )

    # Count
    count_query = (
        select(func.count())
        .select_from(Review)
        .where(Review.is_approved == False, Review.moderated_by.is_(None))
    )
    total_result = await uow.session.execute(count_query)
    total = total_result.scalar() or 0

    # Paginate
    query = query.offset((page - 1) * per_page).limit(per_page)
    result = await uow.session.execute(query)
    reviews = result.scalars().all()

    return {
        "reviews": [
            {
                "id": r.id,
                "product_id": r.product_id,
                "product_name": r.product.name if r.product else "Unknown",
                "user_name": r.user.name if r.user else "Unknown",
                "rating": r.rating,
                "title": r.title,
                "comment": r.comment,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in reviews
        ],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": max(1, ceil(total / per_page)),
    }


async def delete_review_admin(
    uow: UnitOfWork,
    review_id: int,
) -> None:
    """Delete any review (admin)."""
    result = await uow.session.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found",
        )

    await uow.session.delete(review)


async def get_recent_reviews(
    uow: UnitOfWork,
    limit: int = 5,
) -> list[ReviewResponse]:
    """Get most recent approved reviews across all products."""
    query = (
        select(Review)
        .options(selectinload(Review.user))
        .where(Review.is_approved == True)
        .order_by(Review.created_at.desc())
        .limit(limit)
    )
    result = await uow.session.execute(query)
    reviews = result.scalars().all()

    response = []
    for review in reviews:
        r = ReviewResponse.model_validate(review)
        r.user_name = review.user.name if review.user else "Unknown"
        response.append(r)
    return response
