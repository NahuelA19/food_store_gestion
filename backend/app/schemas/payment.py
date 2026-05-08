"""Payment Pydantic schemas for validation and serialization."""

from pydantic import BaseModel, Field


class PaymentIntentResponse(BaseModel):
    """Response schema for PaymentIntent creation."""

    client_secret: str
    payment_intent_id: str
    amount: int
    currency: str = "usd"


class WebhookEvent(BaseModel):
    """Schema for Stripe webhook event payload."""

    id: str
    type: str
    data: dict

    model_config = {"extra": "ignore"}
