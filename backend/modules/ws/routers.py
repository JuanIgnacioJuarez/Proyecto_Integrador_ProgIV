from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from backend.core.ws_manager import ws_manager
from backend.modules.auth.security import decode_access_token

router = APIRouter(prefix="/ws", tags=["websocket"])


@router.websocket("/pedidos")
async def ws_pedidos(
    websocket: WebSocket,
    token: str | None = Query(default=None),
    pedido_id: int | None = Query(default=None),
):
    token_value = token or websocket.cookies.get("access_token")
    if not token_value:
        await websocket.close(code=1008)
        return

    try:
        payload = decode_access_token(token_value)
    except Exception:
        await websocket.close(code=1008)
        return

    rol = payload.get("rol")
    user_id = payload.get("sub")
    canal = "admin" if rol in {"ADMIN", "PEDIDOS"} else f"pedido:{pedido_id}" if pedido_id else f"user:{user_id}"

    await ws_manager.connect(websocket, canal)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, canal)
