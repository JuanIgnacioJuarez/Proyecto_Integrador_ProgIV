from typing import List
from datetime import datetime
from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.core.links import ProductoCategoriaLink, ProductoIngredienteLink
from app.core.unit_of_work import UnitOfWork
from app.modules.categoria.models import Categoria
from app.modules.ingrediente.models import Ingrediente
from app.modules.producto.models import Producto
from app.modules.producto.schemas import (
    ProductoCreate,
    ProductoUpdate,
    ProductoRead,
    ProductoReadFull,
    CategoriaBasicRead,
    IngredienteBasicRead,
)


class ProductoService:
    """
    Capa lógica de negocio para Producto.

    Responsabilidades:
    - Validaciones de dominio (existencia de registros).
    - Coordinar repositorios a través del Unit of Work centralizado.
    - Levantar HTTPException cuando corresponde.
    """

    def __init__(self, session: Session) -> None:
        self._session = session

    def _get_or_404(self, uow: UnitOfWork, producto_id: int) -> Producto:
        producto = uow.productos.get_by_id(producto_id)
        if not producto or producto.deleted_at is not None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Producto con id={producto_id} no encontrado",
            )
        return producto

    def _get_categoria_or_404(self, uow: UnitOfWork, categoria_id: int) -> Categoria:
        categoria = uow.categorias.get_by_id(categoria_id)
        if not categoria or categoria.deleted_at is not None or not categoria.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Categoría con id={categoria_id} no encontrada",
            )
        return categoria

    def _get_ingrediente_or_404(
        self, uow: UnitOfWork, ingrediente_id: int
    ) -> Ingrediente:
        ingrediente = uow.ingredientes.get_by_id(ingrediente_id)
        if (
            not ingrediente
            or ingrediente.deleted_at is not None
            or not ingrediente.is_active
        ):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Ingrediente con id={ingrediente_id} no encontrado",
            )
        return ingrediente

    def _serialize_full(self, uow: UnitOfWork, producto: Producto) -> ProductoReadFull:
        # ===== MODIFICACION =====
        # serializamos a mano para incluir los flags de tablas puente
        # (`es_principal`, `es_removible`) en la respuesta completa del producto.
        categoria_links = {
            l.categoria_id: l.es_principal
            for l in uow._session.exec(
                select(ProductoCategoriaLink).where(
                    ProductoCategoriaLink.producto_id == producto.id
                )
            ).all()
        }
        ingrediente_links = {
            l.ingrediente_id: l.es_removible
            for l in uow._session.exec(
                select(ProductoIngredienteLink).where(
                    ProductoIngredienteLink.producto_id == producto.id
                )
            ).all()
        }

        categorias = [
            CategoriaBasicRead(
                id=c.id,
                nombre=c.nombre,
                es_principal=bool(categoria_links.get(c.id, False)),
            )
            for c in producto.categorias
            if c.deleted_at is None and c.is_active
        ]

        ingredientes = [
            IngredienteBasicRead(
                id=i.id,
                nombre=i.nombre,
                es_alergeno=i.es_alergeno,
                es_removible=bool(ingrediente_links.get(i.id, False)),
            )
            for i in producto.ingredientes
            if i.deleted_at is None and i.is_active
        ]

        return ProductoReadFull(
            id=producto.id,
            nombre=producto.nombre,
            descripcion=producto.descripcion,
            precio_base=producto.precio_base,
            categorias=categorias,
            ingredientes=ingredientes,
        )

    def create(self, data: ProductoCreate) -> ProductoRead:
        with UnitOfWork(self._session) as uow:
            # ===== MODIFICACION =====
            # separamos relaciones del payload base porque el modelo Producto
            # no puede validar esas listas directo.
            base_payload = data.model_dump(exclude={"categorias", "ingredientes"})
            producto = Producto.model_validate(base_payload)
            uow.productos.add(producto)

            for categoria in data.categorias:
                self._get_categoria_or_404(uow, categoria.categoria_id)
                uow._session.add(
                    ProductoCategoriaLink(
                        producto_id=producto.id,
                        categoria_id=categoria.categoria_id,
                        es_principal=categoria.es_principal,
                    )
                )

            for ingrediente in data.ingredientes:
                self._get_ingrediente_or_404(uow, ingrediente.ingrediente_id)
                uow._session.add(
                    ProductoIngredienteLink(
                        producto_id=producto.id,
                        ingrediente_id=ingrediente.ingrediente_id,
                        es_removible=ingrediente.es_removible,
                    )
                )

            uow._session.flush()
            uow._session.refresh(producto)
            result = ProductoRead.model_validate(producto)
        return result

    def get_all(self) -> List[ProductoReadFull]:
        with UnitOfWork(self._session) as uow:
            productos = uow.productos.get_all_active()
            result = [self._serialize_full(uow, p) for p in productos]
        return result

    def get_by_id(self, producto_id: int) -> ProductoReadFull:
        with UnitOfWork(self._session) as uow:
            producto = self._get_or_404(uow, producto_id)
            result = self._serialize_full(uow, producto)
        return result

    def update(self, producto_id: int, data: ProductoUpdate) -> ProductoRead:
        with UnitOfWork(self._session) as uow:
            producto = self._get_or_404(uow, producto_id)
            patch = data.model_dump(exclude_unset=True)

            categorias_patch = patch.pop("categorias", None)
            ingredientes_patch = patch.pop("ingredientes", None)

            for field, value in patch.items():
                setattr(producto, field, value)
            producto.updated_at = datetime.utcnow()
            uow.productos.add(producto)

            if categorias_patch is not None:
                # ===== MODIFICACION =====
                # cuando vienen categorias en update, reemplazamos la relacion
                # de forma controlada (borramos lo viejo y cargamos lo nuevo).
                existing = uow._session.exec(
                    select(ProductoCategoriaLink).where(
                        ProductoCategoriaLink.producto_id == producto.id
                    )
                ).all()
                for link in existing:
                    uow._session.delete(link)
                for categoria in categorias_patch:
                    self._get_categoria_or_404(uow, categoria["categoria_id"])
                    uow._session.add(
                        ProductoCategoriaLink(
                            producto_id=producto.id,
                            categoria_id=categoria["categoria_id"],
                            es_principal=categoria.get("es_principal", False),
                        )
                    )

            if ingredientes_patch is not None:
                existing = uow._session.exec(
                    select(ProductoIngredienteLink).where(
                        ProductoIngredienteLink.producto_id == producto.id
                    )
                ).all()
                for link in existing:
                    uow._session.delete(link)
                for ingrediente in ingredientes_patch:
                    self._get_ingrediente_or_404(uow, ingrediente["ingrediente_id"])
                    uow._session.add(
                        ProductoIngredienteLink(
                            producto_id=producto.id,
                            ingrediente_id=ingrediente["ingrediente_id"],
                            es_removible=ingrediente.get("es_removible", False),
                        )
                    )

            uow._session.flush()
            uow._session.refresh(producto)
            result = ProductoRead.model_validate(producto)
        return result

    def soft_delete(self, producto_id: int) -> None:
        with UnitOfWork(self._session) as uow:
            producto = self._get_or_404(uow, producto_id)
            producto.deleted_at = datetime.utcnow()
            producto.is_active = False
            uow.productos.add(producto)

    def add_to_categoria(
        self, producto_id: int, categoria_id: int, es_principal: bool = False
    ) -> ProductoReadFull:
        with UnitOfWork(self._session) as uow:
            producto = self._get_or_404(uow, producto_id)
            self._get_categoria_or_404(uow, categoria_id)

            link = uow._session.exec(
                select(ProductoCategoriaLink).where(
                    ProductoCategoriaLink.producto_id == producto_id,
                    ProductoCategoriaLink.categoria_id == categoria_id,
                )
            ).first()
            if link is None:
                uow._session.add(
                    ProductoCategoriaLink(
                        producto_id=producto_id,
                        categoria_id=categoria_id,
                        es_principal=es_principal,
                    )
                )
            else:
                link.es_principal = es_principal
                uow._session.add(link)

            uow._session.flush()
            uow._session.refresh(producto)
            result = self._serialize_full(uow, producto)
        return result

    def remove_from_categoria(self, producto_id: int, categoria_id: int) -> ProductoReadFull:
        with UnitOfWork(self._session) as uow:
            producto = self._get_or_404(uow, producto_id)
            link = uow._session.exec(
                select(ProductoCategoriaLink).where(
                    ProductoCategoriaLink.producto_id == producto_id,
                    ProductoCategoriaLink.categoria_id == categoria_id,
                )
            ).first()
            if link is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Relación producto-categoría no encontrada",
                )
            uow._session.delete(link)
            uow._session.flush()
            uow._session.refresh(producto)
            result = self._serialize_full(uow, producto)
        return result

    def get_producto_categorias(self, producto_id: int) -> List[CategoriaBasicRead]:
        with UnitOfWork(self._session) as uow:
            producto = self._get_or_404(uow, producto_id)
            categoria_links = {
                l.categoria_id: l.es_principal
                for l in uow._session.exec(
                    select(ProductoCategoriaLink).where(
                        ProductoCategoriaLink.producto_id == producto.id
                    )
                ).all()
            }
            result = [
                CategoriaBasicRead(
                    id=c.id,
                    nombre=c.nombre,
                    es_principal=bool(categoria_links.get(c.id, False)),
                )
                for c in producto.categorias
                if c.deleted_at is None and c.is_active
            ]
        return result
