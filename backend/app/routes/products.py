"""Product API routes for the Food Store."""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.dependencies import get_db
from app.models.category import Category
from app.models.inventory import Inventory
from app.models.product import Product
from app.services.review_service import get_review_summary
from app.schemas.product import (
    ProductCreate,
    ProductDetailResponse,
    ProductResponse,
    ProductUpdate,
)

router = APIRouter(prefix="/products", tags=["products"])


@router.get("/", response_model=dict)
async def list_products(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category_id: int | None = Query(None, ge=1),
    min_price: float | None = Query(None, ge=0),
    max_price: float | None = Query(None, ge=0),
    in_stock: bool | None = Query(None),
    search: str | None = Query(None),
    sort_by: str = Query("created_at", pattern="^(name|price|created_at)$"),
    order: str = Query("desc", pattern="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """List products with filtering, searching, and pagination."""
    # Build query
    query = select(Product).options(
        selectinload(Product.category),
        selectinload(Product.inventory),
    )

    # Apply filters
    filters = []
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
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Apply sorting
    if sort_by == "name":
        query = query.order_by(
            Product.name.asc() if order == "asc" else Product.name.desc()
        )
    elif sort_by == "price":
        query = query.order_by(
            Product.price.asc() if order == "asc" else Product.price.desc()
        )
    else:  # created_at
        query = query.order_by(
            Product.created_at.asc() if order == "asc" else Product.created_at.desc()
        )

    # Apply pagination
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    products = result.scalars().all()

    # Serialize response
    total_pages = (total + limit - 1) // limit
    return {
        "items": [ProductResponse.model_validate(p) for p in products],
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_previous": page > 1,
    }


@router.get("/{product_id}", response_model=ProductDetailResponse)
async def get_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
) -> ProductDetailResponse:
    """Get a single product with full details and review summary."""
    result = await db.execute(
        select(Product)
        .where(Product.id == product_id)
        .options(
            selectinload(Product.category),
            selectinload(Product.inventory),
        )
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found",
        )

    response = ProductDetailResponse.model_validate(product)
    response.reviews = await get_review_summary(db, product_id)
    return response


@router.post("/", response_model=ProductDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    body: ProductCreate,
    db: AsyncSession = Depends(get_db),
) -> ProductDetailResponse:
    """Create a new product."""
    # Check category exists
    result = await db.execute(select(Category).where(Category.id == body.category_id))
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category with id {body.category_id} not found",
        )

    # Create product
    product = Product(
        name=body.name,
        description=body.description,
        price=body.price,
        category_id=body.category_id,
        is_available=body.is_available,
    )
    db.add(product)
    await db.flush()

    # Auto-create inventory with 0 stock
    inventory = Inventory(product_id=product.id, stock_quantity=0)
    db.add(inventory)

    await db.commit()
    await db.refresh(product)
    await db.refresh(product, ["category", "inventory"])
    return ProductDetailResponse.model_validate(product)


@router.put("/{product_id}", response_model=ProductDetailResponse)
async def update_product(
    product_id: int,
    body: ProductUpdate,
    db: AsyncSession = Depends(get_db),
) -> ProductDetailResponse:
    """Update a product."""
    result = await db.execute(
        select(Product)
        .where(Product.id == product_id)
        .options(selectinload(Product.category), selectinload(Product.inventory))
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found",
        )

    # Check category exists if changing it
    if body.category_id:
        result = await db.execute(select(Category).where(Category.id == body.category_id))
        if not result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category with id {body.category_id} not found",
            )

    # Update fields
    if body.name is not None:
        product.name = body.name
    if body.description is not None:
        product.description = body.description
    if body.price is not None:
        product.price = body.price
    if body.category_id is not None:
        product.category_id = body.category_id
    if body.is_available is not None:
        product.is_available = body.is_available

    db.add(product)
    await db.commit()
    await db.refresh(product, ["category", "inventory"])
    return ProductDetailResponse.model_validate(product)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a product (cascades to inventory)."""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found",
        )

    await db.delete(product)
    await db.commit()


@router.get("/{product_id}/related", response_model=list[ProductResponse])
async def get_related_products(
    product_id: int,
    limit: int = Query(4, ge=1, le=10),
    db: AsyncSession = Depends(get_db),
) -> list[ProductResponse]:
    """Get related products (same category, excluding requested product)."""
    # Get the product to find its category
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found",
        )

    # Get related products from same category
    result = await db.execute(
        select(Product)
        .where(
            and_(
                Product.category_id == product.category_id,
                Product.id != product_id,
            )
        )
        .options(selectinload(Product.category), selectinload(Product.inventory))
        .limit(limit)
    )
    products = result.scalars().all()
    return [ProductResponse.model_validate(p) for p in products]


@router.put("/{product_id}/availability", response_model=ProductDetailResponse)
async def toggle_availability(
    product_id: int,
    db: AsyncSession = Depends(get_db),
) -> ProductDetailResponse:
    """Toggle product availability."""
    result = await db.execute(
        select(Product)
        .where(Product.id == product_id)
        .options(selectinload(Product.category), selectinload(Product.inventory))
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found",
        )

    product.is_available = not product.is_available
    db.add(product)
    await db.commit()
    await db.refresh(product, ["category", "inventory"])
    return ProductDetailResponse.model_validate(product)
