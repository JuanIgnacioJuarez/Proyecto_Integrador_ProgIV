from datetime import datetime
from typing import List

from fastapi import HTTPException, status
from sqlmodel import Session

from backend.core.unit_of_work import UnitOfWork
from backend.modules.ingredientes.models import Ingrediente
from backend.modules.ingredientes.schemas import IngredienteCreate, IngredienteUpdate


class IngredienteService:
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

    def _assert_nombre_unique(self, uow: UnitOfWork, nombre: str) -> None:
        if uow.ingredientes.get_by_nombre(nombre):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"El nombre de ingrediente '{nombre}' ya esta en uso",
            )

    def create(self, data: IngredienteCreate) -> Ingrediente:
        with UnitOfWork(self._session) as uow:
            self._assert_nombre_unique(uow, data.nombre)
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
    ) -> tuple[int, List[Ingrediente]]:
        with UnitOfWork(self._session) as uow:
            total = uow.ingredientes.count_active(name=name, es_alergeno=es_alergeno)
            items = uow.ingredientes.get_active_paginated(
                offset=offset,
                limit=limit,
                name=name,
                es_alergeno=es_alergeno,
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

            patch = data.model_dump(exclude_unset=True)
            for field, value in patch.items():
                setattr(ingrediente, field, value)

            ingrediente.updated_at = datetime.utcnow()
            uow.ingredientes.add(ingrediente)
            result = Ingrediente.model_validate(ingrediente)
        return result

    def soft_delete(self, ingrediente_id: int) -> None:
        with UnitOfWork(self._session) as uow:
            ingrediente = self._get_or_404(uow, ingrediente_id)
            now = datetime.utcnow()
            ingrediente.deleted_at = now
            ingrediente.updated_at = now
            ingrediente.is_active = False
            uow.ingredientes.add(ingrediente)
