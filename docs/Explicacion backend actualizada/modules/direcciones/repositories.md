# Explicación detallada de `backend/modules/direcciones/repositories.py`

## Rol del repositorio

Encapsula consultas y operaciones sobre `DireccionEntrega`.

Hereda `BaseRepository` para operaciones comunes y agrega consultas específicas.

---

## Métodos

### `get_by_id(record_id)`

Busca por id excluyendo direcciones soft-deleted (`deleted_at IS NULL`).

### `get_all_by_usuario(usuario_id)`

Trae todas las direcciones activas de un usuario.

### `get_principal(usuario_id)`

Obtiene la dirección marcada como principal.

### `unset_all_principal(usuario_id)`

Quita `es_principal=True` de todas las direcciones activas del usuario.

Es útil para garantizar que, al elegir una nueva principal, quede una única marcada.

---

## Nota

En varias consultas se usa comparación booleana explícita para filtrar registros verdaderos.
