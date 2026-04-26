from typing import List

from fastapi import APIRouter, Depends, status
from sqlmodel import Session

from app.core.database import get_session

from app.modules.categoria.service import CategoriaService
from app.modules.categoria.schemas import CategoriaCreate, CategoriaRead, CategoriaReadFull, CategoriaUpdate

router = APIRouter(prefix="/categorias", tags=["categorias"])

def get_categoria_service(session: Session = Depends(get_session)) -> CategoriaService:
    # Factory de dependencia: inyecta el servicio con su Session.
    return CategoriaService(session)

# ─── CRUD ──────────────────────────────────────────────────────────────────

# ─── Ceate ─────────────────────────────────────────────────────────────────
@router.post("/", response_model=CategoriaRead, status_code=status.HTTP_201_CREATED)
def create_categoria(
    categoria: CategoriaCreate,
    svc: CategoriaService = Depends(get_categoria_service)
    ):
    return svc.create(categoria)

# ─── Read ──────────────────────────────────────────────────────────────────
@router.get("/", response_model=List[CategoriaReadFull])
def list_categorias(
    svc: CategoriaService = Depends(get_categoria_service)
    ):
    return svc.get_all()

@router.get("/{categoria_id}", response_model=CategoriaReadFull)
def get_categoria(
    categoria_id: int, 
    svc: CategoriaService = Depends(get_categoria_service)
    ):
    return svc.get_by_id(categoria_id)

# ─── Patch ─────────────────────────────────────────────────────────────────
@router.patch("/{categoria_id}", response_model=CategoriaRead)
def update_categoria(
    categoria_id: int, 
    data: CategoriaUpdate, 
    svc: CategoriaService = Depends(get_categoria_service)
    ):
    return svc.update(categoria_id, data)

# ─── Delete ─────────────────────────────────────────────────────────────────
@router.delete("/{categoria_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_categoria(
    categoria_id: int,
    svc: CategoriaService = Depends(get_categoria_service)
    ):
    return svc.soft_delete(categoria_id)
