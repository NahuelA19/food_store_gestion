"""Wishlist API routes."""

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.uow import UnitOfWork
from app.dependencies import get_current_user, get_uow
from app.models.user import User
from app.schemas.wishlist import WishlistItemResponse, WishlistToggleResponse
from app.services import wishlist_service

router = APIRouter(prefix="/wishlist", tags=["wishlist"])


@router.post("/toggle/{product_id}", response_model=WishlistToggleResponse)
async def toggle_wishlist(
    product_id: int,
    uow: UnitOfWork = Depends(get_uow),
    current_user: User = Depends(get_current_user),
) -> WishlistToggleResponse:
    """Toggle a product in the user's wishlist."""
    is_wishlisted = await wishlist_service.toggle_wishlist(
        uow=uow,
        user_id=current_user.id,
        product_id=product_id,
    )
    return WishlistToggleResponse(is_wishlisted=is_wishlisted)


@router.get("/", response_model=list[WishlistItemResponse])
async def list_wishlist(
    uow: UnitOfWork = Depends(get_uow),
    current_user: User = Depends(get_current_user),
) -> list[WishlistItemResponse]:
    """List all wishlisted products for the current user."""
    items = await wishlist_service.get_wishlist(uow=uow, user_id=current_user.id)
    return [WishlistItemResponse.model_validate(item) for item in items]


@router.get("/check")
async def check_wishlist(
    product_ids: str = Query(..., description="Comma-separated product IDs"),
    uow: UnitOfWork = Depends(get_uow),
    current_user: User = Depends(get_current_user),
) -> dict[str, bool]:
    """Check wishlist status for one or more products.

    Returns a map of product_id → boolean.
    """
    try:
        ids = [int(pid.strip()) for pid in product_ids.split(",") if pid.strip()]
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid product_ids format. Use comma-separated integers.",
        )

    if not ids:
        return {}

    return await wishlist_service.check_wishlist(
        uow=uow,
        user_id=current_user.id,
        product_ids=ids,
    )
