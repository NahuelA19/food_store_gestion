"""Payment API routes for the Food Store."""

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.services.payment_service import (
    handle_payment_failed,
    handle_payment_succeeded,
    handle_webhook_event,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/webhook", status_code=status.HTTP_200_OK)
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Handle Stripe webhook events.

    This endpoint is unauthenticated — Stripe signature verification IS the auth.
    """
    # Read raw body
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    if not sig_header:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing Stripe signature",
        )

    # Verify and parse event
    event = await handle_webhook_event(payload, sig_header)
    event_type = event["type"]
    event_data = event["data"]

    if event_type == "payment_intent.succeeded":
        payment_intent = event_data.get("object", {})
        intent_id = payment_intent.get("id")
        if intent_id:
            await handle_payment_succeeded(intent_id, db)
            logger.info("Processed payment_intent.succeeded: %s", intent_id)

    elif event_type == "payment_intent.payment_failed":
        payment_intent = event_data.get("object", {})
        intent_id = payment_intent.get("id")
        if intent_id:
            await handle_payment_failed(intent_id, db)
            logger.info("Processed payment_intent.payment_failed: %s", intent_id)

    else:
        logger.debug("Unhandled webhook event type: %s", event_type)

    return {"received": True, "type": event_type}
