"""Inventory API routes for the Food Store."""

from typing import cast

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from app.core.uow import UnitOfWork
from app.dependencies import get_current_user, get_uow, require_role
from app.models.user import User
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
    current_user: User = Depends(require_role("admin", "chef")),
    uow: UnitOfWork = Depends(get_uow),
) -> InventoryResponse:
    """Get inventory for a product."""
    # Check product exists
    result = await uow.session.execute(select(Product).where(Product.id == product_id))
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found",
        )

    # Get inventory
    result = await uow.session.execute(
        select(Inventory).where(Inventory.product_id == product_id)
    )
    inventory = cast(Inventory | None, result.scalar_one_or_none())
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
    current_user: User = Depends(require_role("admin", "chef")),
    uow: UnitOfWork = Depends(get_uow),
) -> InventoryResponse:
    """Update inventory stock levels."""
    # Check product exists
    result = await uow.session.execute(select(Product).where(Product.id == product_id))
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found",
        )

    # Get inventory
    result = await uow.session.execute(
        select(Inventory).where(Inventory.product_id == product_id)
    )
    inventory = cast(Inventory | None, result.scalar_one_or_none())
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

    uow.session.add(inventory)
    await uow.flush()
    await uow.refresh(inventory)
    return InventoryResponse.model_validate(inventory)


@router.post("/{product_id}/reserve", response_model=InventoryResponse)
async def reserve_inventory(
    product_id: int,
    body: InventoryReserveRequest,
    uow: UnitOfWork = Depends(get_uow),
) -> InventoryResponse:
    """Reserve stock for a product."""
    # Check product exists
    result = await uow.session.execute(select(Product).where(Product.id == product_id))
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found",
        )

    # Get inventory
    result = await uow.session.execute(
        select(Inventory).where(Inventory.product_id == product_id)
    )
    inventory = cast(Inventory | None, result.scalar_one_or_none())
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
    uow.session.add(inventory)
    await uow.flush()
    await uow.refresh(inventory)
    return InventoryResponse.model_validate(inventory)
