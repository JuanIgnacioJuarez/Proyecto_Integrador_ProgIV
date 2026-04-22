from typing import List, Optional, Tuple

from sqlmodel import Session

from .schemas import IngredienteCreate, IngredienteUpdate
from .models import Ingrediente


# ─── Create ──────────────────────────────────────────────────────────
def create_ingrediente(session: Session, data: IngredienteCreate) -> Ingrediente:
    return Ingrediente


# ─── Read ──────────────────────────────────────────────────────────
def get_ingredientes(
    session: Session,
    offset: int = 0,
    limit: int = 100,
    name: Optional[str] = None,
) -> Tuple[int, List[Ingrediente]]:
    return

def get_ingrediente(session: Session, ingrediente_id: int) -> Optional[Ingrediente]:
    return

# ─── Update ──────────────────────────────────────────────────────────
def update_ingrediente(session: Session, ingrediente_id: int, data: IngredienteUpdate) -> Optional[Ingrediente]:
    return

# ─── Delete ──────────────────────────────────────────────────────────
def delete_ingrediente(session: Session, ingrediente_id: int) -> bool:
    return