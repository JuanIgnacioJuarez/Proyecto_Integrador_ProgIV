# Explicación detallada del router de ingredientes

## from typing import Optional

- `from` significa “desde”.
- `typing` es una librería de Python que trae herramientas para aclarar qué tipo de dato espera el código.
- `import` significa “importar”.
- `Optional` significa “opcional”.

👉 Entonces esta línea dice:
“Traé `Optional` desde la librería `typing`”.

¿Para qué sirve `Optional`?
Sirve para indicar que una variable puede:
- tener un valor
- o no tener nada (`None`).

---

## from fastapi import APIRouter, Depends, Query

Acá estamos importando herramientas de FastAPI.

FastAPI es el framework que se usa para crear APIs.

👉 ¿Qué es una API?
Es un sistema que permite que otros programas se comuniquen con nuestro backend.

Por ejemplo:
- una app móvil
- un frontend
- Postman
- un navegador

pueden hacer pedidos a esta API.

### APIRouter

Sirve para crear rutas/endpoints.

Ejemplo:
- `/ingredientes`
- `/usuarios`

Es como un organizador de URLs.

### Depends

Sirve para inyección de dependencias.

👉 Básicamente significa:
“FastAPI se encarga de crear automáticamente algo que necesito”.

Por ejemplo:
- una conexión a la base de datos
- un servicio
- autenticación

### Query

Sirve para definir parámetros de consulta y validarlos.

Ejemplo:
`/ingredientes?limit=10`

---

## from sqlmodel import Session

- `sqlmodel` es la librería que conecta Python con la base de datos.
- `Session` representa una sesión/conexión activa con la base de datos.

👉 Una sesión sirve para:
- leer datos
- guardar datos
- actualizar
- borrar

---

## from backend.core.database import get_session

Acá estamos importando una función llamada `get_session`.

👉 Esa función probablemente crea y devuelve una conexión a la base de datos.

---

## from backend.modules.ingredientes.services import IngredienteService

Acá importamos `IngredienteService`.

👉 Un Service contiene la lógica de negocio.

Es decir:
- crear ingredientes
- buscarlos
- actualizarlos
- borrarlos

---

## router = APIRouter(prefix="/ingredientes", tags=["ingredientes"])

Acá se crea el router.

### prefix="/ingredientes"

Todas las rutas van a empezar con:
`/ingredientes`

### tags=["ingredientes"]

Sirve para organizar la documentación Swagger.

---

## def get_ingrediente_service(

Acá empieza una función.

Se llama `get_ingrediente_service`.

---

## session: Session = Depends(get_session),

Esta línea hace MUCHAS cosas.

- `session: Session`
  → La variable `session` será una conexión a la base de datos.

- `Depends(get_session)`
  → FastAPI ejecuta automáticamente `get_session()`.

---

## return IngredienteService(session)

Acá se crea y devuelve el service.

Le pasa la conexión a la base de datos.

---

## @router.post("/", response_model=IngredienteRead, status_code=201)

Este endpoint responde a requests POST.

Ruta:
`POST /ingredientes`

- `response_model=IngredienteRead`
  → Define cómo será la respuesta.

- `status_code=201`
  → Significa “creado correctamente”.

---

## def create_ingrediente(

Función que crea ingredientes.

---

## ingrediente: IngredienteCreate,

FastAPI espera recibir un JSON.

Ese JSON será validado usando `IngredienteCreate`.

---

## return svc.create(ingrediente)

Llama al método `create` del service.

---

## @router.get("/", response_model=IngredientePaginatedResponse)

Endpoint GET.

Ruta:
`GET /ingredientes`

Sirve para listar ingredientes.

---

## offset: int = Query(0, ge=0),

Parámetro de paginación.

- `0`
  → valor por defecto

- `ge=0`
  → debe ser mayor o igual a 0

---

## limit: int = Query(10, ge=1, le=100),

Cantidad máxima de resultados.

- mínimo 1
- máximo 100

---

## name: Optional[str] = None,

Filtro opcional.

Ejemplo:
`?name=tomate`

---

## total, items = svc.get_paginated(offset=offset, limit=limit, name=name)

Llama al service para obtener resultados paginados.

- `total`
  → cantidad total

- `items`
  → lista de ingredientes

---

## return {
    "total": total,
    "items": items,
}

FastAPI transforma esto automáticamente a JSON.

---

## @router.get("/{ingrediente_id}", response_model=IngredienteRead)

Endpoint para obtener UN ingrediente específico.

Ejemplo:
`/ingredientes/5`

---

## return svc.get_by_id(ingrediente_id)

Busca el ingrediente por ID y lo devuelve.

---

## @router.patch("/{ingrediente_id}", response_model=IngredienteRead)

PATCH se usa para actualizar parcialmente.

---

## return svc.update(ingrediente_id, data)

Actualiza el ingrediente usando el service.

---

## @router.delete("/{ingrediente_id}", status_code=204)

DELETE se usa para borrar.

- `204`
  → operación exitosa sin contenido.

---

## svc.soft_delete(ingrediente_id)

Hace un “soft delete”.

👉 No borra físicamente el dato de la base de datos.

Normalmente:
- lo marca como inactivo
- mantiene historial
- evita pérdida permanente

