from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from app.core.database import get_session
from app.modules.ingrediente.service import IngredienteService
from app.modules.ingrediente.schemas import (
    IngredientePaginatedResponse,
    IngredienteCreate,
    IngredienteRead,
    IngredienteUpdate,
)

router = APIRouter(prefix="/ingredientes", tags=["ingredientes"])

def get_ingrediente_service(
    session: Session = Depends(get_session),
) -> IngredienteService:
    # ===== MODIFICACION =====
    # pasamos a servicio inyectado (mismo esquema que categoria),
    # porque antes llamaba funciones que no existian y rompia.
    return IngredienteService(session)


# ─── CRUD ──────────────────────────────────────────────────────────────────

# ─── Ceate ─────────────────────────────────────────────────────────────────
@router.post("/", response_model=IngredienteRead, status_code=201)
def create_ingrediente(
    ingrediente: IngredienteCreate,
    svc: IngredienteService = Depends(get_ingrediente_service),
):
    return svc.create(ingrediente)

# ─── Read ──────────────────────────────────────────────────────────────────
@router.get("/", response_model=IngredientePaginatedResponse)
def list_ingredientes(
    offset: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    name: Optional[str] = None,
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

    total, items = svc.get_paginated(offset=offset, limit=limit, name=name)

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
):
    return svc.update(ingrediente_id, data)

# ─── Delete ─────────────────────────────────────────────────────────────────
@router.delete("/{ingrediente_id}", status_code=204)
def delete_ingrediente(
    ingrediente_id: int,
    svc: IngredienteService = Depends(get_ingrediente_service),
):
    svc.soft_delete(ingrediente_id)
