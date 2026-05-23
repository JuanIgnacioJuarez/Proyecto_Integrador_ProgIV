from datetime import datetime
from decimal import Decimal

from fastapi import HTTPException, status
from sqlmodel import Session

from backend.core.unit_of_work import UnitOfWork
from backend.modules.pedidos.models import DetallePedido, HistorialEstadoPedido, Pedido
from backend.modules.pedidos.schemas import (
    AvanzarEstadoRequest,
    DetallePedidoRead,
    HistorialEstadoPedidoRead,
    PedidoCreate,
    PedidoPaginatedResponse,
    PedidoRead,
    PedidoReadFull,
)

# Máquina de estados: estado_actual → transiciones permitidas
_TRANSICIONES: dict[str, list[str]] = {
    "PENDIENTE":  ["CONFIRMADO", "CANCELADO"],
    "CONFIRMADO": ["EN_PREP",    "CANCELADO"],
    "EN_PREP":    ["EN_CAMINO"],
    "EN_CAMINO":  ["ENTREGADO"],
    "ENTREGADO":  [],
    "CANCELADO":  [],
}

# Estados desde los cuales el cliente puede cancelar
_CANCELABLES_CLIENTE = ["PENDIENTE", "CONFIRMADO"]


class PedidoService:
    def __init__(self, session: Session) -> None:
        self._session = session

    def _get_or_404(self, uow: UnitOfWork, pedido_id: int) -> Pedido:
        pedido = uow.pedidos.get_by_id(pedido_id)
        if not pedido:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Pedido con id={pedido_id} no encontrado",
            )
        return pedido

    def _serialize_full(self, uow: UnitOfWork, pedido: Pedido) -> PedidoReadFull:
        detalles = uow.detalles_pedido.get_by_pedido(pedido.id)
        historial = uow.historial_pedido.get_by_pedido(pedido.id)
        return PedidoReadFull(
            **PedidoRead.model_validate(pedido).model_dump(),
            detalles=[DetallePedidoRead.model_validate(d) for d in detalles],
            historial=[HistorialEstadoPedidoRead.model_validate(h) for h in historial],
        )

    def crear_pedido(self, usuario_id: int, data: PedidoCreate) -> PedidoReadFull:
        with UnitOfWork(self._session) as uow:

            # Validar forma de pago
            forma_pago = uow.formas_pago.get_by_codigo(data.forma_pago_codigo)
            if not forma_pago or not forma_pago.habilitado:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Forma de pago '{data.forma_pago_codigo}' no válida o deshabilitada",
                )

            # Validar dirección (si se proporcionó)
            if data.direccion_id is not None:
                d = uow.direcciones.get_by_id(data.direccion_id)
                if not d or d.usuario_id != usuario_id:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Dirección no encontrada",
                    )

            # Validar productos y armar snapshot
            subtotal = Decimal("0")
            items_procesados = []
            for item in data.items:
                producto = uow.productos.get_by_id(item.producto_id)
                if not producto:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Producto con id={item.producto_id} no encontrado",
                    )
                if not producto.disponible:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"El producto '{producto.nombre}' no está disponible",
                    )
                if producto.stock_cantidad < item.cantidad:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Stock insuficiente para '{producto.nombre}' (disponible: {producto.stock_cantidad})",
                    )
                sub = producto.precio_base * item.cantidad
                subtotal += sub
                items_procesados.append((item, producto, producto.precio_base, sub))

            descuento = Decimal("0")
            costo_envio = Decimal("50") if data.direccion_id else Decimal("0")
            total = subtotal - descuento + costo_envio

            # Crear el pedido
            pedido = Pedido(
                usuario_id=usuario_id,
                direccion_id=data.direccion_id,
                forma_pago_codigo=data.forma_pago_codigo,
                estado_codigo="PENDIENTE",
                subtotal=subtotal,
                descuento=descuento,
                costo_envio=costo_envio,
                total=total,
                notas=data.notas,
            )
            uow.pedidos.add(pedido)

            # Crear detalles con snapshot inmutable
            for item, producto, precio, sub in items_procesados:
                uow.detalles_pedido.add(
                    DetallePedido(
                        pedido_id=pedido.id,
                        producto_id=item.producto_id,
                        cantidad=item.cantidad,
                        nombre_snapshot=producto.nombre,
                        precio_snapshot=precio,
                        subtotal_snap=sub,
                        personalizacion=item.personalizacion,
                    )
                )

            # Primera entrada del historial (estado_desde=None → creación)
            uow.historial_pedido.add(
                HistorialEstadoPedido(
                    pedido_id=pedido.id,
                    estado_desde=None,
                    estado_hacia="PENDIENTE",
                    usuario_id=usuario_id,
                )
            )

            result = self._serialize_full(uow, pedido)
        return result

    def get_all(
        self,
        usuario_id: int,
        rol: str,
        offset: int = 0,
        limit: int = 10,
    ) -> PedidoPaginatedResponse:
        with UnitOfWork(self._session) as uow:
            # ADMIN y PEDIDOS ven todos; CLIENT solo los suyos
            filtro = None if rol in ("ADMIN", "PEDIDOS") else usuario_id
            total, pedidos = uow.pedidos.get_paginated(
                offset=offset,
                limit=limit,
                usuario_id=filtro,
            )
            items = [PedidoRead.model_validate(p) for p in pedidos]
        return PedidoPaginatedResponse(total=total, items=items)

    def get_by_id(self, pedido_id: int, usuario_id: int, rol: str) -> PedidoReadFull:
        with UnitOfWork(self._session) as uow:
            pedido = self._get_or_404(uow, pedido_id)
            if rol == "CLIENT" and pedido.usuario_id != usuario_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No tenés acceso a este pedido",
                )
            result = self._serialize_full(uow, pedido)
        return result

    def avanzar_estado(
        self,
        pedido_id: int,
        data: AvanzarEstadoRequest,
        usuario_id: int,
        rol: str,
    ) -> PedidoReadFull:
        with UnitOfWork(self._session) as uow:
            pedido = self._get_or_404(uow, pedido_id)
            estado_actual = pedido.estado_codigo
            estado_nuevo = data.estado_hacia

            # Validar que la transición sea válida según la FSM
            if estado_nuevo not in _TRANSICIONES.get(estado_actual, []):
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Transición inválida: {estado_actual} → {estado_nuevo}",
                )

            # Reglas extra para CANCELADO
            if estado_nuevo == "CANCELADO":
                if rol == "CLIENT":
                    if estado_actual not in _CANCELABLES_CLIENTE:
                        raise HTTPException(
                            status_code=status.HTTP_403_FORBIDDEN,
                            detail=f"No podés cancelar un pedido en estado {estado_actual}",
                        )
                    if pedido.usuario_id != usuario_id:
                        raise HTTPException(
                            status_code=status.HTTP_403_FORBIDDEN,
                            detail="No tenés acceso a este pedido",
                        )
                if not data.motivo:
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                        detail="El motivo es obligatorio al cancelar un pedido",
                    )

            # Actualizar estado del pedido
            pedido.estado_codigo = estado_nuevo
            pedido.updated_at = datetime.utcnow()

            # Registrar transición en el historial (append-only)
            uow.historial_pedido.add(
                HistorialEstadoPedido(
                    pedido_id=pedido.id,
                    estado_desde=estado_actual,
                    estado_hacia=estado_nuevo,
                    usuario_id=usuario_id,
                    motivo=data.motivo,
                )
            )

            result = self._serialize_full(uow, pedido)
        return result
