"""Inventory API routes for the Food Store."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.models.inventory import Inventory
from app.models.product import Product
from app.schemas.inventory import (
    InventoryReserveRequest,
    InventoryResponse,
    InventoryUpdate,
)

router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.get("/{product_id}", response_model=InventoryResponse)
async def get_inventory(
    product_id: int,
    db: AsyncSession = Depends(get_db),
) -> InventoryResponse:
    """Get inventory for a product."""
    # Check product exists
    result = await db.execute(select(Product).where(Product.id == product_id))
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found",
        )

    # Get inventory
    result = await db.execute(
        select(Inventory).where(Inventory.product_id == product_id)
    )
    inventory = result.scalar_one_or_none()
    if not inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inventory not found for product {product_id}",
        )

    return InventoryResponse.model_validate(inventory)


@router.put("/{product_id}", response_model=InventoryResponse)
async def update_inventory(
    product_id: int,
    body: InventoryUpdate,
    db: AsyncSession = Depends(get_db),
) -> InventoryResponse:
    """Update inventory stock levels."""
    # Check product exists
    result = await db.execute(select(Product).where(Product.id == product_id))
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found",
        )

    # Get inventory
    result = await db.execute(
        select(Inventory).where(Inventory.product_id == product_id)
    )
    inventory = result.scalar_one_or_none()
    if not inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inventory not found for product {product_id}",
        )

    # Validate: cannot set stock below reserved quantity
    if body.stock_quantity < inventory.reserved_quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot set stock to {body.stock_quantity} when {inventory.reserved_quantity} units are reserved",
        )

    # Update fields
    inventory.stock_quantity = body.stock_quantity
    if body.low_stock_threshold is not None:
        inventory.low_stock_threshold = body.low_stock_threshold

    db.add(inventory)
    await db.commit()
    await db.refresh(inventory)
    return InventoryResponse.model_validate(inventory)


@router.post("/{product_id}/reserve", response_model=InventoryResponse)
async def reserve_inventory(
    product_id: int,
    body: InventoryReserveRequest,
    db: AsyncSession = Depends(get_db),
) -> InventoryResponse:
    """Reserve stock for a product."""
    # Check product exists
    result = await db.execute(select(Product).where(Product.id == product_id))
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found",
        )

    # Get inventory
    result = await db.execute(
        select(Inventory).where(Inventory.product_id == product_id)
    )
    inventory = result.scalar_one_or_none()
    if not inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inventory not found for product {product_id}",
        )

    # Check available quantity
    available = inventory.available_quantity
    if body.quantity > available:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot reserve {body.quantity} units when only {available} are available",
        )

    # Reserve stock
    inventory.reserved_quantity += body.quantity
    db.add(inventory)
    await db.commit()
    await db.refresh(inventory)
    return InventoryResponse.model_validate(inventory)
