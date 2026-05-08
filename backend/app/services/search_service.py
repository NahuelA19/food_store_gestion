"""Search service for building and executing search queries."""

from decimal import Decimal

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.inventory import Inventory
from app.models.product import Product
from app.schemas.search import PaginationInfo


async def validate_search_params(
    db: AsyncSession,
    category_id: int | None = None,
    min_price: Decimal | None = None,
    max_price: Decimal | None = None,
) -> dict[str, str]:
    """Validate search parameters. Returns dict of errors (empty if valid)."""
    errors = {}

    # Validate price range
    if min_price is not None and max_price is not None:
        if min_price > max_price:
            errors["price_range"] = "min_price must be <= max_price"

    # Validate category exists (if provided)
    if category_id:
        from app.models.category import Category

        result = await db.execute(
            select(Category).where(Category.id == category_id)
        )
        if not result.scalar_one_or_none():
            errors["category_id"] = f"Category with id {category_id} not found"

    return errors


def build_search_filters(
    q: str | None = None,
    category_id: int | None = None,
    min_price: Decimal | None = None,
    max_price: Decimal | None = None,
    in_stock: bool | None = None,
    min_stock: int | None = None,
) -> list:
    """Build WHERE clause filters for search query."""
    filters = []

    # Full-text search filter
    if q:
        filters.append(
            Product.search_vector.match(
                func.plainto_tsquery("english", q)
            )
        )

    # Category filter
    if category_id:
        filters.append(Product.category_id == category_id)

    # Price range filters
    if min_price is not None:
        filters.append(Product.price >= min_price)
    if max_price is not None:
        filters.append(Product.price <= max_price)

    # Availability filter
    if in_stock is not None:
        filters.append(Product.is_available == in_stock)

    # Stock quantity filter
    if min_stock:
        filters.append(Inventory.stock_quantity >= min_stock)

    return filters


def build_sort_order(sort_by: str, order: str, q: str | None = None):
    """Build sort order clause."""
    desc = order == "desc"

    if sort_by == "name":
        return Product.name.desc() if desc else Product.name.asc()
    elif sort_by == "price":
        return Product.price.desc() if desc else Product.price.asc()
    elif sort_by == "relevance" and q:
        # Rank by text search relevance
        return func.ts_rank(
            Product.search_vector,
            func.plainto_tsquery("english", q)
        ).desc()
    else:  # created_at or default
        return Product.created_at.desc() if desc else Product.created_at.asc()


def calculate_pagination_info(
    total: int,
    page: int,
    limit: int,
) -> PaginationInfo:
    """Calculate pagination info."""
    total_pages = max(0, (total + limit - 1) // limit)
    return PaginationInfo(
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_previous=page > 1,
    )


async def search_products(
    db: AsyncSession,
    q: str | None = None,
    category_id: int | None = None,
    min_price: Decimal | None = None,
    max_price: Decimal | None = None,
    in_stock: bool | None = None,
    min_stock: int | None = None,
    page: int = 1,
    limit: int = 20,
    sort_by: str = "relevance",
    order: str = "asc",
) -> tuple[list[Product], PaginationInfo]:
    """Execute search query with filters and return results with pagination info."""

    # Build filters
    filters = build_search_filters(
        q=q,
        category_id=category_id,
        min_price=min_price,
        max_price=max_price,
        in_stock=in_stock,
        min_stock=min_stock,
    )

    # Build main query with eager loading to prevent N+1
    query = select(Product).options(
        selectinload(Product.category),
        selectinload(Product.inventory),
    )

    if filters:
        query = query.where(and_(*filters))

    # Count total results before pagination
    count_query = select(func.count()).select_from(Product)
    if filters:
        count_query = count_query.where(and_(*filters))
    total = await db.scalar(count_query) or 0

    # Apply sorting
    sort_clause = build_sort_order(sort_by, order, q)
    query = query.order_by(sort_clause)

    # Apply pagination
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    # Execute query
    result = await db.execute(query)
    products = result.scalars().all()

    # Calculate pagination info
    pagination = calculate_pagination_info(total, page, limit)

    return products, pagination
