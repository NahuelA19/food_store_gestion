"""Cart business logic service."""

from decimal import Decimal
from typing import Any, cast

from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.orm import selectinload

from app.core.uow import UnitOfWork

from app.models.cart import Cart, CartItem
from app.models.product import Product
from app.models.user import User
from app.schemas.cart import (
    CartItemAdd,
    CartItemResponse,
    CartItemUpdate,
    CartResponse,
    CheckoutRequest,
)
from app.services.order_service import create_order_from_cart

TAX_RATE = Decimal("0.10")


async def get_or_create_user_cart(
    user_id: int,
    uow: UnitOfWork,
) -> Cart:
    """Get user's active cart or create a new one.

    Args:
        user_id: The user's ID
        db: Database session

    Returns:
        Cart: The user's active cart
    """
    # Look for existing active cart
    result = await uow.session.execute(
        select(Cart)
        .where(Cart.user_id == user_id, Cart.status == "active")
        .options(selectinload(Cart.items).selectinload(CartItem.product))
    )
    cart = result.scalar_one_or_none()

    if cart:
        return cart

    # Create new cart
    cart = Cart(user_id=user_id, status="active")
    uow.session.add(cart)
    await uow.flush()
    await uow.refresh(cart, ["items"])
    return cart


async def get_cart_with_items(
    cart_id: int,
    user_id: int,
    uow: UnitOfWork,
) -> Cart:
    """Get a cart by ID with items loaded, verifying ownership.

    Args:
        cart_id: Cart ID
        user_id: User ID for ownership verification
        db: Database session

    Returns:
        Cart with items loaded

    Raises:
        HTTPException 404: Cart not found
        HTTPException 403: Cart doesn't belong to user
    """
    result = await uow.session.execute(
        select(Cart)
        .where(Cart.id == cart_id)
        .options(selectinload(Cart.items).selectinload(CartItem.product))
    )
    cart = result.scalar_one_or_none()

    if not cart:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cart with id {cart_id} not found",
        )

    if cart.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this cart",
        )

    return cart


async def get_cart_response(
    cart: Cart,
) -> CartResponse:
    """Convert a Cart ORM object to CartResponse with computed totals.

    Args:
        cart: Cart ORM object with items loaded

    Returns:
        CartResponse with computed totals
    """
    items_response = []
    subtotal = Decimal("0.00")
    item_count = 0

    for item in cart.items:
        product_name = item.product.name if item.product else None
        item_subtotal = item.unit_price * item.quantity
        subtotal += item_subtotal
        item_count += item.quantity

        items_response.append(CartItemResponse(
            id=item.id,
            cart_id=item.cart_id,
            product_id=item.product_id,
            product_name=product_name,
            quantity=item.quantity,
            unit_price=item.unit_price,
            subtotal=item_subtotal,
            created_at=item.created_at,
            updated_at=item.updated_at,
        ))

    tax = (subtotal * TAX_RATE).quantize(Decimal("0.01"))
    total = (subtotal + tax).quantize(Decimal("0.01"))

    return CartResponse(
        id=cart.id,
        user_id=cart.user_id,
        status=cart.status,
        items=items_response,
        item_count=item_count,
        subtotal=subtotal.quantize(Decimal("0.01")),
        tax=tax,
        total=total,
        created_at=cart.created_at,
        expires_at=cart.expires_at,
    )


async def validate_product_for_cart(
    product_id: int,
    quantity: int,
    uow: UnitOfWork,
) -> Product:
    """Validate that a product can be added to cart.

    Args:
        product_id: Product ID to validate
        quantity: Desired quantity
        db: Database session

    Returns:
        Product: The validated product

    Raises:
        HTTPException 404: Product not found
        HTTPException 400: Product unavailable or invalid quantity
    """
    result = await uow.session.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found",
        )

    if not product.is_available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product '{product.name}' is not available",
        )

    if quantity < 1 or quantity > 999:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Quantity must be between 1 and 999",
        )

    return product


async def add_item_to_cart(
    cart_id: int,
    body: CartItemAdd,
    uow: UnitOfWork,
) -> Cart:
    """Add an item to cart (idempotent: updates qty if product already in cart).

    Args:
        cart_id: Cart ID
        body: Cart item details (product_id, quantity)
        db: Database session

    Returns:
        Cart: Updated cart with items
    """
    # Validate product
    product = await validate_product_for_cart(body.product_id, body.quantity, uow)

    # Check if item already in cart (idempotent)
    result = await uow.session.execute(
        select(CartItem).where(
            CartItem.cart_id == cart_id,
            CartItem.product_id == body.product_id,
        )
    )
    existing_item = result.scalar_one_or_none()

    if existing_item:
        # Update quantity instead of duplicate
        existing_item.quantity += body.quantity
        uow.session.add(existing_item)
    else:
        # Add new item with price snapshot
        item = CartItem(
            cart_id=cart_id,
            product_id=body.product_id,
            quantity=body.quantity,
            unit_price=product.price,
        )
        uow.session.add(item)

    # Return updated cart
    return await get_cart_with_items(cart_id, (await uow.session.execute(select(Cart).where(Cart.id == cart_id))).scalar_one().user_id, uow)


async def update_cart_item_quantity(
    cart_id: int,
    item_id: int,
    body: CartItemUpdate,
    uow: UnitOfWork,
) -> Cart:
    """Update cart item quantity. Removes item if quantity is 0.

    Args:
        cart_id: Cart ID
        item_id: Cart item ID
        body: Updated quantity
        db: Database session

    Returns:
        Cart: Updated cart

    Raises:
        HTTPException 404: Item not found in cart
    """
    result = await uow.session.execute(
        select(CartItem).where(CartItem.id == item_id, CartItem.cart_id == cart_id)
    )
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with id {item_id} not found in cart",
        )

    if body.quantity <= 0:
        # Remove item
        await uow.session.delete(item)
    else:
        item.quantity = body.quantity
        uow.session.add(item)

    # Return updated cart
    result = await uow.session.execute(select(Cart.user_id).where(Cart.id == cart_id))
    user_id = cast(int, result.scalar_one())
    return await get_cart_with_items(cart_id, user_id, uow)


async def remove_cart_item(
    cart_id: int,
    item_id: int,
    uow: UnitOfWork,
) -> Cart:
    """Remove an item from cart.

    Args:
        cart_id: Cart ID
        item_id: Item ID to remove
        db: Database session

    Returns:
        Cart: Updated cart

    Raises:
        HTTPException 404: Item not found
    """
    result = await uow.session.execute(
        select(CartItem).where(CartItem.id == item_id, CartItem.cart_id == cart_id)
    )
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with id {item_id} not found in cart",
        )

    await uow.session.delete(item)

    result = await uow.session.execute(select(Cart.user_id).where(Cart.id == cart_id))
    user_id = cast(int, result.scalar_one())
    return await get_cart_with_items(cart_id, user_id, uow)


async def clear_cart_items(
    cart_id: int,
    uow: UnitOfWork,
) -> Cart:
    """Remove all items from cart.

    Args:
        cart_id: Cart ID
        db: Database session

    Returns:
        Cart: Empty cart
    """
    await uow.session.execute(
        delete(CartItem).where(CartItem.cart_id == cart_id)
    )

    result = await uow.session.execute(select(Cart.user_id).where(Cart.id == cart_id))
    user_id = result.scalar_one()
    return await get_cart_with_items(cart_id, user_id, uow)


async def validate_cart_for_checkout(
    cart: Cart,
    uow: UnitOfWork,
) -> None:
    """Validate that cart is ready for checkout.

    Args:
        cart: Cart to validate
        db: Database session

    Raises:
        HTTPException 400: Validation failed
    """
    if cart.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cart is already checked out",
        )

    if not cart.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot checkout an empty cart",
        )

    # Validate each item
    for item in cart.items:
        product = item.product
        if product is None:
            # Reload product
            result = await uow.session.execute(select(Product).where(Product.id == item.product_id))
            product = result.scalar_one_or_none()

        if product is None or not product.is_available:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product '{item.product.name if item.product else item.product_id}' is no longer available",
            )

        # Check price change >10%
        price_change = abs(product.price - item.unit_price) / item.unit_price
        if price_change > Decimal("0.10"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Price for '{product.name}' has changed from ${item.unit_price} to ${product.price}. Please review your cart.",
            )


async def checkout_cart(
    cart_id: int,
    user: User,
    body: CheckoutRequest,
    uow: UnitOfWork,
) -> dict[str, Any]:
    """Initiate checkout for a cart.

    Creates order, sets up Stripe PaymentIntent, and marks cart as checked out.

    Args:
        cart_id: Cart ID
        user: Current authenticated user
        body: Checkout details
        db: Database session

    Returns:
        dict: Checkout response with client_secret

    Raises:
        HTTPException: If checkout validation fails
    """
    cart = await get_cart_with_items(cart_id, user.id, uow)

    if not cart:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart not found",
        )

    # Validate cart for checkout
    await validate_cart_for_checkout(cart, uow)

    # Get cart response with totals
    cart_response = await get_cart_response(cart)

    # Create order with items and reserve inventory
    order = await create_order_from_cart(cart, body, uow, direccion_entrega_id=body.direccion_entrega_id)

    # Mark cart as checked_out
    cart.status = "checked_out"
    uow.session.add(cart)

    return {
        "cart_id": cart_id,
        "order_id": order.id,
        "status": "checked_out",
        "total": cart_response.total,
        "message": "Checkout initiated successfully",
        "client_secret": None,  # TODO: Set MercadoPago preference ID here
    }
