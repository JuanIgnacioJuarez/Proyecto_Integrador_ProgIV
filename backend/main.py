from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel

from backend.core.database import engine

# ── Importar TODOS los modelos antes de create_all ───────────────────────
# SQLModel necesita que las clases estén en memoria para crear las tablas.
# El orden importa: primero los modelos sin dependencias externas.

# Primero importamos tablas intermedias
from backend.core.links import ProductoCategoriaLink, ProductoIngredienteLink
# Luego importamos modelos principales
from backend.modules.categorias.models import Categoria
from backend.modules.ingredientes.models import Ingrediente
from backend.modules.productos.models import Producto

# Routers
from backend.modules.health.routers import router as health_router
from backend.modules.categorias.routers import router as categoria_router
from backend.modules.ingredientes.routers import router as ingrediente_router
from backend.modules.productos.routers import router as producto_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup: crea todas las tablas registradas en SQLModel.metadata.
    Shutdown: espacio para cerrar conexiones, caches, etc.
    """
    SQLModel.metadata.create_all(engine)
    yield

app = FastAPI(
    title="Proyecto Integrador Programación IV",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(health_router)
app.include_router(categoria_router)
app.include_router(ingrediente_router)
app.include_router(producto_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Puerto de React
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trigger reload
