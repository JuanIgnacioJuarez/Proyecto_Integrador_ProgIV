from sqlalchemy import asc, desc, func
from sqlmodel import Session, select

from backend.core.repository import BaseRepository
from backend.modules.categorias.models import Categoria


class CategoriaRepository(BaseRepository[Categoria]):
    """Repositorio especifico de Categoria."""

    def __init__(self, session: Session) -> None:
        super().__init__(session, Categoria)

    def get_by_id(self, record_id: int) -> Categoria | None:
        """Sobreescribe el base para excluir soft-deleted."""
        return self.session.exec(
            select(Categoria)
            .where(Categoria.id == record_id)
            .where(Categoria.deleted_at.is_(None))
        ).first()

    def get_by_id_any(self, record_id: int) -> Categoria | None:
        return self.session.exec(
            select(Categoria).where(Categoria.id == record_id)
        ).first()

    def get_by_nombre(self, nombre: str) -> Categoria | None:
        return self.session.exec(
            select(Categoria)
            .where(Categoria.nombre == nombre)
            .where(Categoria.deleted_at.is_(None))
        ).first()

    def get_all_active(self) -> list[Categoria]:
        return list(
            self.session.exec(
                select(Categoria)
                .where(Categoria.is_active)
            ).all()
        )

    def get_all_raices_activas(self) -> list[Categoria]:
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
        categoria_id: int | None = None,
        is_active: bool | None = None,
        sort_by: str | None = None,
        sort_dir: str = "asc",
        search: str | None = None,
        include_inactive: bool = False,
    ) -> tuple[int, list[Categoria]]:
        filters = []

        if not include_inactive:
            filters.extend([Categoria.is_active == True, Categoria.deleted_at == None])
        elif is_active is not None:
            filters.append(Categoria.is_active == is_active)

        if categoria_id is not None:
            filters.append(Categoria.id == categoria_id)
        elif parent_id is None:
            filters.append(Categoria.parent_id == None)
        else:
            filters.append(Categoria.parent_id == parent_id)

        if search:
            filters.append(Categoria.nombre.ilike(f"%{search}%"))

        total = self.session.exec(
            select(func.count(Categoria.id)).where(*filters)
        ).one()

        sort_field = (sort_by or "").lower()
        direction = desc if str(sort_dir).lower() == "desc" else asc
        sort_column = Categoria.nombre if sort_field == "nombre" else Categoria.created_at

        stmt = select(Categoria).where(*filters)
        if include_inactive and is_active is None:
            stmt = stmt.order_by(Categoria.is_active.desc(), direction(sort_column))
        else:
            stmt = stmt.order_by(direction(sort_column))

        items = list(self.session.exec(stmt.offset(offset).limit(limit)).all())
        return total, items
