from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from sqlmodel import Field, SQLModel


# ── Detalle ──────────────────────────────────────────────────────────────────

class ItemCarritoRequest(SQLModel):
    producto_id: int = Field(ge=1)
    cantidad: int = Field(ge=1)
    personalizacion: List[int] = Field(default_factory=list)


class DetallePedidoRead(SQLModel):
    pedido_id: int
    producto_id: int
    cantidad: int
    nombre_snapshot: str
    precio_snapshot: Decimal
    subtotal_snap: Decimal
    personalizacion: List[int]
    created_at: datetime


# ── Historial ─────────────────────────────────────────────────────────────────

class HistorialEstadoPedidoRead(SQLModel):
    id: int
    pedido_id: int
    estado_desde: Optional[str]
    estado_hacia: str
    usuario_id: Optional[int]
    motivo: Optional[str]
    created_at: datetime


# ── Pedido ────────────────────────────────────────────────────────────────────

class PedidoCreate(SQLModel):
    forma_pago_codigo: str = Field(min_length=1, max_length=20)
    direccion_id: Optional[int] = Field(default=None, ge=1)
    notas: Optional[str] = Field(default=None)
    items: List[ItemCarritoRequest] = Field(min_length=1)


class PedidoRead(SQLModel):
    id: int
    usuario_id: int
    direccion_id: Optional[int]
    estado_codigo: str
    forma_pago_codigo: str
    subtotal: Decimal
    descuento: Decimal
    costo_envio: Decimal
    total: Decimal
    notas: Optional[str]
    created_at: datetime
    updated_at: datetime


class PedidoReadFull(PedidoRead):
    detalles: List[DetallePedidoRead] = Field(default_factory=list)
    historial: List[HistorialEstadoPedidoRead] = Field(default_factory=list)


class PedidoPaginatedResponse(SQLModel):
    total: int
    items: List[PedidoRead]


# ── Cambio de estado ──────────────────────────────────────────────────────────

class AvanzarEstadoRequest(SQLModel):
    estado_hacia: str = Field(min_length=1, max_length=20)
    motivo: Optional[str] = Field(default=None)
