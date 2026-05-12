"""Product API routes for the Food Store."""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, func, select
from sqlalchemy.orm import selectinload

from app.core.uow import UnitOfWork
from app.dependencies import get_current_user_optional, get_uow
from app.models.category import Category
from app.models.inventory import Inventory
from app.models.product import Product
from app.models.user import User
from app.services.recommendation_service import (
    RecommendationService,
    get_recommendation_service,
)
from app.services.review_service import get_review_summary
from app.schemas.product import (
    ProductCreate,
    ProductDetailResponse,
    ProductResponse,
    ProductUpdate,
    TrendingProductResponse,
)

router = APIRouter(prefix="/products", tags=["products"])


def _product_to_detail_dict(product: Product) -> dict:
    """Convert a Product ORM instance to a dict for ProductDetailResponse validation.

    Avoids type mismatch between the ORM ``reviews`` relationship (list[Review])
    and ``ProductDetailResponse.reviews`` (ReviewSummary | None).
    """
    return {
        "id": product.id,
        "name": product.name,
        "description": product.description,
        "price": product.price,
        "category_id": product.category_id,
        "category": product.category,
        "is_available": product.is_available,
        "inventory": product.inventory,
        "reviews": None,
        "created_at": product.created_at,
        "updated_at": product.updated_at,
    }


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
    uow: UnitOfWork = Depends(get_uow),
) -> dict[str, Any]:
    """List products with filtering, searching, and pagination."""
    # Build query
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

    result = await uow.session.execute(query)
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
    uow: UnitOfWork = Depends(get_uow),
) -> ProductDetailResponse:
    """Get a single product with full details and review summary."""
    result = await uow.session.execute(
        select(Product)
        .where(
            and_(
                Product.id == product_id,
                Product.deleted_at.is_(None),
            )
        )
        .options(
            selectinload(Product.category),
            selectinload(Product.inventory),
            selectinload(Product.reviews),
        )
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found",
        )

    response = ProductDetailResponse.model_validate(_product_to_detail_dict(product))
    response.reviews = await get_review_summary(uow, product_id)
    return response


@router.post("/", response_model=ProductDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    body: ProductCreate,
    uow: UnitOfWork = Depends(get_uow),
) -> ProductDetailResponse:
    """Create a new product."""
    # Check category exists
    result = await uow.session.execute(
        select(Category).where(
            and_(
                Category.id == body.category_id,
                Category.deleted_at.is_(None),
            )
        )
    )
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
    uow.session.add(product)
    await uow.flush()

    # Auto-create inventory with 0 stock
    inventory = Inventory(product_id=product.id, stock_quantity=0)
    uow.session.add(inventory)

    await uow.flush()
    await uow.refresh(product)
    await uow.refresh(product, ["category", "inventory"])
    response = ProductDetailResponse.model_validate(_product_to_detail_dict(product))
    return response


@router.put("/{product_id}", response_model=ProductDetailResponse)
async def update_product(
    product_id: int,
    body: ProductUpdate,
    uow: UnitOfWork = Depends(get_uow),
) -> ProductDetailResponse:
    """Update a product."""
    result = await uow.session.execute(
        select(Product)
        .where(
            and_(
                Product.id == product_id,
                Product.deleted_at.is_(None),
            )
        )
        .options(
            selectinload(Product.category),
            selectinload(Product.inventory),
            selectinload(Product.reviews),
        )
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found",
        )

    # Check category exists if changing it
    if body.category_id:
        result = await uow.session.execute(
            select(Category).where(
                and_(
                    Category.id == body.category_id,
                    Category.deleted_at.is_(None),
                )
            )
        )
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

    uow.session.add(product)
    await uow.flush()
    await uow.refresh(product, ["category", "inventory"])
    return ProductDetailResponse.model_validate(_product_to_detail_dict(product))


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    uow: UnitOfWork = Depends(get_uow),
) -> None:
    """Soft-delete a product."""
    result = await uow.session.execute(
        select(Product).where(
            and_(
                Product.id == product_id,
                Product.deleted_at.is_(None),
            )
        )
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found",
        )

    product.soft_delete()


@router.get("/recommendations", response_model=list[TrendingProductResponse])
async def get_recommendations(
    limit: int = Query(8, ge=1, le=20),
    uow: UnitOfWork = Depends(get_uow),
    current_user: User | None = Depends(get_current_user_optional),
    service: RecommendationService = Depends(get_recommendation_service),
) -> list[TrendingProductResponse]:
    """Get personalized product recommendations for the current user.

    When authenticated, returns recommendations based on order history.
    Falls back to trending products when unauthenticated or no history.
    """
    if current_user is not None:
        products = await service.get_personalized(uow.session, current_user.id, limit)
    else:
        products = await service.get_trending(uow.session, limit)

    return [
        TrendingProductResponse(
            **ProductResponse.model_validate(p).model_dump(),
            avg_rating=rating,
            purchase_count=count,
        )
        for p, rating, count in products
    ]


@router.get("/trending", response_model=list[TrendingProductResponse])
async def get_trending_products(
    limit: int = Query(8, ge=1, le=20),
    uow: UnitOfWork = Depends(get_uow),
    service: RecommendationService = Depends(get_recommendation_service),
) -> list[TrendingProductResponse]:
    """Get trending/popular products.

    Uses weighted scoring: purchase_count * 0.6 + avg_rating * 0.4.
    Only returns available products.
    """
    products = await service.get_trending(uow.session, limit)
    return [
        TrendingProductResponse(
            **ProductResponse.model_validate(p).model_dump(),
            avg_rating=rating,
            purchase_count=count,
        )
        for p, rating, count in products
    ]


@router.get("/{product_id}/frequently-bought-together", response_model=list[ProductResponse])
async def get_frequently_bought_together(
    product_id: int,
    limit: int = Query(4, ge=1, le=10),
    uow: UnitOfWork = Depends(get_uow),
    service: RecommendationService = Depends(get_recommendation_service),
) -> list[ProductResponse]:
    """Get products frequently bought together with this product."""
    # Verify product exists
    result = await uow.session.execute(
        select(Product).where(
            and_(
                Product.id == product_id,
                Product.deleted_at.is_(None),
            )
        )
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found",
        )

    products = await service.get_frequently_bought_together(uow.session, product_id, limit)
    return [ProductResponse.model_validate(p) for p in products]


@router.get("/{product_id}/related", response_model=list[ProductResponse])
async def get_related_products(
    product_id: int,
    limit: int = Query(4, ge=1, le=10),
    uow: UnitOfWork = Depends(get_uow),
) -> list[ProductResponse]:
    """Get related products (same category, excluding requested product)."""
    # Get the product to find its category
    result = await uow.session.execute(
        select(Product).where(
            and_(
                Product.id == product_id,
                Product.deleted_at.is_(None),
            )
        )
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found",
        )

    # Get related products from same category
    result = await uow.session.execute(
        select(Product)
        .where(
            and_(
                Product.category_id == product.category_id,
                Product.id != product_id,
                Product.deleted_at.is_(None),
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
    uow: UnitOfWork = Depends(get_uow),
) -> ProductDetailResponse:
    """Toggle product availability."""
    result = await uow.session.execute(
        select(Product)
        .where(
            and_(
                Product.id == product_id,
                Product.deleted_at.is_(None),
            )
        )
        .options(
            selectinload(Product.category),
            selectinload(Product.inventory),
            selectinload(Product.reviews),
        )
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found",
        )

    product.is_available = not product.is_available
    uow.session.add(product)
    await uow.flush()
    await uow.refresh(product, ["category", "inventory"])
    return ProductDetailResponse.model_validate(_product_to_detail_dict(product))
