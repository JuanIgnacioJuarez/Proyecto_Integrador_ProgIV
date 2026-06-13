# Proyecto Integrador Programacion IV

Aplicacion full-stack para gestionar catalogo (productos, categorias e ingredientes), usuarios, carrito y pedidos.
Incluye seguimiento en tiempo real por WebSocket, estadisticas operativas, trazabilidad de pagos MercadoPago y subida de imagenes local con soporte Cloudinary por variables de entorno.

## Integrantes
- Carretero, Ailen
- Juarez, Juan Ignacio
- Molina, Martina
- Videla, Mariano

## Video explicativo
- 1er parcial: https://drive.google.com/file/d/1JSKDJAo1_zfmf-EtmrlIIGym_oCSvQca/view
- 2do parcial: https://drive.google.com/file/d/1qZGvc7xBBIVg0atL5PLxly6GslSLPNx3/view?usp=drivesdk
- INTEGRADOR:

---

## Stack

### Backend
- FastAPI (Python)
- SQLModel + PostgreSQL
- Arquitectura por modulos con Repository + Service + Unit of Work
- Soft delete en entidades principales
- WebSocket para cambios de estado de pedidos
- MercadoPago con tabla de pagos e idempotency key
- Cloudinary opcional para imagenes de productos

### Frontend
- React + TypeScript (Vite)
- TanStack Query + Axios
- React Router
- Tailwind CSS
- Recharts para dashboard de estadisticas

---

## Como correr el proyecto

- [Con Docker](#opcion-1-con-docker-recomendado)
- [En local](#opcion-2-local-sin-docker)

Antes de ejecutar, revisar la seccion [Variables de entorno](#variables-de-entorno). En ambos modos se parte copiando `.env.example` a `.env`.

### Opcion 1: con Docker (recomendado)

Desde una terminal en la carpeta donde quieras bajar el proyecto:

```bash
git clone https://github.com/JuanIgnacioJuarez/Proyecto_Integrador_ProgIV.git
cd Proyecto_Integrador_ProgIV
cp .env.example .env
docker compose up -d --build
docker compose ps
```

En Windows PowerShell, si `cp` no esta disponible, copiar el archivo de variables con:

```powershell
Copy-Item .env.example .env
```

#### Seed inicial con Docker

El seed no se ejecuta automaticamente por defecto porque en `.env.example` viene:

```env
RUN_SEED_ON_STARTUP=false
```

Para que se carguen usuarios demo, roles, catalogos y datos iniciales al levantar Docker por primera vez, cambiar en `.env`:

```env
RUN_SEED_ON_STARTUP=true
```

Luego ejecutar:

```bash
docker compose up -d --build
```

Si el stack ya estaba levantado o la base ya existia, tambien se puede correr el seed manualmente:

```bash
docker compose exec backend python -m backend.seeds.run
```

Servicios por defecto:
- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend: [http://localhost:8000](http://localhost:8000)
- Swagger: [http://localhost:8000/docs](http://localhost:8000/docs)
- PGAdmin: [http://localhost:5050](http://localhost:5050)

Acceso PGAdmin:
- Email: valor de `PGADMIN_DEFAULT_EMAIL` en `.env`.
- Password: valor de `PGADMIN_DEFAULT_PASSWORD` en `.env`.

Para conectar la base desde PGAdmin:
- Host: `db`
- Port: `5432`
- Database: valor de `POSTGRES_DB` en `.env`.
- User: valor de `POSTGRES_USER` en `.env`.
- Password: valor de `POSTGRES_PASSWORD` en `.env`.

Si ya tenes otro PGAdmin usando el puerto `5050`, cambiar `PGADMIN_PORT` en `.env` antes de levantar Docker.

--

Usuarios demo creados por seed:
- Administrador: `admin@foodstore.com` / `admin123`
- Gestor de stock: `stock@foodstore.com` / `stock123`
- Gestor de pedidos: `pedidos@foodstore.com` / `pedidos123`
- Cliente: `cliente@foodstore.com` / `cliente123`

Los tests no se ejecutan automaticamente con `docker compose up`. Para correrlos con Docker, ejecutar:

```bash
docker compose exec backend pytest tests
```

Apagar stack:

```bash
docker compose down
```

Apagar stack y borrar volumen de base de datos:

```bash
docker compose down -v
```
---

### Opcion 2: Local (sin Docker)

Primero copiar variables de entorno y revisar la seccion [Variables de entorno](#variables-de-entorno):

```bash
cp .env.example .env
```

En Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

#### 1) Backend

Luego de clonar el repositorio, posicionarse en la ruta raíz del proyecto (`cd Proyecto_Integrador_ProgIV`) para ejecutar los siguientes comandos:

```bash
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

- Backend: [http://localhost:8000](http://localhost:8000)
- Swagger: [http://localhost:8000/docs](http://localhost:8000/docs)

#### 2) Seed manual

```bash
python -m backend.seeds.run
```

#### 3) Tests backend

```bash
pytest tests
```

#### 4) Frontend

```bash
cd frontend
npm install
npm run dev
```

- Frontend: [http://localhost:5173](http://localhost:5173)

---

## Variables de entorno

El archivo `.env.example` trae valores de desarrollo. Para una maquina limpia:

1. Copiar `.env.example` a `.env`.
2. Cambiar secretos reales solo si se van a probar servicios externos.
3. Mantener `COOKIE_SECURE=false` y `COOKIE_SAMESITE=lax` en local.

Variables principales:
- `SECRET_KEY`: clave para firmar JWT. En produccion debe ser larga y privada.
- `DATABASE_URL`: conexion a PostgreSQL. Con Docker el backend usa el servicio `db`; sin Docker puede apuntar a `localhost:5438`.
- `PGADMIN_DEFAULT_EMAIL`, `PGADMIN_DEFAULT_PASSWORD`, `PGADMIN_PORT`: credenciales y puerto local del PGAdmin incluido en Docker.
- `RUN_SEED_ON_STARTUP`: si vale `true`, el backend ejecuta el seed al iniciar. Por defecto esta en `false`.
- `VITE_API_URL`: origen HTTP del backend.
- `VITE_WS_URL`: endpoint WebSocket para notificaciones de pedidos.
- `MP_ACCESS_TOKEN`: token privado de MercadoPago.
- `MP_WEBHOOK_SECRET`: secreto opcional para validar webhooks.
- `BACKEND_URL`: URL publica del backend para webhooks/redirects de MercadoPago. En local con ngrok usar la URL `https://...ngrok-free.app`.
- `FRONTEND_URL`: URL del frontend para volver desde MercadoPago.
- `NGROK_AUTHTOKEN`: token de ngrok si se usa el servicio `ngrok` del compose.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: si estan presentes, las imagenes se suben a Cloudinary; si no, se usa almacenamiento local.

---

## Comandos de validacion recomendados

### Backend
```bash
python -m compileall backend
pytest tests
```

### Frontend
```bash
cd frontend
npm run build
npm run lint
```

## Estructura general
```text
backend/                         # API FastAPI y logica del servidor
  core/                          # Configuracion base, DB, UnitOfWork, WebSocket y compatibilidad de esquema
  modules/                       # Modulos funcionales del dominio
    admin/                       # Gestion administrativa de usuarios y recursos
    auth/                        # Login, JWT, refresh tokens, roles y permisos
    categorias/                  # CRUD y jerarquia de categorias
    direcciones/                 # Direcciones asociadas a usuarios/clientes
    estadisticas/                # Consultas y endpoints del dashboard
    health/                      # Endpoints de salud del backend
    ingredientes/                # CRUD de ingredientes, stock y alergenos
    pagos/                       # Integracion MercadoPago, preferencias, webhooks y pagos
    pedidos/                     # Carrito confirmado, estados, historial y detalle de pedidos
    productos/                   # Catalogo de productos, stock, imagenes y asociaciones
    uploads/                     # Subida de imagenes local o Cloudinary
    ws/                          # Endpoint WebSocket para avisos en tiempo real
  seeds/                         # Carga inicial de roles, usuarios demo, catalogos y datos de prueba
  img/                           # Imagenes locales cuando no se usa Cloudinary
  main.py                        # Entrada principal de FastAPI

frontend/                        # Aplicacion React + Vite
  public/                        # Assets publicos estaticos
  src/
    api/                         # Clientes HTTP y funciones para consumir endpoints
    components/                  # Componentes reutilizables de layout/UI
    context/                     # Providers globales de auth, catalogo y carrito
    features/                    # Componentes agrupados por funcionalidad
      categorias/                # Grilla, formulario y modales de categorias
      productos/                 # Grilla, tabla y formulario de productos
      ingredientes/              # Grilla y formulario de ingredientes
      usuarios/                  # Componentes de gestion de usuarios
    hooks/                       # Hooks de permisos, auth, carrito y WebSocket
    models/                      # Tipos y modelos usados por el frontend
    pages/                       # Pantallas principales de la aplicacion
    reducers/                    # Reducers usados por contextos de catalogo
    routes/                      # Guards de autenticacion y roles

docker/                          # Dockerfile de base de datos y configuraciones auxiliares
docs/                            # Documentacion tecnica, ERD y material de entrega
tests/                           # Tests automatizados del backend
docker-compose.yml               # Orquestacion local de DB, backend, frontend, PGAdmin y ngrok
requirements.txt                 # Dependencias Python
```

2026 - Proyecto Integrador Prog IV - CodeCrafters</>
