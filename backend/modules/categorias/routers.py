from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlmodel import Session

from backend.core.database import get_session
from backend.modules.auth.dependencies import require_admin
from backend.modules.auth.models import Usuario
from backend.modules.categorias.services import CategoriaService
from backend.modules.categorias.schemas import (
    CategoriaPaginatedResponse,
    CategoriaCreate,
    CategoriaRead,
    CategoriaReadFull,
    CategoriaUpdate,
)

router = APIRouter(prefix="/categorias", tags=["categorias"])

def get_categoria_service(session: Session = Depends(get_session)) -> CategoriaService:
    return CategoriaService(session)

# ─── CRUD ──────────────────────────────────────────────────────────────────

# ─── Create ────────────────────────────────────────────────────────────────
@router.post("/", response_model=CategoriaRead, status_code=status.HTTP_201_CREATED)
def create_categoria(
    categoria: CategoriaCreate,
    svc: CategoriaService = Depends(get_categoria_service),
    _: Usuario = Depends(require_admin),
):
    return svc.create(categoria)

# ─── Read ──────────────────────────────────────────────────────────────────
@router.get("/", response_model=CategoriaPaginatedResponse)
def list_categorias(
    parent_id: Optional[int] = Query(default=None, ge=1, description="Filtrar por categoría padre. Omitir para ver raíces."),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=100),
    svc: CategoriaService = Depends(get_categoria_service),
):
    return svc.get_all(parent_id=parent_id, offset=offset, limit=limit)

@router.get("/{categoria_id}", response_model=CategoriaReadFull)
def get_categoria(
    categoria_id: int,
    svc: CategoriaService = Depends(get_categoria_service),
):
    return svc.get_by_id(categoria_id)

# ─── Patch ─────────────────────────────────────────────────────────────────
@router.patch("/{categoria_id}", response_model=CategoriaRead)
def update_categoria(
    categoria_id: int,
    data: CategoriaUpdate,
    svc: CategoriaService = Depends(get_categoria_service),
    _: Usuario = Depends(require_admin),
):
    return svc.update(categoria_id, data)

# ─── Delete ────────────────────────────────────────────────────────────────
@router.delete("/{categoria_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_categoria(
    categoria_id: int,
    svc: CategoriaService = Depends(get_categoria_service),
    _: Usuario = Depends(require_admin),
):
    return svc.soft_delete(categoria_id)
