"""Order repository implementation."""

from sqlalchemy import func, select, text
from sqlalchemy.orm import selectinload

from app.core.repository import BaseRepository
from app.models.order import Order, OrderStatus
from app.models.order_item import OrderItem


class OrderRepository(BaseRepository[Order]):
    """Repository for Order operations."""

    def __init__(self, session):
        super().__init__(Order, session)

    async def get_with_items(self, order_id: int) -> Order | None:
        """Get order with items and products preloaded."""
        result = await self.session.execute(
            select(Order)
            .where(Order.id == order_id)
            .options(selectinload(Order.items).selectinload(OrderItem.product))
        )
        return result.scalar_one_or_none()

    async def count_by_user(self, user_id: int) -> int:
        """Count orders for a specific user."""
        result = await self.session.execute(
            select(func.count(Order.id)).where(Order.user_id == user_id)
        )
        return result.scalar_one()

    async def get_paginated_by_user(self, user_id: int, page: int, limit: int) -> list[Order]:
        """Get paginated orders for a user."""
        offset = (page - 1) * limit
        result = await self.session.execute(
            select(Order)
            .where(Order.user_id == user_id)
            .order_by(Order.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return result.scalars().all()

    async def count_all(self, status_filter: str | None = None) -> int:
        """Count all orders with optional filtering."""
        query = select(func.count(Order.id))
        if status_filter:
            query = query.where(text("status::text = :st")).params(st=status_filter.lower())
        
        result = await self.session.execute(query)
        return result.scalar_one()

    async def get_all_paginated(self, page: int, limit: int, status_filter: str | None = None) -> list[Order]:
        """Get all orders paginated with optional filtering."""
        query = select(Order)
        if status_filter:
            query = query.where(text("status::text = :st")).params(st=status_filter.lower())
        
        offset = (page - 1) * limit
        result = await self.session.execute(
            query.order_by(Order.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return result.scalars().all()
