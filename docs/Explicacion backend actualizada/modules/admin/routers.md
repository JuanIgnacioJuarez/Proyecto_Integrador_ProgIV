# Explicación detallada de `backend/modules/admin/routers.py`

## Rol del archivo

Expone endpoints administrativos de gestión de usuarios bajo `/admin`.

Todos los endpoints requieren rol `ADMIN`.

---

## Router y dependencia de servicio

- `router = APIRouter(prefix="/admin", tags=["admin"])`
- `get_service(...)` crea `AdminUsuarioService` inyectando sesión.

Con esto cada endpoint recibe la lógica de negocio lista, sin tocar repositorios directo.

---

## Endpoints

### `GET /admin/usuarios`

Devuelve listado paginado (`total + items`) con filtro opcional por rol.

Detalles importantes:

- `offset >= 0`
- `1 <= limit <= 100`
- Si el rol enviado no es válido (`ADMIN`, `STOCK`, `PEDIDOS`, `CLIENT`), se ignora el filtro.

### `GET /admin/usuarios/{usuario_id}`

Devuelve detalle de un usuario.

### `PATCH /admin/usuarios/{usuario_id}`

Permite actualizar campos básicos (`nombre`, `is_active`).

### `PATCH /admin/usuarios/{usuario_id}/rol`

Permite asignar un rol al usuario.

### `DELETE /admin/usuarios/{usuario_id}`

No borra físicamente: hace soft delete (`deleted_at`) y responde `204`.

---

## Seguridad

Cada endpoint incluye `Depends(require_admin)`, por eso el control de acceso es uniforme y explícito.
