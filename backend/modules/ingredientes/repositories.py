from sqlalchemy import func
from sqlmodel import Session, select

from backend.core.repository import BaseRepository
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

    def get_by_nombre(self, nombre: str) -> Ingrediente | None:
        return self.session.exec(
            select(Ingrediente).where(Ingrediente.nombre == nombre)
        ).first()

    def get_all_active(self) -> list[Ingrediente]:
        return list(self.session.exec(select(Ingrediente).where(Ingrediente.is_active)).all())

    def count_active(self, name: str | None = None, es_alergeno: bool | None = None) -> int:
        stmt = select(func.count()).select_from(Ingrediente).where(Ingrediente.is_active)
        if name:
            stmt = stmt.where(Ingrediente.nombre.ilike(f"%{name}%"))
        if es_alergeno is not None:
            stmt = stmt.where(Ingrediente.es_alergeno == es_alergeno)
        return int(self.session.exec(stmt).one())

    def get_active_paginated(
        self,
        offset: int = 0,
        limit: int = 10,
        name: str | None = None,
        es_alergeno: bool | None = None,
    ) -> list[Ingrediente]:
        stmt = select(Ingrediente).where(Ingrediente.is_active)
        if name:
            stmt = stmt.where(Ingrediente.nombre.ilike(f"%{name}%"))
        if es_alergeno is not None:
            stmt = stmt.where(Ingrediente.es_alergeno == es_alergeno)
        stmt = stmt.order_by(Ingrediente.created_at.desc())
        return list(self.session.exec(stmt.offset(offset).limit(limit)).all())
