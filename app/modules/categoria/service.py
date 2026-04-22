from typing import List, Optional
from datetime import datetime

from sqlmodel import Session, select

from .schemas import CategoriaCreate, CategoriaUpdate
from .models import Categoria


# ─── Create ──────────────────────────────────────────────────────────
def create_categoria(session: Session, data: CategoriaCreate) -> Categoria:
    categoria = Categoria.model_validate(data)
    session.add(categoria)
    session.commit()
    session.refresh(categoria)
    return categoria


# ─── Read ──────────────────────────────────────────────────────────
def get_categorias(session: Session) -> List[Categoria]:
    statement = select(Categoria).where(Categoria.deleted_at == None)
    return session.exec(statement).all()

def get_categoria(session: Session, categoria_id: int) -> Optional[Categoria]:
    statement = select(Categoria).where(Categoria.id == categoria_id, Categoria.deleted_at == None)
    return session.exec(statement).first()

# ─── Update ──────────────────────────────────────────────────────────
def update_categoria(session: Session, categoria_id: int, data: CategoriaUpdate) -> Optional[Categoria]:
    statement = select(Categoria).where(Categoria.id == categoria_id, Categoria.deleted_at == None)
    categoria = session.exec(statement).first()
    if not categoria:
        return None
        
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(categoria, key, value)
        
    categoria.updated_at = datetime.utcnow()
    
    session.add(categoria)
    session.commit()
    session.refresh(categoria)
    return categoria

# ─── Delete ──────────────────────────────────────────────────────────
def delete_categoria(session: Session, categoria_id: int) -> bool:
    statement = select(Categoria).where(Categoria.id == categoria_id, Categoria.deleted_at == None)
    categoria = session.exec(statement).first()
    if not categoria:
        return False
        
    categoria.deleted_at = datetime.utcnow()
    session.add(categoria)
    session.commit()
    return True
