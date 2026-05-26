# Explicación detallada de `backend/modules/admin/schemas.py`

## Objetivo

Define los contratos de entrada/salida del módulo admin.

---

## Schemas de salida

### `UsuarioAdminRead`

Representa un usuario en respuestas administrativas:

- `id`, `nombre`, `email`
- `rol`, `is_active`
- `created_at`, `updated_at`

### `UsuarioAdminPaginatedResponse`

Formato paginado estándar:

- `total`: cantidad total
- `items`: lista de `UsuarioAdminRead`

---

## Schemas de entrada

### `UsuarioAdminUpdate`

Permite cambios parciales del usuario:

- `nombre` opcional (2..120)
- `is_active` opcional

No incluye rol ni password para evitar side effects.

### `RolAssignRequest`

Recibe `rol` para reasignación.

Incluye `field_validator("rol")` que:

1. Normaliza (`strip().upper()`).
2. Valida contra `Rol.values()`.
3. Si falla, informa los valores permitidos.

---

## Resultado práctico

Estos schemas hacen que la API admin sea predecible y validen datos antes de tocar la capa de servicio.
