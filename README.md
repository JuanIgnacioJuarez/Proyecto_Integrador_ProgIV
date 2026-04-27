# Proyecto Integrador Programacion IV

API REST construida con FastAPI + SQLModel para gestionar:
- Categorias
- Ingredientes
- Productos

## Menu

- [Requisitos](#requisitos)
- [1) Crear y activar entorno virtual](#1-crear-y-activar-entorno-virtual)
- [2) Instalar dependencias](#2-instalar-dependencias)
- [3) Configurar variables de entorno](#3-configurar-variables-de-entorno)
- [4) Ejecutar la API](#4-ejecutar-la-api)
- [5) Verificacion rapida](#5-verificacion-rapida)
- [6) Datos de prueba y orden recomendado](#6-datos-de-prueba-y-orden-recomendado-manual-desde-swagger)
- [7) Como ver la base de datos](#7-como-ver-la-base-de-datos)
- [Estructura principal](#estructura-principal)
- [MODIFICACIONES](#modificaciones)

## Requisitos

- Python 3.11+ (recomendado 3.12/3.13)
- PostgreSQL en ejecucion

## 1) Crear y activar entorno virtual

### Windows (PowerShell)
```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

## 2) Instalar dependencias

```bash
pip install -r requirements.txt
```

## 3) Configurar variables de entorno

El proyecto usa `.env`. Debe contener al menos:

```env
POSTGRES_USER=tu_usuario
POSTGRES_PASSWORD=tu_password
POSTGRES_DB=tu_base
# Opcional: si se define, tiene prioridad
DATABASE_URL=postgresql://usuario:password@localhost:5432/tu_base
```

Si `DATABASE_URL` no existe, se arma automaticamente con `POSTGRES_USER`, `POSTGRES_PASSWORD` y `POSTGRES_DB`.

## 4) Ejecutar la API

Desde la raiz del proyecto:

```bash
uvicorn app.main:app --reload
```

Servidor local:
- API: `http://127.0.0.1:8000`
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

## 5) Verificacion rapida

- Health app:
  - `GET /health/`
- Health DB:
  - `GET /health/db`

Si la DB esta caida o inaccesible, `GET /health/db` responde `503`.

## 6) Datos de prueba y orden recomendado (manual desde Swagger)

Importante:
- Para ejecutar requests usar `http://127.0.0.1:8000/docs` (Swagger UI).
- ReDoc (`/redoc`) solo documenta, no ejecuta.

### Paso 1: Health
1. `GET /health/` -> esperar `200` con `{"status":"ok"}`
2. `GET /health/db` -> esperar `200` con DB conectada

### Paso 2: Categorias (CRUD + soft delete)
1. `POST /categorias/`
```json
{
  "nombre": "Bebidas",
  "descripcion": "Categoria de bebidas",
  "imagen_url": "https://ejemplo.com/bebidas.jpg",
  "parent_id": null,
  "is_active": true
}
```
2. Guardar el `id` devuelto (ejemplo: `categoria_id = 1`)
3. `GET /categorias/` (debe aparecer)
4. `PATCH /categorias/{categoria_id}`
```json
{
  "descripcion": "Categoria de bebidas frias y calientes"
}
```
5. `DELETE /categorias/{categoria_id}` -> esperar `204`
6. `GET /categorias/{categoria_id}` -> esperar `404`

### Paso 3: Ingredientes (CRUD + paginado + filtro)
1. `POST /ingredientes/`
```json
{
  "nombre": "Azucar",
  "descripcion": "Endulzante",
  "es_alergeno": false
}
```
2. `POST /ingredientes/`
```json
{
  "nombre": "Leche",
  "descripcion": "Lacteo",
  "es_alergeno": true
}
```
3. `GET /ingredientes/?offset=0&limit=10` -> validar `total` e `items`
4. `GET /ingredientes/?offset=0&limit=10&name=Le` -> debe filtrar por nombre
5. Guardar `id` de Leche (ejemplo: `ingrediente_id = 2`)
6. `PATCH /ingredientes/{ingrediente_id}`
```json
{
  "descripcion": "Lacteo descremado"
}
```
7. `DELETE /ingredientes/{ingrediente_id}` -> esperar `204`
8. `GET /ingredientes/{ingrediente_id}` -> esperar `404`

### Paso 4: Productos + relaciones N:M
1. Crear nueva categoria activa (porque la anterior se elimino):
`POST /categorias/`
```json
{
  "nombre": "Cafeteria",
  "descripcion": "Bebidas de cafeteria",
  "imagen_url": null,
  "parent_id": null,
  "is_active": true
}
```
2. Crear ingrediente activo:
`POST /ingredientes/`
```json
{
  "nombre": "Cafe",
  "descripcion": "Cafe molido",
  "es_alergeno": false
}
```
3. Guardar IDs devueltos (ejemplo: `categoria_id = 2`, `ingrediente_id = 3`)
4. `POST /productos/`
```json
{
  "nombre": "Cafe con leche",
  "descripcion": "Taza mediana",
  "precio_base": 1500,
  "categorias": [
    {
      "categoria_id": 2,
      "es_principal": true
    }
  ],
  "ingredientes": [
    {
      "ingrediente_id": 3,
      "es_removible": false
    }
  ]
}
```
Nota: reemplazar `2` y `3` por los IDs reales de tu entorno.

5. Guardar `producto_id` (ejemplo: `1`)
6. `GET /productos/{producto_id}` -> validar categorias e ingredientes
7. `GET /productos/{producto_id}/categorias` -> validar `es_principal`
8. `PATCH /productos/{producto_id}`
```json
{
  "precio_base": 1700,
  "descripcion": "Taza mediana grande"
}
```
9. `DELETE /productos/{producto_id}/categorias/{categoria_id}` -> esperar `200`
10. `DELETE /productos/{producto_id}` -> esperar `204`
11. `GET /productos/{producto_id}` -> esperar `404`

### Paso 5: Errores esperados
- Duplicar `nombre` en categoria o ingrediente -> `409`
- Enviar body con formato incorrecto (ejemplo: lista en vez de objeto en PATCH) -> `422`
- Usar IDs inexistentes en GET/PATCH/DELETE -> `404`

## 7) Como ver la base de datos

### Opcion A: desde VS Code (SQLTools)
1. Instalar extension `SQLTools`.
2. Instalar extension `SQLTools PostgreSQL/Cockroach Driver`.
3. Abrir `Ctrl+Shift+P` -> `SQLTools: Add New Connection`.
4. Completar:
   - Host: `localhost`
   - Port: `5436` (o el puerto que tengas en Docker)
   - Database: `project` (o la DB de tu `POSTGRES_DB`)
   - Username: `postgres`
   - Password: `postgres`
5. Conectar y ejecutar queries.

### Opcion B: desde terminal (VS Code o PowerShell)
```powershell
docker compose -f docker-compose.yml exec db psql -U postgres -d project
```

Consultas utiles:
```sql
\dt
SELECT * FROM categoria;
SELECT * FROM ingrediente;
SELECT * FROM producto;
SELECT * FROM producto_categoria;
SELECT * FROM producto_ingrediente;
```

Salir de `psql`:
```sql
\q
```

### Opcion C: cliente grafico (DBeaver/pgAdmin)
- Host: `localhost`
- Port: `5436`
- Database: `project`
- User: `postgres`
- Password: `postgres`

## Estructura principal

```text
app/
  core/                # DB, repositorio base, UoW, tablas link
  modules/
    categoria/         # CRUD categoria
    ingrediente/       # CRUD ingrediente
    producto/          # CRUD producto + relaciones N:M
    health/            # checks de salud
  main.py              # inicializacion FastAPI y routers
```

## MODIFICACIONES

- Ubicacion de cada modificacion (hacer click para redirigir al codigo):
  - [health/router.py linea 22](app/modules/health/router.py#L22)
  - [ingrediente/models.py linea 32](app/modules/ingrediente/models.py#L32)
  - [ingrediente/repository.py linea 41](app/modules/ingrediente/repository.py#L41)
  - [ingrediente/repository.py linea 51](app/modules/ingrediente/repository.py#L51)
  - [ingrediente/router.py linea 20](app/modules/ingrediente/router.py#L20)
  - [ingrediente/service.py linea 69](app/modules/ingrediente/service.py#L69)
  - [producto/router.py linea 21](app/modules/producto/router.py#L21)
  - [producto/router.py linea 71](app/modules/producto/router.py#L71)
  - [producto/service.py linea 68](app/modules/producto/service.py#L68)
  - [producto/service.py linea 120](app/modules/producto/service.py#L120)
  - [producto/service.py linea 178](app/modules/producto/service.py#L178)
