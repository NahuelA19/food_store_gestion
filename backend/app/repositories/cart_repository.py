"""Cart repository implementation."""

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.repository import BaseRepository
from app.models.cart import Cart, CartItem


class CartRepository(BaseRepository[Cart]):
    """Repository for Cart operations."""

    def __init__(self, session):
        super().__init__(Cart, session)

    async def get_active_by_user(self, user_id: int) -> Cart | None:
        """Get active cart for a user with items and products loaded."""
        result = await self.session.execute(
            select(Cart)
            .where(Cart.user_id == user_id, Cart.status == "active")
            .options(selectinload(Cart.items).selectinload(CartItem.product))
        )
        return result.scalar_one_or_none()

    async def get_with_items(self, cart_id: int) -> Cart | None:
        """Get cart with items and products loaded."""
        result = await self.session.execute(
            select(Cart)
            .where(Cart.id == cart_id)
            .options(selectinload(Cart.items).selectinload(CartItem.product))
        )
        return result.scalar_one_or_none()


class CartItemRepository(BaseRepository[CartItem]):
    """Repository for CartItem operations."""

    def __init__(self, session):
        super().__init__(CartItem, session)

    async def get_item_in_cart(self, cart_id: int, product_id: int) -> CartItem | None:
        """Find a specific product in a cart."""
        result = await self.session.execute(
            select(CartItem).where(
                CartItem.cart_id == cart_id,
                CartItem.product_id == product_id,
            )
        )
        return result.scalar_one_or_none()
