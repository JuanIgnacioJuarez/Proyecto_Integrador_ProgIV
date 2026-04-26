from typing import List
from datetime import datetime
from fastapi import HTTPException, status
from sqlmodel import Session

from app.core.unit_of_work import UnitOfWork
from app.modules.producto.models import Producto
from app.modules.producto.schemas import ProductoCreate, ProductoUpdate

class ProductoService:
    """
    Capa lógica de negocio para Producto.

    Responsabilidades:
    - Validaciones de dominio(existencia de registros)
    - Coordinar repositorios a través del Unit of Work centralizado.
    - Levantar HTTPException cuando corresponde.
    """

    def __init__(self, session: Session) -> None:
        # Inicializa el servicio inyectando la sesión de base de datos
        self._session = session

    def _get_or_404(self, uow: UnitOfWork, producto_id: int) -> Producto:
        # Obtiene un producto por ID o lanza excepción HTTP 404 si no existe o si ha sido eliminado lógicamente.
        producto = uow.productos.get_by_id(producto_id)
        if not producto or producto.deleted_at is not None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Producto con id={producto_id} no encontrado",
            )
        
        return producto
    
    def create(self, data: ProductoCreate) -> Producto:
        # Crea un nuevo producto.
        with UnitOfWork(self._session) as uow:            
            producto = Producto.model_validate(data)
            uow.productos.add(producto)

            # Serializar dentro del contexto asegura acceso a atributos Lazy.
            result = Producto.model_validate(producto)

        return result
    
    def get_all(self) -> List[Producto]:
        # Obtiene lista de todos los productos activos.
        with UnitOfWork(self._session) as uow:
            productos = uow.productos.get_all_active()
            
            # Serializamos la lista completa dentro de la transacción
            result = [Producto.model_validate(p) for p in productos]

        return result
    
    def get_by_id(self, producto_id: int) -> Producto:
        # Obtiene un producto específico por su ID.
        with UnitOfWork(self._session) as uow:
            producto = self._get_or_404(uow, producto_id)
            result = Producto.model_validate(producto)

        return result
    
    def update(self, producto_id: int, data: ProductoUpdate) -> Producto:
        # Actualiza un producto existente de forma parcial (PATCH).
        with UnitOfWork(self._session) as uow:
            producto = self._get_or_404(uow, producto_id)

            # Extraemos solo los campos que fueron enviados en el request
            patch = data.model_dump(exclude_unset=True)

            for field, value in patch.items():
                setattr(producto, field, value)

            producto.updated_at = datetime.utcnow()
            uow.productos.add(producto)
            
            result = Producto.model_validate(producto)

        return result

    def soft_delete(self, producto_id: int) -> None:
        # Realiza un borrado lógico del producto estableciendo el deleted_at.
        with UnitOfWork(self._session) as uow:
            producto = self._get_or_404(uow, producto_id)
            producto.deleted_at = datetime.utcnow()
            producto.is_active = False
            uow.productos.add(producto)