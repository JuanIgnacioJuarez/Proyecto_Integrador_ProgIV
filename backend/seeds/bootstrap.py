from __future__ import annotations

import os
import unicodedata
from decimal import Decimal

from sqlmodel import Session, select

from backend.core.links import ProductoCategoriaLink, ProductoIngredienteLink
from backend.modules.auth.models import Rol, Usuario
from backend.modules.auth.security import hash_password
from backend.modules.categorias.models import Categoria
from backend.modules.ingredientes.models import Ingrediente
from backend.modules.pedidos.models import EstadoPedido, FormaPago
from backend.modules.productos.models import Producto


def normalize_text(value: str) -> str:
    normalized = unicodedata.normalize("NFD", value.strip().lower())
    without_accents = "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")
    return " ".join(without_accents.split())


def seed_default_users(session: Session) -> None:
    default_admin_email = os.getenv("DEFAULT_ADMIN_EMAIL", "admin@foodstore.com")
    default_admin_password = os.getenv("DEFAULT_ADMIN_PASSWORD", "admin123")
    default_admin_name = os.getenv("DEFAULT_ADMIN_NAME", "Administrador")

    demo_users = [
        (default_admin_email, default_admin_name, Rol.ADMIN, default_admin_password),
        (
            os.getenv("DEFAULT_STOCK_EMAIL", "stock@foodstore.com"),
            os.getenv("DEFAULT_STOCK_NAME", "Gestor de Stock"),
            Rol.STOCK,
            os.getenv("DEFAULT_STOCK_PASSWORD", "stock123"),
        ),
        (
            os.getenv("DEFAULT_PEDIDOS_EMAIL", "pedidos@foodstore.com"),
            os.getenv("DEFAULT_PEDIDOS_NAME", "Gestor de Pedidos"),
            Rol.PEDIDOS,
            os.getenv("DEFAULT_PEDIDOS_PASSWORD", "pedidos123"),
        ),
        (
            os.getenv("DEFAULT_CLIENT_EMAIL", "cliente@foodstore.com"),
            os.getenv("DEFAULT_CLIENT_NAME", "Cliente Demo"),
            Rol.CLIENT,
            os.getenv("DEFAULT_CLIENT_PASSWORD", "cliente123"),
        ),
    ]

    for email, nombre, rol_value, password in demo_users:
        if not session.exec(select(Usuario).where(Usuario.email == email)).first():
            session.add(
                Usuario(
                    nombre=nombre,
                    email=email,
                    password_hash=hash_password(password),
                    rol=rol_value,
                )
            )
    session.commit()


def seed_catalogos(session: Session) -> None:
    """Carga las tablas catalogo FormaPago y EstadoPedido si estan vacias."""
    formas_pago = [
        FormaPago(codigo="EFECTIVO", descripcion="Pago en efectivo"),
        FormaPago(codigo="TARJETA", descripcion="Tarjeta de credito o debito"),
        FormaPago(codigo="TRANSFERENCIA", descripcion="Transferencia bancaria"),
    ]
    for fp in formas_pago:
        if not session.exec(select(FormaPago).where(FormaPago.codigo == fp.codigo)).first():
            session.add(fp)

    estados_pedido = [
        EstadoPedido(codigo="PENDIENTE", descripcion="Pedido recibido, pendiente de confirmacion", orden=1, es_terminal=False),
        EstadoPedido(codigo="CONFIRMADO", descripcion="Pedido confirmado por el local", orden=2, es_terminal=False),
        EstadoPedido(codigo="EN_PREP", descripcion="En preparacion", orden=3, es_terminal=False),
        EstadoPedido(codigo="EN_CAMINO", descripcion="En camino al cliente", orden=4, es_terminal=False),
        EstadoPedido(codigo="ENTREGADO", descripcion="Entregado al cliente", orden=5, es_terminal=True),
        EstadoPedido(codigo="CANCELADO", descripcion="Pedido cancelado", orden=6, es_terminal=True),
    ]
    for ep in estados_pedido:
        if not session.exec(select(EstadoPedido).where(EstadoPedido.codigo == ep.codigo)).first():
            session.add(ep)

    session.commit()


def seed_demo_data(session: Session) -> None:
    """Carga datos demo y corrige duplicados por nombres equivalentes."""

    def merge_duplicate_products() -> None:
        productos = session.exec(select(Producto)).all()
        by_name: dict[str, list[Producto]] = {}
        for p in productos:
            by_name.setdefault(normalize_text(p.nombre), []).append(p)

        for group in by_name.values():
            if len(group) <= 1:
                continue

            group.sort(key=lambda x: x.id or 0)
            keep = group[0]
            duplicates = group[1:]

            keep.descripcion = max([g.descripcion or "" for g in group], key=len, default="") or keep.descripcion
            keep.stock_cantidad = max(g.stock_cantidad for g in group)
            keep.is_active = any(bool(g.is_active) for g in group)

            non_zero_prices = [g.precio_base for g in group if Decimal(g.precio_base) > 0]
            if non_zero_prices:
                keep.precio_base = non_zero_prices[0]

            for dup in duplicates:
                cat_links = session.exec(
                    select(ProductoCategoriaLink).where(ProductoCategoriaLink.producto_id == dup.id)
                ).all()
                for link in cat_links:
                    existing = session.exec(
                        select(ProductoCategoriaLink).where(
                            ProductoCategoriaLink.producto_id == keep.id,
                            ProductoCategoriaLink.categoria_id == link.categoria_id,
                        )
                    ).first()
                    if existing:
                        existing.es_principal = existing.es_principal or link.es_principal
                        session.delete(link)
                    else:
                        session.add(
                            ProductoCategoriaLink(
                                producto_id=keep.id,
                                categoria_id=link.categoria_id,
                                es_principal=link.es_principal,
                            )
                        )
                        session.delete(link)

                ing_links = session.exec(
                    select(ProductoIngredienteLink).where(ProductoIngredienteLink.producto_id == dup.id)
                ).all()
                for link in ing_links:
                    existing = session.exec(
                        select(ProductoIngredienteLink).where(
                            ProductoIngredienteLink.producto_id == keep.id,
                            ProductoIngredienteLink.ingrediente_id == link.ingrediente_id,
                        )
                    ).first()
                    if existing:
                        existing.es_removible = existing.es_removible or link.es_removible
                        session.delete(link)
                    else:
                        session.add(
                            ProductoIngredienteLink(
                                producto_id=keep.id,
                                ingrediente_id=link.ingrediente_id,
                                es_removible=link.es_removible,
                            )
                        )
                        session.delete(link)

                session.delete(dup)

    def merge_duplicate_categories() -> None:
        categorias = session.exec(select(Categoria)).all()
        by_name: dict[str, list[Categoria]] = {}
        for c in categorias:
            by_name.setdefault(normalize_text(c.nombre), []).append(c)

        for group in by_name.values():
            if len(group) <= 1:
                continue

            group.sort(key=lambda x: x.id or 0)
            keep = group[0]
            duplicates = group[1:]

            keep.descripcion = max([g.descripcion or "" for g in group], key=len, default="") or keep.descripcion
            keep.is_active = any(bool(g.is_active) for g in group)

            for dup in duplicates:
                childs = session.exec(select(Categoria).where(Categoria.parent_id == dup.id)).all()
                for child in childs:
                    child.parent_id = keep.id

                links = session.exec(
                    select(ProductoCategoriaLink).where(ProductoCategoriaLink.categoria_id == dup.id)
                ).all()
                for link in links:
                    existing = session.exec(
                        select(ProductoCategoriaLink).where(
                            ProductoCategoriaLink.producto_id == link.producto_id,
                            ProductoCategoriaLink.categoria_id == keep.id,
                        )
                    ).first()
                    if existing:
                        existing.es_principal = existing.es_principal or link.es_principal
                        session.delete(link)
                    else:
                        session.add(
                            ProductoCategoriaLink(
                                producto_id=link.producto_id,
                                categoria_id=keep.id,
                                es_principal=link.es_principal,
                            )
                        )
                        session.delete(link)

                if keep.parent_id == dup.id:
                    keep.parent_id = None

                session.delete(dup)

    def merge_duplicate_ingredients() -> None:
        ingredientes = session.exec(select(Ingrediente)).all()
        by_name: dict[str, list[Ingrediente]] = {}
        for i in ingredientes:
            by_name.setdefault(normalize_text(i.nombre), []).append(i)

        for group in by_name.values():
            if len(group) <= 1:
                continue

            group.sort(key=lambda x: x.id or 0)
            keep = group[0]
            duplicates = group[1:]

            keep.descripcion = max([g.descripcion or "" for g in group], key=len, default="") or keep.descripcion
            keep.es_alergeno = any(bool(g.es_alergeno) for g in group)
            keep.is_active = any(bool(g.is_active) for g in group)

            for dup in duplicates:
                links = session.exec(
                    select(ProductoIngredienteLink).where(ProductoIngredienteLink.ingrediente_id == dup.id)
                ).all()
                for link in links:
                    existing = session.exec(
                        select(ProductoIngredienteLink).where(
                            ProductoIngredienteLink.producto_id == link.producto_id,
                            ProductoIngredienteLink.ingrediente_id == keep.id,
                        )
                    ).first()
                    if existing:
                        existing.es_removible = existing.es_removible or link.es_removible
                        session.delete(link)
                    else:
                        session.add(
                            ProductoIngredienteLink(
                                producto_id=link.producto_id,
                                ingrediente_id=keep.id,
                                es_removible=link.es_removible,
                            )
                        )
                        session.delete(link)

                session.delete(dup)

    def find_categoria(name: str) -> Categoria | None:
        target = normalize_text(name)
        categorias = session.exec(select(Categoria)).all()
        for c in categorias:
            if normalize_text(c.nombre) == target:
                return c
        return None

    def find_ingrediente(name: str) -> Ingrediente | None:
        target = normalize_text(name)
        ingredientes = session.exec(select(Ingrediente)).all()
        for i in ingredientes:
            if normalize_text(i.nombre) == target:
                return i
        return None

    def find_producto(name: str) -> Producto | None:
        target = normalize_text(name)
        productos = session.exec(select(Producto)).all()
        for p in productos:
            if normalize_text(p.nombre) == target:
                return p
        return None

    def get_or_create_categoria(nombre: str, descripcion: str, parent_id: int | None = None) -> Categoria:
        categoria = find_categoria(nombre)
        if categoria is None:
            categoria = Categoria(nombre=nombre, descripcion=descripcion, parent_id=parent_id)
            session.add(categoria)
            session.flush()
            return categoria

        categoria.nombre = nombre
        categoria.descripcion = descripcion
        categoria.parent_id = parent_id
        return categoria

    def get_or_create_ingrediente(nombre: str, descripcion: str, es_alergeno: bool = False) -> Ingrediente:
        ingrediente = find_ingrediente(nombre)
        if ingrediente is None:
            ingrediente = Ingrediente(nombre=nombre, descripcion=descripcion, es_alergeno=es_alergeno)
            session.add(ingrediente)
            session.flush()
            return ingrediente

        ingrediente.nombre = nombre
        ingrediente.descripcion = descripcion
        ingrediente.es_alergeno = es_alergeno
        return ingrediente

    def get_or_create_producto(nombre: str, descripcion: str, precio: str, stock: int) -> Producto:
        producto = find_producto(nombre)
        if producto is None:
            producto = Producto(
                nombre=nombre,
                descripcion=descripcion,
                precio_base=Decimal(precio),
                stock_cantidad=stock,
                imagenes_url=[],
            )
            session.add(producto)
            session.flush()
            return producto

        producto.nombre = nombre
        producto.descripcion = descripcion
        producto.precio_base = Decimal(precio)
        producto.stock_cantidad = stock
        return producto

    def ensure_producto_categoria(producto_id: int, categoria_id: int, es_principal: bool) -> None:
        link = session.exec(
            select(ProductoCategoriaLink).where(
                ProductoCategoriaLink.producto_id == producto_id,
                ProductoCategoriaLink.categoria_id == categoria_id,
            )
        ).first()
        if link is None:
            session.add(
                ProductoCategoriaLink(
                    producto_id=producto_id,
                    categoria_id=categoria_id,
                    es_principal=es_principal,
                )
            )
            return
        link.es_principal = es_principal

    def ensure_producto_ingrediente(producto_id: int, ingrediente_id: int, es_removible: bool) -> None:
        link = session.exec(
            select(ProductoIngredienteLink).where(
                ProductoIngredienteLink.producto_id == producto_id,
                ProductoIngredienteLink.ingrediente_id == ingrediente_id,
            )
        ).first()
        if link is None:
            session.add(
                ProductoIngredienteLink(
                    producto_id=producto_id,
                    ingrediente_id=ingrediente_id,
                    es_removible=es_removible,
                )
            )
            return
        link.es_removible = es_removible

    merge_duplicate_products()
    merge_duplicate_categories()
    merge_duplicate_ingredients()

    cat_bebidas = get_or_create_categoria("Bebidas", "Bebidas frias y calientes")
    cat_panaderia = get_or_create_categoria("Panaderia", "Productos horneados")
    cat_lacteos = get_or_create_categoria("Lacteos", "Leches, quesos y derivados")

    get_or_create_categoria("Infusiones", "Cafe, te y otras infusiones", parent_id=cat_bebidas.id)
    get_or_create_categoria("Panes", "Panes artesanales y de molde", parent_id=cat_panaderia.id)
    get_or_create_categoria("Quesos", "Quesos frescos y madurados", parent_id=cat_lacteos.id)

    ing_agua = get_or_create_ingrediente("Agua", "Base liquida para bebidas")
    ing_cafe = get_or_create_ingrediente("Cafe", "Cafe molido o infusionado")
    ing_harina = get_or_create_ingrediente("Harina de trigo", "Harina refinada para panificados")
    ing_leche = get_or_create_ingrediente("Leche", "Leche vacuna pasteurizada", es_alergeno=True)
    ing_azucar = get_or_create_ingrediente("Azucar", "Endulzante comun de origen vegetal")

    prod_cafe = get_or_create_producto("Cafe Latte", "Cafe con leche espumada", "1800.00", 35)
    prod_pan = get_or_create_producto("Pan Integral", "Pan artesanal de harina integral", "1200.00", 50)
    prod_agua = get_or_create_producto("Agua Mineral 500ml", "Agua sin gas", "900.00", 80)

    ensure_producto_categoria(prod_cafe.id, cat_bebidas.id, es_principal=True)
    ensure_producto_categoria(prod_pan.id, cat_panaderia.id, es_principal=True)
    ensure_producto_categoria(prod_agua.id, cat_bebidas.id, es_principal=True)

    ensure_producto_ingrediente(prod_cafe.id, ing_cafe.id, es_removible=False)
    ensure_producto_ingrediente(prod_cafe.id, ing_leche.id, es_removible=True)
    ensure_producto_ingrediente(prod_pan.id, ing_harina.id, es_removible=False)
    ensure_producto_ingrediente(prod_pan.id, ing_azucar.id, es_removible=True)
    ensure_producto_ingrediente(prod_agua.id, ing_agua.id, es_removible=False)

    session.commit()


def run_all_seeds(session: Session) -> None:
    seed_default_users(session)
    seed_catalogos(session)
    seed_demo_data(session)
