from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from app.core.database import get_session
from app.modules.ingrediente import service
from app.modules.ingrediente.schemas import (
    IngredientePaginatedResponse,
    IngredienteCreate,
    IngredienteRead,
    IngredienteUpdate,
)

router = APIRouter(prefix="/ingredientes", tags=["ingredientes"])


# ─── CRUD ──────────────────────────────────────────────────────────────────

# ─── Ceate ─────────────────────────────────────────────────────────────────
@router.post("/", response_model=IngredienteRead, status_code=201)
def create_ingrediente(ingrediente: IngredienteCreate, session: Session = Depends(get_session)):
    return service.create_ingrediente(session, ingrediente)

# ─── Read ──────────────────────────────────────────────────────────────────
@router.get("/", response_model=IngredientePaginatedResponse)
def list_ingredientes(
    offset: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    name: Optional[str] = None,
    session: Session = Depends(get_session),
):
    """
    Endpoint de listado de armas con soporte para:
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
        Filtro opcional para buscar armas por nombre.
        Si se envía, el servicio aplicará una condición WHERE
        en la consulta SQL.

    Retorna
    -------
    WeaponPaginatedResponse
    """

    total, items = service.get_ingredientes(
        session=session,
        offset=offset,
        limit=limit,
        name=name,
    )

    return {
        "total": total,
        "items": items,
    }


@router.get("/{ingrediente_id}", response_model=IngredienteRead)
def get_ingrediente(ingrediente_id: int, session: Session = Depends(get_session)):
    ingrediente = service.get_ingrediente(session, ingrediente_id)

    if not ingrediente:
        raise HTTPException(status_code=404, detail="Ingrediente not found")

    return ingrediente

# ─── Patch ─────────────────────────────────────────────────────────────────
@router.patch("/{ingrediente_id}", response_model=IngredienteRead)
def update_ingrediente(
    ingrediente_id: int, data: IngredienteUpdate, session: Session = Depends(get_session)
):
    ingrediente = service.update_ingrediente(session, ingrediente_id, data)

    if not ingrediente:
        raise HTTPException(status_code=404, detail="Ingrediente not found")

    return ingrediente

# ─── Delete ─────────────────────────────────────────────────────────────────
@router.delete("/{ingrediente_id}", status_code=204)
def delete_ingrediente(ingrediente_id: int, session: Session = Depends(get_session)):
    if not service.delete_ingrediente(session, ingrediente_id):
        raise HTTPException(status_code=404, detail="Ingrediente not found")