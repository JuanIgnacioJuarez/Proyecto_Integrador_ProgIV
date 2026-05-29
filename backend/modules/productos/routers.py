import imghdr
import os
from pathlib import Path
from typing import List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlmodel import Session

from backend.core.database import get_session
from backend.modules.auth.dependencies import require_roles
from backend.modules.auth.models import Rol, Usuario
from backend.modules.productos.schemas import (
    CategoriaBasicRead,
    ProductoCategoriaAssign,
    ProductoCreate,
    ProductoDisponibilidadUpdate,
    ProductoPaginatedResponse,
    ProductoRead,
    ProductoReadFull,
    ImagenUploadResponse,
    ProductoEstadoUpdate,
    ProductoStockUpdate,
    ProductoUpdate,
)
from backend.modules.productos.services import ProductoService

router = APIRouter(prefix="/productos", tags=["productos"])

DEFAULT_UPLOADS_DIR = Path(__file__).resolve().parents[2] / "img"
UPLOAD_ROOT = Path(os.getenv("UPLOADS_DIR", str(DEFAULT_UPLOADS_DIR))).expanduser() / "productos"
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "gif"}
MAX_UPLOAD_BYTES = 8 * 1024 * 1024


def get_producto_service(session: Session = Depends(get_session)) -> ProductoService:
    return ProductoService(session)


@router.post("/upload-imagen", response_model=ImagenUploadResponse, status_code=201)
async def upload_imagen_producto(
    file: UploadFile = File(...),
    _: Usuario = Depends(require_roles(Rol.ADMIN)),
):
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Archivo invalido")

    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El archivo esta vacio")
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Maximo 8MB por imagen")

    detected = imghdr.what(None, h=raw)
    ext = (detected or "").lower()
    if ext == "jpeg":
        ext = "jpg"
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Formato no permitido. Usa JPG, PNG, WEBP o GIF.",
        )

    UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid4().hex}.{ext}"
    file_path = UPLOAD_ROOT / filename
    file_path.write_bytes(raw)

    return ImagenUploadResponse(url=f"/uploads/productos/{filename}")


@router.post("/", response_model=ProductoRead, status_code=201)
def create_producto(
    producto: ProductoCreate,
    svc: ProductoService = Depends(get_producto_service),
    _: Usuario = Depends(require_roles(Rol.ADMIN)),
):
    return svc.create(producto)


@router.get("/", response_model=ProductoPaginatedResponse)
def list_productos(
    categoria_id: Optional[int] = Query(default=None, ge=1, description="Filtrar por categoria"),
    subcategoria_id: Optional[int] = Query(default=None, ge=1, description="Filtrar por subcategoria"),
    ingrediente_id: Optional[int] = Query(default=None, ge=1, description="Filtrar por ingrediente"),
    ingrediente_ids: list[int] = Query(default=[], description="Filtrar por multiples ingredientes"),
    disponible: Optional[bool] = Query(default=None, description="Filtrar por disponibilidad"),
    is_active: Optional[bool] = Query(default=None, description="Filtrar por estado"),
    sort_by: Optional[str] = Query(default=None, description="Orden: nombre|precio|stock"),
    sort_dir: str = Query(default="asc", description="Direccion: asc|desc"),
    search: Optional[str] = Query(default=None, max_length=100, description="Busqueda por nombre o descripcion"),
    include_inactive: bool = Query(default=False, description="Incluir productos inactivos/eliminados logicamente"),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=100),
    svc: ProductoService = Depends(get_producto_service),
):
    return svc.get_all(
        categoria_id=categoria_id,
        subcategoria_id=subcategoria_id,
        ingrediente_id=ingrediente_id,
        ingrediente_ids=ingrediente_ids,
        disponible=disponible,
        is_active=is_active,
        sort_by=sort_by,
        sort_dir=sort_dir,
        search=search,
        include_inactive=include_inactive,
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
    _: Usuario = Depends(require_roles(Rol.ADMIN)),
):
    return svc.update(producto_id, data)


@router.patch("/{producto_id}/disponibilidad", response_model=ProductoRead)
def set_disponibilidad(
    producto_id: int,
    body: ProductoDisponibilidadUpdate,
    svc: ProductoService = Depends(get_producto_service),
    _: Usuario = Depends(require_roles(Rol.ADMIN, Rol.STOCK)),
):
    return svc.set_disponibilidad(producto_id, body.disponible)


@router.patch("/{producto_id}/stock", response_model=ProductoRead)
def set_stock(
    producto_id: int,
    body: ProductoStockUpdate,
    svc: ProductoService = Depends(get_producto_service),
    _: Usuario = Depends(require_roles(Rol.ADMIN, Rol.STOCK)),
):
    return svc.update(producto_id, ProductoUpdate(stock_cantidad=body.stock_cantidad))


@router.delete("/{producto_id}", status_code=204)
def delete_producto(
    producto_id: int,
    svc: ProductoService = Depends(get_producto_service),
    _: Usuario = Depends(require_roles(Rol.ADMIN)),
):
    svc.soft_delete(producto_id)


@router.delete("/{producto_id}/hard", status_code=204)
def hard_delete_producto(
    producto_id: int,
    svc: ProductoService = Depends(get_producto_service),
    current_user: Usuario = Depends(require_roles(Rol.ADMIN)),
):
    svc.hard_delete(producto_id, actor_email=current_user.email)


@router.patch("/{producto_id}/estado", response_model=ProductoRead)
def set_estado_producto(
    producto_id: int,
    body: ProductoEstadoUpdate,
    svc: ProductoService = Depends(get_producto_service),
    _: Usuario = Depends(require_roles(Rol.ADMIN)),
):
    return svc.set_activo(producto_id, body.is_active)


@router.post("/{producto_id}/categorias", response_model=ProductoReadFull)
def assign_to_categoria(
    producto_id: int,
    body: ProductoCategoriaAssign,
    svc: ProductoService = Depends(get_producto_service),
    _: Usuario = Depends(require_roles(Rol.ADMIN)),
):
    return svc.add_to_categoria(producto_id, body.categoria_id, body.es_principal)


@router.delete("/{producto_id}/categorias/{categoria_id}", response_model=ProductoReadFull)
def remove_from_categoria(
    producto_id: int,
    categoria_id: int,
    svc: ProductoService = Depends(get_producto_service),
    _: Usuario = Depends(require_roles(Rol.ADMIN)),
):
    return svc.remove_from_categoria(producto_id, categoria_id)


@router.get("/{producto_id}/categorias", response_model=List[CategoriaBasicRead])
def get_producto_categorias(
    producto_id: int,
    svc: ProductoService = Depends(get_producto_service),
):
    return svc.get_producto_categorias(producto_id)
