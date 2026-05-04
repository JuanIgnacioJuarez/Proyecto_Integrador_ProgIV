# Proyecto Integrador Programación IV

Aplicación web completa (Full-Stack) para la gestión de un panel de control y catálogo de productos, ingredientes y categorías.

## Integrantes
- Carretero, Ailen
- Juarez, Juan Ignacio
- Molina, Martina
- Videla, Mariano

## Link al video con la explicación
https://drive.google.com/file/d/1JSKDJAo1_zfmf-EtmrlIIGym_oCSvQca/view

---

## Tecnologías Utilizadas

### Backend
- **Framework**: FastAPI (Python)
- **ORM / Base de Datos**: SQLModel + PostgreSQL
- **Arquitectura**: Basada en módulos y patrones de diseño (Repositorio, Servicio, UoW). Soporta borrado lógico (Soft Delete).

### Frontend
- **Librería Core**: React 18 + TypeScript
- **Bundler**: Vite
- **Estilos**: TailwindCSS
- **Enrutamiento**: React Router DOM v6
- **Arquitectura**: [Feature-Sliced Design (FSD)](https://feature-sliced.design/) - modularizada en `app`, `pages`, `features`, `entities`, y `shared`.

---

## Requisitos Previos

- **Python**: 3.11+ (Recomendado 3.12/3.13)
- **Node.js**: v18+ (y npm o yarn)
- **Base de Datos**: PostgreSQL en ejecución

---

## 🚀 Instalación y Ejecución

### 1. Configurar Variables de Entorno

En la raíz del proyecto, crea un archivo `.env` para la base de datos:

```env
POSTGRES_USER=tu_usuario
POSTGRES_PASSWORD=tu_password
POSTGRES_DB=tu_base
# Opcional (Sobrescribe las credenciales de arriba):
DATABASE_URL=postgresql://tu_usuario:tu_password@localhost:5432/tu_base

# Frontend (Se usa automáticamente en Vite)
VITE_API_URL=http://localhost:8000
```

### 2. Ejecutar el Backend (FastAPI)

1. Abrir una terminal en la raíz del proyecto.
2. Crear y activar el entorno virtual:
   ```bash
   python -m venv .venv
   # Windows PowerShell
   .venv\Scripts\Activate.ps1
   # Linux / Mac
   source .venv/bin/activate
   ```
3. Instalar dependencias de Python:
   ```bash
   pip install -r requirements.txt
   ```
4. Levantar el servidor:
   ```bash
   uvicorn backend.main:app --reload
   ```
   *El backend correrá en: `http://localhost:8000`*
   *Documentación Swagger: `http://localhost:8000/docs`*

### 3. Ejecutar el Frontend (React + Vite)

1. Abrir otra terminal y navegar a la carpeta frontend:
   ```bash
   cd frontend
   ```
2. Instalar las dependencias de Node:
   ```bash
   npm install
   ```
3. Levantar el entorno de desarrollo:
   ```bash
   npm run dev
   ```
   *El frontend correrá típicamente en: `http://localhost:5173`*

---

## Estructura del Proyecto

### Backend
```text
backend/
  core/                # Configuración BD, Repositorio base, Unit of Work (UoW)
  modules/
    categorias/        # CRUD categoría
    ingredientes/      # CRUD ingrediente
    productos/         # CRUD producto + relaciones
    health/            # Endpoint de salud de BD
  main.py              # Inicialización de FastAPI y routers
```

### Frontend (Feature-Sliced Design)
```text
frontend/src/
  app/                 # Proveedores, Enrutador principal, Layout global
  pages/               # Páginas completas (Home, Productos, Categorias, etc.)
  features/            # Componentes complejos y formularios (Grillas, FormularioProducto)
  entities/            # Lógica de negocio (Contextos, Reducers, Interfaces)
  shared/              # UI genérica (Card, Button, NavBar, Iconos)
```

## Características de la Aplicación

- **Interfaz Moderna**: Navegación en páginas (`react-router-dom`), menús adaptables y grillas modulares.
- **Formularios Dinámicos**: Precarga de información en vistas de edición usando hooks interactivos.
- **Relaciones Complejas**: Asignación de ingredientes (con alerta de alérgenos) y múltiples categorías a un producto.
- **Gestión Segura de Datos**: Soft deletes implementados en backend. Las entidades no se eliminan físicamente.
- **Paginado y Filtrado**: Implementado tanto del lado del servidor como del cliente para vistas de alto rendimiento.

---
*2026 - Panel de Gestión, Proyecto Integrador Prog IV*
