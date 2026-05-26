
# Explicación línea por línea - ProductoService

## Introducción

Este archivo corresponde a una clase de servicio (`ProductoService`) desarrollada con:
- FastAPI
- SQLModel
- Python

Su responsabilidad principal es manejar toda la lógica de negocio relacionada con productos:
- crear productos
- buscarlos
- actualizarlos
- eliminarlos lógicamente
- relacionarlos con categorías e ingredientes

---

# IMPORTACIONES

```python
from typing import List
```

## Explicación
Importa `List` desde la librería `typing`.

`List` sirve para indicar que una variable o retorno contendrá una lista.

Ejemplo:

```python
List[str]
```

Significa:
“una lista que contiene textos”.

---

```python
from datetime import datetime
```

## Explicación
Importa herramientas para trabajar con fechas y horas.

Más adelante se usa:

```python
datetime.utcnow()
```

Para obtener la fecha y hora actual.

---

```python
from fastapi import HTTPException, status
```

## Explicación
Importa herramientas de FastAPI.

### HTTPException
Sirve para lanzar errores HTTP controlados.

Ejemplo:
- producto no encontrado
- categoría inexistente

### status
Contiene códigos HTTP listos para usar.

Ejemplo:

```python
status.HTTP_404_NOT_FOUND
```

Representa el error 404.

---

```python
from sqlmodel import Session, select
```

## Explicación

### Session
Representa una conexión activa con la base de datos.

Permite:
- guardar
- modificar
- consultar
- eliminar datos

### select
Sirve para realizar consultas SQL.

---

# IMPORTACIONES INTERNAS

```python
from backend.core.links import ProductoCategoriaLink, ProductoIngredienteLink
```

## Explicación
Importa tablas puente.

Estas tablas sirven para relaciones muchos-a-muchos.

Ejemplo:
- un producto puede tener muchas categorías
- una categoría puede tener muchos productos

---

```python
from backend.core.unit_of_work import UnitOfWork
```

## Explicación
Importa el patrón Unit Of Work.

Sirve para controlar transacciones de base de datos.

Si algo falla:
- no se guarda nada

---

```python
from backend.modules.categorias.models import Categoria
```

## Explicación
Importa el modelo `Categoria`.

Representa la tabla categorías de la base de datos.

---

```python
from backend.modules.ingredientes.models import Ingrediente
```

## Explicación
Importa el modelo `Ingrediente`.

---

```python
from backend.modules.productos.models import Producto
```

## Explicación
Importa el modelo `Producto`.

Representa la tabla productos.

---

# SCHEMAS

```python
from backend.modules.productos.schemas import (
```

## Explicación
Importa schemas.

Los schemas son estructuras que definen:
- cómo entra información
- cómo sale información

---

```python
ProductoCreate
```

Schema usado para crear productos.

---

```python
ProductoUpdate
```

Schema usado para actualizar productos.

---

```python
ProductoRead
```

Schema usado para respuestas simples.

---

```python
ProductoReadFull
```

Schema usado para respuestas completas.

---

# CLASE PRINCIPAL

```python
class ProductoService:
```

## Explicación
Define la clase principal que contiene toda la lógica de negocio de productos.

---

# CONSTRUCTOR

```python
def __init__(self, session: Session) -> None:
```

## Explicación
Constructor de la clase.

Recibe:
- una sesión de base de datos

---

```python
self._session = session
```

## Explicación
Guarda la sesión en la instancia actual.

---

# MÉTODOS PRIVADOS

```python
def _get_or_404(self, uow: UnitOfWork, producto_id: int) -> Producto:
```

## Explicación
Busca un producto por ID.

Si no existe:
- lanza error 404

---

```python
producto = uow.productos.get_by_id(producto_id)
```

## Explicación
Busca el producto en la base de datos.

---

```python
if not producto or producto.deleted_at is not None:
```

## Explicación
Verifica:
- si no existe
- si fue eliminado lógicamente

---

```python
raise HTTPException(
```

## Explicación
Lanza un error HTTP.

---

```python
status_code=status.HTTP_404_NOT_FOUND
```

## Explicación
Define que el error será 404.

---

```python
detail=f"Producto con id={producto_id} no encontrado"
```

## Explicación
Mensaje descriptivo del error.

---

```python
return producto
```

## Explicación
Devuelve el producto si existe.

---

# SERIALIZACIÓN

```python
def _serialize_full(self, uow: UnitOfWork, producto: Producto) -> ProductoReadFull:
```

## Explicación
Convierte un producto en una respuesta completa serializada.

Incluye:
- categorías
- ingredientes
- flags especiales

---

```python
categoria_links = {
```

## Explicación
Crea un diccionario para almacenar relaciones producto-categoría.

---

```python
ingrediente_links = {
```

## Explicación
Crea un diccionario para almacenar relaciones producto-ingrediente.

---

```python
categorias = [
```

## Explicación
Construye una lista de categorías serializadas.

---

```python
ingredientes = [
```

## Explicación
Construye una lista de ingredientes serializados.

---

```python
return ProductoReadFull(
```

## Explicación
Devuelve el producto completo serializado.

---

# CREATE

```python
def create(self, data: ProductoCreate) -> ProductoRead:
```

## Explicación
Método para crear productos.

---

```python
with UnitOfWork(self._session) as uow:
```

## Explicación
Abre una transacción controlada.

---

```python
base_payload = data.model_dump(exclude={"categorias", "ingredientes"})
```

## Explicación
Convierte el schema en un diccionario excluyendo relaciones.

---

```python
producto = Producto.model_validate(base_payload)
```

## Explicación
Valida y crea un objeto Producto.

---

```python
uow.productos.add(producto)
```

## Explicación
Agrega el producto a la sesión.

---

```python
for categoria in data.categorias:
```

## Explicación
Recorre categorías enviadas.

---

```python
self._get_categoria_or_404(uow, categoria.categoria_id)
```

## Explicación
Verifica que exista la categoría.

---

```python
ProductoCategoriaLink(
```

## Explicación
Crea una relación producto-categoría.

---

```python
for ingrediente in data.ingredientes:
```

## Explicación
Recorre ingredientes enviados.

---

```python
ProductoIngredienteLink(
```

## Explicación
Crea una relación producto-ingrediente.

---

```python
uow._session.flush()
```

## Explicación
Sincroniza cambios con la base de datos.

---

```python
uow._session.refresh(producto)
```

## Explicación
Recarga el producto actualizado.

---

```python
result = ProductoRead.model_validate(producto)
```

## Explicación
Convierte el producto en schema de respuesta.

---

```python
return result
```

## Explicación
Devuelve el producto creado.

---

# GET ALL

```python
def get_all(self) -> List[ProductoReadFull]:
```

## Explicación
Obtiene todos los productos activos.

---

```python
productos = uow.productos.get_all_active()
```

## Explicación
Busca productos activos.

---

```python
result = [self._serialize_full(uow, p) for p in productos]
```

## Explicación
Serializa todos los productos.

---

# GET BY ID

```python
def get_by_id(self, producto_id: int) -> ProductoReadFull:
```

## Explicación
Obtiene un producto por ID.

---

```python
producto = self._get_or_404(uow, producto_id)
```

## Explicación
Busca el producto o lanza 404.

---

# UPDATE

```python
def update(self, producto_id: int, data: ProductoUpdate) -> ProductoRead:
```

## Explicación
Actualiza un producto existente.

---

```python
patch = data.model_dump(exclude_unset=True)
```

## Explicación
Convierte datos enviados en diccionario incluyendo solo campos modificados.

---

```python
for field, value in patch.items():
```

## Explicación
Recorre todos los campos enviados.

---

```python
setattr(producto, field, value)
```

## Explicación
Modifica dinámicamente atributos del producto.

---

```python
producto.updated_at = datetime.utcnow()
```

## Explicación
Actualiza fecha de modificación.

---

```python
if categorias_patch is not None:
```

## Explicación
Verifica si llegaron categorías nuevas.

---

```python
uow._session.delete(link)
```

## Explicación
Elimina relaciones viejas.

---

```python
categoria.get("es_principal", False)
```

## Explicación
Obtiene si la categoría es principal.

---

```python
if ingredientes_patch is not None:
```

## Explicación
Verifica si llegaron ingredientes nuevos.

---

```python
ingrediente.get("es_removible", False)
```

## Explicación
Obtiene si el ingrediente es removible.

---

# SOFT DELETE

```python
def soft_delete(self, producto_id: int) -> None:
```

## Explicación
Realiza un borrado lógico.

No elimina físicamente el producto.

---

```python
producto.deleted_at = datetime.utcnow()
```

## Explicación
Guarda fecha de eliminación.

---

```python
producto.is_active = False
```

## Explicación
Desactiva el producto.

---

# ADD TO CATEGORIA

```python
def add_to_categoria(
```

## Explicación
Agrega una relación producto-categoría.

---

```python
if link is None:
```

## Explicación
Verifica si la relación ya existe.

---

```python
link.es_principal = es_principal
```

## Explicación
Actualiza si la categoría es principal.

---

# REMOVE FROM CATEGORIA

```python
def remove_from_categoria(self, producto_id: int, categoria_id: int) -> ProductoReadFull:
```

## Explicación
Elimina la relación entre producto y categoría.

---

```python
uow._session.delete(link)
```

## Explicación
Borra la relación de la tabla puente.

---

# GET PRODUCTO CATEGORIAS

```python
def get_producto_categorias(self, producto_id: int) -> List[CategoriaBasicRead]:
```

## Explicación
Devuelve todas las categorías asociadas a un producto.

---

# CONCEPTOS IMPORTANTES DEL ARCHIVO

## UnitOfWork
Controla transacciones de base de datos.

## SQLModel
ORM para trabajar con tablas usando objetos Python.

## Schemas
Definen estructuras de entrada y salida.

## Soft Delete
Borrado lógico.

## Serialización
Conversión de objetos Python a respuestas JSON.

## HTTPException
Permite devolver errores HTTP.

## model_dump()
Convierte schemas en diccionarios.

## model_validate()
Valida y crea modelos/schemas.

## flush()
Sincroniza cambios con la base de datos.

## refresh()
Recarga datos actualizados.

## setattr()
Modifica atributos dinámicamente.

## List comprehension
Forma compacta de crear listas.

Ejemplo:

```python
[x for x in lista]
```

---

# RESUMEN FINAL

La clase `ProductoService` funciona como el cerebro de toda la lógica de productos del backend.

Se encarga de:
- crear productos
- buscarlos
- actualizarlos
- eliminarlos lógicamente
- relacionarlos con categorías e ingredientes
- serializar respuestas
- validar existencia de registros
- manejar errores HTTP
