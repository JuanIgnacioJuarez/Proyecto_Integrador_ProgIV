# Explicación detallada de `backend/modules/auth/dependencies.py`

## Objetivo

Define dependencias reutilizables de autenticación/autorización para FastAPI.

Este archivo responde dos preguntas:

1. ¿Quién es el usuario actual?
2. ¿Ese usuario tiene permiso para esta acción?

---

## `bearer_scheme = HTTPBearer(auto_error=False)`

Permite leer token Bearer desde `Authorization` sin fallar automáticamente.

¿Por qué `auto_error=False`?

Porque la lógica también acepta token por cookie (`access_token`), entonces la validación final la hace nuestra función.

---

## `get_current_user(...)`

### Fuentes de token

- Header Bearer.
- Cookie `access_token`.

### Estrategia

1. Si no hay ninguno, responde 401.
2. Intenta decodificar primero Bearer y luego cookie.
3. Del payload toma `sub` como `user_id`.
4. Busca usuario en DB.
5. Si no existe o está inactivo, responde 401.

Resultado: devuelve un `Usuario` autenticado.

---

## Dependencias por rol

Todas dependen de `get_current_user`.

### `require_admin`

Permite solo `ADMIN`.

### `require_admin_or_stock`

Permite `ADMIN` o `STOCK`.

### `require_admin_or_pedidos`

Permite `ADMIN` o `PEDIDOS`.

### `require_client`

Permite `CLIENT` y también `ADMIN`.

Si el rol no coincide, devuelve `403 Forbidden`.

---

## Resultado práctico

Este módulo evita duplicar checks de seguridad en cada router y deja las reglas de acceso expresivas en una sola línea de `Depends(...)`.
