# Explicación detallada del router de productos

## Línea 1
```python
from typing import List
```
Esta línea importa `List` desde una librería de Python llamada `typing`.
`typing` se usa para indicar “qué tipo de dato” esperamos usar.
Por ejemplo:
- `int` → números enteros
- `str` → texto
- `List` → listas

Acá `List` se usa después para decirle al programa que una función devuelve una lista de productos.

Es solamente una ayuda para organizar mejor el código y hacerlo más entendible.

---

## Línea 2
```python
from fastapi import APIRouter, Depends
```
Esta línea importa dos herramientas de FastAPI:
- `APIRouter`
- `Depends`

`APIRouter` sirve para crear rutas o endpoints de la API.

Por ejemplo:
- `/productos`
- `/usuarios`
- `/categorias`

Es como un organizador de rutas.

`Depends` sirve para inyectar dependencias.
Eso significa que FastAPI puede “dar automáticamente” algo que una función necesita.

En este caso más adelante se usa para pasar automáticamente:
- la conexión a la base de datos
- el servicio de productos

---

## Línea 3
```python
from sqlmodel import Session
```
Acá se importa `Session` desde SQLModel.

`Session` representa la conexión activa con la base de datos.

Es el objeto que permite:
- guardar datos
- buscar datos
- actualizar datos
- borrar datos

Sin una `Session`, el programa no podría hablar con PostgreSQL o cualquier base de datos.

---

## Línea 4
```python
from backend.core.database import get_session
```
Esta línea importa la función `get_session`.

`get_session` probablemente está creada en otro archivo del proyecto.

Su trabajo es:
- abrir una conexión a la base de datos
- entregarla
- y después cerrarla correctamente

Es una forma ordenada y segura de manejar conexiones.

---

## Línea 5
```python
from backend.modules.productos.services import ProductoService
```
Acá se importa `ProductoService`.

El `Service` es la capa donde está la lógica del negocio.

Por ejemplo:
- crear productos
- validarlos
- actualizarlos
- eliminarlos
- relacionarlos con categorías

El router NO hace toda la lógica.
El router solamente recibe peticiones y llama al service.

Eso mantiene el código más limpio y profesional.
