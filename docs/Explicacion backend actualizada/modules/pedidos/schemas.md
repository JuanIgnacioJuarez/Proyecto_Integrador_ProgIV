# Explicación detallada de `backend/modules/pedidos/schemas.py`

## Objetivo

Estandariza payloads de creación, lectura, paginado y cambio de estado.

---

## Item y detalle

### `ItemCarritoRequest`

Entrada de cada ítem al crear pedido:

- `producto_id`
- `cantidad`
- `personalizacion` (ingredientes removidos)

### `DetallePedidoRead`

Salida de cada línea de pedido con snapshot y fecha.

---

## Historial

### `HistorialEstadoPedidoRead`

Representa cada transición de estado registrada.

---

## Pedido

### `PedidoCreate`

Entrada principal:

- forma de pago
- dirección opcional
- notas opcionales
- lista de ítems (mínimo 1)

### `PedidoRead`

Vista de cabecera (importes, estado, fechas).

### `PedidoReadFull`

Extiende `PedidoRead` agregando:

- `detalles`
- `historial`

### `PedidoPaginatedResponse`

Contrato estándar `total + items`.

---

## Cambio de estado

### `AvanzarEstadoRequest`

Recibe estado destino y motivo opcional.

(El servicio exige motivo cuando el estado destino es `CANCELADO`).
