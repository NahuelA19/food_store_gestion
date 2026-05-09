"""Wishlist service layer."""

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.product import Product
from app.models.wishlist import WishlistItem


async def toggle_wishlist(
    db: AsyncSession,
    user_id: int,
    product_id: int,
) -> bool:
    """Toggle a product in the user's wishlist.

    Returns True if added, False if removed.
    """
    # Check product exists
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found",
        )

    # Check if already wishlisted
    result = await db.execute(
        select(WishlistItem).where(
            WishlistItem.user_id == user_id,
            WishlistItem.product_id == product_id,
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        await db.delete(existing)
        await db.commit()
        return False  # Removed
    else:
        item = WishlistItem(user_id=user_id, product_id=product_id)
        db.add(item)
        await db.commit()
        return True  # Added


async def get_wishlist(
    db: AsyncSession,
    user_id: int,
) -> list[WishlistItem]:
    """Get all wishlist items for a user with product details."""
    result = await db.execute(
        select(WishlistItem)
        .where(WishlistItem.user_id == user_id)
        .options(selectinload(WishlistItem.product).selectinload(Product.category))
        .order_by(WishlistItem.created_at.desc())
    )
    return list(result.scalars().all())


async def check_wishlist(
    db: AsyncSession,
    user_id: int,
    product_ids: list[int],
) -> dict[str, bool]:
    """Check which products are in the user's wishlist.

    Returns a dict mapping product_id strings to boolean.
    """
    if not product_ids:
        return {}

    result = await db.execute(
        select(WishlistItem.product_id).where(
            WishlistItem.user_id == user_id,
            WishlistItem.product_id.in_(product_ids),
        )
    )
    wishlisted_ids = {row[0] for row in result.all()}
    return {str(pid): pid in wishlisted_ids for pid in product_ids}
