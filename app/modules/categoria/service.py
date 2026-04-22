from typing import List, Optional

from sqlmodel import Session

from .schemas import CategoriaCreate, CategoriaUpdate
from .models import Categoria


# ─── Create ──────────────────────────────────────────────────────────
def create_categoria(session: Session, data: CategoriaCreate) -> Categoria:
    return


# ─── Read ──────────────────────────────────────────────────────────
def get_categorias(session: Session) -> List[Categoria]:
    return

def get_categoria(session: Session, categoria_id: int) -> Optional[Categoria]:
    return

# ─── Update ──────────────────────────────────────────────────────────
def update_categoria(session: Session, categoria_id: int, data: CategoriaUpdate) -> Optional[Categoria]:
    return

# ─── Delete ──────────────────────────────────────────────────────────
def delete_categoria(session: Session, categoria_id: int) -> bool:
    return

