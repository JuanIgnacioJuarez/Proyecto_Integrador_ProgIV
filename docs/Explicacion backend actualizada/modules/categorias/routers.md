# Explicación línea por línea — Router de Categorías (FastAPI)

```python
from typing import List
```
**Explicación:** importa `List`, que sirve para indicar que una respuesta será una **lista** de elementos. Por ejemplo, `List[CategoriaReadFull]` significa “una lista de categorías completas”.

```python
from fastapi import APIRouter, Depends, status
```
**Explicación:** importa herramientas de FastAPI. `APIRouter` permite crear un grupo de rutas. `Depends` sirve para inyectar dependencias automáticamente, como una sesión de base de datos o un servicio. `status` permite usar códigos HTTP de forma clara, por ejemplo `201 CREATED`.

```python
from sqlmodel import Session
```
**Explicación:** importa `Session`, que representa una conexión activa con la base de datos. Es el objeto que permite consultar, guardar, modificar o borrar datos.

```python
from backend.core.database import get_session
```
**Explicación:** importa la función `get_session`, que seguramente crea o entrega una sesión de base de datos para usar en cada petición.

```python
from backend.modules.categorias.services import CategoriaService
```
**Explicación:** importa el servicio de categorías. El servicio contiene la lógica principal: crear categorías, buscarlas, actualizarlas o eliminarlas.

```python
from backend.modules.categorias.schemas import CategoriaCreate, CategoriaRead, CategoriaReadFull, CategoriaUpdate
```
**Explicación:** importa los schemas de categoría. Los schemas son “moldes” que definen qué datos entran y qué datos salen. `CategoriaCreate` se usa para crear, `CategoriaUpdate` para actualizar, `CategoriaRead` para responder con datos básicos y `CategoriaReadFull` para responder con datos más completos.

```python
router = APIRouter(prefix="/categorias", tags=["categorias"])
```
**Explicación:** crea un router. `prefix="/categorias"` significa que todas las rutas de este archivo empiezan con `/categorias`. `tags=["categorias"]` agrupa estas rutas en la documentación automática de FastAPI.

```python
def get_categoria_service(session: Session = Depends(get_session)) -> CategoriaService:
```
**Explicación:** define una función que crea y devuelve un `CategoriaService`. La parte `session: Session = Depends(get_session)` significa que FastAPI va a llamar automáticamente a `get_session` para conseguir una sesión de base de datos.

```python
    # Factory de dependencia: inyecta el servicio con su Session.
```
**Explicación:** es un comentario. Dice que esta función funciona como una “fábrica” de dependencias: crea el servicio y le pasa la sesión de base de datos.

```python
    return CategoriaService(session)
```
**Explicación:** devuelve una instancia de `CategoriaService`, usando la sesión recibida. En simple: arma el servicio para que pueda trabajar con la base de datos.

```python
# ─── CRUD ──────────────────────────────────────────────────────────────────
```
**Explicación:** comentario separador. Indica que debajo están las operaciones CRUD: crear, leer, actualizar y eliminar.

```python
# ─── Ceate ─────────────────────────────────────────────────────────────────
```
**Explicación:** comentario separador para la parte de creación. Hay un error de escritura: debería decir `Create`, no `Ceate`.

```python
@router.post("/", response_model=CategoriaRead, status_code=status.HTTP_201_CREATED)
```
**Explicación:** define una ruta `POST`. Como el router ya tiene prefijo `/categorias`, esta ruta queda como `POST /categorias/`. Sirve para crear una categoría. `response_model=CategoriaRead` indica que la respuesta tendrá el formato de `CategoriaRead`. `status_code=status.HTTP_201_CREATED` indica que, si se crea correctamente, devuelve código HTTP 201.

```python
def create_categoria(
```
**Explicación:** empieza la función que se ejecuta cuando alguien llama a `POST /categorias/`.

```python
    categoria: CategoriaCreate,
```
**Explicación:** recibe los datos necesarios para crear una categoría. FastAPI espera que el cuerpo de la petición tenga la forma definida en `CategoriaCreate`.

```python
    svc: CategoriaService = Depends(get_categoria_service)
```
**Explicación:** recibe automáticamente un servicio de categorías. `Depends(get_categoria_service)` le dice a FastAPI: “antes de ejecutar esta función, creá o conseguí el servicio”.

```python
    ):
```
**Explicación:** cierra la definición de parámetros de la función.

```python
    return svc.create(categoria)
```
**Explicación:** llama al método `create` del servicio y le pasa la categoría recibida. Ese método se encarga de guardar la categoría en la base de datos y devolver el resultado.

```python
# ─── Read ──────────────────────────────────────────────────────────────────
```
**Explicación:** comentario separador para las rutas de lectura.

```python
@router.get("/", response_model=List[CategoriaReadFull])
```
**Explicación:** define una ruta `GET /categorias/`. Sirve para listar todas las categorías. `response_model=List[CategoriaReadFull]` indica que devuelve una lista de categorías completas.

```python
def list_categorias(
```
**Explicación:** empieza la función que se ejecuta cuando alguien pide la lista de categorías.

```python
    svc: CategoriaService = Depends(get_categoria_service)
```
**Explicación:** FastAPI inyecta automáticamente el servicio de categorías.

```python
    ):
```
**Explicación:** cierra los parámetros de la función.

```python
    return svc.get_all()
```
**Explicación:** llama al método `get_all` del servicio. Ese método debería buscar todas las categorías en la base de datos y devolverlas.

```python
@router.get("/{categoria_id}", response_model=CategoriaReadFull)
```
**Explicación:** define una ruta `GET /categorias/{categoria_id}`. El valor entre llaves es dinámico. Por ejemplo, `/categorias/3` busca la categoría con ID 3.

```python
def get_categoria(
```
**Explicación:** empieza la función que busca una categoría específica.

```python
    categoria_id: int, 
```
**Explicación:** recibe el ID de la categoría desde la URL. `int` indica que debe ser un número entero.

```python
    svc: CategoriaService = Depends(get_categoria_service)
```
**Explicación:** recibe automáticamente el servicio de categorías.

```python
    ):
```
**Explicación:** cierra los parámetros de la función.

```python
    return svc.get_by_id(categoria_id)
```
**Explicación:** llama al método `get_by_id` del servicio y le pasa el ID recibido. El servicio se encarga de buscar esa categoría en la base de datos.

```python
# ─── Patch ─────────────────────────────────────────────────────────────────
```
**Explicación:** comentario separador para la ruta de actualización parcial.

```python
@router.patch("/{categoria_id}", response_model=CategoriaRead)
```
**Explicación:** define una ruta `PATCH /categorias/{categoria_id}`. `PATCH` se usa para actualizar datos de forma parcial. Por ejemplo, cambiar solo el nombre de una categoría.

```python
def update_categoria(
```
**Explicación:** empieza la función que actualiza una categoría.

```python
    categoria_id: int, 
```
**Explicación:** recibe el ID de la categoría que se quiere modificar.

```python
    data: CategoriaUpdate, 
```
**Explicación:** recibe los datos nuevos para actualizar la categoría. Usa el schema `CategoriaUpdate`.

```python
    svc: CategoriaService = Depends(get_categoria_service)
```
**Explicación:** recibe automáticamente el servicio de categorías.

```python
    ):
```
**Explicación:** cierra los parámetros de la función.

```python
    return svc.update(categoria_id, data)
```
**Explicación:** llama al método `update` del servicio. Le pasa el ID de la categoría y los datos nuevos. El servicio busca la categoría, la modifica y devuelve el resultado.

```python
# ─── Delete ─────────────────────────────────────────────────────────────────
```
**Explicación:** comentario separador para la ruta de eliminación.

```python
@router.delete("/{categoria_id}", status_code=status.HTTP_204_NO_CONTENT)
```
**Explicación:** define una ruta `DELETE /categorias/{categoria_id}`. Sirve para eliminar una categoría. `status_code=status.HTTP_204_NO_CONTENT` indica que la operación fue exitosa pero no debería devolver contenido.

```python
def delete_categoria(
```
**Explicación:** empieza la función que elimina una categoría.

```python
    categoria_id: int,
```
**Explicación:** recibe el ID de la categoría que se quiere eliminar.

```python
    svc: CategoriaService = Depends(get_categoria_service)
```
**Explicación:** recibe automáticamente el servicio de categorías.

```python
    ):
```
**Explicación:** cierra los parámetros de la función.

```python
    return svc.soft_delete(categoria_id)
```
**Explicación:** llama al método `soft_delete`. Esto indica que probablemente no borra físicamente la categoría de la base de datos, sino que la marca como eliminada o inactiva.

---

# Resumen simple

| Método | Ruta | Función |
|---|---|---|
| POST | `/categorias/` | Crear una categoría |
| GET | `/categorias/` | Listar todas las categorías |
| GET | `/categorias/{categoria_id}` | Buscar una categoría por ID |
| PATCH | `/categorias/{categoria_id}` | Actualizar una categoría |
| DELETE | `/categorias/{categoria_id}` | Eliminar lógicamente una categoría |

La idea central es esta: el router recibe la petición, el servicio hace el trabajo, y los schemas controlan qué datos entran y salen.
