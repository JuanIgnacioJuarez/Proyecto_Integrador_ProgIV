# Explicación detallada de `backend/modules/pedidos/repositories.py`

## Rol

Encapsula acceso a datos de pedidos y entidades relacionadas.

---

## `FormaPagoRepository`

- `get_by_codigo(codigo)`
- `get_all_habilitados()`

Permite validar catálogo de pagos antes de crear pedidos.

---

## `PedidoRepository`

- `get_by_id(record_id)` con filtro de soft delete.
- `get_paginated(offset, limit, usuario_id=None)`:
  - si `usuario_id` es `None`, trae todos.
  - si tiene valor, filtra por cliente.

Incluye cómputo de `total` con `count()` sobre subquery.

---

## `DetallePedidoRepository`

No hereda `BaseRepository` porque maneja PK compuesta.

Métodos:

- `get_by_pedido(pedido_id)`
- `add(detalle)`

---

## `HistorialEstadoPedidoRepository`

Repositorio append-only (solo inserción y lectura):

- `get_by_pedido(pedido_id)` ordenado ascendente por fecha.
- `add(entrada)`

---

## Valor

Esta separación respeta particularidades de cada tabla sin forzar una abstracción única.
