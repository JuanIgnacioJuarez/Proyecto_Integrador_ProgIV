# Explicación detallada de `backend/modules/direcciones/services.py`

## Responsabilidad

Aplica reglas de negocio para direcciones del usuario autenticado.

---

## Helper interno `_get_or_404`

Valida dos cosas:

1. La dirección existe.
2. Pertenece al usuario que hace la operación.

Si falla alguna, responde con `404` o `403` según corresponda.

---

## Métodos principales

### `create(usuario_id, data)`

Crea dirección asociando automáticamente el `usuario_id` actual.

### `get_all(usuario_id)`

Lista direcciones propias.

### `get_by_id(usuario_id, direccion_id)`

Devuelve una dirección concreta si pertenece al usuario.

### `update(usuario_id, direccion_id, data)`

Actualiza solo campos enviados y refresca `updated_at`.

### `set_principal(usuario_id, direccion_id)`

- Desmarca todas las principales del usuario.
- Marca la elegida como principal.
- Actualiza timestamp.

### `soft_delete(usuario_id, direccion_id)`

Marca `deleted_at` y actualiza `updated_at`.

---

## Diseño

Este servicio protege ownership de datos: un usuario no puede manipular direcciones de otro.
