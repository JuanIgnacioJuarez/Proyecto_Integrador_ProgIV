# Proyecto Integrador Programacion IV

Aplicacion full-stack para gestionar catalogo (productos, categorias e ingredientes), usuarios, carrito y pedidos.

## Integrantes
- Carretero, Ailen
- Juarez, Juan Ignacio
- Molina, Martina
- Videla, Mariano

## Video explicativo
1er parcial: https://drive.google.com/file/d/1JSKDJAo1_zfmf-EtmrlIIGym_oCSvQca/view
2do parcial: (agregar link)

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

2026 - Proyecto Integrador Prog IV
