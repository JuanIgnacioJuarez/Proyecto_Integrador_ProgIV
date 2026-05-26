# Explicación línea por línea del código con Pydantic

```python
from pydantic import BaseModel, EmailStr, Field
```

## Explicación:
Esta línea le dice a Python:
“Necesito traer herramientas de la librería `pydantic` para poder crear modelos de datos y validarlos”.

Ahora vamos parte por parte:

- `from`
Significa:
“desde”.

- `pydantic`
Es una librería de Python.
Se usa muchísimo en FastAPI porque sirve para:
- validar datos,
- controlar tipos,
- verificar que lo que envía el usuario sea correcto.

Por ejemplo:
- verificar que un email tenga formato válido,
- que una contraseña tenga mínimo 6 caracteres,
- que un número realmente sea número.

- `import`
Significa:
“importar” o “traer”.

- `BaseModel`
Es la clase base que usa Pydantic para crear modelos.

Un modelo es como una “plantilla” o “molde” de datos.

Por ejemplo:
Si alguien se registra, vos esperás:
- nombre,
- email,
- contraseña.

Entonces hacés un modelo que defina exactamente eso.

- `EmailStr`
Es un tipo especial de dato.
Sirve para validar emails automáticamente.

Por ejemplo:

✅ válido:
```python
"juan@gmail.com"
```

❌ inválido:
```python
"juan"
```

Si el usuario escribe algo inválido, FastAPI devuelve error automáticamente.

- `Field`
Sirve para agregar reglas o restricciones a un dato.

Por ejemplo:
```python
password: str = Field(min_length=6)
```

Eso significa:
“La contraseña debe tener mínimo 6 caracteres”.

---

```python
class LoginRequest(BaseModel):
```

## Explicación:
Acá estás creando una clase llamada `LoginRequest`.

Una clase es como una estructura o molde.

En este caso, este molde representa:
“los datos que necesito para iniciar sesión”.

- `class`
Palabra reservada de Python para crear clases.

- `LoginRequest`
Es el nombre de la clase.

Se llama así porque representa:
una petición (`Request`) de login.

- `(BaseModel)`
Significa que esta clase hereda de `BaseModel`.

Gracias a eso:
Pydantic puede validar automáticamente los datos.

---

```python
    email: EmailStr
```

## Explicación:
Esta línea define un atributo llamado `email`.

- `email`
Es el nombre del campo.

- `:`
Significa:
“este dato debe ser de este tipo”.

- `EmailStr`
Indica que debe ser un email válido.

Por ejemplo:

✅ válido:
```python
"maria@gmail.com"
```

❌ inválido:
```python
"maria"
```

Si el usuario manda algo inválido:
FastAPI responde automáticamente con error.

---

```python
    password: str = Field(min_length=6, max_length=128)
```

## Explicación:
Acá se define el campo contraseña.

- `password`
Nombre del campo.

- `: str`
Significa que debe ser texto (`string`).

- `= Field(...)`
Acá se agregan reglas especiales.

- `min_length=6`
La contraseña debe tener mínimo 6 caracteres.

Ejemplo:
❌
```python
"123"
```

✅
```python
"123456"
```

- `max_length=128`
La contraseña puede tener máximo 128 caracteres.

Esto ayuda a:
- validar datos,
- evitar errores,
- mejorar seguridad.

---

```python
class RegisterRequest(BaseModel):
```

## Explicación:
Acá se crea otra clase/modelo.

Esta vez representa:
“los datos necesarios para registrarse”.

La diferencia con login:
en login normalmente pedís:
- email,
- password.

En registro pedís:
- nombre,
- email,
- password.

---

```python
    nombre: str = Field(min_length=2, max_length=120)
```

## Explicación:
Define el campo `nombre`.

- `nombre`
Nombre del usuario.

- `: str`
Debe ser texto.

- `Field(...)`
Se agregan validaciones.

- `min_length=2`
El nombre debe tener al menos 2 caracteres.

❌
```python
"A"
```

✅
```python
"Juan"
```

- `max_length=120`
El nombre puede tener máximo 120 caracteres.

Esto evita datos absurdamente largos.

---

```python
    email: EmailStr
```

## Explicación:
Igual que antes.

El email:
- debe existir,
- debe tener formato válido.

---

```python
    password: str = Field(min_length=6, max_length=128)
```

## Explicación:
Igual que en login.

La contraseña:
- debe ser texto,
- mínimo 6 caracteres,
- máximo 128.

---

```python
class UserResponse(BaseModel):
```

## Explicación:
Ahora se crea un modelo distinto.

Este modelo NO representa datos que envía el usuario.

Representa datos que el servidor devuelve como respuesta (`Response`).

O sea:
esto es lo que el backend le manda al frontend.

---

```python
    id: int
```

## Explicación:
Campo `id`.

- `id`
Es el identificador del usuario.

- `: int`
Debe ser un número entero.

Ejemplo:
```python
1
2
3
```

Normalmente viene de la base de datos.

---

```python
    nombre: str
```

## Explicación:
Campo nombre del usuario.

Debe ser texto.

---

```python
    email: EmailStr
```

## Explicación:
Campo email del usuario.

Se mantiene como `EmailStr` para garantizar formato válido.

---

```python
    rol: str
```

## Explicación:
Campo rol del usuario.

Ejemplos:
```python
"admin"
"cliente"
"usuario"
```

Sirve para permisos y autorización.

---

```python
class TokenResponse(BaseModel):
```

## Explicación:
Este modelo representa la respuesta del login exitoso.

Cuando el usuario inicia sesión correctamente:
el backend devuelve un token.

Ese token sirve para:
- autenticar al usuario,
- saber quién está logueado,
- proteger rutas privadas.

---

```python
    access_token: str
```

## Explicación:
Campo que contiene el token.

Es texto.

Ejemplo:
```python
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Generalmente es un JWT.

---

```python
    token_type: str = "bearer"
```

## Explicación:
Define el tipo de token.

- `token_type`
Nombre del campo.

- `: str`
Es texto.

- `= "bearer"`
Valor por defecto.

Normalmente en autenticación JWT se usa:
```python
Bearer TOKEN
```

Por eso se guarda `"bearer"`.

---

```python
    user: UserResponse
```

## Explicación:
Acá estás diciendo:
“además del token, también voy a devolver información del usuario”.

Y esa información debe seguir el modelo:
```python
UserResponse
```

O sea:
el campo `user` debe tener:
- id,
- nombre,
- email,
- rol.

Ejemplo completo de respuesta:

```json
{
  "access_token": "abc123",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "nombre": "Juan",
    "email": "juan@gmail.com",
    "rol": "admin"
  }
}
```

Esto permite que el frontend:
- guarde el token,
- conozca al usuario logueado,
- muestre nombre,
- controle permisos,
- etc.
