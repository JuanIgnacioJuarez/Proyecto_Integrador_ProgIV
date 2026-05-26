from sqlalchemy import asc, desc, func
from sqlmodel import Session, select

from backend.core.repository import BaseRepository
from backend.modules.categorias.models import Categoria
from backend.modules.ingredientes.models import Ingrediente


class IngredienteRepository(BaseRepository[Ingrediente]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Ingrediente)

    def get_by_id(self, record_id: int) -> Ingrediente | None:
        return self.session.exec(
            select(Ingrediente)
            .where(Ingrediente.id == record_id)
            .where(Ingrediente.deleted_at.is_(None))
        ).first()

    def get_by_id_any(self, record_id: int) -> Ingrediente | None:
        return self.session.exec(
            select(Ingrediente).where(Ingrediente.id == record_id)
        ).first()

    def get_by_nombre(self, nombre: str) -> Ingrediente | None:
        return self.session.exec(
            select(Ingrediente)
            .where(Ingrediente.nombre == nombre)
            .where(Ingrediente.deleted_at.is_(None))
        ).first()

    def get_all_active(self) -> list[Ingrediente]:
        return list(
            self.session.exec(
                select(Ingrediente).where(Ingrediente.is_active, Ingrediente.deleted_at.is_(None))
            ).all()
        )

    def count_active(
        self,
        name: str | None = None,
        es_alergeno: bool | None = None,
        categoria_id: int | None = None,
        subcategoria_id: int | None = None,
        is_active: bool | None = None,
        include_inactive: bool = False,
    ) -> int:
        stmt = select(func.count()).select_from(Ingrediente)
        if not include_inactive:
            stmt = stmt.where(Ingrediente.is_active, Ingrediente.deleted_at.is_(None))
        elif is_active is not None:
            stmt = stmt.where(Ingrediente.is_active == is_active)
        if name:
            stmt = stmt.where(Ingrediente.nombre.ilike(f"%{name}%"))
        if es_alergeno is not None:
            stmt = stmt.where(Ingrediente.es_alergeno == es_alergeno)

        categoria_ids: list[int] = []
        if subcategoria_id is not None:
            categoria_ids = [subcategoria_id]
        elif categoria_id is not None:
            categoria_ids = [categoria_id]
            subcategorias = self.session.exec(
                select(Categoria.id).where(
                    Categoria.parent_id == categoria_id,
                    Categoria.deleted_at.is_(None),
                )
            ).all()
            categoria_ids.extend(subcategorias)
        if categoria_ids:
            stmt = stmt.where(Ingrediente.categoria_id.in_(categoria_ids))
        return int(self.session.exec(stmt).one())

    def get_active_paginated(
        self,
        offset: int = 0,
        limit: int = 10,
        name: str | None = None,
        es_alergeno: bool | None = None,
        categoria_id: int | None = None,
        subcategoria_id: int | None = None,
        is_active: bool | None = None,
        sort_by: str | None = None,
        sort_dir: str = "asc",
        include_inactive: bool = False,
    ) -> list[Ingrediente]:
        stmt = select(Ingrediente)
        if not include_inactive:
            stmt = stmt.where(Ingrediente.is_active, Ingrediente.deleted_at.is_(None))
        elif is_active is not None:
            stmt = stmt.where(Ingrediente.is_active == is_active)
        if name:
            stmt = stmt.where(Ingrediente.nombre.ilike(f"%{name}%"))
        if es_alergeno is not None:
            stmt = stmt.where(Ingrediente.es_alergeno == es_alergeno)

        categoria_ids: list[int] = []
        if subcategoria_id is not None:
            categoria_ids = [subcategoria_id]
        elif categoria_id is not None:
            categoria_ids = [categoria_id]
            subcategorias = self.session.exec(
                select(Categoria.id).where(
                    Categoria.parent_id == categoria_id,
                    Categoria.deleted_at.is_(None),
                )
            ).all()
            categoria_ids.extend(subcategorias)
        if categoria_ids:
            stmt = stmt.where(Ingrediente.categoria_id.in_(categoria_ids))

        direction = desc if str(sort_dir).lower() == "desc" else asc
        sort_field = (sort_by or "").lower()
        sort_column = Ingrediente.stock_cantidad if sort_field == "stock" else Ingrediente.nombre
        if include_inactive and is_active is None:
            stmt = stmt.order_by(Ingrediente.is_active.desc(), direction(sort_column))
        else:
            stmt = stmt.order_by(direction(sort_column))

        return list(self.session.exec(stmt.offset(offset).limit(limit)).all())
