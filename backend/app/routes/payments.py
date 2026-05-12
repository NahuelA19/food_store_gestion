"""Payment API routes for the Food Store.

TODO: Implement MercadoPago webhook and payment endpoints.
"""

import logging

from fastapi import APIRouter, status

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/webhook", status_code=status.HTTP_200_OK)
async def mercadopago_webhook() -> dict[str, bool]:
    """Handle MercadoPago IPN webhook events.

    TODO: Implement MercadoPago webhook verification and processing.
    See docs/Integrador.txt for the required flow.
    """
    logger.warning("MercadoPago webhook not yet implemented")
    return {"received": True}
