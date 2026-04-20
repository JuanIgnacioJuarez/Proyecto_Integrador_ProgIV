from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlmodel import SQLModel

from app.core.database import engine

# ── Importar TODOS los modelos antes de create_all ───────────────────────
# SQLModel necesita que las clases estén en memoria para crear las tablas.
# El orden importa: primero los modelos sin dependencias externas.

# Primero importamos tablas intermedias
from app.core.links import ProductoCategoriaLink, ProductoIngredienteLink
# Luego importamos modelos principales
from app.modules.categoria.models import Categoria
from app.modules.ingrediente.models import Ingrediente
from app.modules.producto.models import Producto

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
