from typing import List

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.core.database import get_session
from app.modules.producto.service import ProductoService
from app.modules.producto.schemas import (
    ProductoCreate,
    ProductoRead,
    ProductoReadFull,
    ProductoCategoriaAssign,
    ProductoUpdate,
    CategoriaBasicRead,
)

router = APIRouter(prefix="/productos", tags=["productos"])


def get_producto_service(session: Session = Depends(get_session)) -> ProductoService:
    # ===== MODIFICACION =====
    # unificamos el patron con categoria/ingrediente usando servicio inyectado.
    # Antes llamaba funciones sueltas y no existian.
    return ProductoService(session)


@router.post("/", response_model=ProductoRead, status_code=201)
def create_producto(
    producto: ProductoCreate,
    svc: ProductoService = Depends(get_producto_service),
):
    return svc.create(producto)


@router.get("/", response_model=List[ProductoReadFull])
def list_productos(svc: ProductoService = Depends(get_producto_service)):
    return svc.get_all()


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
):
    return svc.update(producto_id, data)


@router.delete("/{producto_id}", status_code=204)
def delete_producto(
    producto_id: int,
    svc: ProductoService = Depends(get_producto_service),
):
    svc.soft_delete(producto_id)


@router.post("/{producto_id}/categorias", response_model=ProductoReadFull)
def assign_to_categoria(
    producto_id: int,
    body: ProductoCategoriaAssign,
    svc: ProductoService = Depends(get_producto_service),
):
    # ===== MODIFICACION =====
    # guardamos tambien el flag `es_principal` que llega en el body.
    return svc.add_to_categoria(producto_id, body.categoria_id, body.es_principal)


@router.delete("/{producto_id}/categorias/{categoria_id}", response_model=ProductoReadFull)
def remove_from_categoria(
    producto_id: int,
    categoria_id: int,
    svc: ProductoService = Depends(get_producto_service),
):
    return svc.remove_from_categoria(producto_id, categoria_id)


@router.get("/{producto_id}/categorias", response_model=List[CategoriaBasicRead])
def get_producto_categorias(
    producto_id: int,
    svc: ProductoService = Depends(get_producto_service),
):
    return svc.get_producto_categorias(producto_id)
