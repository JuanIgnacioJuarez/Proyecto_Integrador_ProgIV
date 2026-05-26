# Explicación línea por línea - AuthService

```python
from datetime import datetime
```

- `from` significa “desde”.
- `datetime` es una librería de Python relacionada con fechas y horas.
- `import` sirve para traer algo y poder usarlo.
- Esta línea importa la clase `datetime`.

Ejemplo:
```python
datetime.utcnow()
```

Obtiene la fecha y hora actual.

---

```python
from fastapi import HTTPException, status
```

- Importa herramientas desde FastAPI.

## HTTPException
Sirve para lanzar errores HTTP.

Ejemplo:
```python
raise HTTPException(status_code=404)
```

## status
Contiene códigos HTTP ya preparados.

Ejemplo:
```python
status.HTTP_401_UNAUTHORIZED
```

---

```python
from sqlmodel import Session
```

- `Session` representa una conexión activa con la base de datos.
- Permite:
  - consultar,
  - guardar,
  - modificar,
  - eliminar datos.

---

```python
from backend.core.unit_of_work import UnitOfWork
```

- Importa `UnitOfWork`.
- Es un patrón para manejar transacciones de base de datos.
- Si algo falla, los cambios pueden deshacerse.

---

```python
from backend.modules.auth.models import Usuario
```

- Importa el modelo `Usuario`.
- Un modelo representa una tabla de la base de datos.

---

```python
from backend.modules.auth.schemas import LoginRequest, RegisterRequest, TokenResponse, UserResponse
```

## LoginRequest
Datos que llegan al login.

## RegisterRequest
Datos necesarios para registrarse.

## TokenResponse
Respuesta del login.

## UserResponse
Datos seguros del usuario para devolver al frontend.

---

```python
from backend.modules.auth.security import create_access_token, hash_password, verify_password
```

## create_access_token
Crea un token JWT.

## hash_password
Convierte una contraseña en hash.

## verify_password
Compara contraseña ingresada con contraseña guardada.

---

```python
class AuthService:
```

- `class` crea una clase.
- `AuthService` maneja autenticación y registro.

---

```python
def __init__(self, session: Session) -> None:
```

## __init__
Constructor de la clase.

## self
Representa el objeto actual.

## session: Session
Recibe una sesión de base de datos.

## -> None
No devuelve nada.

---

```python
self._session = session
```

- Guarda la sesión dentro del objeto.

---

```python
def register(self, data: RegisterRequest) -> UserResponse:
```

- Método para registrar usuarios.
- Recibe datos de registro.
- Devuelve un `UserResponse`.

---

```python
with UnitOfWork(self._session) as uow:
```

- Abre una unidad de trabajo.
- `uow` será la variable usada para operar.

---

```python
existing = uow.usuarios.get_by_email(data.email)
```

- Busca un usuario por email.

---

```python
if existing:
```

- Verifica si el usuario ya existe.

---

```python
raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El email ya está registrado")
```

- Lanza error 409.
- Significa conflicto porque el email ya existe.

---

```python
user = Usuario(
```

- Crea un nuevo objeto usuario.

---

```python
nombre=data.nombre,
```

- Guarda el nombre.

---

```python
email=data.email,
```

- Guarda el email.

---

```python
password_hash=hash_password(data.password),
```

- Hashea la contraseña antes de guardarla.

---

```python
rol="ADMIN",
```

- Asigna rol ADMIN.

---

```python
uow.usuarios.add(user)
```

- Guarda el usuario en la base de datos.

---

```python
return UserResponse(id=user.id, nombre=user.nombre, email=user.email, rol=user.rol)
```

- Devuelve los datos del usuario.
- No devuelve la contraseña.

---

```python
def login(self, data: LoginRequest) -> TokenResponse:
```

- Método para login.
- Devuelve un token.

---

```python
user = uow.usuarios.get_by_email(data.email)
```

- Busca usuario por email.

---

```python
invalid_error = HTTPException(
```

- Crea un error reutilizable.

---

```python
status_code=status.HTTP_401_UNAUTHORIZED,
```

- Error 401.
- Significa no autorizado.

---

```python
detail="Credenciales inválidas",
```

- Mensaje del error.

---

```python
if not user or not user.is_active:
```

- Verifica:
  - si el usuario no existe,
  - o si está inactivo.

---

```python
raise invalid_error
```

- Lanza el error.

---

```python
if not verify_password(data.password, user.password_hash):
```

- Verifica contraseña.

---

```python
user.updated_at = datetime.utcnow()
```

- Actualiza fecha de modificación/login.

---

```python
uow.usuarios.add(user)
```

- Guarda cambios.

---

```python
token = create_access_token(user_id=user.id, email=user.email, rol=user.rol)
```

- Crea token JWT.

---

```python
return TokenResponse(
```

- Devuelve respuesta del login.

---

```python
access_token=token,
```

- Incluye el token.

---

```python
user=UserResponse(id=user.id, nombre=user.nombre, email=user.email, rol=user.rol),
```

- Devuelve datos del usuario.

