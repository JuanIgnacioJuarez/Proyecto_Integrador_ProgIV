from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from backend.core.database import get_session
from backend.modules.auth.dependencies import require_admin, require_admin_or_stock
from backend.modules.auth.models import Usuario
from backend.modules.productos.services import ProductoService
from backend.modules.productos.schemas import (
    ProductoCreate,
    ProductoDisponibilidadUpdate,
    ProductoPaginatedResponse,
    ProductoRead,
    ProductoReadFull,
    ProductoCategoriaAssign,
    ProductoUpdate,
    CategoriaBasicRead,
)

router = APIRouter(prefix="/productos", tags=["productos"])


def get_producto_service(session: Session = Depends(get_session)) -> ProductoService:
    return ProductoService(session)


@router.post("/", response_model=ProductoRead, status_code=201)
def create_producto(
    producto: ProductoCreate,
    svc: ProductoService = Depends(get_producto_service),
    _: Usuario = Depends(require_admin),
):
    return svc.create(producto)


@router.get("/", response_model=ProductoPaginatedResponse)
def list_productos(
    categoria_id: Optional[int] = Query(default=None, ge=1, description="Filtrar por categoría"),
    disponible: Optional[bool] = Query(default=None, description="Filtrar por disponibilidad"),
    search: Optional[str] = Query(default=None, max_length=100, description="Búsqueda por nombre o descripción"),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=100),
    svc: ProductoService = Depends(get_producto_service),
):
    return svc.get_all(
        categoria_id=categoria_id,
        disponible=disponible,
        search=search,
        offset=offset,
        limit=limit,
    )


@router.get("/{producto_id}", response_model=ProductoReadFull)
def get_producto(
    producto_id: int,
    svc: ProductoService = Depends(get_producto_service),
):
    return svc.get_by_id(producto_id)


@router.patch("/{producto_id}", response_model=ProductoRead)
def update_producto(
    producto_id: int,
    data: ProductoUpdate,
    svc: ProductoService = Depends(get_producto_service),
    _: Usuario = Depends(require_admin),
):
    return svc.update(producto_id, data)


@router.patch("/{producto_id}/disponibilidad", response_model=ProductoRead)
def set_disponibilidad(
    producto_id: int,
    body: ProductoDisponibilidadUpdate,
    svc: ProductoService = Depends(get_producto_service),
    _: Usuario = Depends(require_admin_or_stock),
):
    return svc.set_disponibilidad(producto_id, body.disponible)


@router.delete("/{producto_id}", status_code=204)
def delete_producto(
    producto_id: int,
    svc: ProductoService = Depends(get_producto_service),
    _: Usuario = Depends(require_admin),
):
    svc.soft_delete(producto_id)


@router.post("/{producto_id}/categorias", response_model=ProductoReadFull)
def assign_to_categoria(
    producto_id: int,
    body: ProductoCategoriaAssign,
    svc: ProductoService = Depends(get_producto_service),
    _: Usuario = Depends(require_admin),
):
    return svc.add_to_categoria(producto_id, body.categoria_id, body.es_principal)


@router.delete("/{producto_id}/categorias/{categoria_id}", response_model=ProductoReadFull)
def remove_from_categoria(
    producto_id: int,
    categoria_id: int,
    svc: ProductoService = Depends(get_producto_service),
    _: Usuario = Depends(require_admin),
):
    return svc.remove_from_categoria(producto_id, categoria_id)


@router.get("/{producto_id}/categorias", response_model=List[CategoriaBasicRead])
def get_producto_categorias(
    producto_id: int,
    svc: ProductoService = Depends(get_producto_service),
):
    return svc.get_producto_categorias(producto_id)
