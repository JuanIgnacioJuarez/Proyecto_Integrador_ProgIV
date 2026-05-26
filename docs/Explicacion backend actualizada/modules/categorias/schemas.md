# Explicación detallada del código de categorías

```python
from __future__ import annotations
```
→ Esta línea le dice a Python que use una forma “más moderna” de interpretar los tipos de datos que aparecen escritos después.
→ `__future__` significa literalmente “del futuro”.
→ Se usa para activar características nuevas de Python aunque algunas versiones todavía no las tengan completamente integradas.
→ En este caso, `annotations` permite escribir tipos de datos de manera más flexible.
→ Esto es especialmente útil cuando una clase se referencia a sí misma más adelante.
→ Por ejemplo, abajo aparece:

```python
subcategorias: list[CategoriaReadFull]
```

→ Ahí la clase `CategoriaReadFull` se usa dentro de sí misma.
→ Sin esta línea, Python podría dar error porque todavía no terminó de crear la clase cuando intenta leerla.
→ Entonces esta línea evita ese problema.

---

```python
from typing import Optional
```
→ `typing` es un módulo de Python que sirve para indicar tipos de datos.
→ Los tipos ayudan a entender qué información espera el programa.
→ `Optional` significa “opcional”.
→ O sea: ese dato puede existir o puede ser `None`.
→ `None` significa “vacío”, “sin valor”, “no hay dato”.

---

```python
from decimal import Decimal
```
→ Esta línea importa `Decimal`.
→ `Decimal` sirve para trabajar con números decimales con mucha precisión.
→ Se usa muchísimo para dinero.
→ Evita errores matemáticos típicos de los `float`.

---

```python
from sqlmodel import Field, SQLModel
```
→ Acá se importan dos herramientas de `SQLModel`.
→ `Field` sirve para agregar validaciones y configuraciones a los atributos.
→ `SQLModel` es la clase base que permite crear modelos compatibles con FastAPI y bases de datos.

---

```python
class CategoriaBase(SQLModel):
```
→ Acá se crea una clase llamada `CategoriaBase`.
→ Una clase funciona como una plantilla.
→ Define cómo será una categoría.

---

```python
nombre: str = Field(min_length=2, max_length=100)
```
→ Se crea el atributo `nombre`.
→ `str` significa texto.
→ Debe tener mínimo 2 caracteres y máximo 100.

---

```python
descripcion: Optional[str] = Field(default=None, max_length=300)
```
→ La descripción puede ser texto o puede estar vacía.
→ Máximo 300 caracteres.

---

```python
imagen_url: Optional[str] = Field(default=None, max_length=500)
```
→ Guarda la URL de una imagen.
→ También es opcional.
→ Máximo 500 caracteres.

---

```python
class CategoriaCreate(CategoriaBase):
```
→ Esta clase hereda de `CategoriaBase`.
→ Se usa para crear nuevas categorías.

---

```python
parent_id: Optional[int] = Field(default=None, ge=1)
```
→ Guarda el ID de una categoría padre.
→ `ge=1` significa “mayor o igual a 1”.

---

```python
is_active: Optional[bool] = Field(default=True)
```
→ Indica si la categoría está activa.
→ `True` = activa.
→ `False` = desactivada.

---

```python
class CategoriaUpdate(SQLModel):
```
→ Esta clase se usa para actualizar categorías.
→ Los campos son opcionales porque no siempre se modifica todo.

---

```python
class CategoriaRead(CategoriaBase):
```
→ Esta clase se usa para devolver información al cliente.

---

```python
id: int
```
→ Representa el ID único de la categoría.

---

```python
class CategoriaBasicRead(SQLModel):
```
→ Es una versión simplificada de una categoría.

---

```python
class ProductoBasicRead(SQLModel):
```
→ Representa una versión básica de un producto.

---

```python
precio_base: Decimal
```
→ Guarda el precio del producto usando números decimales precisos.

---

```python
class CategoriaReadFull(CategoriaRead):
```
→ Es la versión completa de la categoría.

---

```python
parent: Optional[CategoriaBasicRead] = None
```
→ Guarda información completa de la categoría padre.

---

```python
subcategorias: list[CategoriaReadFull] = Field(default_factory=list)
```
→ Guarda una lista de subcategorías.
→ `default_factory=list` crea automáticamente una lista vacía.

---

```python
productos: list[ProductoBasicRead] = Field(default_factory=list)
```
→ Guarda una lista de productos pertenecientes a la categoría.
