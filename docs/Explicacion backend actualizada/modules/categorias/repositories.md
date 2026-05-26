
# Explicación línea por línea - CategoriaRepository

```python
from backend.core.repository import BaseRepository
```

## Explicación
Acá el programa está diciendo: “quiero traer algo que ya existe en otro archivo”.

- `from` significa “desde”.
- `backend.core.repository` es la ubicación del archivo donde está guardada la clase.
- `import BaseRepository` significa que se importa la clase llamada `BaseRepository`.

`BaseRepository` es una clase base que ya tiene operaciones generales para trabajar con la base de datos:
- crear registros,
- obtener registros,
- actualizar,
- eliminar.

---

```python
from backend.modules.categorias.models import Categoria
```

## Explicación
Acá se importa la clase `Categoria`.

Esa clase representa la tabla `categoria` de la base de datos.

---

```python
from sqlmodel import Session, select
```

## Explicación
Acá se importan dos herramientas importantes de `sqlmodel`.

### Session
La `Session` es la conexión activa con la base de datos.

### select
`select` sirve para construir consultas SQL usando Python.

---

```python
class CategoriaRepository(BaseRepository[Categoria]):
```

## Explicación
Acá se crea una clase nueva llamada `CategoriaRepository`.

Un Repository es una clase encargada del acceso a datos.

La herencia:
```python
(BaseRepository[Categoria])
```
significa que esta clase reutiliza funcionalidades del repository base.

CRUD significa:
- Create
- Read
- Update
- Delete

---

```python
"""
Repositorio específico de Categoria.
Hereda de BaseRepository para obtener todas las operaciones CRUD generales.
Acá sólo deberíamos agregar funciones específicas de la clase.
"""
```

## Explicación
Esto es un comentario multilínea (`docstring`) que documenta la clase.

---

```python
def __init__(self, session: Session) -> None :
```

## Explicación
Acá se define el constructor de la clase.

- `def` crea una función.
- `__init__` es el constructor automático.
- `self` representa al objeto actual.
- `session: Session` indica que recibe una sesión de base de datos.
- `-> None` significa que no devuelve nada.

---

```python
super().__init__(session, Categoria)
```

## Explicación
`super()` llama al constructor de la clase padre (`BaseRepository`).

Le pasa:
- la sesión,
- y el modelo `Categoria`.

Así el repository sabe con qué tabla trabajar.

---

```python
def get_by_nombre(self, nombre: str) -> Categoria | None:
```

## Explicación
Este método busca una categoría usando su nombre.

- `nombre: str` indica que el parámetro es texto.
- `Categoria | None` significa que puede devolver una categoría o `None`.

---

```python
return self.session.exec(
```

## Explicación
Acá comienza la ejecución de la consulta SQL.

---

```python
select(Categoria)
```

## Explicación
Equivale a:

```sql
SELECT * FROM categoria
```

---

```python
.where(Categoria.nombre == nombre)
```

## Explicación
Agrega una condición.

Equivale a:

```sql
WHERE nombre = 'algo'
```

---

```python
).first()
```

## Explicación
Obtiene el primer resultado encontrado.

Si no encuentra nada devuelve `None`.

---

```python
def get_all_active(self) -> list[Categoria]:
```

## Explicación
Este método obtiene todas las categorías activas.

---

```python
.where(Categoria.is_active)
```

## Explicación
Filtra únicamente las categorías activas.

Equivale a:

```sql
WHERE is_active = true
```

---

```python
.all()
```

## Explicación
Trae todos los resultados encontrados.

---

```python
def get_all_raices_activas(self) -> list[Categoria]:
```

## Explicación
Obtiene categorías activas que además no tienen padre.

“Raíz” significa categoría principal.

---

```python
.where(Categoria.is_active, Categoria.parent_id == None)
```

## Explicación
Tiene dos condiciones:

1. La categoría debe estar activa.
2. La categoría no debe tener padre.

Equivale a:

```sql
WHERE is_active = true
AND parent_id IS NULL
```
