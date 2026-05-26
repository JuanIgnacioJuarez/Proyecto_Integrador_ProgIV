from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from backend.core.database import get_session
from backend.modules.auth.dependencies import require_admin
from backend.modules.auth.models import Usuario
from backend.modules.ingredientes.services import IngredienteService
from backend.modules.ingredientes.schemas import (
    IngredienteEstadoUpdate,
    IngredientePaginatedResponse,
    IngredienteCreate,
    IngredienteRead,
    IngredienteUpdate,
)

router = APIRouter(prefix="/ingredientes", tags=["ingredientes"])

def get_ingrediente_service(
    session: Session = Depends(get_session),
) -> IngredienteService:
    return IngredienteService(session)


# ─── CRUD ──────────────────────────────────────────────────────────────────

# ─── Ceate ─────────────────────────────────────────────────────────────────
@router.post("/", response_model=IngredienteRead, status_code=201)
def create_ingrediente(
    ingrediente: IngredienteCreate,
    svc: IngredienteService = Depends(get_ingrediente_service),
    _: Usuario = Depends(require_admin),
):
    return svc.create(ingrediente)

# ─── Read ──────────────────────────────────────────────────────────────────
@router.get("/", response_model=IngredientePaginatedResponse)
def list_ingredientes(
    offset: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    name: Optional[str] = None,
    es_alergeno: Optional[bool] = None,
    categoria_id: Optional[int] = Query(default=None, ge=1),
    subcategoria_id: Optional[int] = Query(default=None, ge=1),
    is_active: Optional[bool] = Query(default=None),
    sort_by: Optional[str] = Query(default=None, description="Orden: nombre|stock"),
    sort_dir: str = Query(default="asc", description="Direccion: asc|desc"),
    include_inactive: bool = Query(default=False),
    svc: IngredienteService = Depends(get_ingrediente_service),
):
    """
    Endpoint de listado de ingredientes con soporte para:
    - paginación
    - filtros dinámicos
    - validación automática de parámetros

    Parámetros
    ----------
    offset : int
        Cantidad de registros iniciales que se deben omitir.
        Permite navegar entre páginas de resultados.

        Validación:
        - ge=0 → el valor debe ser mayor o igual a 0

    limit : int
        Cantidad máxima de registros que se devolverán en la respuesta.

        Validación:
        - ge=1  → mínimo 1 registro
        - le=100 → máximo 100 registros

        Esto evita que un cliente solicite volúmenes excesivos.

    name : Optional[str]
        Filtro opcional para buscar ingredientes por nombre.
        Si se envía, el servicio aplicará una condición WHERE
        en la consulta SQL.

    Retorna
    -------
    IngredientePaginatedResponse
    """

    total, items = svc.get_paginated(
        offset=offset,
        limit=limit,
        name=name,
        es_alergeno=es_alergeno,
        categoria_id=categoria_id,
        subcategoria_id=subcategoria_id,
        is_active=is_active,
        sort_by=sort_by,
        sort_dir=sort_dir,
        include_inactive=include_inactive,
    )

    return {
        "total": total,
        "items": items,
    }


@router.get("/{ingrediente_id}", response_model=IngredienteRead)
def get_ingrediente(
    ingrediente_id: int,
    svc: IngredienteService = Depends(get_ingrediente_service),
):
    return svc.get_by_id(ingrediente_id)

# ─── Patch ─────────────────────────────────────────────────────────────────
@router.patch("/{ingrediente_id}", response_model=IngredienteRead)
def update_ingrediente(
    ingrediente_id: int,
    data: IngredienteUpdate,
    svc: IngredienteService = Depends(get_ingrediente_service),
    _: Usuario = Depends(require_admin),
):
    return svc.update(ingrediente_id, data)

# ─── Delete ─────────────────────────────────────────────────────────────────
@router.delete("/{ingrediente_id}", status_code=204)
def delete_ingrediente(
    ingrediente_id: int,
    svc: IngredienteService = Depends(get_ingrediente_service),
    _: Usuario = Depends(require_admin),
):
    svc.soft_delete(ingrediente_id)


@router.patch("/{ingrediente_id}/estado", response_model=IngredienteRead)
def set_estado_ingrediente(
    ingrediente_id: int,
    body: IngredienteEstadoUpdate,
    svc: IngredienteService = Depends(get_ingrediente_service),
    _: Usuario = Depends(require_admin),
):
    return svc.set_activo(ingrediente_id, body.is_active)
