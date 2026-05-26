# Explicación detallada del código `schemas/productos.py`

## Línea
```python
from decimal import Decimal
```

## Explicación
Esta línea importa `Decimal` desde la librería `decimal` de Python.  
`Decimal` sirve para trabajar con números decimales de forma precisa.  
Se usa muchísimo en sistemas donde hay dinero, precios, impuestos o cálculos financieros.  

¿Por qué no usar simplemente `float`?  
Porque los `float` pueden generar errores de precisión.

Ejemplo:
```python
0.1 + 0.2
```

a veces da:
```python
0.30000000000000004
```

Eso en un sistema de ventas sería un problema.  
Entonces `Decimal` evita esos errores y hace que los precios sean exactos.

---

## Línea
```python
from typing import Optional
```

## Explicación
Esta línea importa `Optional` desde el módulo `typing`.  

`Optional` significa:
“este dato puede existir o puede ser `None`”.

`None` en Python significa “vacío” o “sin valor”.

Por ejemplo:
```python
descripcion: Optional[str]
```

quiere decir:
“La descripción puede ser un texto (`str`) o puede no tener nada (`None`)”.

---

## Línea
```python
from sqlmodel import Field, SQLModel
```

## Explicación
Acá se importan dos cosas importantes desde `sqlmodel`.

### `SQLModel`
Es la base para crear modelos.  
Un modelo representa una estructura de datos.  

Por ejemplo:
- un producto
- un usuario
- una categoría
- un pedido

Es como crear el “molde” de cómo van a verse los datos.

### `Field`
Sirve para configurar las propiedades de cada atributo.

Con `Field` podés poner:
- valores por defecto
- límites
- validaciones
- tamaños mínimos y máximos
- restricciones

Ejemplo:
```python
nombre: str = Field(min_length=2)
```

significa:
“El nombre debe tener al menos 2 caracteres”.

---

## Línea
```python
class ProductoBase(SQLModel):
```

## Explicación
Acá se crea una clase llamada `ProductoBase`.

`class` significa:
“vamos a crear un nuevo tipo de objeto”.

`ProductoBase` es un modelo base para productos.

Hereda de `SQLModel`, eso significa que obtiene todas las capacidades de SQLModel:
- validación
- serialización
- integración con base de datos
- conversión a JSON

La idea de este modelo es guardar los campos comunes de un producto.

---

## Línea
```python
nombre: str = Field(min_length=2, max_length=150)
```

## Explicación
Se define un atributo llamado `nombre`.

`nombre:` → nombre del campo.

`str` → el dato debe ser texto.

`Field(...)` → agrega validaciones.

`min_length=2`
El nombre debe tener mínimo 2 caracteres.

`max_length=150`
El nombre puede tener máximo 150 caracteres.

Ejemplo válido:
```python
"Pizza"
```

Ejemplo inválido:
```python
"A"
```

porque tiene solo 1 letra.

---

## Línea
```python
descripcion: Optional[str] = Field(default=None, max_length=500)
```

## Explicación
Se crea el campo `descripcion`.

`Optional[str]`
Significa:
“puede ser texto o puede estar vacío”.

`default=None`
Por defecto no tiene descripción.

`max_length=500`
La descripción puede tener máximo 500 caracteres.

---

## Línea
```python
precio_base: Decimal = Field(default=0, ge=0, max_digits=10, decimal_places=2)
```

## Explicación
Se crea el campo `precio_base`.

`Decimal`
El precio será un número decimal preciso.

`default=0`
Si no mandan precio, vale 0.

`ge=0`
Significa:
“greater or equal”.
El número debe ser mayor o igual a 0.

NO permite precios negativos.

`max_digits=10`
El número puede tener hasta 10 dígitos en total.

`decimal_places=2`
Puede tener 2 decimales.

---

## Línea
```python
stock_cantidad: int = Field(default=0, ge=0)
```

## Explicación
Se crea el campo `stock_cantidad`.

`int`
Debe ser un número entero.

Representa cuántas unidades hay disponibles.

`default=0`
Por defecto hay 0 unidades.

`ge=0`
No permite stock negativo.

---

## Línea
```python
class ProductoCategoriaAssign(SQLModel):
```

## Explicación
Se crea otro modelo.

Este modelo representa la relación entre un producto y una categoría.

Por ejemplo:
- Pizza → categoría “Comida”
- Coca Cola → categoría “Bebidas”

---

## Línea
```python
categoria_id: int = Field(ge=1)
```

## Explicación
Este campo guarda el ID de la categoría.

`int`
Debe ser entero.

`ge=1`
El ID debe ser mayor o igual a 1.

---

## Línea
```python
es_principal: bool = False
```

## Explicación
Campo booleano.

`bool` significa:
- True
- False

Indica si esa categoría es la principal del producto.

---

## Línea
```python
class ProductoIngredienteAssign(SQLModel):
```

## Explicación
Este modelo representa la relación entre un producto y un ingrediente.

Ejemplo:
Pizza:
- queso
- tomate
- aceitunas

---

## Línea
```python
ingrediente_id: int = Field(ge=1)
```

## Explicación
Guarda el ID del ingrediente.

Debe ser un entero mayor o igual a 1.

---

## Línea
```python
es_removible: bool = False
```

## Explicación
Indica si el ingrediente puede removerse.

Ejemplo:
“Pizza sin aceitunas”.

---

## Línea
```python
class ProductoCreate(ProductoBase):
```

## Explicación
Este modelo se usa para CREAR productos.

Hereda de `ProductoBase`.

Eso significa que automáticamente ya tiene:
- nombre
- descripción
- precio
- stock

Y además agrega nuevas cosas.

---

## Línea
```python
categorias: list[ProductoCategoriaAssign] = Field(default_factory=list)
```

## Explicación
Este campo contiene una lista de categorías.

`list[...]`
Significa:
“una lista de elementos”.

Cada elemento debe ser un:
```python
ProductoCategoriaAssign
```

`default_factory=list`
Si no mandan categorías, se crea una lista vacía automáticamente.

---

## Línea
```python
ingredientes: list[ProductoIngredienteAssign] = Field(default_factory=list)
```

## Explicación
Lo mismo que antes, pero con ingredientes.

Se guarda una lista de ingredientes asociados al producto.

---

## Línea
```python
class ProductoUpdate(SQLModel):
```

## Explicación
Este modelo se usa para ACTUALIZAR productos.

La diferencia importante:
todos los campos son opcionales.

¿Por qué?
Porque al actualizar tal vez solo quieras cambiar UNA cosa.

---

## Línea
```python
nombre: Optional[str] = Field(default=None, min_length=2, max_length=150)
```

## Explicación
El nombre puede:
- venir
- o no venir

Si viene:
debe cumplir las validaciones.

---

## Línea
```python
descripcion: Optional[str] = Field(default=None, max_length=500)
```

## Explicación
La descripción también es opcional.

---

## Línea
```python
precio_base: Optional[Decimal] = Field(default=None, ge=0, max_digits=10, decimal_places=2)
```

## Explicación
El precio puede no enviarse.
Pero si se envía:
debe cumplir las reglas.

---

## Línea
```python
stock_cantidad: Optional[int] = Field(default=None, ge=0)
```

## Explicación
El stock también es opcional.

---

## Línea
```python
categorias: Optional[list[ProductoCategoriaAssign]] = None
```

## Explicación
La lista de categorías puede venir o no.

---

## Línea
```python
ingredientes: Optional[list[ProductoIngredienteAssign]] = None
```

## Explicación
La lista de ingredientes también puede venir o no.

---

## Línea
```python
class ProductoRead(ProductoBase):
```

## Explicación
Este modelo se usa para LEER productos.

O sea:
para devolver datos al cliente.

Hereda todo de `ProductoBase`.

---

## Línea
```python
id: int
```

## Explicación
Agrega el ID del producto.

Cuando creás un producto:
normalmente todavía no tiene ID.

Pero cuando lo leés desde la base:
sí tiene.

---

## Línea
```python
class CategoriaBasicRead(SQLModel):
```

## Explicación
Modelo básico para mostrar categorías.

---

## Línea
```python
id: int
```

## Explicación
ID de la categoría.

---

## Línea
```python
nombre: str
```

## Explicación
Nombre de la categoría.

---

## Línea
```python
es_principal: bool = False
```

## Explicación
Indica si esa categoría es principal.

---

## Línea
```python
class IngredienteBasicRead(SQLModel):
```

## Explicación
Modelo básico para mostrar ingredientes.

---

## Línea
```python
id: int
```

## Explicación
ID del ingrediente.

---

## Línea
```python
nombre: str
```

## Explicación
Nombre del ingrediente.

---

## Línea
```python
es_alergeno: bool
```

## Explicación
Indica si el ingrediente puede causar alergias.

Ejemplo:
- gluten
- maní
- leche

---

## Línea
```python
es_removible: bool = False
```

## Explicación
Indica si se puede sacar del producto.

---

## Línea
```python
class ProductoReadFull(ProductoRead):
```

## Explicación
Modelo completo de lectura.

Hereda:
- id
- nombre
- descripción
- precio
- stock

Y además agrega:
- categorías
- ingredientes

---

## Línea
```python
categorias: list[CategoriaBasicRead] = Field(default_factory=list)
```

## Explicación
Lista de categorías completas del producto.

---

## Línea
```python
ingredientes: list[IngredienteBasicRead] = Field(default_factory=list)
```

## Explicación
Lista de ingredientes completos del producto.

---

## Línea
```python
#Alias
```

## Explicación
Es un comentario.

Python ignora comentarios.
Sirve para explicar algo al programador.

---

## Línea
```python
CategoriaEnProductoRead = CategoriaBasicRead
```

## Explicación
Acá se crea un alias.

Un alias es simplemente otro nombre para lo mismo.

---

## Línea
```python
IngredienteEnProductoRead = IngredienteBasicRead
```

## Explicación
Otro alias.

---

## Línea
```python
class ProductoPaginatedResponse(SQLModel):
```

## Explicación
Este modelo representa una respuesta paginada.

Paginada significa:
mostrar resultados por partes.

Ejemplo:
- página 1 → 10 productos
- página 2 → otros 10

---

## Línea
```python
total: int
```

## Explicación
Cantidad total de productos existentes.

---

## Línea
```python
items: list[ProductoRead]
```

## Explicación
Lista de productos de esa página.

Cada elemento será un:
```python
ProductoRead
```

O sea:
productos con:
- id
- nombre
- descripción
- precio
- stock
