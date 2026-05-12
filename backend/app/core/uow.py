"""Unit of Work pattern implementation."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repository import BaseRepository
from app.repositories.order_repository import OrderRepository
from app.repositories.inventory_repository import InventoryRepository
from app.repositories.user_repository import UserRepository
from app.repositories.cart_repository import CartRepository, CartItemRepository
from app.repositories.review_repository import ReviewRepository, NotificationRepository
from app.models.product import Product
from app.models.category import Category
from app.models.order_item import OrderItem
from app.models.wishlist import WishlistItem
from app.models.branch import Branch
from app.models.historial_estado_pedido import HistorialEstadoPedido
from app.models.refresh_token import RefreshToken


class UnitOfWork:
    """Manages database transactions and repositories."""

    def __init__(self, session: AsyncSession):
        self.session = session
        
        # Specific Repositories
        self.orders = OrderRepository(session)
        self.inventory = InventoryRepository(session)
        self.users = UserRepository(session)
        self.carts = CartRepository(session)
        self.cart_items = CartItemRepository(session)
        self.reviews = ReviewRepository(session)
        self.notifications = NotificationRepository(session)
        
        # Generic Repositories (can be specialized later if needed)
        self.products = BaseRepository(Product, session)
        self.categories = BaseRepository(Category, session)
        self.order_items = BaseRepository(OrderItem, session)
        self.wishlist = BaseRepository(WishlistItem, session)
        self.branches = BaseRepository(Branch, session)
        self.refresh_tokens = BaseRepository(RefreshToken, session)
        self.historial = BaseRepository(HistorialEstadoPedido, session)

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            await self.rollback()
        else:
            await self.commit()

    async def commit(self):
        """Commit the current transaction."""
        await self.session.commit()

    async def rollback(self):
        """Rollback the current transaction."""
        await self.session.rollback()

    async def flush(self):
        """Flush the current session to get IDs without committing."""
        await self.session.flush()

    async def refresh(self, obj, attribute_names: list[str] | None = None):
        """Refresh an object from the database.

        Args:
            obj: SQLAlchemy model instance to refresh
            attribute_names: Optional list of relationship attribute names to eager-load
        """
        if attribute_names:
            await self.session.refresh(obj, attribute_names=attribute_names)
        else:
            await self.session.refresh(obj)
