"""Kitchen Display System (KDS) Pydantic schemas."""

from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict


class KitchenOrderItem(BaseModel):
    """Kitchen order item (simplified for display)."""
    
    id: int
    nombre_snapshot: str
    cantidad: int
    precio_snapshot: Decimal
    
    model_config = ConfigDict(from_attributes=True)


class KitchenOrderResponse(BaseModel):
    """Kitchen order response schema (display in KDS)."""
    
    id: int
    estado_codigo: str  # CONFIRMADO or EN_PREP
    notas: str = ""
    items: list[KitchenOrderItem]
    kitchen_entry_at: datetime  # When this order entered CONFIRMADO state
    
    model_config = ConfigDict(from_attributes=True)


class KitchenOrderListResponse(BaseModel):
    """Kitchen orders list response."""
    
    items: list[KitchenOrderResponse]
    total: int
