"""Inventory service layer."""

from typing import cast

from fastapi import HTTPException, status
from sqlalchemy import select

from app.core.uow import UnitOfWork
from app.models.inventory import Inventory
from app.models.product import Product
from app.schemas.inventory import (
    InventoryReserveRequest,
    InventoryUpdate,
)


async def get_inventory(uow: UnitOfWork, product_id: int) -> Inventory:
    """Get inventory for a product."""
    # Check product exists
    result = await uow.session.execute(select(Product).where(Product.id == product_id))
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found",
        )

    # Get inventory
    result = await uow.session.execute(select(Inventory).where(Inventory.product_id == product_id))
    inventory = cast(Inventory | None, result.scalar_one_or_none())
    if not inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inventory not found for product {product_id}",
        )
    return inventory


async def update_inventory(uow: UnitOfWork, product_id: int, data: InventoryUpdate) -> Inventory:
    """Update inventory stock levels."""
    inventory = await get_inventory(uow, product_id)

    # Validate: cannot set stock below reserved quantity
    if data.stock_quantity < inventory.reserved_quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot set stock to {data.stock_quantity} when {inventory.reserved_quantity} units are reserved",
        )

    # Update fields
    inventory.stock_quantity = data.stock_quantity
    if data.low_stock_threshold is not None:
        inventory.low_stock_threshold = data.low_stock_threshold

    uow.session.add(inventory)
    await uow.flush()
    await uow.refresh(inventory)
    return inventory


async def reserve_inventory(uow: UnitOfWork, product_id: int, data: InventoryReserveRequest) -> Inventory:
    """Reserve stock for a product."""
    inventory = await get_inventory(uow, product_id)

    # Check available quantity
    available = inventory.available_quantity
    if data.quantity > available:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot reserve {data.quantity} units when only {available} are available",
        )

    # Reserve stock
    inventory.reserved_quantity += data.quantity
    uow.session.add(inventory)
    await uow.flush()
    await uow.refresh(inventory)
    return inventory
