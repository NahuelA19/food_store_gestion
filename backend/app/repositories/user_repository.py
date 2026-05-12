"""User repository implementation."""

from sqlalchemy import select
from app.core.repository import BaseRepository
from app.models.user import User


class UserRepository(BaseRepository[User]):
    """Repository for User operations."""

    def __init__(self, session):
        super().__init__(User, session)

    async def get_by_email(self, email: str) -> User | None:
        """Get user by email address."""
        result = await self.session.execute(
            select(User).where(User.email == email, User.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def get_by_id(self, user_id: int) -> User | None:
        """Get user by ID, checking for soft-delete."""
        result = await self.session.execute(
            select(User).where(User.id == user_id, User.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()
