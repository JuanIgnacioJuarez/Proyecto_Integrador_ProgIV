# Explicación línea por línea - Health Router FastAPI

```python
from fastapi import APIRouter, HTTPException, status
```

## Explicación
Acá el programa está trayendo herramientas que ya existen dentro de FastAPI para poder usarlas en este archivo.

`from` significa “desde”.

`import` significa “traer” o “importar”.

Entonces esta línea dice:

👉 “Desde FastAPI traeme APIRouter, HTTPException y status”.

### ¿Qué es cada cosa?

- `APIRouter`
  sirve para crear rutas o endpoints.

- `HTTPException`
  sirve para generar errores HTTP controlados.

- `status`
  contiene constantes con códigos HTTP.

---

```python
from sqlmodel import text
```

## Explicación
Acá se importa `text` desde SQLModel.

`text()` sirve para escribir SQL manualmente.

Por ejemplo:

```sql
SELECT 1
```

Eso es una consulta SQL muy simple que se usa para probar si la base de datos responde.

---

```python
from backend.core.database import engine
```

## Explicación
Acá el programa trae el `engine`.

El `engine` es el objeto que maneja la conexión con la base de datos.

Es como el “motor” que sabe:
- a qué base conectarse,
- usuario,
- contraseña,
- puerto,
- tipo de DB,
- etc.

---

```python
# todas las rutas de este archivo empiezan por "health"
```

## Explicación
Esto es un comentario.

Los comentarios empiezan con `#`.

Python ignora estas líneas.

---

```python
router = APIRouter(prefix="/health", tags=["health"])
```

## Explicación
Acá se crea un router.

Un router organiza rutas relacionadas.

### prefix="/health"

Todas las rutas de este archivo van a empezar automáticamente con:

```txt
/health
```

### tags=["health"]

Esto agrega una etiqueta para Swagger.

---

```python
# Verifica que el servidor de FastAPI está encendido y respondiendo peticiones.
```

## Explicación
Comentario explicando para qué sirve la próxima ruta.

---

```python
@router.get("/")
```

## Explicación
Esto se llama decorador.

Significa:

👉 “Cuando alguien haga un GET a esta URL, ejecutá la función siguiente”.

La ruta final será:

```txt
/health/
```

---

```python
def health_check():
```

## Explicación
Acá se define una función.

- `def` significa “definir función”.

- `health_check` es el nombre de la función.

---

```python
return {"status": "ok"}
```

## Explicación
`return` significa “devolver”.

FastAPI transforma automáticamente este diccionario en JSON.

El cliente recibe:

```json
{
  "status": "ok"
}
```

---

```python
# Para probar la conexión, simplemente si devuelve un 1 ya empieza a funcionar
```

## Explicación
Comentario explicando la próxima ruta.

---

```python
@router.get("/db")
```

## Explicación
Otra ruta GET.

La ruta completa será:

```txt
/health/db
```

---

```python
def db_check():
```

## Explicación
Se crea una función llamada `db_check`.

---

```python
try:
```

## Explicación
`try` significa:

👉 “intentá ejecutar esto”.

Sirve para manejar errores.

---

```python
with engine.connect() as conn:
```

## Explicación
Esta línea intenta abrir una conexión con la base de datos.

- `engine.connect()`
  significa:
  👉 “conectate a la base”.

- `with`
  hace que la conexión se cierre automáticamente cuando termina el bloque.

---

```python
conn.execute(text("SELECT 1"))
```

## Explicación
Acá se ejecuta SQL directamente.

La consulta:

```sql
SELECT 1
```

sirve para verificar si la base responde correctamente.

---

```python
return {"status": "ok", "database": "connected"}
```

## Explicación
Si todo salió bien, devuelve:

```json
{
  "status": "ok",
  "database": "connected"
}
```

---

```python
except Exception as e:
```

## Explicación
Si algo falla dentro del `try`, Python entra acá.

- `Exception`
  significa cualquier error general.

- `as e`
  guarda el error en la variable `e`.

---

```python
raise HTTPException(
```

## Explicación
`raise` significa:

👉 “lanzar un error”.

Acá crean un error HTTP manualmente.

---

```python
status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
```

## Explicación
503 significa:

👉 “Servicio no disponible”.

Perfecto para indicar que la base de datos está caída.

---

```python
detail="Database unavailable",
```

## Explicación
Mensaje descriptivo del error.

El cliente recibirá:

```json
{
  "detail": "Database unavailable"
}
```

---

```python
) from e
```

## Explicación
Esto significa:

👉 “este error ocurrió a partir del error original `e`”.

Sirve para debugging y logs internos.
