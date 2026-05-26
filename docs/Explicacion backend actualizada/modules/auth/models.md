# Explicación detallada del modelo Usuario con SQLModel

```python
from datetime import datetime
```

## Explicación
Esta línea importa algo que ya viene preparado en Python llamado `datetime`.

`datetime` sirve para trabajar con fechas y horas.

Por ejemplo:
- saber qué día es,
- guardar la fecha de creación de un usuario,
- registrar la hora exacta en que pasó algo.

En este código se usa para guardar automáticamente cuándo fue creado o actualizado un usuario.

---

```python
from typing import Optional
```

## Explicación
Esta línea importa `Optional`.

`Optional` significa:
👉 “este valor puede existir… o puede no existir”.

Por ejemplo:
Un usuario puede tener:
- un `id` → 1, 2, 3, etc.

pero antes de guardarse en la base de datos puede no tener ninguno todavía.

Entonces:

```python
Optional[int]
```

significa:
👉 “puede haber un número entero… o puede haber nada (`None`)”.

---

```python
from sqlmodel import Field, SQLModel
```

## Explicación
Acá se importan dos herramientas de la librería `sqlmodel`.

### SQLModel
Sirve para crear modelos de base de datos.

Un modelo es como una plantilla o molde.

Por ejemplo:
- Usuario
- Producto
- Pedido

Cada modelo representa una tabla de la base de datos.

### Field
`Field` sirve para configurar cada columna de la tabla.

Con `Field` podés decir cosas como:
- máximo de caracteres,
- si es clave primaria,
- si es única,
- valor por defecto,
- etc.

Es como poner reglas a cada dato.

---

```python
class Usuario(SQLModel, table=True):
```

## Explicación
Acá se está creando una clase llamada `Usuario`.

Una clase es como un molde para fabricar objetos.

Por ejemplo:
si la clase es `Usuario`,
los objetos podrían ser:
- Juan,
- María,
- Pedro.

### `(SQLModel, table=True)`

Esto significa que la clase:
1. hereda funcionalidades de `SQLModel`,
2. y además se convertirá en una tabla de la base de datos.

👉 `table=True`
le dice:
“esta clase debe existir como tabla SQL”.

Entonces esta clase terminará creando una tabla llamada usuario.

---

```python
__tablename__ = "usuario"
```

## Explicación
Esta línea define el nombre exacto que tendrá la tabla en la base de datos.

Entonces la tabla se llamará:

```sql
usuario
```

Si esto no estuviera, SQLModel podría inventar un nombre automáticamente.

Acá el programador decidió definirlo manualmente.

---

```python
id: Optional[int] = Field(default=None, primary_key=True)
```

## Explicación
Esta línea crea la columna `id`.

El `id` normalmente identifica de manera única a cada usuario.

Por ejemplo:

| id | nombre |
|---|---|
| 1 | Juan |
| 2 | Ana |

### Parte por parte

```python
id:
```

Es el nombre de la variable/campo.

```python
Optional[int]
```

Significa:
👉 puede ser un número entero o nada.

Antes de guardarse en la base de datos el usuario todavía no tiene id.

```python
Field(...)
```

Configura la columna.

```python
default=None
```

El valor inicial será vacío (`None`).

```python
primary_key=True
```

Esto indica que es la clave primaria.

La clave primaria:
- identifica cada fila,
- nunca se repite,
- sirve para buscar usuarios rápidamente.

Es como el DNI del registro.

---

```python
nombre: str = Field(max_length=120)
```

## Explicación
Esta línea crea la columna `nombre`.

### `str`

Significa texto.

Por ejemplo:
- "Juan"
- "María"

### `max_length=120`

El nombre puede tener máximo 120 caracteres.

Esto evita textos absurdamente largos y ayuda a controlar los datos.

---

```python
email: str = Field(max_length=255, unique=True, index=True)
```

## Explicación
Esta línea crea la columna `email`.

### `max_length=255`

El email puede tener hasta 255 caracteres.

### `unique=True`

Significa:
👉 no puede haber emails repetidos.

Por ejemplo:
NO se permitiría:

| id | email |
|---|---|
| 1 | ana@gmail.com |
| 2 | ana@gmail.com |

Porque el email debe ser único.

### `index=True`

Esto crea un índice en la base de datos.

Un índice funciona parecido al índice de un libro:
ayuda a encontrar información más rápido.

Entonces buscar usuarios por email será más eficiente.

---

```python
password_hash: str = Field(max_length=255)
```

## Explicación
Esta columna guarda la contraseña.

PERO:
⚠️ no guarda la contraseña real.

Guarda un `hash`.

### ¿Qué es un hash?

Es una versión transformada y encriptada de la contraseña.

Por ejemplo:
La contraseña:

```text
hola123
```

podría convertirse en:

```text
a8f5f167f44f4964e6c998dee827110c
```

Así, aunque alguien robe la base de datos, no verá las contraseñas reales.

Eso es una medida de seguridad.

---

```python
rol: str = Field(default="ADMIN", max_length=20)
```

## Explicación
Esta columna guarda el rol del usuario.

Por ejemplo:
- ADMIN
- USER
- MODERADOR

### `default="ADMIN"`

Si no se especifica ningún rol,
automáticamente será `"ADMIN"`.

### `max_length=20`

El texto no puede superar 20 caracteres.

---

```python
is_active: bool = Field(default=True)
```

## Explicación
Esta columna indica si el usuario está activo o no.

### `bool`

`bool` significa booleano.

Un booleano solo puede tener dos valores:
- `True` → verdadero
- `False` → falso

Entonces:
- `True` → usuario activo
- `False` → usuario deshabilitado

### `default=True`

Cuando se crea un usuario,
por defecto estará activo.

---

```python
created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
```

## Explicación
Esta columna guarda la fecha y hora de creación del usuario.

### `datetime`

El dato será una fecha y hora.

Por ejemplo:

```text
2026-05-08 14:32:11
```

### `default_factory=datetime.utcnow`

Esto significa:
👉 automáticamente se guarda la fecha/hora actual al crear el usuario.

`utcnow()` obtiene la fecha y hora universal actual.

No hace falta escribirla manualmente.

### `nullable=False`

Significa:
👉 este campo NO puede quedar vacío.

Todo usuario debe tener fecha de creación.

---

```python
updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
```

## Explicación
Esta columna guarda la fecha y hora de última actualización.

Funciona parecido a `created_at`.

La idea es:
- cuando el usuario se crea → se guarda la fecha,
- cuando se modifica → se actualiza esta columna.

Así el sistema sabe cuándo fue el último cambio del registro.
