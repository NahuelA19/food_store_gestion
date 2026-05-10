"""Recommendation engine service with TTL cache and multiple strategies."""

import time
from functools import lru_cache
from typing import Any

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.order import Order, OrderStatus
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.review import Review

_VALID_ORDER_STATUSES = [
    OrderStatus.PAYMENT_PENDING,
    OrderStatus.PAID,
    OrderStatus.CONFIRMED,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
]

_EXCLUDED_STATUSES = [OrderStatus.CANCELLED, OrderStatus.PAYMENT_FAILED]


class TTLCache:
    """Simple in-memory cache with time-to-live expiration."""

    def __init__(self, ttl_seconds: int = 300):
        self._cache: dict[str, tuple[float, Any]] = {}
        self._ttl = ttl_seconds

    def get(self, key: str) -> Any | None:
        if key in self._cache:
            timestamp, value = self._cache[key]
            if time.time() - timestamp < self._ttl:
                return value
            del self._cache[key]
        return None

    def set(self, key: str, value: Any) -> None:
        self._cache[key] = (time.time(), value)

    def invalidate(self, key: str) -> None:
        self._cache.pop(key, None)

    def invalidate_pattern(self, pattern: str) -> None:
        """Invalidate all keys containing the given substring."""
        keys_to_delete = [k for k in self._cache if pattern in k]
        for k in keys_to_delete:
            del self._cache[k]

    def clear(self) -> None:
        self._cache.clear()


class RecommendationService:
    """Recommendation service with multiple strategies and TTL cache.

    Strategies:
      - FrequentlyBoughtTogether: products co-purchased in same order
      - Popular: weighted score (purchase_count * 0.6 + avg_rating * 0.4)
      - Personalized: category-based for authenticated users
    """

    def __init__(self) -> None:
        self._cache = TTLCache(ttl_seconds=300)

    # ── Frequently Bought Together ──────────────────────────────────────

    async def get_frequently_bought_together(
        self,
        db: AsyncSession,
        product_id: int,
        limit: int = 4,
    ) -> list[Product]:
        """Find products frequently co-purchased with the given product.

        Falls back to same-category products if < limit results.
        """
        cache_key = f"fbt:{product_id}:{limit}"
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached

        # Find valid order IDs that contain the target product
        order_ids_subq = (
            select(OrderItem.order_id)
            .where(OrderItem.product_id == product_id)
            .join(Order)
            .where(Order.status.notin_(_EXCLUDED_STATUSES))
        )

        # Find products co-purchased in those orders, ranked by frequency
        ids_result = await db.execute(
            select(OrderItem.product_id)
            .join(Order)
            .where(
                Order.status.notin_(_EXCLUDED_STATUSES),
                OrderItem.order_id.in_(order_ids_subq),
                OrderItem.product_id != product_id,
            )
            .group_by(OrderItem.product_id)
            .order_by(func.count(OrderItem.id).desc())
            .limit(limit)
        )
        product_ids = list(ids_result.scalars().all())

        products: list[Product] = []
        if product_ids:
            result = await db.execute(
                select(Product)
                .where(Product.id.in_(product_ids))
                .options(selectinload(Product.category), selectinload(Product.inventory))
            )
            products = list(result.scalars().all())

        # Fall back to same-category products if needed
        if len(products) < limit:
            existing_ids = {p.id for p in products}
            existing_ids.add(product_id)

            prod_result = await db.execute(
                select(Product.category_id).where(Product.id == product_id)
            )
            category_id = prod_result.scalar_one_or_none()

            if category_id:
                needed = limit - len(products)
                result = await db.execute(
                    select(Product)
                    .where(
                        and_(
                            Product.category_id == category_id,
                            Product.id.notin_(list(existing_ids)),
                        )
                    )
                    .options(selectinload(Product.category), selectinload(Product.inventory))
                    .limit(needed)
                )
                products.extend(result.scalars().all())

        self._cache.set(cache_key, products)
        return products

    # ── Trending / Popular ──────────────────────────────────────────────

    async def get_trending(
        self,
        db: AsyncSession,
        limit: int = 8,
    ) -> list[tuple[Product, float | None, int]]:
        """Get trending products by weighted score.

        Returns list of (Product, avg_rating, purchase_count) tuples.
        Score = purchase_count * 0.6 + avg_rating * 0.4
        """
        cache_key = f"trending:{limit}"
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached

        # Purchase count per product
        purchase_count_subq = (
            select(
                OrderItem.product_id,
                func.count(OrderItem.id).label("purchase_count"),
            )
            .join(Order)
            .where(Order.status.notin_(_EXCLUDED_STATUSES))
            .group_by(OrderItem.product_id)
            .subquery()
        )

        # Average rating per product (approved only)
        avg_rating_subq = (
            select(
                Review.product_id,
                func.avg(Review.rating).label("avg_rating"),
            )
            .where(Review.is_approved.is_(True))
            .group_by(Review.product_id)
            .subquery()
        )

        score = (
            func.coalesce(purchase_count_subq.c.purchase_count, 0) * 0.6
            + func.coalesce(avg_rating_subq.c.avg_rating, 0) * 0.4
        )

        result = await db.execute(
            select(
                Product,
                avg_rating_subq.c.avg_rating,
                purchase_count_subq.c.purchase_count,
            )
            .outerjoin(purchase_count_subq, Product.id == purchase_count_subq.c.product_id)
            .outerjoin(avg_rating_subq, Product.id == avg_rating_subq.c.product_id)
            .where(Product.is_available.is_(True))
            .order_by(score.desc())
            .options(selectinload(Product.category), selectinload(Product.inventory))
            .limit(limit)
        )
        rows = result.all()
        products = [
            (row.Product, row.avg_rating, row.purchase_count or 0)
            for row in rows
        ]

        self._cache.set(cache_key, products)
        return products

    # ── Personalized ────────────────────────────────────────────────────

    async def get_personalized(
        self,
        db: AsyncSession,
        user_id: int,
        limit: int = 8,
    ) -> list[tuple[Product, float | None, int]]:
        """Get personalized recommendations for a user.

        Finds categories from user's order history, recommends top products
        in those categories that the user hasn't purchased.
        Falls back to trending if user has no order history.
        """
        cache_key = f"personalized:{user_id}:{limit}"
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached

        # Categories the user has ordered from
        user_categories = (
            select(Product.category_id)
            .join(OrderItem, OrderItem.product_id == Product.id)
            .join(Order)
            .where(
                Order.user_id == user_id,
                Order.status.notin_(_EXCLUDED_STATUSES),
            )
            .group_by(Product.category_id)
            .subquery()
        )

        # Products the user has already purchased
        purchased = (
            select(OrderItem.product_id)
            .join(Order)
            .where(
                Order.user_id == user_id,
                Order.status.notin_(_EXCLUDED_STATUSES),
            )
            .subquery()
        )

        # Check if user has history — fall back to trending if not
        count_result = await db.execute(
            select(func.count()).select_from(user_categories)
        )
        has_history = count_result.scalar() > 0

        if not has_history:
            result = await self.get_trending(db, limit)
            self._cache.set(cache_key, result)
            return result

        # Avg rating subquery
        avg_rating_subq = (
            select(
                Review.product_id,
                func.avg(Review.rating).label("avg_rating"),
            )
            .where(Review.is_approved.is_(True))
            .group_by(Review.product_id)
            .subquery()
        )

        # Purchase count subquery
        purchase_count_subq = (
            select(
                OrderItem.product_id,
                func.count(OrderItem.id).label("purchase_count"),
            )
            .join(Order)
            .where(Order.status.notin_(_EXCLUDED_STATUSES))
            .group_by(OrderItem.product_id)
            .subquery()
        )

        result = await db.execute(
            select(
                Product,
                avg_rating_subq.c.avg_rating,
                purchase_count_subq.c.purchase_count,
            )
            .outerjoin(avg_rating_subq, Product.id == avg_rating_subq.c.product_id)
            .outerjoin(purchase_count_subq, Product.id == purchase_count_subq.c.product_id)
            .where(
                Product.category_id.in_(select(user_categories.c.category_id)),
                Product.id.notin_(select(purchased.c.product_id)),
                Product.is_available.is_(True),
            )
            .order_by(
                avg_rating_subq.c.avg_rating.desc().nullslast(),
                purchase_count_subq.c.purchase_count.desc().nullslast(),
            )
            .options(selectinload(Product.category), selectinload(Product.inventory))
            .limit(limit)
        )
        rows = result.all()
        products = [
            (row.Product, row.avg_rating, row.purchase_count or 0)
            for row in rows
        ]

        self._cache.set(cache_key, products)
        return products

    # ── Cache management ────────────────────────────────────────────────

    def invalidate_product_cache(self, product_id: int | None = None) -> None:
        """Invalidate cache entries related to products/recommendations."""
        self._cache.invalidate_pattern("trending:")
        self._cache.invalidate_pattern("personalized:")
        if product_id is not None:
            self._cache.invalidate(f"fbt:{product_id}:")

    def invalidate_all(self) -> None:
        """Invalidate entire recommendation cache."""
        self._cache.clear()


# ── Singleton instance ────────────────────────────────────────────────

_service_instance: RecommendationService | None = None


@lru_cache
def get_recommendation_service() -> RecommendationService:
    """FastAPI dependency factory — caches a single service instance."""
    global _service_instance
    if _service_instance is None:
        _service_instance = RecommendationService()
    return _service_instance


# Module-level singleton for direct import by other services
recommendation_service = get_recommendation_service()
