# Explicación detallada de `backend/modules/pedidos/models.py`

## Objetivo general

Modela el dominio de pedidos con cuatro tablas:

1. `FormaPago`
2. `EstadoPedido`
3. `Pedido`
4. `DetallePedido`
5. `HistorialEstadoPedido`

---

## `FormaPago`

Catálogo de medios de pago:

- `codigo` (PK textual)
- `descripcion`
- `habilitado`

---

## `EstadoPedido`

Catálogo de estados:

- `codigo`
- `descripcion`
- `orden`
- `es_terminal`

Permite representar la máquina de estados a nivel datos.

---

## `Pedido`

Cabecera del pedido:

- FK usuario, dirección, estado y forma de pago.
- Importes: `subtotal`, `descuento`, `costo_envio`, `total`.
- `notas` opcional.
- Soft delete con `deleted_at`.

Incluye `CheckConstraint` para impedir importes negativos.

Relaciones:

- `direccion`
- `detalles`
- `historial`

---

## `DetallePedido`

Ítems del pedido con PK compuesta (`pedido_id`, `producto_id`).

Guarda snapshot inmutable:

- `nombre_snapshot`
- `precio_snapshot`
- `subtotal_snap`

`personalizacion` usa columna JSON para guardar IDs de ingredientes removidos.

---

## `HistorialEstadoPedido`

Registro append-only de cambios de estado:

- `estado_desde`
- `estado_hacia`
- `usuario_id` actor
- `motivo` (clave para cancelaciones)
- `created_at`

---

## Resumen

El diseño separa catálogos, cabecera, detalle e historial para trazabilidad completa del ciclo de vida de un pedido.
