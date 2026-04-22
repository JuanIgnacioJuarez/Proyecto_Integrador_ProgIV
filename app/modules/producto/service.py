from typing import List, Optional

from sqlmodel import Session

from .schemas import ProductoCreate, ProductoUpdate
from .models import Producto
from app.modules.categoria.models import Categoria

# ─── CRUD ────────────────────────────────────────────────────────────

# ─── Create ──────────────────────────────────────────────────────────
def create_producto(session: Session, data: ProductoCreate) -> Producto:
    return


# ─── Read ──────────────────────────────────────────────────────────
def get_productos(session: Session) -> List[Producto]:
    return

def get_producto(session: Session, producto_id: int) -> Optional[Producto]:
    return

# ─── Update ──────────────────────────────────────────────────────────
def update_producto(session: Session, producto_id: int, data: ProductoUpdate) -> Optional[Producto]:
    return

# ─── Delete ──────────────────────────────────────────────────────────
def delete_producto(session: Session, producto_id: int) -> bool:
    return


# ─── Operaciones N:M  Hero ↔ Team ─────────────────────────────────────────

# ─── Assing producto to categoria ────────────────────────────────────────────
def add_producto_to_categoria(session: Session, producto_id: int, categoria_id: int) -> Optional[Producto]:
    return

# ─── Remove producto from categoria ───────────────────────────────────────
def remove_producto_from_categoria(session: Session, producto_id: int, categoria_id: int) -> Optional[Producto]:
    return

# ─── Return producto - categorias ─────────────────────────────────────────
def get_producto_categorias(session: Session, producto_id: int) -> List[Categoria]:
    return