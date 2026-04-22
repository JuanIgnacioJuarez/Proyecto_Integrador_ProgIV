from typing import List, Optional, Tuple
from datetime import datetime

from sqlmodel import Session, select, func

from .schemas import IngredienteCreate, IngredienteUpdate
from .models import Ingrediente


# ─── Create ──────────────────────────────────────────────────────────
def create_ingrediente(session: Session, data: IngredienteCreate) -> Ingrediente:
    ingrediente = Ingrediente.model_validate(data)
    session.add(ingrediente)
    session.commit()
    session.refresh(ingrediente)
    return ingrediente


# ─── Read ──────────────────────────────────────────────────────────
def get_ingredientes(
    session: Session,
    offset: int = 0,
    limit: int = 100,
    name: Optional[str] = None,
) -> Tuple[int, List[Ingrediente]]:
    statement = select(Ingrediente)
    count_statement = select(func.count(Ingrediente.id))
    
    if name:
        statement = statement.where(Ingrediente.nombre.ilike(f"%{name}%"))
        count_statement = count_statement.where(Ingrediente.nombre.ilike(f"%{name}%"))
        
    total = session.exec(count_statement).one()
    
    statement = statement.offset(offset).limit(limit)
    ingredientes = session.exec(statement).all()
    
    return total, list(ingredientes)

def get_ingrediente(session: Session, ingrediente_id: int) -> Optional[Ingrediente]:
    return session.get(Ingrediente, ingrediente_id)

# ─── Update ──────────────────────────────────────────────────────────
def update_ingrediente(session: Session, ingrediente_id: int, data: IngredienteUpdate) -> Optional[Ingrediente]:
    ingrediente = session.get(Ingrediente, ingrediente_id)
    if not ingrediente:
        return None
        
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(ingrediente, key, value)
        
    ingrediente.updated_at = datetime.utcnow()
    
    session.add(ingrediente)
    session.commit()
    session.refresh(ingrediente)
    return ingrediente

# ─── Delete ──────────────────────────────────────────────────────────
def delete_ingrediente(session: Session, ingrediente_id: int) -> bool:
    ingrediente = session.get(Ingrediente, ingrediente_id)
    if not ingrediente:
        return False
        
    session.delete(ingrediente)
    session.commit()
    return True