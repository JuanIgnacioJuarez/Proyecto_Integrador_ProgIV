# Explicación detallada - Modelo Ingrediente

```python
from typing import Optional, List, TYPE_CHECKING
```

## Explicación
Esta línea importa herramientas que vienen incluidas en Python dentro del módulo llamado `typing`.

Ese módulo se usa para indicar qué tipo de datos guarda cada variable o atributo.

- `Optional` → significa que un valor puede existir o puede ser `None`.
- `List` → representa listas.
- `TYPE_CHECKING` → se usa para evitar problemas de importaciones circulares.

---

```python
from datetime import datetime
```

## Explicación
Importa la herramienta `datetime`, que sirve para manejar fechas y horas.

---

```python
from sqlmodel import SQLModel, Field, Relationship
```

## Explicación
Importa herramientas de SQLModel.

- `SQLModel` → permite crear modelos/tablas.
- `Field` → configura columnas.
- `Relationship` → crea relaciones entre tablas.

---

```python
from backend.core.links import ProductoIngredienteLink
```

## Explicación
Importa la tabla puente para la relación muchos a muchos entre productos e ingredientes.

---

```python
if TYPE_CHECKING:
```

## Explicación
Pregunta si Python está revisando tipos.

---

```python
    from backend.modules.productos.models import Producto
```

## Explicación
Importa la clase `Producto` solo durante el chequeo de tipos para evitar errores de importación circular.

---

```python
class Ingrediente(SQLModel, table=True):
```

## Explicación
Define una clase llamada `Ingrediente` que representa una tabla de la base de datos.

---

```python
    '''
    Entidad Ingrediente con 1 relación:

    N:N productos -> Varios ingredientes pueden tener varios productos
    '''
```

## Explicación
Comentario de documentación de la clase.

---

```python
    __tablename__ = "ingrediente"
```

## Explicación
Define el nombre real de la tabla en la base de datos.

---

```python
    id: Optional[int] = Field(default=None, primary_key=True)
```

## Explicación
Define la clave primaria de la tabla.

- `Optional[int]` → puede ser entero o `None`.
- `primary_key=True` → indica que es clave primaria.

---

```python
    nombre: str = Field(max_length=100, unique=True, nullable=False)
```

## Explicación
Define el nombre del ingrediente.

- máximo 100 caracteres
- único
- obligatorio

---

```python
    descripcion: Optional[str] = Field(default=None)
```

## Explicación
Define una descripción opcional.

---

```python
    es_alergeno: bool = Field(default=False, nullable=False)
```

## Explicación
Indica si el ingrediente es alérgeno.

---

```python
    is_active: bool = Field(default=True)
```

## Explicación
Indica si el ingrediente está activo.

---

```python
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
```

## Explicación
Guarda la fecha y hora de creación automáticamente.

---

```python
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
```

## Explicación
Guarda la fecha y hora de actualización.

---

```python
    # ===== MODIFICACION =====
```

## Explicación
Comentario organizativo del programador.

---

```python
    # agregamos deleted_at porque el service ya lo usaba.
```

## Explicación
Explica por qué se agregó el campo `deleted_at`.

---

```python
    # Sin esto tiraba error al buscar/eliminar ingredientes.
```

## Explicación
Aclara el error que ocurría anteriormente.

---

```python
    deleted_at: Optional[datetime] = Field(default=None)
```

## Explicación
Guarda la fecha de eliminación lógica.

---

```python
    # Relaciones
```

## Explicación
Comentario organizativo.

---

```python
    # Relación N:M con Producto
```

## Explicación
Indica una relación muchos a muchos con productos.

---

```python
    productos: List["Producto"] = Relationship(back_populates="ingredientes", link_model=ProductoIngredienteLink)
```

## Explicación
Define la relación entre ingredientes y productos.

- `List["Producto"]` → lista de productos.
- `Relationship()` → crea la relación.
- `back_populates="ingredientes"` → conecta con el atributo inverso.
- `link_model=ProductoIngredienteLink` → usa la tabla puente.
