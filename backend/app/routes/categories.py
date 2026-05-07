"""Category API routes for the Food Store."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_db
from app.models.category import Category
from app.models.product import Product
from app.schemas.category import (
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate,
    CategoryWithProductsResponse,
)

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("/", response_model=list[CategoryWithProductsResponse])
async def list_categories(
    db: AsyncSession = Depends(get_db),
) -> list[CategoryWithProductsResponse]:
    """List all categories with product counts."""
    result = await db.execute(
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
        .order_by(Category.name)
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


@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
) -> CategoryResponse:
    """Get a category by ID."""
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with id {category_id} not found",
        )
    return CategoryResponse.model_validate(category)


@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    body: CategoryCreate,
    db: AsyncSession = Depends(get_db),
) -> CategoryResponse:
    """Create a new category."""
    # Check if category with same name already exists
    result = await db.execute(select(Category).where(Category.name == body.name))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Category with name '{body.name}' already exists",
        )

    category = Category(name=body.name, description=body.description)
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return CategoryResponse.model_validate(category)


@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: int,
    body: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
) -> CategoryResponse:
    """Update a category."""
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with id {category_id} not found",
        )

    # Check for duplicate name if changing it
    if body.name and body.name != category.name:
        result = await db.execute(select(Category).where(Category.name == body.name))
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Category with name '{body.name}' already exists",
            )

    # Update fields
    if body.name is not None:
        category.name = body.name
    if body.description is not None:
        category.description = body.description

    db.add(category)
    await db.commit()
    await db.refresh(category)
    return CategoryResponse.model_validate(category)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a category."""
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with id {category_id} not found",
        )

    # Check if category has products
    result = await db.execute(
        select(func.count(Product.id)).where(Product.category_id == category_id)
    )
    product_count = result.scalar()
    if product_count and product_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete category with {product_count} product(s)",
        )

    await db.delete(category)
    await db.commit()
