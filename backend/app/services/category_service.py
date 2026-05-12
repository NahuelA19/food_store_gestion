"""Category service layer."""

from typing import cast

from fastapi import HTTPException, status
from sqlalchemy import func, select

from app.core.uow import UnitOfWork
from app.models.category import Category
from app.models.product import Product
from app.schemas.category import (
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate,
    CategoryWithProductsResponse,
)


async def list_categories_with_counts(uow: UnitOfWork) -> list[CategoryWithProductsResponse]:
    """List all categories with product counts."""
    result = await uow.session.execute(
        select(
            Category.id,
            Category.name,
            Category.description,
            Category.created_at,
            Category.updated_at,
            func.count(Product.id).label("product_count"),
        )
        .outerjoin(Product, Product.category_id == Category.id)
        .group_by(
            Category.id,
            Category.name,
            Category.description,
            Category.created_at,
            Category.updated_at,
        )
        .order_by(Category.name),
    )
    rows = result.all()
    return [
        CategoryWithProductsResponse(
            id=row[0],
            name=row[1],
            description=row[2],
            created_at=row[3],
            updated_at=row[4],
            product_count=row[5] or 0,
        )
        for row in rows
    ]


async def get_category(uow: UnitOfWork, category_id: int) -> Category:
    """Get a category by ID."""
    result = await uow.session.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with id {category_id} not found",
        )
    return category


async def create_category(uow: UnitOfWork, data: CategoryCreate) -> Category:
    """Create a new category."""
    # Check if category with same name already exists
    result = await uow.session.execute(select(Category).where(Category.name == data.name))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Category with name '{data.name}' already exists",
        )
    category = Category(name=data.name, description=data.description)
    uow.session.add(category)
    await uow.flush()
    await uow.refresh(category)
    return category


async def update_category(uow: UnitOfWork, category_id: int, data: CategoryUpdate) -> Category:
    """Update a category."""
    category = await get_category(uow, category_id)

    # Check for duplicate name if changing it
    if data.name and data.name != category.name:
        result = await uow.session.execute(select(Category).where(Category.name == data.name))
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Category with name '{data.name}' already exists",
            )

    # Update fields
    if data.name is not None:
        category.name = data.name
    if data.description is not None:
        category.description = data.description

    uow.session.add(category)
    await uow.flush()
    await uow.refresh(category)
    return category


async def delete_category(uow: UnitOfWork, category_id: int) -> None:
    """Delete a category."""
    category = await get_category(uow, category_id)

    # Check if category has products
    result = await uow.session.execute(
        select(func.count(Product.id)).where(Product.category_id == category_id),
    )
    product_count = cast(int | None, result.scalar())
    if product_count and product_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete category with {product_count} product(s)",
        )

    await uow.session.delete(category)
