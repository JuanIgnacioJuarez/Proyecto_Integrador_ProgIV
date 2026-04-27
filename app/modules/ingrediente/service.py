from typing import List
from datetime import datetime
from fastapi import HTTPException, status
from sqlmodel import Session

from app.core.unit_of_work import UnitOfWork
from app.modules.ingrediente.models import Ingrediente
from app.modules.ingrediente.schemas import IngredienteCreate, IngredienteUpdate

class IngredienteService:
    """
    Capa lógica de negocio para Ingrediente.

    Responsabilidades:
    - Validaciones de dominio(nombres únicos, existencia de registros)
    - Coordinar repositorios a través del Unit of Work centralizado.
    - Levantar HTTPException cuando corresponde.
    """

    def __init__(self, session: Session) -> None:
        # Inicializa el servicio inyectando la sesión de base de datos
        self._session = session

    def _get_or_404(self, uow: UnitOfWork, ingrediente_id: int) -> Ingrediente:
        # Obtiene un ingrediente por ID o lanza excepción HTTP 404 si no existe o si ha sido eliminado lógicamente.
        ingrediente = uow.ingredientes.get_by_id(ingrediente_id)
        if not ingrediente or ingrediente.deleted_at is not None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Ingrediente con id={ingrediente_id} no encontrado",
            )
        
        return ingrediente

    def _assert_nombre_unique(self, uow: UnitOfWork, nombre: str) -> None:
        # Valida que el nombre del ingrediente no esté en uso por otro ingrediente activo.
        if uow.ingredientes.get_by_nombre(nombre):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"El nombre de ingrediente '{nombre}' ya está en uso",
            )
    
    def create(self, data: IngredienteCreate) -> Ingrediente:
        # Crea un nuevo ingrediente validando que el nombre no exista.
        with UnitOfWork(self._session) as uow:
            self._assert_nombre_unique(uow, data.nombre)
            
            ingrediente = Ingrediente.model_validate(data)
            uow.ingredientes.add(ingrediente)

            # Serializar dentro del contexto asegura acceso a atributos Lazy.
            result = Ingrediente.model_validate(ingrediente)

        return result
    
    def get_all(self) -> List[Ingrediente]:
        # Obtiene lista de todos los ingredientes activos.
        with UnitOfWork(self._session) as uow:
            ingredientes = uow.ingredientes.get_all_active()
            
            # Serializamos la lista completa dentro de la transacción
            result = [Ingrediente.model_validate(i) for i in ingredientes]

        return result

    def get_paginated(
        self, offset: int = 0, limit: int = 10, name: str | None = None
    ) -> tuple[int, List[Ingrediente]]:
        # ===== MODIFICACION =====
        # metodo nuevo para cubrir el endpoint paginado del router.
        with UnitOfWork(self._session) as uow:
            total = uow.ingredientes.count_active(name=name)
            items = uow.ingredientes.get_active_paginated(
                offset=offset, limit=limit, name=name
            )
            result = [Ingrediente.model_validate(i) for i in items]
        return total, result
    
    def get_by_id(self, ingrediente_id: int) -> Ingrediente:
        # Obtiene un ingrediente específico por su ID.
        with UnitOfWork(self._session) as uow:
            ingrediente = self._get_or_404(uow, ingrediente_id)
            result = Ingrediente.model_validate(ingrediente)

        return result
    
    def update(self, ingrediente_id: int, data: IngredienteUpdate) -> Ingrediente:
        # Actualiza un ingrediente existente de forma parcial (PATCH).
        with UnitOfWork(self._session) as uow:
            ingrediente = self._get_or_404(uow, ingrediente_id)

            # Si el cliente envía un nombre nuevo, validamos que no colisione
            if data.nombre and data.nombre != ingrediente.nombre:
                self._assert_nombre_unique(uow, data.nombre)

            # Extraemos solo los campos que fueron enviados en el request
            patch = data.model_dump(exclude_unset=True)

            for field, value in patch.items():
                setattr(ingrediente, field, value)

            ingrediente.updated_at = datetime.utcnow()
            uow.ingredientes.add(ingrediente)
            
            result = Ingrediente.model_validate(ingrediente)

        return result

    def soft_delete(self, ingrediente_id: int) -> None:
        # Realiza un borrado lógico del ingrediente estableciendo el deleted_at.
        with UnitOfWork(self._session) as uow:
            ingrediente = self._get_or_404(uow, ingrediente_id)
            ingrediente.deleted_at = datetime.utcnow()
            ingrediente.is_active = False
            uow.ingredientes.add(ingrediente)
