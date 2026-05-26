# Explicación detallada de `backend/modules/admin/services.py`

## Responsabilidad

Contiene la lógica de negocio de administración de usuarios.

Se apoya en `UnitOfWork` para garantizar commit/rollback centralizado.

---

## Método interno `_get_or_404`

Busca usuario por id y, si no existe, lanza `404`.

Evita repetir la misma validación en todos los métodos.

---

## Casos de uso

### `list_usuarios(rol, offset, limit)`

- Usa paginado del repositorio.
- Convierte entidades a `UsuarioAdminRead`.
- Devuelve `UsuarioAdminPaginatedResponse`.

### `get_by_id(usuario_id)`

Devuelve un usuario en formato de lectura admin.

### `update(usuario_id, data)`

- Toma solo campos enviados (`exclude_unset=True`).
- Los aplica con `setattr`.
- Actualiza `updated_at`.

### `assign_rol(usuario_id, data, current_admin)`

- Cambia el rol del usuario.
- Regla de seguridad: un ADMIN no puede quitarse su propio rol ADMIN.

### `soft_delete(usuario_id, current_admin)`

- Soft delete (`deleted_at`, `updated_at`, `is_active=False`).
- Regla de seguridad: un ADMIN no puede eliminarse a sí mismo.

---

## Valor de diseño

La capa de servicio concentra reglas funcionales y de negocio, dejando al router limpio y declarativo.
