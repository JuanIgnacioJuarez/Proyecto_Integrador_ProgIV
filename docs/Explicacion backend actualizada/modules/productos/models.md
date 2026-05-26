# Explicación línea por línea del modelo `Producto`

```python
from typing import Optional, List, TYPE_CHECKING
```

## Explicación
Esta línea importa herramientas especiales de Python que sirven para definir mejor los tipos de datos que va a usar la clase.

- `Optional` significa que un valor puede existir o puede ser `None`.
- `List` representa listas.
- `TYPE_CHECKING` ayuda a evitar problemas de importaciones circulares.

---

```python
from datetime import datetime
```

## Explicación
Importa la clase `datetime`, utilizada para manejar fechas y horas.

---

```python
from decimal import Decimal
```

## Explicación
Importa `Decimal`, que permite trabajar con números decimales precisos, ideal para precios y dinero.

---

```python
from sqlalchemy import Column, JSON
```

## Explicación
Importa herramientas de SQLAlchemy.

- `Column` crea columnas especiales.
- `JSON` permite guardar datos JSON.

---

```python
from sqlmodel import Field, Relationship, SQLModel, CheckConstraint
```

## Explicación
Importa componentes principales de SQLModel.

- `Field` configura columnas.
- `Relationship` crea relaciones.
- `SQLModel` convierte la clase en tabla SQL.
- `CheckConstraint` agrega restricciones.

---

```python
from backend.core.links import ProductoCategoriaLink, ProductoIngredienteLink
```

## Explicación
Importa tablas intermedias para relaciones muchos a muchos.

---

```python
if TYPE_CHECKING:
```

## Explicación
Evita problemas de importación circular.

---

```python
class Producto(SQLModel, table=True):
```

## Explicación
Define la clase `Producto` y la convierte en una tabla de base de datos.

---

```python
__tablename__ = "producto"
```

## Explicación
Define el nombre exacto de la tabla SQL.

---

```python
id: Optional[int] = Field(default=None, primary_key=True)
```

## Explicación
Define la clave primaria única del producto.

---

```python
nombre: str = Field(max_length=150, nullable=False)
```

## Explicación
Campo obligatorio para guardar el nombre del producto.

---

```python
descripcion: Optional[str] = Field(default=None)
```

## Explicación
Descripción opcional.

---

```python
precio_base: Decimal = Field(default=0, max_digits=10, decimal_places=2)
```

## Explicación
Guarda el precio base usando decimales precisos.

---

```python
imagenes_url: List[str] = Field(default_factory=list, sa_column=Column(JSON))
```

## Explicación
Guarda una lista de URLs de imágenes en formato JSON.

---

```python
stock_cantidad: int = Field(default=0)
```

## Explicación
Representa la cantidad de stock disponible.

---

```python
is_active: bool = Field(default=True)
```

## Explicación
Indica si el producto está activo o no.

---

```python
CheckConstraint("precio_base >= 0")
```

## Explicación
Evita precios negativos.

---

```python
CheckConstraint("stock_cantidad >= 0")
```

## Explicación
Evita stock negativo.

---

```python
created_at: datetime = Field(default_factory=datetime.utcnow)
```

## Explicación
Guarda automáticamente la fecha de creación.

---

```python
updated_at: datetime = Field(default_factory=datetime.utcnow)
```

## Explicación
Guarda la fecha de actualización.

---

```python
deleted_at: Optional[datetime] = Field(default=None)
```

## Explicación
Permite borrado lógico.

---

```python
categorias: List["Categoria"] = Relationship(...)
```

## Explicación
Relación muchos a muchos con categorías.

---

```python
ingredientes: List["Ingrediente"] = Relationship(...)
```

## Explicación
Relación muchos a muchos con ingredientes.

