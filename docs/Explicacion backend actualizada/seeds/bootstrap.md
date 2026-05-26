# Explicación detallada de `backend/seeds/bootstrap.py`

## Rol del archivo

Contiene toda la lógica de seed del sistema.

No solo inserta datos: también normaliza y corrige duplicados para mantener consistencia.

---

## `normalize_text(value)`

Normaliza texto para comparaciones robustas:

- minúsculas
- sin tildes
- espacios unificados

Sirve para detectar equivalencias como "Café" y "Cafe".

---

## `seed_default_users(session)`

Crea usuarios demo si no existen:

- ADMIN
- STOCK
- PEDIDOS
- CLIENT

Toma valores desde variables de entorno y hashea contraseña con `hash_password`.

---

## `seed_catalogos(session)`

Carga catálogos base si están vacíos:

- `FormaPago`
- `EstadoPedido`

Incluye estados de todo el ciclo (`PENDIENTE`, `CONFIRMADO`, `EN_PREP`, etc.).

---

## `seed_demo_data(session)`

Es la parte más extensa. Hace dos tipos de trabajo:

1. Limpieza/corrección:
   - merge de productos duplicados
   - merge de categorías duplicadas
   - merge de ingredientes duplicados

2. Carga/actualización de demo:
   - categorías
   - ingredientes
   - productos
   - links producto-categoría y producto-ingrediente

### Helpers importantes

- `find_*`: búsqueda por nombre normalizado.
- `get_or_create_*`: crea o actualiza evitando duplicados lógicos.
- `ensure_producto_categoria` y `ensure_producto_ingrediente`: garantizan relaciones sin duplicarlas.

Al final hace `session.commit()`.

---

## `run_all_seeds(session)`

Punto único de ejecución:

1. `seed_default_users`
2. `seed_catalogos`
3. `seed_demo_data`

Esto asegura orden correcto: primero identidad, luego catálogos, luego entidades de negocio.
