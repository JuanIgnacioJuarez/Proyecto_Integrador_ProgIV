# Explicación línea por línea del código de autenticación JWT en Python

```python
import os
```
Esta línea importa el módulo llamado `os`. Un módulo es un conjunto de herramientas ya preparadas de Python. En este caso, `os` sirve para interactuar con el sistema operativo, por ejemplo leer variables de entorno, acceder a carpetas, archivos, etc.

```python
from datetime import datetime, timedelta, timezone
```
Acá estamos importando herramientas relacionadas con fechas y horas:
- `datetime` sirve para obtener la fecha y hora actual.
- `timedelta` sirve para sumar o restar tiempo, por ejemplo 30 minutos.
- `timezone` sirve para trabajar correctamente con zonas horarias como UTC.

```python
import jwt
```
Esta línea importa la librería `jwt`, que sirve para crear y leer tokens JWT.
Un JWT (JSON Web Token) es como un “documento digital de identidad” que se usa mucho en login y autenticación.
Cuando un usuario inicia sesión, el backend puede generar un token para decir:
“Este usuario ya se autenticó correctamente”.

```python
from passlib.context import CryptContext
```
Acá se importa `CryptContext` desde la librería `passlib`.
Esta herramienta sirve para encriptar (hashear) contraseñas de forma segura.

Muy importante:
Las contraseñas NUNCA deberían guardarse como texto normal en una base de datos.
En vez de guardar:
```text
123456
```
se guarda algo parecido a:
```text
$pbkdf2-sha256$29000$A8...
```
Eso protege la seguridad de los usuarios.

```python
# Usamos pbkdf2_sha256 para evitar problemas de compatibilidad de bcrypt
# en algunos entornos locales de Windows.
```
Estas dos líneas son comentarios.
Los comentarios empiezan con `#` y Python los ignora.
Sirven para explicar el código.

Acá el programador está aclarando que usa `pbkdf2_sha256` porque `bcrypt` a veces da problemas en Windows.

```python
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
```
Acá se crea una configuración llamada `pwd_context`.

Vamos por partes:
- `CryptContext(...)` crea un sistema para manejar contraseñas.
- `schemes=["pbkdf2_sha256"]` indica qué algoritmo de encriptación se va a usar.
- `deprecated="auto"` significa que si en el futuro el algoritmo queda viejo o inseguro, el sistema podrá manejarlo automáticamente.

En otras palabras:
Esta línea prepara la “máquina” que después va a encriptar y verificar contraseñas.

```python
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
```
Esta línea busca una variable de entorno llamada `"SECRET_KEY"`.

Las variables de entorno son configuraciones guardadas fuera del código.
Sirven para guardar información sensible sin escribirla directamente en el programa.

`os.getenv()` funciona así:
- Primero intenta buscar `"SECRET_KEY"` en el sistema.
- Si no existe, usa `"dev-secret-change-me"` como valor por defecto.

La `SECRET_KEY` es una clave secreta usada para firmar tokens JWT.
Sirve para evitar que alguien falsifique tokens.

```python
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
```
Acá se obtiene el algoritmo que se usará para firmar el JWT.

- Busca la variable `"JWT_ALGORITHM"`.
- Si no existe, usa `"HS256"`.

`HS256` es uno de los algoritmos más comunes para JWT.

```python
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
```
Esta línea define cuánto tiempo dura el token antes de vencer.

Paso a paso:
- Busca `"JWT_ACCESS_TOKEN_EXPIRE_MINUTES"`.
- Si no existe, usa `"30"`.
- `int(...)` convierte el texto `"30"` en número entero `30`.

Entonces:
El token expirará en 30 minutos.

```python
def hash_password(password: str) -> str:
```
Acá se define una función llamada `hash_password`.

Una función es un bloque de código reutilizable.

Esta función:
- recibe una contraseña (`password`)
- devuelve una contraseña hasheada/encriptada

`password: str`
significa:
“password debe ser un texto”.

`-> str`
significa:
“la función devolverá un texto”.

```python
    return pwd_context.hash(password)
```
Esta línea ejecuta el hash de la contraseña.

- `pwd_context.hash(...)` toma la contraseña original.
- la transforma en un hash seguro.
- `return` devuelve el resultado.

Ejemplo:
```python
"123456"
```
puede transformarse en:
```python
"$pbkdf2-sha256$29000$..."
```

```python
def verify_password(plain_password: str, hashed_password: str) -> bool:
```
Acá se define otra función llamada `verify_password`.

Esta función sirve para comprobar si una contraseña es correcta.

Recibe:
- `plain_password` → contraseña escrita por el usuario.
- `hashed_password` → contraseña guardada en la base de datos.

`-> bool`
significa que devolverá:
- `True` (verdadero)
o
- `False` (falso)

```python
    return pwd_context.verify(plain_password, hashed_password)
```
Esta línea compara ambas contraseñas.

El sistema:
- toma la contraseña ingresada
- la hashea internamente
- compara el resultado con el hash guardado

Si coinciden:
```python
True
```

Si no coinciden:
```python
False
```

```python
def create_access_token(*, user_id: int, email: str, rol: str) -> str:
```
Esta función crea un token JWT.

Recibe:
- `user_id`
- `email`
- `rol`

El `*` significa que esos parámetros deben pasarse obligatoriamente con nombre.

O sea:
Esto está bien:
```python
create_access_token(user_id=1, email="a@gmail.com", rol="admin")
```

Esto NO:
```python
create_access_token(1, "a@gmail.com", "admin")
```

`-> str`
indica que devolverá un texto.
Ese texto será el JWT.

```python
    now = datetime.now(timezone.utc)
```
Acá se obtiene la fecha y hora actual en UTC.

UTC es una zona horaria universal usada mucho en servidores.

Ejemplo:
```python
2026-05-08 12:30:00 UTC
```

```python
    payload = {
```
Acá comienza un diccionario llamado `payload`.

Un diccionario guarda datos en formato:
```python
clave: valor
```

El payload es la información que se meterá dentro del token JWT.

```python
        "sub": str(user_id),
```
`sub` significa “subject” (sujeto).

Normalmente representa el ID del usuario.

`str(user_id)` convierte el número en texto.

Ejemplo:
```python
1 → "1"
```

```python
        "email": email,
```
Guarda el email del usuario dentro del token.

```python
        "rol": rol,
```
Guarda el rol del usuario.
Por ejemplo:
```python
admin
cliente
empleado
```

```python
        "iat": int(now.timestamp()),
```
`iat` significa:
“Issued At” → momento en que el token fue creado.

`timestamp()` convierte la fecha en un número universal de segundos.

Ejemplo:
```python
1715160000
```

`int(...)` elimina decimales.

```python
        "exp": int((now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)).timestamp()),
```
`exp` significa:
“Expiration” → momento en que el token vence.

Paso a paso:
- `timedelta(minutes=...)` crea un período de tiempo.
- `now + timedelta(...)` suma minutos a la fecha actual.
- `.timestamp()` convierte esa fecha en segundos.
- `int(...)` convierte el resultado en entero.

Entonces:
Si el token dura 30 minutos:
- se guarda la hora actual
- se guarda también la hora de vencimiento

```python
    }
```
Acá termina el diccionario `payload`.

```python
    return jwt.encode(payload, SECRET_KEY, algorithm=JWT_ALGORITHM)
```
Esta línea crea finalmente el JWT.

`jwt.encode(...)`:
- toma el payload
- usa la clave secreta
- usa el algoritmo configurado
- genera el token firmado

El resultado suele verse así:
```text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Ese token luego se envía al frontend.

```python
def decode_access_token(token: str) -> dict:
```
Esta función sirve para leer y validar un token JWT.

Recibe:
- `token` → el JWT

Devuelve:
- un diccionario (`dict`) con la información interna del token.

```python
    return jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
```
Esta línea:
- verifica si el token es válido
- comprueba la firma usando la `SECRET_KEY`
- usa el algoritmo configurado
- devuelve el contenido interno del token

Si el token fue modificado o venció:
la librería lanzará un error.

Si todo está bien:
devuelve algo así:
```python
{
    "sub": "1",
    "email": "admin@gmail.com",
    "rol": "admin",
    "iat": 1715160000,
    "exp": 1715161800
}
```
