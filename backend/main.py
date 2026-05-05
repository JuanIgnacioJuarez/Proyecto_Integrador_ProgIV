from contextlib import asynccontextmanager
import os
from decimal import Decimal

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session
from sqlmodel import SQLModel, select

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
from backend.modules.auth.models import Usuario
from backend.modules.auth.security import hash_password

# Routers
from backend.modules.health.routers import router as health_router
from backend.modules.categorias.routers import router as categoria_router
from backend.modules.ingredientes.routers import router as ingrediente_router
from backend.modules.productos.routers import router as producto_router
from backend.modules.auth.routers import router as auth_router

def seed_demo_data(session: Session) -> None:
    """
    Carga datos de ejemplo para la demo solo si no hay productos.
    """
    has_products = session.exec(select(Producto.id)).first()
    if has_products is not None:
        return

    cat_bebidas = Categoria(nombre="Bebidas", descripcion="Bebidas frías y calientes")
    cat_panaderia = Categoria(nombre="Panadería", descripcion="Productos horneados")
    cat_lacteos = Categoria(nombre="Lácteos", descripcion="Leches, quesos y derivados")
    session.add_all([cat_bebidas, cat_panaderia, cat_lacteos])

    ing_agua = Ingrediente(nombre="Agua")
    ing_cafe = Ingrediente(nombre="Café")
    ing_harina = Ingrediente(nombre="Harina de trigo")
    ing_leche = Ingrediente(nombre="Leche", es_alergeno=True)
    ing_azucar = Ingrediente(nombre="Azúcar")
    session.add_all([ing_agua, ing_cafe, ing_harina, ing_leche, ing_azucar])
    session.flush()

    prod_cafe = Producto(
        nombre="Café Latte",
        descripcion="Café con leche espumada",
        precio_base=Decimal("1800.00"),
        stock_cantidad=35,
        imagenes_url=[],
    )
    prod_pan = Producto(
        nombre="Pan Integral",
        descripcion="Pan artesanal de harina integral",
        precio_base=Decimal("1200.00"),
        stock_cantidad=50,
        imagenes_url=[],
    )
    prod_agua = Producto(
        nombre="Agua Mineral 500ml",
        descripcion="Agua sin gas",
        precio_base=Decimal("900.00"),
        stock_cantidad=80,
        imagenes_url=[],
    )
    session.add_all([prod_cafe, prod_pan, prod_agua])
    session.flush()

    session.add_all(
        [
            ProductoCategoriaLink(producto_id=prod_cafe.id, categoria_id=cat_bebidas.id, es_principal=True),
            ProductoCategoriaLink(producto_id=prod_pan.id, categoria_id=cat_panaderia.id, es_principal=True),
            ProductoCategoriaLink(producto_id=prod_agua.id, categoria_id=cat_bebidas.id, es_principal=True),
            ProductoIngredienteLink(producto_id=prod_cafe.id, ingrediente_id=ing_cafe.id, es_removible=False),
            ProductoIngredienteLink(producto_id=prod_cafe.id, ingrediente_id=ing_leche.id, es_removible=True),
            ProductoIngredienteLink(producto_id=prod_pan.id, ingrediente_id=ing_harina.id, es_removible=False),
            ProductoIngredienteLink(producto_id=prod_pan.id, ingrediente_id=ing_azucar.id, es_removible=True),
            ProductoIngredienteLink(producto_id=prod_agua.id, ingrediente_id=ing_agua.id, es_removible=False),
        ]
    )
    session.commit()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup: crea todas las tablas registradas en SQLModel.metadata.
    Shutdown: espacio para cerrar conexiones, caches, etc.
    """
    SQLModel.metadata.create_all(engine)

    default_admin_email = os.getenv("DEFAULT_ADMIN_EMAIL", "admin@foodstore.com")
    default_admin_password = os.getenv("DEFAULT_ADMIN_PASSWORD", "admin123")
    default_admin_name = os.getenv("DEFAULT_ADMIN_NAME", "Administrador")

    with Session(engine) as session:
        existing_admin = session.exec(
            select(Usuario).where(Usuario.email == default_admin_email)
        ).first()
        if not existing_admin:
            session.add(
                Usuario(
                    nombre=default_admin_name,
                    email=default_admin_email,
                    password_hash=hash_password(default_admin_password),
                    rol="ADMIN",
                )
            )
            session.commit()

        seed_demo_data(session)

    yield

app = FastAPI(
    title="Proyecto Integrador Programación IV",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(health_router)
app.include_router(auth_router)
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
