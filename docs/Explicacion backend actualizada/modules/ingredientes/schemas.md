# Explicación línea por línea - Ingredientes (SQLModel)

```python
from typing import Optional, List
```

## Explicación
Esta línea importa herramientas que ya vienen incluidas en Python dentro del módulo llamado `typing`.

El módulo `typing` se usa para indicar qué tipo de dato va a tener cada variable, parámetro o atributo.

- `Optional` significa: “este dato puede existir o puede ser `None`”.
- `List` significa: “esto va a ser una lista”.

Ejemplo:

```python
nombre: Optional[str]
```

Quiere decir:
- puede haber un texto (`str`)
- o puede no haber nada (`None`)

---

```python
from sqlmodel import Field, SQLModel
```

## Explicación
Acá se importan dos cosas desde la librería `SQLModel`.

### `SQLModel`
Es la clase base desde la que van a heredar los modelos.

### `Field`
Sirve para agregar validaciones y configuraciones a los atributos.

Ejemplo:

```python
nombre: str = Field(min_length=2)
```

---

```python
class IngredienteBase(SQLModel):
```

## Explicación
Acá se crea una clase llamada `IngredienteBase`.

Una clase es como una plantilla o molde.

Esta clase servirá como base para otros modelos relacionados con ingredientes.

---

```python
    nombre: str = Field(min_length=2, max_length=100)
```

## Explicación
Define el atributo `nombre`.

- `str` indica que debe ser texto.
- `min_length=2` indica mínimo 2 caracteres.
- `max_length=100` indica máximo 100 caracteres.

---

```python
    descripcion: Optional[str] = Field(default=None, max_length=300)
```

## Explicación
Define el campo `descripcion`.

- Puede contener texto.
- O puede no contener nada (`None`).

`default=None` significa que si no se envía una descripción, quedará vacía.

---

```python
    es_alergeno: bool = False
```

## Explicación
Campo booleano.

Puede valer:
- `True`
- `False`

Por defecto queda en `False`.

---

```python
class IngredienteCreate(IngredienteBase):
```

## Explicación
Clase utilizada para crear ingredientes.

Hereda todos los atributos de `IngredienteBase`.

---

```python
    pass
```

## Explicación
`pass` significa que no se agrega nada más.

La clase existe para reutilizar la estructura base.

---

```python
class IngredienteUpdate(SQLModel):
```

## Explicación
Clase utilizada para actualizar ingredientes.

---

```python
    nombre: Optional[str] = Field(default=None, min_length=2, max_length=100)
```

## Explicación
El nombre ahora es opcional.

Esto permite actualizar solo algunos campos.

---

```python
    descripcion: Optional[str] = Field(default=None, max_length=300)
```

## Explicación
La descripción también es opcional en actualizaciones.

---

```python
    es_alergeno: Optional[bool] = None
```

## Explicación
También es opcional.

`None` significa que no se modificó el campo.

---

```python
class IngredienteRead(IngredienteBase):
```

## Explicación
Clase utilizada para mostrar ingredientes.

Hereda:
- nombre
- descripcion
- es_alergeno

---

```python
    id: int
```

## Explicación
Identificador único del ingrediente.

`int` significa número entero.

---

```python
class IngredienteBasicRead(SQLModel):
```

## Explicación
Versión reducida del ingrediente.

Se usa cuando no hace falta devolver toda la información.

---

```python
    id: int
```

## Explicación
ID del ingrediente.

---

```python
    nombre: str
```

## Explicación
Nombre del ingrediente.

---

```python
    es_alergeno: bool
```

## Explicación
Indica si es alérgeno o no.

---

```python
#Paginado
```

## Explicación
Comentario que indica el inicio de la sección de paginación.

La paginación sirve para dividir grandes cantidades de datos en páginas pequeñas.

---

```python
class IngredientePaginatedResponse(SQLModel):
```

## Explicación
Clase utilizada para devolver respuestas paginadas.

---

```python
    total: int
```

## Explicación
Cantidad total de ingredientes existentes.

---

```python
    items: List[IngredienteRead]
```

## Explicación
Lista de ingredientes.

Cada elemento tendrá:
- id
- nombre
- descripcion
- es_alergeno

## Ejemplo de respuesta

```json
{
  "total": 250,
  "items": [
    {
      "id": 1,
      "nombre": "Tomate",
      "descripcion": "Tomate fresco",
      "es_alergeno": false
    }
  ]
}
```
