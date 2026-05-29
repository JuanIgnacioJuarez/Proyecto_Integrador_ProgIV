# Explicación detallada de `backend/main.py`

## Idea general

Este archivo es el punto de entrada del backend FastAPI. Tiene cuatro responsabilidades clave:

1. Crear tablas con SQLModel.
2. Ejecutar ajustes de compatibilidad de esquema en bases ya existentes.
3. Cargar seeds de forma opcional según variables de entorno.
4. Registrar routers y configurar CORS.

---

## Importaciones importantes

- `FastAPI` y `CORSMiddleware`: configuración web.
- `SQLModel`, `Session`, `engine`: inicialización de base de datos.
- `text` de SQLAlchemy: ejecutar SQL explícito para migraciones ligeras.
- Routers de módulos (`auth`, `productos`, `pedidos`, etc.).
- `run_all_seeds` desde `backend.seeds.seed_data`.

---

## Helpers de entorno

### `_env_flag(name, default="false")`

Interpreta variables de entorno como booleano (`1`, `true`, `yes`, `on`).

### `_env_list(name, default="")`

Convierte una variable separada por comas en lista limpia.

---

## Compatibilidad de esquema: `_ensure_schema_compatibility()`

Este bloque aplica SQL defensivo para entornos donde la base exista con una versión anterior.

Acciones principales:

- Agrega columnas faltantes en `ingrediente` (`unidad_medida`, `stock_cantidad`, `categoria_id`).
- Crea la tabla `producto_ingrediente_cantidad` si no existe.
- Inicializa datos por defecto en ingredientes para que queden consistentes.
- Sincroniza cantidades de la tabla puente según la composición conocida de productos.

Objetivo: evitar roturas cuando evoluciona el modelo sin tener un sistema de migraciones formal.

---

## `lifespan(app)`

Durante el arranque:

1. Ejecuta `SQLModel.metadata.create_all(engine)`.
2. Ejecuta `_ensure_schema_compatibility()`.
3. Si `RUN_SEED_ON_STARTUP=true`, corre `run_all_seeds(session)`.
4. Hace `yield` y deja la app operativa.

---

## Registro de routers

Todos se publican bajo `API_V1_PREFIX = "/api/v1"`.

Ejemplos:

- `/api/v1/auth/...`
- `/api/v1/productos/...`
- `/api/v1/pedidos/...`
- `/api/v1/admin/...`

---

## CORS

Permite consumo desde frontend local configurable por entorno:

- `allow_origins` desde `CORS_ORIGINS`.
- `allow_origin_regex` para localhost/127.0.0.1 con puertos variables.
- `allow_credentials=True` para cookies/tokens.

---

## Resumen práctico

`main.py` no solo levanta FastAPI: también protege la compatibilidad de datos y coordina inicialización segura para desarrollo y pruebas.
