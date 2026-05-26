# Explicación detallada de `backend/modules/direcciones/routers.py`

## Objetivo

Publica CRUD de direcciones para usuario autenticado bajo `/direcciones`.

---

## Patrón de inyección

- `get_service(...)` crea `DireccionEntregaService`.
- `current_user = Depends(get_current_user)` asegura identidad.

Todos los endpoints operan con `current_user.id`.

---

## Endpoints

### `POST /direcciones/`

Crea una dirección.

### `GET /direcciones/`

Lista direcciones del usuario logueado.

### `GET /direcciones/{direccion_id}`

Devuelve una dirección puntual del usuario.

### `PATCH /direcciones/{direccion_id}`

Actualiza parcialmente una dirección.

### `PATCH /direcciones/{direccion_id}/principal`

Marca la dirección como principal.

### `DELETE /direcciones/{direccion_id}`

Soft delete de la dirección (respuesta `204`).

---

## Seguridad funcional

Aunque el endpoint recibe `direccion_id`, la autorización real la valida servicio/repo contrastando propietario (`usuario_id`).
