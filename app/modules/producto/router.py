from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.core.database import get_session
from app.modules.producto import service
from app.modules.producto.schemas import (
    ProductoCreate,
    ProductoRead,
    ProductoReadFull,
    ProductoCategoriaAssign,
    ProductoUpdate,
    CategoriaBasicRead,
)

router = APIRouter(prefix="/productos", tags=["productos"])

# ─── CRUD ──────────────────────────────────────────────────────────────────

# ─── Ceate ─────────────────────────────────────────────────────────────────
@router.post("/", response_model=ProductoRead, status_code=201)
def create_producto(producto: ProductoCreate, session: Session = Depends(get_session)):
    return service.create_producto(session, producto)

# ─── Read ──────────────────────────────────────────────────────────────────
@router.get("/", response_model=List[ProductoReadFull])
def list_productos(session: Session = Depends(get_session)):
    return service.get_productos(session)


@router.get("/{producto_id}", response_model=ProductoReadFull)
def get_producto(producto_id: int, session: Session = Depends(get_session)):
    producto = service.get_producto(session, producto_id)
    if not producto:
        raise HTTPException(status_code=404, detail="Producto not found")
    return producto

# ─── Patch ─────────────────────────────────────────────────────────────────
@router.patch("/{producto_id}", response_model=ProductoRead)
def update_producto(
    producto_id: int, data: ProductoUpdate, session: Session = Depends(get_session)
):
    producto = service.update_producto(session, producto_id, data)
    if not producto:
        raise HTTPException(status_code=404, detail="Producto not found")
    return producto

# ─── Delete ─────────────────────────────────────────────────────────────────
@router.delete("/{producto_id}", status_code=204)
def delete_producto(producto_id: int, session: Session = Depends(get_session)):
    if not service.delete_producto(session, producto_id):
        raise HTTPException(status_code=404, detail="Producto not found")
    

# ─── Relación N:M  Hero ↔ Team ─────────────────────────────────────────────

# ─── Assing producto to categoria ────────────────────────────────────────────
@router.post("/{producto_id}/categorias", response_model=ProductoReadFull)
def assign_to_categoria(producto_id: int, body: ProductoCategoriaAssign, session: Session = Depends(get_session),
):
    producto = service.add_producto_to_categoria(session, producto_id, body.categoria_id)
    if not producto:
        raise HTTPException(status_code=404, detail="Producto or Categoria not found")
    return producto

# ─── Remove producto from categoria ───────────────────────────────────────
@router.delete("/{producto_id}/categorias/{categoria_id}", response_model=ProductoReadFull)
def remove_from_categoria(
    producto_id: int,
    categoria_id: int,
    session: Session = Depends(get_session),
):
    producto = service.remove_producto_from_categoria(session, producto_id, categoria_id)
    if not producto:
        raise HTTPException(
            status_code=404, detail="Producto-Categoria relationship not found"
        )
    return producto

# ─── Return producto - categorias ─────────────────────────────────────────
@router.get("/{producto_id}/categorias", response_model=List[CategoriaBasicRead])
def get_producto_categorias(producto_id: int, session: Session = Depends(get_session)):
    return service.get_producto_categorias(session, producto_id)