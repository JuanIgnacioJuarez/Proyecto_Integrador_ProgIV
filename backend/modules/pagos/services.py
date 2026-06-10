import os

import mercadopago
from sqlmodel import Session, select
from fastapi import HTTPException, status

from backend.modules.pedidos.models import Pedido
from backend.modules.pedidos.services import PedidoService
from backend.modules.pedidos.schemas import AvanzarEstadoRequest

class PagoService:

    def __init__(self, session: Session) -> None:
        self._session = session
        self._sdk = mercadopago.SDK(os.getenv("MP_ACCESS_TOKEN", ""))

    def _get_pedido_or_404(self, pedido_id: int) -> Pedido:
        pedido = self._session.exec(
            select(Pedido).where(
                Pedido.id == pedido_id,
                Pedido.deleted_at.is_(None),
            )
        ).first()
        if not pedido:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Pedido con id={pedido_id} no encontrado",
            )
        return pedido

    def crear_preferencia_mp(self, pedido_id: int, usuario_id: int) -> dict:
        pedido = self._get_pedido_or_404(pedido_id)

        if pedido.usuario_id != usuario_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tenés acceso a este pedido",
            )
        if pedido.estado_codigo != "PENDIENTE":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El pedido no está en estado PENDIENTE (estado actual: {pedido.estado_codigo})",
            )
        if pedido.forma_pago_codigo != "MERCADOPAGO":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este pedido no tiene MercadoPago como forma de pago",
            )
        
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        backend_url = os.getenv("BACKEND_URL", "http://localhost:8000")

        preference_data = {
            "items": [
                {
                    "id": str(pedido.id),
                    "title": f"Pedido #{pedido.id} - FoodStore",
                    "quantity": 1,
                    "unit_price": float(pedido.total),
                    "currency_id": "ARS",
                }
            ],
            "back_urls": {
                "success": f"{backend_url}/api/v1/pagos/redirect/{pedido.id}/success",
                "failure": f"{backend_url}/api/v1/pagos/redirect/{pedido.id}/failure",
                "pending": f"{backend_url}/api/v1/pagos/redirect/{pedido.id}/pending",
            },
            "auto_return": "approved",
            "external_reference": str(pedido.id),
            # "notification_url": f"{backend_url}/api/v1/pagos/webhook",
        }

        response = self._sdk.preference().create(preference_data)
        print("MP response status:", response["status"])
        print("MP response body:", response.get("response"))

        if response["status"] != 201:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"MP respondió {response['status']}: {response.get('response')}",
            )
        
        return {
            "pedido_id": pedido.id,
            "init_point": response["response"]["init_point"],
        }
    
    def confirmar_pago_mp(self, payment_id: str) -> None:
        response = self._sdk.payment().get(payment_id)

        if response["status"] != 200:
            # MP reintenta el webhook si no obtuvo 200
            return
        
        payment = response["response"]
        mp_status = payment.get("status")
        external_reference = payment.get("external_reference")

        if mp_status != "approved" or not external_reference:
            return
        
        try:
            pedido_id = int(external_reference)
        except ValueError:
            return
        
        pedido = self._session.exec(
            select(Pedido).where(Pedido.id == pedido_id)
        ).first()

        if not pedido or pedido.estado_codigo != "PENDIENTE":
            return
        
        PedidoService(self._session).avanzar_estado(
            pedido_id=pedido_id,
            data=AvanzarEstadoRequest(estado_hacia="CONFIRMADO"),
            usuario_id=pedido.usuario_id,
            rol="ADMIN",
        )

    _STATUS_MAP = {
        "approved": "aprobado",
        "rejected": "rechazado",
        "cancelled": "rechazado",
        "refunded": "rechazado",
        "charged_back": "rechazado",
        "pending": "pendiente",
        "in_process": "pendiente",
        "authorized": "pendiente",
    }

    def confirmar_pago(self, pedido_id: int, payment_id: int) -> dict:
        response = self._sdk.payment().get(payment_id)

        if response["status"] != 200:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="No se pudo consultar el pago en MercadoPago",
            )

        payment = response["response"]
        mp_status = payment.get("status")
        estado_local = self._STATUS_MAP.get(mp_status, "pendiente")

        if estado_local == "aprobado":
            pedido = self._session.exec(
                select(Pedido).where(Pedido.id == pedido_id)
            ).first()
            if pedido and pedido.estado_codigo == "PENDIENTE":
                PedidoService(self._session).avanzar_estado(
                    pedido_id=pedido_id,
                    data=AvanzarEstadoRequest(estado_hacia="CONFIRMADO"),
                    usuario_id=pedido.usuario_id,
                    rol="ADMIN",
                )

        return {"estado": estado_local, "pedido_id": pedido_id}