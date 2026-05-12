"""Product service layer."""

from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import and_, func, select
from sqlalchemy.orm import selectinload

from app.core.uow import UnitOfWork
from app.models.category import Category
from app.models.inventory import Inventory
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate
from app.services.review_service import get_review_summary


async def list_products(
    uow: UnitOfWork,
    page: int = 1,
    limit: int = 20,
    category_id: int | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    in_stock: bool | None = None,
    search: str | None = None,
    sort_by: str = "created_at",
    order: str = "desc",
) -> dict[str, Any]:
    """List products with filtering, searching, and pagination."""
    query = select(Product).options(
        selectinload(Product.category),
        selectinload(Product.inventory),
    )

    # Apply filters
    filters = [Product.deleted_at.is_(None)]
    if category_id:
        filters.append(Product.category_id == category_id)
    if min_price is not None:
        filters.append(Product.price >= min_price)
    if max_price is not None:
        filters.append(Product.price <= max_price)
    if in_stock is not None:
        filters.append(Product.is_available == in_stock)
    if search:
        filters.append(Product.name.ilike(f"%{search}%"))
    if filters:
        query = query.where(and_(*filters))

    # Get total count
    count_query = select(func.count()).select_from(Product)
    if filters:
        count_query = count_query.where(and_(*filters))
    total_result = await uow.session.execute(count_query)
    total = total_result.scalar() or 0

    # Apply sorting
    if sort_by == "name":
        query = query.order_by(Product.name.asc() if order == "asc" else Product.name.desc())
    elif sort_by == "price":
        query = query.order_by(Product.price.asc() if order == "asc" else Product.price.desc())
    else:
        query = query.order_by(Product.created_at.asc() if order == "asc" else Product.created_at.desc())

    # Apply pagination
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)
    result = await uow.session.execute(query)
    products = result.scalars().all()
    total_pages = (total + limit - 1) // limit

    return {
        "items": products,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_previous": page > 1,
    }


async def get_product(uow: UnitOfWork, product_id: int) -> Product:
    """Get a single product by ID."""
    result = await uow.session.execute(
        select(Product)
        .where(Product.id == product_id)
        .options(selectinload(Product.category), selectinload(Product.inventory)),
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found",
        )
    return product


async def create_product(uow: UnitOfWork, data: ProductCreate) -> Product:
    """Create a new product with inventory."""
    # Check category exists
    result = await uow.session.execute(select(Category).where(Category.id == data.category_id))
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category with id {data.category_id} not found",
        )

    product = Product(
        name=data.name,
        description=data.description,
        price=data.price,
        category_id=data.category_id,
        is_available=data.is_available,
    )
    uow.session.add(product)
    await uow.flush()

    # Auto-create inventory with 0 stock
    inventory = Inventory(product_id=product.id, stock_quantity=0)
    uow.session.add(inventory)
    await uow.flush()
    await uow.refresh(product)

    return product


async def update_product(uow: UnitOfWork, product_id: int, data: ProductUpdate) -> Product:
    """Update a product."""
    product = await get_product(uow, product_id)

    # Check category exists if changing it
    if data.category_id:
        result = await uow.session.execute(select(Category).where(Category.id == data.category_id))
        if not result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category with id {data.category_id} not found",
            )

    # Update fields
    if data.name is not None:
        product.name = data.name
    if data.description is not None:
        product.description = data.description
    if data.price is not None:
        product.price = data.price
    if data.category_id is not None:
        product.category_id = data.category_id
    if data.is_available is not None:
        product.is_available = data.is_available

    uow.session.add(product)
    await uow.flush()
    await uow.refresh(product)
    return product


async def delete_product(uow: UnitOfWork, product_id: int) -> None:
    """Soft-delete a product."""
    product = await get_product(uow, product_id)
    product.soft_delete()
    uow.session.add(product)
    await uow.flush()


async def toggle_availability(uow: UnitOfWork, product_id: int) -> Product:
    """Toggle product availability."""
    product = await get_product(uow, product_id)
    product.is_available = not product.is_available
    uow.session.add(product)
    await uow.flush()
    await uow.refresh(product)
    return product


async def get_related_products(uow: UnitOfWork, product_id: int, limit: int = 4) -> list[Product]:
    """Get related products from same category."""
    product = await get_product(uow, product_id)
    result = await uow.session.execute(
        select(Product)
        .where(
            and_(
                Product.category_id == product.category_id,
                Product.id != product_id,
            ),
        )
        .options(selectinload(Product.category), selectinload(Product.inventory))
        .limit(limit),
    )
    return list(result.scalars().all())
