# Explicación detallada de `backend/seeds/seed_data.py`

## Rol del archivo

Concentra toda la lógica de carga de datos iniciales y demo.

Además de insertar, también normaliza y corrige inconsistencias para evitar duplicados lógicos.

---

## Funciones principales

### `normalize_text(value)`

Normaliza textos (minúsculas, sin tildes, espacios limpios) para comparar nombres de forma robusta.

### `seed_default_users(session)`

Crea usuarios por defecto (`ADMIN`, `STOCK`, `PEDIDOS`, `CLIENT`) leyendo variables de entorno y hasheando contraseñas.

### `seed_catalogos(session)`

Carga catálogos base si faltan:

- `FormaPago`
- `EstadoPedido`

### `seed_demo_data(session)`

Bloque más grande del archivo. Incluye:

- Merge de productos/categorías/ingredientes duplicados por nombre equivalente.
- Helpers `find_*` y `get_or_create_*`.
- Carga y actualización de categorías, ingredientes y productos demo.
- Vinculación producto-categoría.
- Vinculación producto-ingrediente.
- Vinculación de cantidades por ingrediente (`ProductoIngredienteCantidadLink`).

---

## Cierre unificado

### `run_all_seeds(session)`

Ejecuta en orden:

1. `seed_default_users`
2. `seed_catalogos`
3. `seed_demo_data`

Este orden asegura dependencias correctas: primero usuarios, luego catálogos, luego datos de negocio.

---

## Resumen

Este archivo deja la base “lista para trabajar” en desarrollo, minimizando duplicados y asegurando relaciones coherentes entre entidades.
