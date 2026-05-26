from contextlib import asynccontextmanager
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, SQLModel

from backend.core.database import engine
from backend.core.links import ProductoCategoriaLink, ProductoIngredienteLink  
from backend.modules.admin.routers import router as admin_router
from backend.modules.auth.models import RefreshToken, Usuario  
from backend.modules.auth.routers import router as auth_router
from backend.modules.categorias.models import Categoria 
from backend.modules.categorias.routers import router as categoria_router
from backend.modules.direcciones.models import DireccionEntrega  
from backend.modules.direcciones.routers import router as direcciones_router
from backend.modules.health.routers import router as health_router
from backend.modules.ingredientes.models import Ingrediente  
from backend.modules.ingredientes.routers import router as ingrediente_router
from backend.modules.pedidos.models import (  
    DetallePedido,
    EstadoPedido,
    FormaPago,
    HistorialEstadoPedido,
    Pedido,
)
from backend.modules.pedidos.routers import router as pedidos_router
from backend.modules.productos.models import Producto  
from backend.modules.productos.routers import router as producto_router
from backend.seeds.bootstrap import run_all_seeds


def _env_flag(name: str, default: str = "false") -> bool:
    value = os.getenv(name, default).strip().lower()
    return value in ("1", "true", "yes", "on")


def _env_list(name: str, default: str = "") -> list[str]:
    raw = os.getenv(name, default)
    return [item.strip() for item in raw.split(",") if item.strip()]


@asynccontextmanager
async def lifespan(app: FastAPI):
    SQLModel.metadata.create_all(engine)

    if _env_flag("RUN_SEED_ON_STARTUP", "false"):
        with Session(engine) as session:
            run_all_seeds(session)

    yield


app = FastAPI(
    title="Proyecto Integrador Programacion IV",
    version="1.0.0",
    lifespan=lifespan,
)

API_V1_PREFIX = "/api/v1"

app.include_router(health_router, prefix=API_V1_PREFIX)
app.include_router(auth_router, prefix=API_V1_PREFIX)
app.include_router(categoria_router, prefix=API_V1_PREFIX)
app.include_router(ingrediente_router, prefix=API_V1_PREFIX)
app.include_router(producto_router, prefix=API_V1_PREFIX)
app.include_router(direcciones_router, prefix=API_V1_PREFIX)
app.include_router(pedidos_router, prefix=API_V1_PREFIX)
app.include_router(admin_router, prefix=API_V1_PREFIX)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_env_list(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173",
    ),
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
