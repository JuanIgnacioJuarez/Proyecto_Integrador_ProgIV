# Explicación detallada de `CategoriaService`

## Idea general del archivo

Este código define un servicio de categorías llamado `CategoriaService`.

En una aplicación backend, un servicio es una clase que contiene la lógica de negocio. Es decir: no se encarga directamente de recibir la petición HTTP ni de hablar “a mano” con la base de datos, sino de decidir qué reglas se deben cumplir para crear, buscar, modificar o eliminar categorías.

---

## Explicación línea por línea

```python
from typing import List
```

Importa `List`, que sirve para indicar que una función devuelve una lista de elementos.

Por ejemplo, más abajo se usa así:

```python
List[CategoriaReadFull]
```

Eso significa: “esta función devuelve una lista de categorías completas”.

---

```python
from datetime import datetime
```

Importa `datetime`, que sirve para trabajar con fechas y horas.

En este código se usa para guardar cuándo se modificó o eliminó una categoría.

---

```python
from fastapi import HTTPException, status
```

Importa dos cosas de FastAPI:

- `HTTPException`: sirve para lanzar errores HTTP, por ejemplo “404 no encontrado” o “409 conflicto”.
- `status`: trae nombres ya preparados para los códigos HTTP.

---

```python
from sqlmodel import Session
```

Importa `Session`, que representa una sesión de conexión con la base de datos.

Pensalo como el “canal” que permite consultar, guardar o modificar datos.

---

```python
from backend.core.unit_of_work import UnitOfWork
```

Importa la clase `UnitOfWork`.

El `UnitOfWork` se usa para organizar operaciones con la base de datos dentro de un mismo bloque seguro.

---

```python
from backend.modules.categorias.models import Categoria
```

Importa el modelo `Categoria`.

Este modelo representa la tabla o entidad real de categoría en la base de datos.

---

```python
from backend.modules.categorias.schemas import CategoriaCreate, CategoriaUpdate, CategoriaReadFull, CategoriaRead
```

Importa varios esquemas.

Los esquemas son estructuras que definen qué datos entran y qué datos salen de la API.

---

```python
class CategoriaService:
```

Define una clase llamada `CategoriaService`.

Una clase es como un “molde” que agrupa funciones relacionadas.

---

```python
def __init__(self, session: Session) -> None:
```

Define el constructor de la clase.

El constructor es lo primero que se ejecuta cuando se crea un objeto `CategoriaService`.

---

```python
self._session = session
```

Guarda la sesión recibida dentro del objeto.

---

```python
def _get_or_404(self, uow: UnitOfWork, categoria_id: int) -> Categoria:
```

Define un método interno llamado `_get_or_404`.

Busca una categoría por ID.

---

```python
categoria = uow.categorias.get_by_id(categoria_id)
```

Busca la categoría en la base de datos usando su ID.

---

```python
if not categoria or categoria.deleted_at is not None:
```

Verifica si:

- la categoría no existe;
- o fue eliminada lógicamente.

---

```python
raise HTTPException(
```

Lanza un error HTTP.

---

```python
status_code=status.HTTP_404_NOT_FOUND
```

Indica que el error será de tipo `404 Not Found`.

---

```python
return categoria
```

Si la categoría existe, la devuelve.

---

```python
def _assert_nombre_unique(self, uow: UnitOfWork, nombre: str) -> None:
```

Valida que el nombre de la categoría no esté repetido.

---

```python
if uow.categorias.get_by_nombre(nombre):
```

Busca si ya existe una categoría con ese nombre.

---

```python
status_code=status.HTTP_409_CONFLICT
```

Lanza un error `409 Conflict` si el nombre ya existe.

---

```python
def create(self, data: CategoriaCreate) -> Categoria:
```

Método para crear una nueva categoría.

---

```python
with UnitOfWork(self._session) as uow:
```

Abre un bloque de trabajo seguro con la base de datos.

---

```python
self._assert_nombre_unique(uow, data.nombre)
```

Verifica que el nombre no exista.

---

```python
categoria = Categoria.model_validate(data)
```

Convierte los datos recibidos en un objeto `Categoria`.

---

```python
uow.categorias.add(categoria)
```

Guarda la categoría en la base de datos.

---

```python
result = Categoria.model_validate(categoria)
```

Valida y serializa la categoría creada.

---

```python
return result
```

Devuelve la categoría creada.

---

```python
def get_all(self) -> List[CategoriaReadFull]:
```

Obtiene todas las categorías activas.

---

```python
categorias = uow.categorias.get_all_raices_activas()
```

Busca todas las categorías raíz activas.

---

```python
result = [CategoriaReadFull.model_validate(c) for c in categorias]
```

Convierte todas las categorías al esquema de lectura completo.

---

```python
def get_by_id(self, categoria_id: int) -> CategoriaReadFull:
```

Busca una categoría específica por ID.

---

```python
categoria = self._get_or_404(uow, categoria_id)
```

Busca la categoría o lanza error 404.

---

```python
def update(self, categoria_id: int, data: CategoriaUpdate) -> Categoria:
```

Actualiza una categoría existente.

---

```python
if data.nombre and data.nombre != categoria.nombre:
```

Verifica si el nombre cambió.

---

```python
patch = data.model_dump(exclude_unset=True)
```

Extrae solo los campos enviados por el cliente.

---

```python
for field, value in patch.items():
```

Recorre cada campo enviado.

---

```python
setattr(categoria, field, value)
```

Actualiza dinámicamente el atributo de la categoría.

---

```python
categoria.updated_at = datetime.utcnow()
```

Guarda la fecha de última modificación.

---

```python
def soft_delete(self, categoria_id: int) -> None:
```

Realiza un borrado lógico.

---

```python
categoria.deleted_at = datetime.utcnow()
```

Marca la fecha de eliminación.

---

```python
categoria.is_active = False
```

Marca la categoría como inactiva.

---

## Resumen general

| Método | Función |
|---|---|
| `_get_or_404` | Busca categoría o lanza error 404 |
| `_assert_nombre_unique` | Verifica nombres únicos |
| `create` | Crea categorías |
| `get_all` | Lista categorías |
| `get_by_id` | Busca por ID |
| `update` | Modifica categorías |
| `soft_delete` | Elimina lógicamente |

---

## Explicación simple

Este archivo funciona como un encargado de categorías.

- Verifica que no haya nombres repetidos.
- Busca categorías por ID.
- Crea nuevas categorías.
- Modifica categorías existentes.
- Marca categorías como eliminadas sin borrarlas físicamente de la base de datos.
