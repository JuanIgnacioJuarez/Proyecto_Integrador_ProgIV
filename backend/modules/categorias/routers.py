from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlmodel import Session

from backend.core.database import get_session
from backend.modules.auth.dependencies import require_admin
from backend.modules.auth.models import Usuario
from backend.modules.categorias.schemas import (
    CategoriaCreate,
    CategoriaPaginatedResponse,
    CategoriaRead,
    CategoriaReadFull,
    CategoriaUpdate,
)
from backend.modules.categorias.services import CategoriaService

router = APIRouter(prefix="/categorias", tags=["categorias"])


def get_categoria_service(session: Session = Depends(get_session)) -> CategoriaService:
    return CategoriaService(session)


@router.post("/", response_model=CategoriaRead, status_code=status.HTTP_201_CREATED)
def create_categoria(
    categoria: CategoriaCreate,
    svc: CategoriaService = Depends(get_categoria_service),
    _: Usuario = Depends(require_admin),
):
    return svc.create(categoria)


@router.get("/", response_model=CategoriaPaginatedResponse)
def list_categorias(
    parent_id: Optional[int] = Query(default=None, ge=1, description="Filtrar por categoria padre"),
    search: Optional[str] = Query(default=None, max_length=100, description="Busqueda por nombre"),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=100),
    svc: CategoriaService = Depends(get_categoria_service),
):
    return svc.get_all(parent_id=parent_id, search=search, offset=offset, limit=limit)


@router.get("/{categoria_id}", response_model=CategoriaReadFull)
def get_categoria(
    categoria_id: int,
    svc: CategoriaService = Depends(get_categoria_service),
):
    return svc.get_by_id(categoria_id)


@router.patch("/{categoria_id}", response_model=CategoriaRead)
def update_categoria(
    categoria_id: int,
    data: CategoriaUpdate,
    svc: CategoriaService = Depends(get_categoria_service),
    _: Usuario = Depends(require_admin),
):
    return svc.update(categoria_id, data)


@router.delete("/{categoria_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_categoria(
    categoria_id: int,
    svc: CategoriaService = Depends(get_categoria_service),
    _: Usuario = Depends(require_admin),
):
    return svc.soft_delete(categoria_id)
