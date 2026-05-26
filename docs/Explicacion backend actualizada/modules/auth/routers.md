# Explicación línea por línea - FastAPI Auth Router

```python
from fastapi import APIRouter, Depends, status
```

## Explicación detallada
Esta línea le dice a Python que importe herramientas que vienen desde una librería llamada FastAPI.

FastAPI es un framework, es decir, un conjunto de herramientas ya preparadas para crear APIs y servidores web de forma rápida.

La palabra `from` significa “desde”.

La palabra `import` significa “traer” o “importar”.

Entonces esta línea está diciendo:

“Desde FastAPI quiero usar APIRouter, Depends y status”.

### ¿Qué es cada cosa?

- `APIRouter` → sirve para organizar rutas de la API.
- `Depends` → sirve para manejar dependencias automáticamente.
- `status` → contiene códigos HTTP ya preparados.

---

```python
from sqlmodel import Session
```

## Explicación detallada
Esta línea importa `Session` desde SQLModel.

`Session` representa una conexión activa con la base de datos.

Gracias a la sesión el programa puede:
- consultar datos
- guardar datos
- modificar datos
- eliminar datos

---

```python
from backend.core.database import get_session
```

## Explicación detallada
Aquí se importa una función llamada `get_session`.

La función probablemente:
- abre una conexión a la base de datos
- crea una sesión
- devuelve esa sesión

---

```python
from backend.modules.auth.dependencies import get_current_user
```

## Explicación detallada
Aquí se importa una función llamada `get_current_user`.

Su trabajo normalmente es:
- leer el token JWT
- validar el token
- buscar el usuario
- devolver el usuario autenticado

---

```python
from backend.modules.auth.models import Usuario
```

## Explicación detallada
Aquí se importa el modelo `Usuario`.

Un modelo representa una tabla de la base de datos.

Por ejemplo:
- id
- nombre
- email
- contraseña
- rol

---

```python
from backend.modules.auth.schemas import LoginRequest, RegisterRequest, TokenResponse, UserResponse
```

## Explicación detallada
Aquí se importan varios schemas.

Los schemas sirven para:
- validar datos
- definir entradas
- definir respuestas

### Schemas importados

- `LoginRequest` → datos del login
- `RegisterRequest` → datos del registro
- `TokenResponse` → respuesta del login
- `UserResponse` → respuesta de usuario

---

```python
from backend.modules.auth.services import AuthService
```

## Explicación detallada
Aquí se importa `AuthService`.

Un service contiene la lógica importante del sistema.

Por ejemplo:
- registrar usuarios
- validar contraseñas
- generar tokens
- iniciar sesión

---

```python
router = APIRouter(prefix="/auth", tags=["auth"])
```

## Explicación detallada
Aquí se crea un router.

### prefix="/auth"
Todas las rutas comenzarán con:

```txt
/auth
```

### tags=["auth"]
Sirve para agrupar endpoints en Swagger.

---

```python
def get_auth_service(session: Session = Depends(get_session)) -> AuthService:
```

## Explicación detallada
Aquí se define una función llamada `get_auth_service`.

### session: Session
Indica que la función necesita una sesión de base de datos.

### Depends(get_session)
FastAPI ejecuta automáticamente `get_session`.

### -> AuthService
Indica que la función devolverá un `AuthService`.

---

```python
return AuthService(session)
```

## Explicación detallada
Aquí se crea un objeto `AuthService` usando la sesión de base de datos.

---

```python
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
```

## Explicación detallada
Esto crea el endpoint:

```txt
/auth/register
```

### POST
Se usa para crear datos.

### response_model=UserResponse
La respuesta tendrá estructura `UserResponse`.

### status_code=201
Indica “creado correctamente”.

---

```python
def register_user(data: RegisterRequest, svc: AuthService = Depends(get_auth_service)):
```

## Explicación detallada
Esta función maneja el registro de usuarios.

### data: RegisterRequest
Recibe los datos enviados desde el cliente.

### svc: AuthService
Recibe automáticamente el servicio de autenticación.

---

```python
return svc.register(data)
```

## Explicación detallada
Aquí se ejecuta el método `register()`.

Probablemente:
- valide datos
- verifique emails
- encripte contraseñas
- guarde usuarios

---

```python
@router.post("/login", response_model=TokenResponse)
```

## Explicación detallada
Esto crea el endpoint:

```txt
/auth/login
```

La respuesta será un `TokenResponse`.

---

```python
def login_user(data: LoginRequest, svc: AuthService = Depends(get_auth_service)):
```

## Explicación detallada
Esta función maneja el login.

Recibe:
- email
- contraseña

Y también el servicio de autenticación.

---

```python
return svc.login(data)
```

## Explicación detallada
Aquí se ejecuta el método `login()`.

Probablemente:
- valida usuario
- verifica contraseña
- genera token JWT

---

```python
@router.get("/me", response_model=UserResponse)
```

## Explicación detallada
Esto crea el endpoint:

```txt
/auth/me
```

Sirve para obtener información del usuario autenticado.

---

```python
def get_me(current_user: Usuario = Depends(get_current_user)):
```

## Explicación detallada
Aquí FastAPI ejecuta `get_current_user`.

El usuario autenticado queda guardado en `current_user`.

---

```python
return UserResponse(
```

## Explicación detallada
Aquí se crea un objeto `UserResponse`.

---

```python
id=current_user.id,
```

## Explicación detallada
Toma el ID del usuario autenticado.

---

```python
nombre=current_user.nombre,
```

## Explicación detallada
Toma el nombre del usuario.

---

```python
email=current_user.email,
```

## Explicación detallada
Toma el email del usuario.

---

```python
rol=current_user.rol,
```

## Explicación detallada
Toma el rol del usuario.

---

```python
)
```

## Explicación detallada
Aquí termina la creación del objeto `UserResponse`.

FastAPI lo convierte automáticamente en JSON.
