from sqlalchemy import func
from sqlmodel import Session, select

from backend.core.repository import BaseRepository
from backend.modules.categorias.models import Categoria

class CategoriaRepository(BaseRepository[Categoria]):
    """
    Repositorio específico de Categoria.
    Hereda de BaseRepository para obtener todas las operaciones CRUD generales.
    Acá sólo deberíamos agregar funciones específicas de la clase.
    """
    def __init__(self, session: Session) -> None :
        """
        Inicialiaza el repositorio de Categoría

        Args:
            session (Session): Sesión activa de base de datos.
        """
        super().__init__(session, Categoria)

    

    def get_by_id(self, record_id: int) -> Categoria | None:
        """Sobreescribe el base para excluir soft-deleted."""
        return self.session.exec(
            select(Categoria)
            .where(Categoria.id == record_id)
            .where(Categoria.deleted_at.is_(None))  # ← filtro clave
        ).first()

    def get_by_nombre(self, nombre: str) -> Categoria | None:
        return self.session.exec(
            select(Categoria)
            .where(Categoria.nombre == nombre)
            .where(Categoria.deleted_at.is_(None))  # ← permite reutilizar nombres borrados
        ).first()

    def get_all_active(self) -> list[Categoria]:
        """
        Obtiene todas las categorías activas de manera lógica.
        Returns: list[Categoria]: lista de categorías categorías.
        """
        return list(
            self.session.exec(
                select(Categoria)
                .where(Categoria.is_active)
            ).all()
        )
    
    def get_all_raices_activas(self) -> list[Categoria]:
        """
        Obtiene solo las categorias principales (raíces) que no tienen padre.
        Esto evita que las subcategorías aparezcan en el primer nivel del JSON.
        """
        return list(
            self.session.exec(
                select(Categoria)
                .where(Categoria.is_active == True, Categoria.parent_id == None)
            ).all()
        )

    def get_paginated(
        self,
        offset: int,
        limit: int,
        parent_id: int | None,
    ) -> tuple[int, list[Categoria]]:
        filters = [Categoria.is_active == True, Categoria.deleted_at == None]
        if parent_id is None:
            filters.append(Categoria.parent_id == None)
        else:
            filters.append(Categoria.parent_id == parent_id)

        total = self.session.exec(
            select(func.count(Categoria.id)).where(*filters)
        ).one()

        items = list(
            self.session.exec(
                select(Categoria).where(*filters).offset(offset).limit(limit)
            ).all()
        )
        return total, items
