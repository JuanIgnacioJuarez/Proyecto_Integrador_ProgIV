from typing import List
from datetime import datetime
from fastapi import HTTPException, status
from sqlmodel import Session

from backend.core.unit_of_work import UnitOfWork
from backend.modules.categorias.models import Categoria
from backend.modules.categorias.schemas import CategoriaCreate, CategoriaUpdate, CategoriaReadFull, CategoriaRead

class CategoriaService:
    """
    Capa de lógica de negocio para Categorías.

    Responsabilidades:
    - Validaciones de dominio (nombres únicos, existencia de registros).
    - Coordinar repositorios a través del Unit of Work centralizado.
    - Levantar HTTPException cuando corresponde.
    """

    def __init__(self, session: Session) -> None:
        # Inicializa el servicio inyectando la sesión de base de datos.
        self._session = session

    def _get_or_404(self, uow: UnitOfWork, categoria_id: int) -> Categoria:
        categoria = uow.categorias.get_by_id(categoria_id)
        if not categoria:  # deleted_at ya lo filtra el repo
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Categoría con id={categoria_id} no encontrada",
            )
        return categoria
    
    def _assert_nombre_unique(self, uow: UnitOfWork, nombre: str) -> None:
        # Valida que el nombre de la categoría no esté en uso por otra categoría activa.
        if uow.categorias.get_by_nombre(nombre):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"El nombre de categoría '{nombre}' ya está en uso",
            )
    
    def create(self, data: CategoriaCreate) -> Categoria:
        # Crea una nueva categoría validando que el nombre no exista.
        with UnitOfWork(self._session) as uow:
            self._assert_nombre_unique(uow, data.nombre)
            
            categoria = Categoria.model_validate(data)
            uow.categorias.add(categoria)

            # Serializar dentro del contexto asegura acceso a atributos Lazy.
            result = Categoria.model_validate(categoria)

        return result
    
    def get_all(self) -> List[CategoriaReadFull]:
        # Obtiene lista de todas las categorías activas.
        # El ORM se encarga de anidar las subcategorias automáticamente
        with UnitOfWork(self._session) as uow:
            categorias = uow.categorias.get_all_raices_activas()
            
            # Serializamos la lista completa dentro de la transacción
            result = [CategoriaReadFull.model_validate(c) for c in categorias]

        return result
    
    def get_by_id(self, categoria_id: int) -> CategoriaReadFull:
        # Obtiene una categoría específica por su ID.
        with UnitOfWork(self._session) as uow:
            categoria = self._get_or_404(uow, categoria_id)
            result = CategoriaReadFull.model_validate(categoria)

        return result
    
    def update(self, categoria_id: int, data: CategoriaUpdate) -> Categoria:
        # Actualiza una categoría existente de forma parcial (PATCH).
        with UnitOfWork(self._session) as uow:
            categoria = self._get_or_404(uow, categoria_id)

            # Si el cliente envía un nombre nuevo, validamos que no colisione
            if data.nombre and data.nombre != categoria.nombre:
                self._assert_nombre_unique(uow, data.nombre)

            # Extraemos solo los campos que fueron enviados en el request
            patch = data.model_dump(exclude_unset=True)

            for field, value in patch.items():
                setattr(categoria, field, value)

            categoria.updated_at = datetime.utcnow()
            uow.categorias.add(categoria)
            
            result = Categoria.model_validate(categoria)

        return result

    def soft_delete(self, categoria_id: int) -> None:
        with UnitOfWork(self._session) as uow:
            categoria = self._get_or_404(uow, categoria_id)

            now = datetime.utcnow()

            # Borrado en cascada lógico hacia las subcategorías
            for sub in categoria.subcategorias:
                if sub.deleted_at is None:
                    sub.deleted_at = now
                    sub.updated_at = now
                    sub.is_active = False
                    uow.categorias.add(sub)

            categoria.deleted_at = now
            categoria.updated_at = now  # ← audit trail
            categoria.is_active = False
            uow.categorias.add(categoria)
