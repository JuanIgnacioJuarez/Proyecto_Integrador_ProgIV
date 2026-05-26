# Explicación detallada - IngredienteRepository

```python
from backend.core.repository import BaseRepository
```

## Explicación
Esta línea importa una clase llamada `BaseRepository` desde otro archivo del proyecto.

- `from` significa “desde”.
- `backend.core.repository` es la ubicación del archivo.
- `import BaseRepository` trae esa clase para usarla acá.

`BaseRepository` probablemente contiene las operaciones CRUD generales:
- Crear
- Leer
- Actualizar
- Eliminar

---

```python
from backend.modules.ingredientes.models import Ingrediente
```

## Explicación
Importa la clase `Ingrediente`.

Esta clase representa la tabla de ingredientes en la base de datos.

---

```python
from sqlmodel import Session, select
```

## Explicación
Importa dos cosas:

### Session
Representa la conexión activa con la base de datos.

### select
Sirve para construir consultas SQL usando Python.

---

```python
from sqlalchemy import func
```

## Explicación
Importa `func`, que permite usar funciones SQL como:
- COUNT
- SUM
- AVG

---

```python
class IngredienteRepository(BaseRepository[Ingrediente]):
```

## Explicación
Define una clase llamada `IngredienteRepository`.

Hereda de `BaseRepository`, reutilizando toda la lógica CRUD.

`[Ingrediente]` indica que este repository trabaja específicamente con la entidad Ingrediente.

---

```python
def __init__(self, session: Session) -> None:
```

## Explicación
Es el constructor de la clase.

Se ejecuta automáticamente cuando se crea un objeto de esta clase.

- `self` representa el objeto actual.
- `session: Session` indica que recibe una sesión de base de datos.
- `-> None` significa que no devuelve nada.

---

```python
super().__init__(session, Ingrediente)
```

## Explicación
Llama al constructor de la clase padre (`BaseRepository`).

Le pasa:
- la sesión de base de datos
- la entidad Ingrediente

Así el repository ya sabe qué tabla manejar.

---

```python
def get_by_nombre(self, nombre: str) -> Ingrediente | None:
```

## Explicación
Función personalizada para buscar un ingrediente por nombre.

- `nombre: str` → recibe texto.
- `Ingrediente | None` → devuelve un ingrediente o nada.

---

```python
return self.session.exec(
    select(Ingrediente)
    .where(Ingrediente.nombre == nombre)
).first()
```

## Explicación
Ejecuta una consulta SQL.

Equivale aproximadamente a:

```sql
SELECT * FROM ingrediente
WHERE nombre = 'Tomate'
```

`.first()` devuelve el primer resultado encontrado.

---

```python
def get_all_active(self) -> list[Ingrediente]:
```

## Explicación
Devuelve todos los ingredientes activos.

`list[Ingrediente]` significa una lista de ingredientes.

---

```python
return list(
    self.session.exec(
        select(Ingrediente)
        .where(Ingrediente.is_active)
    ).all()
)
```

## Explicación
Busca todos los ingredientes donde:

```sql
is_active = true
```

`.all()` trae todos los resultados.

`list()` convierte el resultado en una lista de Python.

---

```python
def count_active(self, name: str | None = None) -> int:
```

## Explicación
Cuenta ingredientes activos.

También puede filtrar por nombre.

- `name` es opcional.
- `-> int` indica que devuelve un número entero.

---

```python
stmt = select(func.count()).select_from(Ingrediente).where(Ingrediente.is_active)
```

## Explicación
Construye una consulta SQL equivalente a:

```sql
SELECT COUNT(*)
FROM ingrediente
WHERE is_active = true
```

---

```python
if name:
```

## Explicación
Pregunta si el usuario envió un nombre para filtrar.

---

```python
stmt = stmt.where(Ingrediente.nombre.ilike(f"%{name}%"))
```

## Explicación
Agrega una búsqueda parcial ignorando mayúsculas/minúsculas.

Por ejemplo:
- tomate
- TOMATE
- Tomate

Todos coincidirían.

---

```python
return int(self.session.exec(stmt).one())
```

## Explicación
Ejecuta la consulta y devuelve el resultado convertido a entero.

---

```python
def get_active_paginated(
    self, offset: int = 0, limit: int = 10, name: str | None = None
) -> list[Ingrediente]:
```

## Explicación
Devuelve ingredientes activos usando paginación.

### offset
Indica desde qué registro empezar.

### limit
Indica cuántos registros traer.

### name
Filtro opcional de búsqueda.

---

```python
stmt = select(Ingrediente).where(Ingrediente.is_active)
```

## Explicación
Consulta base:
buscar ingredientes activos.

---

```python
if name:
```

## Explicación
Si el usuario escribió un nombre, agrega un filtro.

---

```python
stmt = stmt.where(Ingrediente.nombre.ilike(f"%{name}%"))
```

## Explicación
Busca ingredientes cuyo nombre contenga ese texto.

---

```python
return list(self.session.exec(stmt.offset(offset).limit(limit)).all())
```

## Explicación
Realiza la paginación.

### offset(offset)
Saltea registros.

### limit(limit)
Limita la cantidad de resultados.

### all()
Obtiene todos los registros encontrados.

### list()
Convierte el resultado en una lista de Python.
