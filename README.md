# Proyecto Integrador Programacion IV

Aplicacion full-stack para gestionar catalogo (productos, categorias e ingredientes), usuarios, carrito y pedidos.

## Integrantes
- Carretero, Ailen
- Juarez, Juan Ignacio
- Molina, Martina
- Videla, Mariano

## Video explicativo
https://drive.google.com/file/d/1JSKDJAo1_zfmf-EtmrlIIGym_oCSvQca/view

---

## Stack

### Backend
- FastAPI (Python)
- SQLModel + PostgreSQL
- Arquitectura por modulos con Repository + Service + Unit of Work
- Soft delete en entidades principales

### Frontend
- React + TypeScript (Vite)
- TanStack Query + Axios
- React Router
- Tailwind CSS

---

## Requisitos previos
- Python 3.11+
- Node.js 18+
- Docker Desktop (opcional)
- PostgreSQL local (si no usas Docker)

---

## Variables de entorno

1. Copiar `.env.example` a `.env` en la raiz del repo.
2. Completar valores reales (DB, JWT, usuarios seed, etc).

Variables importantes:
- `DATABASE_URL`
- `VITE_API_URL`
- `CORS_ORIGINS` (lista separada por comas para frontend autorizado)
- `SECRET_KEY`
- `RUN_SEED_ON_STARTUP` (recomendado `false`)
- `COOKIE_SECURE`
- `COOKIE_SAMESITE`

Regla recomendada para cookies:
- Desarrollo local HTTP: `COOKIE_SECURE=false`, `COOKIE_SAMESITE=lax`
- Produccion HTTPS: `COOKIE_SECURE=true`, `COOKIE_SAMESITE=lax` o `none`

> Si usas `COOKIE_SAMESITE=none`, el backend fuerza `secure=true` por compatibilidad de navegador.

---

## Ejecutar en local (sin Docker)

### 1) Backend
```bash
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

Backend en: `http://localhost:8000`
Swagger: `http://localhost:8000/docs`

### 2) Seed manual (recomendado)
```bash
python -m backend.seeds.run
```

### 3) Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend en: `http://localhost:5173`

---

## Ejecutar con Docker (uso personal)

Desde la raiz del repo:

```bash
docker compose config
docker compose up -d --build
docker compose ps
```

Apagar stack:
```bash
docker compose down
```

Apagar stack y borrar volumen de DB:
```bash
docker compose down -v
```

Servicios por defecto:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- Postgres: `localhost:5438`

---

## Comandos de validacion recomendados

### Backend
```bash
python -m compileall backend
```

### Frontend
```bash
cd frontend
npm run build
npm run lint
```

---

## Notas funcionales actuales
- API versionada en `/api/v1`
- Auth con cookies httpOnly + refresh token
- Fallback auth: Bearer token o cookie
- Carrito persistente en `localStorage`
- Creacion de pedidos sin pasarela de pago
- RBAC por roles (`ADMIN`, `STOCK`, `PEDIDOS`, `CLIENT`)
- Paginacion y filtros de catalogo desde backend
- Seed desacoplado del startup (controlado por `RUN_SEED_ON_STARTUP`)

---

## Estructura general
```text
backend/
  core/
  modules/
  seeds/
  main.py

frontend/src/
  app/
  pages/
  features/
  entities/
  shared/
```

---

## Seguridad y secretos
Checklist minimo para entrega:
1. Confirmar que `.env` no esta versionado.
2. Rotar `SECRET_KEY` y passwords por defecto.
3. No reutilizar credenciales del entorno local en produccion.
4. Revisar `COOKIE_SECURE`/`COOKIE_SAMESITE` segun entorno.

---

2026 - Proyecto Integrador Prog IV
