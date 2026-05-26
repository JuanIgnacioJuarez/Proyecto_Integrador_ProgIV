# Explicación detallada de `backend/modules/pedidos/services.py`

## Responsabilidad

Orquesta toda la lógica de pedidos:

- alta desde carrito
- lectura paginada
- permisos por rol
- transición de estados con historial

---

## Reglas globales

### Máquina de estados (`_TRANSICIONES`)

Define transiciones válidas, por ejemplo:

- `PENDIENTE -> CONFIRMADO/CANCELADO`
- `CONFIRMADO -> EN_PREP/CANCELADO`
- `EN_PREP -> EN_CAMINO`
- `EN_CAMINO -> ENTREGADO`

### Reglas de cliente

`_CANCELABLES_CLIENTE = ["PENDIENTE", "CONFIRMADO"]`.

Cliente solo puede cancelar y solo en esos estados.

---

## Métodos clave

### `_get_or_404`

Busca pedido por id y lanza 404 si no existe.

### `_serialize_full`

Arma `PedidoReadFull` juntando cabecera, detalles e historial.

### `crear_pedido(usuario_id, data)`

Pasos:

1. Valida forma de pago habilitada.
2. Valida dirección (si se envía) y ownership.
3. Valida productos, disponibilidad y stock.
4. Calcula subtotales y total.
5. Crea pedido.
6. Inserta detalles snapshot.
7. Inserta primer evento de historial (`PENDIENTE`).

### `get_all(usuario_id, rol, offset, limit)`

Aplica permisos:

- `ADMIN/PEDIDOS`: global.
- `CLIENT`: filtrado por usuario.
- Otros: `403`.

### `get_by_id(pedido_id, usuario_id, rol)`

Aplica autorización por rol y ownership.

### `avanzar_estado(...)`

1. Valida permisos por rol.
2. Valida transición contra FSM.
3. Requiere `motivo` al cancelar.
4. Actualiza estado y timestamp.
5. Inserta evento en historial append-only.

---

## Diseño

El servicio concentra reglas funcionales críticas del negocio de pedidos y asegura trazabilidad completa.
