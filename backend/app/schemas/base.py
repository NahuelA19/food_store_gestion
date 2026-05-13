"""Base response model with proper Decimal serialization."""

from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class BaseResponseModel(BaseModel):
    """Base model for all response schemas.

    Ensures Decimal fields are serialized as floats (not strings) in JSON responses.
    """

    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={Decimal: float},  # pragma: allowlist secret
    )
