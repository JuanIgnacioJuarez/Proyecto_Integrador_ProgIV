from datetime import datetime
import logging
from typing import List

from fastapi import HTTPException, status
from sqlmodel import Session

from backend.core.unit_of_work import UnitOfWork
from backend.modules.ingredientes.models import Ingrediente
from backend.modules.ingredientes.schemas import IngredienteCreate, IngredienteUpdate

logger = logging.getLogger(__name__)


class IngredienteService:
    UNIDADES_VALIDAS = {"gr", "litros", "unidad"}

    def __init__(self, session: Session) -> None:
        self._session = session

    def _get_or_404(self, uow: UnitOfWork, ingrediente_id: int) -> Ingrediente:
        ingrediente = uow.ingredientes.get_by_id(ingrediente_id)
        if not ingrediente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Ingrediente con id={ingrediente_id} no encontrado",
            )
        return ingrediente

    def _get_any_or_404(self, uow: UnitOfWork, ingrediente_id: int) -> Ingrediente:
        ingrediente = uow.ingredientes.get_by_id_any(ingrediente_id)
        if not ingrediente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Ingrediente con id={ingrediente_id} no encontrado",
            )
        return ingrediente

    def _assert_nombre_unique(self, uow: UnitOfWork, nombre: str) -> None:
        if uow.ingredientes.get_by_nombre(nombre):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"El nombre de ingrediente '{nombre}' ya esta en uso",
            )

    def _assert_unidad_valida(self, unidad_medida: str) -> None:
        if unidad_medida not in self.UNIDADES_VALIDAS:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="unidad_medida debe ser una de: gr, litros, unidad",
            )

    def create(self, data: IngredienteCreate) -> Ingrediente:
        with UnitOfWork(self._session) as uow:
            self._assert_nombre_unique(uow, data.nombre)
            self._assert_unidad_valida(data.unidad_medida)
            ingrediente = Ingrediente.model_validate(data)
            uow.ingredientes.add(ingrediente)
            result = Ingrediente.model_validate(ingrediente)
        return result

    def get_all(self) -> List[Ingrediente]:
        with UnitOfWork(self._session) as uow:
            ingredientes = uow.ingredientes.get_all_active()
            result = [Ingrediente.model_validate(i) for i in ingredientes]
        return result

    def get_paginated(
        self,
        offset: int = 0,
        limit: int = 10,
        name: str | None = None,
        es_alergeno: bool | None = None,
        unidad_medida: str | None = None,
        is_active: bool | None = None,
        sort_by: str | None = None,
        sort_dir: str = "asc",
        include_inactive: bool = False,
    ) -> tuple[int, List[Ingrediente]]:
        with UnitOfWork(self._session) as uow:
            total = uow.ingredientes.count_active(
                name=name,
                es_alergeno=es_alergeno,
                unidad_medida=unidad_medida,
                is_active=is_active,
                include_inactive=include_inactive,
            )
            items = uow.ingredientes.get_active_paginated(
                offset=offset,
                limit=limit,
                name=name,
                es_alergeno=es_alergeno,
                unidad_medida=unidad_medida,
                is_active=is_active,
                sort_by=sort_by,
                sort_dir=sort_dir,
                include_inactive=include_inactive,
            )
            result = [Ingrediente.model_validate(i) for i in items]
        return total, result

    def get_by_id(self, ingrediente_id: int) -> Ingrediente:
        with UnitOfWork(self._session) as uow:
            ingrediente = self._get_or_404(uow, ingrediente_id)
            result = Ingrediente.model_validate(ingrediente)
        return result

    def update(self, ingrediente_id: int, data: IngredienteUpdate) -> Ingrediente:
        with UnitOfWork(self._session) as uow:
            ingrediente = self._get_or_404(uow, ingrediente_id)

            if data.nombre and data.nombre != ingrediente.nombre:
                self._assert_nombre_unique(uow, data.nombre)
            if data.unidad_medida is not None:
                self._assert_unidad_valida(data.unidad_medida)

            patch = data.model_dump(exclude_unset=True)
            for field, value in patch.items():
                setattr(ingrediente, field, value)

            ingrediente.updated_at = datetime.utcnow()
            uow.ingredientes.add(ingrediente)
            result = Ingrediente.model_validate(ingrediente)
        return result

    def soft_delete(self, ingrediente_id: int) -> None:
        self.set_activo(ingrediente_id, False)

    def set_activo(self, ingrediente_id: int, is_active: bool) -> Ingrediente:
        with UnitOfWork(self._session) as uow:
            ingrediente = self._get_any_or_404(uow, ingrediente_id)
            now = datetime.utcnow()
            ingrediente.is_active = is_active
            ingrediente.deleted_at = None if is_active else now
            ingrediente.updated_at = now
            uow.ingredientes.add(ingrediente)
            return Ingrediente.model_validate(ingrediente)

    def hard_delete(self, ingrediente_id: int, actor_email: str | None = None) -> None:
        with UnitOfWork(self._session) as uow:
            ingrediente = self._get_any_or_404(uow, ingrediente_id)

            if ingrediente.is_active:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Para eliminar definitivamente, primero desactiva el ingrediente (soft delete).",
                )

            if uow.ingredientes.has_product_links(ingrediente_id):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="No se puede eliminar definitivamente: el ingrediente esta asociado a productos.",
                )

            ingrediente_nombre = ingrediente.nombre
            uow.ingredientes.delete(ingrediente)
            logger.info(
                "AUDIT hard_delete_ingrediente actor=%s ingrediente_id=%s ingrediente_nombre=%s",
                actor_email or "unknown",
                ingrediente_id,
                ingrediente_nombre,
            )
