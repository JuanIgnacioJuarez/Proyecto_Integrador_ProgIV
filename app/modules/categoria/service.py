from typing import List
from datetime import datetime
from fastapi import HTTPException, status
from sqlmodel import Session

from app.core.unit_of_work import UnitOfWork
from app.modules.categoria.models import Categoria
from app.modules.categoria.schemas import CategoriaCreate, CategoriaUpdate, CategoriaReadFull, CategoriaRead

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
        # Obtiene una categoría por ID o lanza excepción HTTP 404 si no existe o si ha sido eliminada lógicamente.
        categoria = uow.categorias.get_by_id(categoria_id)
        if not categoria or categoria.deleted_at is not None:
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
        # Realiza un borrado lógico de la categoría estableciendo el deleted_at.
        with UnitOfWork(self._session) as uow:
            categoria = self._get_or_404(uow, categoria_id)
            categoria.deleted_at = datetime.utcnow()
            categoria.is_active = False
            uow.categorias.add(categoria)
