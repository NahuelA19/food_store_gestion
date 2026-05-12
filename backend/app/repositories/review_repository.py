"""Review and Notification repositories implementation."""

from sqlalchemy import select
from app.core.repository import BaseRepository
from app.models.review import Review
from app.models.notification import Notification


class ReviewRepository(BaseRepository[Review]):
    """Repository for Review operations."""

    def __init__(self, session):
        super().__init__(Review, session)

    async def get_by_product_id(self, product_id: int) -> list[Review]:
        """Get all reviews for a product."""
        result = await self.session.execute(
            select(Review).where(Review.product_id == product_id).order_by(Review.created_at.desc())
        )
        return result.scalars().all()


class NotificationRepository(BaseRepository[Notification]):
    """Repository for Notification operations."""

    def __init__(self, session):
        super().__init__(Notification, session)

    async def get_unread_for_user(self, user_id: int) -> list[Notification]:
        """Get all unread notifications for a user."""
        result = await self.session.execute(
            select(Notification).where(
                Notification.user_id == user_id,
                Notification.is_read == False
            ).order_by(Notification.created_at.desc())
        )
        return result.scalars().all()
