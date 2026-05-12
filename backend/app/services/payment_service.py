"""Payment service for handling MercadoPago IPN and payment flows."""

import logging

from app.core.uow import UnitOfWork

from app.models.order import Order
from app.services.order_service import transition

logger = logging.getLogger(__name__)


async def handle_ipn(
    order: Order,
    mp_status: str,
    uow: UnitOfWork,
) -> None:
    """Handle MercadoPago IPN notification for a given order.

    Triggers FSM transitions based on the payment status received
    from the MercadoPago webhook.

    Args:
        order: Order being paid
        mp_status: MercadoPago payment status (approved, rejected, etc.)
        db: Database session
    """
    if mp_status == "approved":
        await transition(
            order,
            "CONFIRMADO",
            usuario_id=None,
            session=uow.session,
            motivo="Pago confirmado vía MercadoPago IPN",
        )
        logger.info("Order %d: payment approved via MP IPN", order.id)
    elif mp_status == "rejected":
        await transition(
            order,
            "CANCELADO",
            usuario_id=None,
            session=uow.session,
            motivo="Pago rechazado vía MercadoPago IPN",
        )
        logger.info("Order %d: payment rejected via MP IPN", order.id)
    else:
        logger.warning(
            "Order %d: unhandled MP IPN status '%s'", order.id, mp_status
        )
