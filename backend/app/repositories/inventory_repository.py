"""Inventory repository implementation."""

from sqlalchemy import select
from app.core.repository import BaseRepository
from app.models.inventory import Inventory


class InventoryRepository(BaseRepository[Inventory]):
    """Repository for Inventory operations."""

    def __init__(self, session):
        super().__init__(Inventory, session)

    async def get_by_product_id(self, product_id: int) -> Inventory | None:
        """Get inventory record for a specific product."""
        result = await self.session.execute(
            select(Inventory).where(Inventory.product_id == product_id)
        )
        return result.scalar_one_or_none()
