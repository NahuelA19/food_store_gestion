"""Cart API routes for the Food Store."""

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.uow import UnitOfWork
from app.dependencies import get_current_user, get_uow
from app.models.user import User
from app.schemas.cart import (
    CartItemAdd,
    CartItemUpdate,
    CartResponse,
    CheckoutRequest,
    CheckoutResponse,
)
from app.services.cart_service import (
    add_item_to_cart,
    checkout_cart,
    clear_cart_items,
    get_cart_response,
    get_cart_with_items,
    get_or_create_user_cart,
    remove_cart_item,
    update_cart_item_quantity,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/carts", tags=["cart"])


@router.get("/", response_model=CartResponse)
async def get_current_cart(
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> CartResponse:
    """Get the current user's active cart. Creates one if it doesn't exist."""
    cart = await get_or_create_user_cart(current_user.id, uow)
    return await get_cart_response(cart)


@router.get("/{cart_id}", response_model=CartResponse)
async def get_cart_by_id(
    cart_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> CartResponse:
    """Get a specific cart by ID (must belong to current user)."""
    cart = await get_cart_with_items(cart_id, current_user.id, uow)
    return await get_cart_response(cart)


@router.post("/{cart_id}/items", response_model=CartResponse, status_code=status.HTTP_201_CREATED)
async def add_item(
    cart_id: int,
    body: CartItemAdd,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> CartResponse:
    """Add an item to the cart. Idempotent: if product already in cart, updates quantity."""
    # Verify cart belongs to user
    cart = await get_cart_with_items(cart_id, current_user.id, uow)

    if cart.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot add items to a checked out cart",
        )

    updated_cart = await add_item_to_cart(cart_id, body, uow)
    logger.info(
        "Added item to cart: user_id=%s, cart_id=%s, product_id=%s, qty=%s",
        current_user.id, cart_id, body.product_id, body.quantity,
    )
    return await get_cart_response(updated_cart)


@router.patch("/{cart_id}/items/{item_id}", response_model=CartResponse)
async def update_item_quantity(
    cart_id: int,
    item_id: int,
    body: CartItemUpdate,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> CartResponse:
    """Update cart item quantity. If quantity is 0, removes the item."""
    # Verify cart belongs to user
    await get_cart_with_items(cart_id, current_user.id, uow)

    updated_cart = await update_cart_item_quantity(cart_id, item_id, body, uow)
    logger.info(
        "Updated cart item: user_id=%s, cart_id=%s, item_id=%s, qty=%s",
        current_user.id, cart_id, item_id, body.quantity,
    )
    return await get_cart_response(updated_cart)


@router.delete("/{cart_id}/items/{item_id}", response_model=CartResponse)
async def remove_item(
    cart_id: int,
    item_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> CartResponse:
    """Remove an item from the cart."""
    # Verify cart belongs to user
    await get_cart_with_items(cart_id, current_user.id, uow)

    updated_cart = await remove_cart_item(cart_id, item_id, uow)
    logger.info(
        "Removed item from cart: user_id=%s, cart_id=%s, item_id=%s",
        current_user.id, cart_id, item_id,
    )
    return await get_cart_response(updated_cart)


@router.delete("/{cart_id}/items", response_model=CartResponse)
async def clear_items(
    cart_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> CartResponse:
    """Clear all items from the cart."""
    # Verify cart belongs to user
    await get_cart_with_items(cart_id, current_user.id, uow)

    updated_cart = await clear_cart_items(cart_id, uow)
    logger.info("Cleared cart: user_id=%s, cart_id=%s", current_user.id, cart_id)
    return await get_cart_response(updated_cart)


@router.post("/{cart_id}/checkout", response_model=CheckoutResponse, status_code=status.HTTP_201_CREATED)
async def initiate_checkout(
    cart_id: int,
    body: CheckoutRequest,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> dict[str, Any]:
    """Initiate checkout for the cart. Validates all items are available."""
    result = await checkout_cart(cart_id, current_user, body, uow)
    logger.info(
        "Checkout initiated: user_id=%s, cart_id=%s",
        current_user.id, cart_id,
    )
    return result
