# Explicación detallada de `backend/main.py`

## Idea general

Este archivo es el punto de entrada de FastAPI. Acá se definen tres cosas importantes:

1. Cómo arranca la app (`lifespan`).
2. Qué routers se publican bajo `/api/v1`.
3. Cómo se habilita CORS para el frontend local.

---

## Importaciones clave

- `FastAPI` y `CORSMiddleware`: crean y configuran la API.
- `SQLModel`, `Session` y `engine`: se usan para crear tablas y abrir sesión.
- Routers de cada módulo (`auth`, `productos`, `pedidos`, etc.): exponen endpoints.
- `run_all_seeds`: permite precargar datos automáticos al iniciar.

---

## Funciones auxiliares de entorno

### `_env_flag(name, default="false")`

Convierte una variable de entorno textual a booleano. Interpreta como `True` valores como `1`, `true`, `yes`, `on`.

Se usa para decidir si correr seeds al arrancar.

### `_env_list(name, default="")`

Lee una variable separada por comas y la devuelve como lista limpia.

Se usa para `CORS_ORIGINS`.

---

## `lifespan(app: FastAPI)`

Este bloque corre al inicio de la app:

1. `SQLModel.metadata.create_all(engine)` crea tablas si no existen.
2. Si `RUN_SEED_ON_STARTUP=true`, ejecuta `run_all_seeds(session)`.
3. Luego hace `yield` para dejar la app en ejecución.

Con esto, la app puede autoinicializar estructura y datos demo sin scripts manuales.

---

## Creación de la app

`app = FastAPI(...)` define:

- `title`: nombre visible en OpenAPI/Swagger.
- `version`: versión de API.
- `lifespan`: función que controla startup/shutdown.

---

## Registro de routers

Se define `API_V1_PREFIX = "/api/v1"` y se incluye cada router con ese prefijo.

Ejemplos de rutas finales:

- `/api/v1/auth/...`
- `/api/v1/productos/...`
- `/api/v1/pedidos/...`
- `/api/v1/admin/...`

Este patrón mantiene orden y facilita versionado futuro (`/api/v2`).

---

## CORS

`app.add_middleware(CORSMiddleware, ...)` habilita consumo desde frontend local.

- `allow_origins`: lista configurable por `.env`.
- `allow_origin_regex`: cubre `localhost` y `127.0.0.1` con puertos variables.
- `allow_methods/allow_headers`: `*` para desarrollo.
- `allow_credentials=True`: habilita cookies/tokens en requests cross-origin.

---

## Resumen práctico

`main.py` concentra el wiring principal del backend: inicialización de DB, carga opcional de datos base, publicación de módulos y compatibilidad con frontend.
