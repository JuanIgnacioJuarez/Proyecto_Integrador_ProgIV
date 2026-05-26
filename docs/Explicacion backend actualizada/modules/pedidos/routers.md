# Explicación detallada de `backend/modules/pedidos/routers.py`

## Objetivo

Define endpoints de pedidos bajo `/pedidos`, usando autenticación obligatoria.

---

## Dependencias

- `get_service(...)` crea `PedidoService`.
- `current_user = Depends(get_current_user)` aporta `id` y `rol`.

---

## Endpoints

### `POST /pedidos/`

Crea pedido desde carrito (`PedidoCreate`).

### `GET /pedidos/`

Listado paginado:

- `offset >= 0`
- `1 <= limit <= 100`

Regla funcional (implementada en servicio):

- `ADMIN/PEDIDOS`: ven todo.
- `CLIENT`: solo propios.

### `GET /pedidos/{pedido_id}`

Detalle completo (`PedidoReadFull`) con líneas e historial.

### `PATCH /pedidos/{pedido_id}/estado`

Intenta transición de estado usando reglas de negocio y permisos por rol.

---

## Diseño

El router se mantiene delgado: valida forma HTTP y delega reglas complejas al servicio.
