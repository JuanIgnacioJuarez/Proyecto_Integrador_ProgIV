from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.core.database import get_session
from app.core.database import get_session

from app.modules.categoria import service
from app.modules.categoria.schemas import CategoriaCreate, CategoriaRead, CategoriaReadFull, CategoriaUpdate

router = APIRouter(prefix="/categorias", tags=["categorias"])

# ─── CRUD ──────────────────────────────────────────────────────────────────

# ─── Ceate ─────────────────────────────────────────────────────────────────
@router.post("/", response_model=CategoriaRead, status_code=201)
def create_categoria(categoria: CategoriaCreate, session: Session = Depends(get_session)):
    return service.create_categoria(session, categoria)

# ─── Read ──────────────────────────────────────────────────────────────────
@router.get("/", response_model=List[CategoriaReadFull])
def list_categorias(session: Session = Depends(get_session)):
    return service.get_categorias(session)

@router.get("/{categoria_id}", response_model=CategoriaReadFull)
def get_categoria(categoria_id: int, session: Session = Depends(get_session)):
    categoria = service.get_categoria(session, categoria_id)
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoria not found")
    return categoria

# ─── Patch ─────────────────────────────────────────────────────────────────
@router.patch("/{categoria_id}", response_model=CategoriaRead)
def update_categoria(
    categoria_id: int, data: CategoriaUpdate, session: Session = Depends(get_session)
):
    categoria = service.update_categoria(session, categoria_id, data)
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoria not found")
    return categoria

# ─── Delete ─────────────────────────────────────────────────────────────────
@router.delete("/{categoria_id}", status_code=204)
def delete_categoria(categoria_id: int, session: Session = Depends(get_session)):
    if not service.delete_categoria(session, categoria_id):
        raise HTTPException(status_code=404, detail="Categoria not found")
