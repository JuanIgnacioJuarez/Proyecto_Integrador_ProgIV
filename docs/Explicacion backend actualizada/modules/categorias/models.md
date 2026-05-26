# Explicación línea por línea - Clase Categoria

```python
from typing import List, Optional, TYPE_CHECKING
```

Explicación: Esta línea importa herramientas especiales de Python que sirven para definir tipos de datos. Esto ayuda a que el código sea más claro, más seguro y más fácil de entender.

- `List` significa “lista”.
- `Optional` significa “opcional”.
- `TYPE_CHECKING` sirve para evitar problemas entre importaciones.

---

```python
from datetime import datetime
```

Explicación: Importa herramientas para trabajar con fechas y horas.

---

```python
from sqlmodel import Field, Relationship, SQLModel
```

Explicación: Importa herramientas de SQLModel para trabajar con bases de datos.

- `SQLModel` → crea tablas.
- `Field` → configura columnas.
- `Relationship` → conecta tablas.

---

```python
from backend.core.links import ProductoCategoriaLink
```

Explicación: Importa una tabla intermedia que conecta productos y categorías.

---

```python
# Evita importación circular
```

Explicación: Comentario aclarando que lo siguiente evita errores de importación.

---

```python
if TYPE_CHECKING:
```

Explicación: Verifica si Python está revisando tipos de datos.

---

```python
    from backend.modules.productos.models import Producto
```

Explicación: Importa `Producto` solo para referencia de tipos.

---

```python
class Categoria(SQLModel, table=True):
```

Explicación: Define una clase que también será una tabla en la base de datos.

---

```python
    __tablename__ = "categoria"
```

Explicación: Define el nombre de la tabla SQL.

---

```python
    id: Optional[int] = Field(default=None, primary_key=True)
```

Explicación: Crea la clave primaria de la tabla.

---

```python
    parent_id: Optional[int] = Field(default=None, foreign_key="categoria.id", nullable=True)
```

Explicación: Crea una relación entre categorías padre e hijas.

---

```python
    nombre: str = Field(max_length=100, unique=True, nullable=False)
```

Explicación: Campo obligatorio y único para el nombre de la categoría.

---

```python
    descripcion: Optional[str] = Field(default=None)
```

Explicación: Campo opcional para descripción.

---

```python
    imagen_url: Optional[str] = Field(default=None)
```

Explicación: Guarda la URL de una imagen.

---

```python
    is_active: bool = Field(default=True)
```

Explicación: Indica si la categoría está activa.

---

```python
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
```

Explicación: Guarda automáticamente la fecha de creación.

---

```python
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
```

Explicación: Guarda la fecha de última actualización.

---

```python
    deleted_at: Optional[datetime] = Field(default=None)
```

Explicación: Guarda la fecha de eliminación lógica.

---

```python
    parent: Optional["Categoria"] = Relationship(back_populates="subcategorias", sa_relationship_kwargs={"remote_side":"Categoria.id"})
```

Explicación: Relación hacia la categoría padre.

---

```python
    subcategorias: List["Categoria"] = Relationship(back_populates="parent")
```

Explicación: Lista de categorías hijas.

---

```python
    productos: List["Producto"] = Relationship(back_populates="categorias", link_model=ProductoCategoriaLink)
```

Explicación: Relación muchos a muchos entre productos y categorías.
