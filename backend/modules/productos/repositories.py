from sqlalchemy import func, or_
from sqlmodel import Session, select

from backend.core.links import ProductoCategoriaLink, ProductoIngredienteLink
from backend.core.repository import BaseRepository
from backend.modules.productos.models import Producto


class ProductoRepository(BaseRepository[Producto]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Producto)


    # Se agrega metodo para filtrar activos
    def get_by_id(self, record_id: int) -> Producto | None:
        """Sobreescribe el base para excluir soft-deleted."""
        return self.session.exec(
            select(Producto)
            .where(Producto.id == record_id)
            .where(Producto.deleted_at.is_(None))   # ← filtro clave
        ).first()

    def get_all_active(self) -> list[Producto]:
        return list(
            self.session.exec(
                select(Producto).where(Producto.is_active == True, Producto.deleted_at == None)
            ).all()
        )

    def get_paginated(
        self,
        offset: int,
        limit: int,
        categoria_id: int | None,
        ingrediente_id: int | None,
        disponible: bool | None,
        search: str | None,
    ) -> tuple[int, list[Producto]]:
        q = select(Producto).where(
            Producto.is_active == True,
            Producto.deleted_at == None,
        )

        if disponible is not None:
            q = q.where(Producto.disponible == disponible)

        if search:
            pattern = f"%{search}%"
            q = q.where(
                or_(
                    Producto.nombre.ilike(pattern),
                    Producto.descripcion.ilike(pattern),
                )
            )

        if categoria_id is not None:
            q = q.join(
                ProductoCategoriaLink,
                ProductoCategoriaLink.producto_id == Producto.id,
            ).where(ProductoCategoriaLink.categoria_id == categoria_id)

        if ingrediente_id is not None:
            q = q.join(
                ProductoIngredienteLink,
                ProductoIngredienteLink.producto_id == Producto.id,
            ).where(ProductoIngredienteLink.ingrediente_id == ingrediente_id)

        total = self.session.exec(
            select(func.count()).select_from(q.subquery())
        ).one()

        q = q.order_by(Producto.created_at.desc())
        items = list(self.session.exec(q.offset(offset).limit(limit)).all())
        return total, items
