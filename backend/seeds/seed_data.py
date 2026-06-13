from __future__ import annotations

import os
import unicodedata
from datetime import datetime
from decimal import Decimal

from sqlmodel import Session, select

from backend.core.links import (
    ProductoCategoriaLink,
    ProductoIngredienteLink,
)
from backend.modules.auth.models import Rol, Usuario, UsuarioRolLink
from backend.modules.auth.security import hash_password
from backend.modules.categorias.models import Categoria
from backend.modules.ingredientes.models import Ingrediente
from backend.modules.pedidos.models import EstadoPedido, FormaPago
from backend.modules.productos.models import Producto


def normalize_text(value: str) -> str:
    normalized = unicodedata.normalize("NFD", value.strip().lower())
    without_accents = "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")
    return " ".join(without_accents.split())


def seed_roles(session: Session) -> None:
    """Carga la tabla rol con los cuatro roles del sistema si no existen."""
    roles_data = [
        (Rol.ADMIN, "Administrador", "Administrador del sistema"),
        (Rol.STOCK, "Gestor de stock", "Gestor de inventario y stock"),
        (Rol.PEDIDOS, "Gestor de pedidos", "Gestor de pedidos"),
        (Rol.CLIENT, "Cliente", "Cliente registrado"),
    ]
    for codigo, nombre, descripcion in roles_data:
        if not session.exec(select(Rol).where(Rol.codigo == codigo)).first():
            session.add(Rol(codigo=codigo, nombre=nombre, descripcion=descripcion))
    session.commit()


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

    for email, nombre, rol_nombre, password in demo_users:
        user = session.exec(select(Usuario).where(Usuario.email == email)).first()
        if not user:
            user = Usuario(nombre=nombre, email=email, password_hash=hash_password(password))
            session.add(user)
            session.flush()

        rol_obj = session.exec(select(Rol).where(Rol.codigo == rol_nombre)).first()
        if rol_obj:
            ya_tiene_link = session.exec(
                select(UsuarioRolLink).where(
                    UsuarioRolLink.usuario_id == user.id,
                    UsuarioRolLink.rol_codigo == rol_obj.codigo,
                )
            ).first()
            if not ya_tiene_link:
                session.add(UsuarioRolLink(usuario_id=user.id, rol_codigo=rol_obj.codigo))

    session.commit()


def seed_catalogos(session: Session) -> None:
    """Carga las tablas catalogo FormaPago y EstadoPedido si estan vacias."""
    formas_pago = [
        FormaPago(codigo="EFECTIVO", descripcion="Pago en efectivo"),
        FormaPago(codigo="TARJETA", descripcion="Tarjeta de credito o debito"),
        FormaPago(codigo="TRANSFERENCIA", descripcion="Transferencia bancaria"),
        FormaPago(codigo="MERCADOPAGO", descripcion="Pago con MercadoPago"),
    ]
    for fp in formas_pago:
        if not session.exec(select(FormaPago).where(FormaPago.codigo == fp.codigo)).first():
            session.add(fp)

    estados_pedido = [
        EstadoPedido(codigo="PENDIENTE", descripcion="Pedido recibido, pendiente de confirmacion", orden=1, es_terminal=False),
        EstadoPedido(codigo="CONFIRMADO", descripcion="Pedido confirmado por el local", orden=2, es_terminal=False),
        EstadoPedido(codigo="EN_PREP", descripcion="En preparacion", orden=3, es_terminal=False),
        EstadoPedido(codigo="ENTREGADO", descripcion="Entregado al cliente", orden=4, es_terminal=True),
        EstadoPedido(codigo="CANCELADO", descripcion="Pedido cancelado", orden=5, es_terminal=True),
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
                        existing.cantidad = max(float(existing.cantidad), float(link.cantidad))
                        session.delete(link)
                    else:
                        session.add(
                            ProductoIngredienteLink(
                                producto_id=keep.id,
                                ingrediente_id=link.ingrediente_id,
                                es_removible=link.es_removible,
                                cantidad=float(link.cantidad),
                                unidad_medida_id=link.unidad_medida_id,
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
            keep.stock_cantidad = max(float(g.stock_cantidad or 0) for g in group)
            keep.unidad_medida = next((g.unidad_medida for g in group if g.unidad_medida), keep.unidad_medida)

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
                        existing.cantidad = max(float(existing.cantidad), float(link.cantidad))
                        session.delete(link)
                    else:
                        session.add(
                            ProductoIngredienteLink(
                                producto_id=link.producto_id,
                                ingrediente_id=keep.id,
                                es_removible=link.es_removible,
                                cantidad=float(link.cantidad),
                                unidad_medida_id=link.unidad_medida_id,
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
            ingrediente = Ingrediente(
                nombre=nombre,
                descripcion=descripcion,
                es_alergeno=es_alergeno,
                unidad_medida="unidad",
                stock_cantidad=100,
            )
            session.add(ingrediente)
            session.flush()
            return ingrediente

        ingrediente.nombre = nombre
        ingrediente.descripcion = descripcion
        ingrediente.es_alergeno = es_alergeno
        ingrediente.unidad_medida = ingrediente.unidad_medida or "unidad"
        ingrediente.stock_cantidad = float(ingrediente.stock_cantidad or 100.0)
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

    def ensure_producto_ingrediente(
        producto_id: int,
        ingrediente_id: int,
        es_removible: bool,
        cantidad: float = 1,
    ) -> None:
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
                    cantidad=cantidad,
                )
            )
        else:
            link.es_removible = es_removible
            link.cantidad = cantidad

    def remove_producto_ingrediente(producto_id: int, ingrediente_id: int) -> None:
        link = session.exec(
            select(ProductoIngredienteLink).where(
                ProductoIngredienteLink.producto_id == producto_id,
                ProductoIngredienteLink.ingrediente_id == ingrediente_id,
            )
        ).first()
        if link is not None:
            session.delete(link)

    merge_duplicate_products()
    merge_duplicate_categories()
    merge_duplicate_ingredients()

    # Categorias de rotiseria
    cat_comidas = get_or_create_categoria("Comidas", "Platos principales de rotiseria")
    cat_bebidas = get_or_create_categoria("Bebidas", "Bebidas frias y gaseosas")

    cat_hamburguesas = get_or_create_categoria("Hamburguesas", "Hamburguesas caseras", parent_id=cat_comidas.id)
    cat_pizzas = get_or_create_categoria("Pizzas", "Pizzas artesanales", parent_id=cat_comidas.id)
    cat_empanadas = get_or_create_categoria("Empanadas", "Empanadas al horno y fritas", parent_id=cat_comidas.id)
    cat_milanesas = get_or_create_categoria("Milanesas", "Milanesas con guarnicion", parent_id=cat_comidas.id)
    cat_postres = get_or_create_categoria("Postres", "Postres caseros y porciones", parent_id=cat_comidas.id)

    cat_agua = get_or_create_categoria("Aguas", "Aguas minerales", parent_id=cat_bebidas.id)
    cat_soda = get_or_create_categoria("Sodas", "Soda y agua con gas", parent_id=cat_bebidas.id)
    cat_gaseosas = get_or_create_categoria("Gaseosas", "Gaseosas de distintos sabores", parent_id=cat_bebidas.id)

    # Limpieza de categorias legacy que no corresponden al catalogo de rotiseria actual
    for legacy_name in ("Lacteos", "Quesos", "Panaderia", "Panes"):
        legacy = find_categoria(legacy_name)
        if legacy:
            legacy.is_active = False
            legacy.deleted_at = datetime.utcnow()

    # Limpieza de ingredientes legacy de bebidas por base liquida (se reemplazan por botellas/unidad)
    for legacy_ing_name in (
        "Agua mineral",
        "Soda",
        "Base gaseosa cola",
        "Base gaseosa lima limon",
        "Base gaseosa naranja",
    ):
        legacy_ing = find_ingrediente(legacy_ing_name)
        if legacy_ing:
            legacy_ing.is_active = False
            legacy_ing.deleted_at = datetime.utcnow()

    # Ingredientes comidas
    ing_pan_hamb = get_or_create_ingrediente("Pan de hamburguesa", "Pan tipo brioche", es_alergeno=True)
    ing_medallon = get_or_create_ingrediente("Medallon de carne", "Carne vacuna molida", es_alergeno=False)
    ing_medallon_pollo = get_or_create_ingrediente("Medallon de pollo", "Pechuga de pollo procesada")
    ing_medallon_veggie = get_or_create_ingrediente("Medallon veggie", "Medallon de lentejas y vegetales")
    ing_queso_muzza = get_or_create_ingrediente("Queso mozzarella", "Queso para pizza y hamburguesa", es_alergeno=True)
    ing_queso_cheddar = get_or_create_ingrediente("Queso cheddar", "Cheddar para hamburguesas", es_alergeno=True)
    ing_lechuga = get_or_create_ingrediente("Lechuga", "Lechuga fresca cortada")
    ing_tomate = get_or_create_ingrediente("Tomate", "Tomate fresco en rodajas")
    ing_cebolla = get_or_create_ingrediente("Cebolla", "Cebolla picada")
    ing_morron = get_or_create_ingrediente("Morron rojo", "Morron rojo en tiras")
    ing_panceta = get_or_create_ingrediente("Panceta", "Panceta ahumada en tiras")
    ing_bbq = get_or_create_ingrediente("Salsa BBQ", "Salsa barbacoa casera")
    ing_mayo = get_or_create_ingrediente("Mayonesa", "Mayonesa clasica")
    ing_pepinillos = get_or_create_ingrediente("Pepinillos", "Pepinillos agridulces en rodajas")
    ing_masa_pizza = get_or_create_ingrediente("Masa de pizza", "Bollo de masa precocida", es_alergeno=True)
    ing_salsa_tomate = get_or_create_ingrediente("Salsa de tomate", "Salsa de tomate condimentada")
    ing_ajo = get_or_create_ingrediente("Ajo", "Ajo picado")
    ing_oregano = get_or_create_ingrediente("Oregano", "Oregano seco")
    ing_aceitunas = get_or_create_ingrediente("Aceitunas", "Aceitunas verdes descarozadas")
    ing_jamon = get_or_create_ingrediente("Jamon cocido", "Jamon cocido feteado")
    ing_salami = get_or_create_ingrediente("Salamin", "Salamin feteado")
    ing_queso_azul = get_or_create_ingrediente("Queso azul", "Queso azul madurado", es_alergeno=True)
    ing_parmesano = get_or_create_ingrediente("Queso parmesano", "Queso parmesano rallado", es_alergeno=True)
    ing_masa_emp = get_or_create_ingrediente("Masa de empanada", "Tapas de empanada", es_alergeno=True)
    ing_carne_picada = get_or_create_ingrediente("Carne picada", "Carne vacuna picada")
    ing_nalga = get_or_create_ingrediente("Nalga vacuna", "Corte para milanesa")
    ing_pan_rallado = get_or_create_ingrediente("Pan rallado", "Pan rallado fino", es_alergeno=True)
    ing_huevo = get_or_create_ingrediente("Huevo", "Huevo entero", es_alergeno=True)
    ing_papa = get_or_create_ingrediente("Papa", "Papa fresca para fritas")

    # Ingredientes postres
    ing_galletitas_choco = get_or_create_ingrediente("Galletitas de chocolate", "Galletitas tipo chocolina", es_alergeno=True)
    ing_queso_crema = get_or_create_ingrediente("Queso crema", "Queso crema para postres", es_alergeno=True)
    ing_dulce_leche = get_or_create_ingrediente("Dulce de leche", "Dulce de leche repostero", es_alergeno=True)
    ing_crema_leche = get_or_create_ingrediente("Crema de leche", "Crema para batir", es_alergeno=True)
    ing_masa_tarta = get_or_create_ingrediente("Masa de tarta dulce", "Masa base para tartas", es_alergeno=True)
    ing_limon = get_or_create_ingrediente("Limon", "Jugo de limon fresco")
    ing_azucar = get_or_create_ingrediente("Azucar", "Azucar blanca")
    ing_cafe = get_or_create_ingrediente("Cafe", "Cafe para infusion")
    ing_cacao = get_or_create_ingrediente("Cacao amargo", "Cacao en polvo")
    ing_vainillas = get_or_create_ingrediente("Vainillas", "Bizcochos vainilla", es_alergeno=True)
    ing_mascarpone = get_or_create_ingrediente("Queso mascarpone", "Mascarpone para tiramisu", es_alergeno=True)

    # Ingredientes bebidas
    ing_agua = get_or_create_ingrediente("Agua", "Agua para preparaciones y cocina")
    ing_agua_mineral_500 = get_or_create_ingrediente("Botella agua mineral 500ml", "Botella cerrada de agua sin gas")
    ing_agua_mineral_15 = get_or_create_ingrediente("Botella agua mineral 1.5L", "Botella cerrada de agua sin gas")
    ing_soda_500 = get_or_create_ingrediente("Botella soda 500ml", "Botella cerrada de soda")
    ing_soda_15 = get_or_create_ingrediente("Botella soda 1.5L", "Botella cerrada de soda")
    ing_cola_500 = get_or_create_ingrediente("Botella gaseosa cola 500ml", "Botella cerrada sabor cola")
    ing_cola_15 = get_or_create_ingrediente("Botella gaseosa cola 1.5L", "Botella cerrada sabor cola")
    ing_cola_225 = get_or_create_ingrediente("Botella gaseosa cola 2.25L", "Botella cerrada sabor cola")
    ing_lima_500 = get_or_create_ingrediente("Botella gaseosa lima limon 500ml", "Botella cerrada lima limon")
    ing_lima_15 = get_or_create_ingrediente("Botella gaseosa lima limon 1.5L", "Botella cerrada lima limon")
    ing_naranja_500 = get_or_create_ingrediente("Botella gaseosa naranja 500ml", "Botella cerrada naranja")
    ing_naranja_15 = get_or_create_ingrediente("Botella gaseosa naranja 1.5L", "Botella cerrada naranja")
    ing_legacy_agua_mineral = find_ingrediente("Agua mineral")
    ing_legacy_soda = find_ingrediente("Soda")
    ing_legacy_cola = find_ingrediente("Base gaseosa cola")
    ing_legacy_lima = find_ingrediente("Base gaseosa lima limon")
    ing_legacy_naranja = find_ingrediente("Base gaseosa naranja")

    # Configuracion de unidad/stock de ingredientes
    ingredientes_cfg = [
        (ing_pan_hamb, "unidad", 120),
        (ing_medallon, "unidad", 55),
        (ing_medallon_pollo, "unidad", 35),
        (ing_medallon_veggie, "unidad", 28),
        (ing_queso_muzza, "gr", 12000),
        (ing_queso_cheddar, "gr", 7000),
        (ing_lechuga, "gr", 4000),
        (ing_tomate, "gr", 6000),
        (ing_cebolla, "gr", 5000),
        (ing_morron, "gr", 2500),
        (ing_panceta, "gr", 2500),
        (ing_bbq, "gr", 2200),
        (ing_mayo, "gr", 2500),
        (ing_pepinillos, "gr", 1500),
        (ing_masa_pizza, "unidad", 80),
        (ing_salsa_tomate, "gr", 12000),
        (ing_ajo, "gr", 1000),
        (ing_oregano, "gr", 600),
        (ing_aceitunas, "gr", 2500),
        (ing_jamon, "gr", 6000),
        (ing_salami, "gr", 4000),
        (ing_queso_azul, "gr", 2500),
        (ing_parmesano, "gr", 2000),
        (ing_masa_emp, "unidad", 180),
        (ing_carne_picada, "gr", 9000),
        (ing_nalga, "gr", 7000),
        (ing_pan_rallado, "gr", 3000),
        (ing_huevo, "unidad", 180),
        (ing_papa, "gr", 12000),
        (ing_galletitas_choco, "gr", 3500),
        (ing_queso_crema, "gr", 5000),
        (ing_dulce_leche, "gr", 6000),
        (ing_crema_leche, "gr", 4000),
        (ing_masa_tarta, "unidad", 45),
        (ing_limon, "unidad", 120),
        (ing_azucar, "gr", 6000),
        (ing_cafe, "gr", 1200),
        (ing_cacao, "gr", 1500),
        (ing_vainillas, "gr", 2500),
        (ing_mascarpone, "gr", 3000),
        (ing_agua, "litros", 120),
        (ing_agua_mineral_500, "unidad", 120),
        (ing_agua_mineral_15, "unidad", 80),
        (ing_soda_500, "unidad", 90),
        (ing_soda_15, "unidad", 70),
        (ing_cola_500, "unidad", 110),
        (ing_cola_15, "unidad", 80),
        (ing_cola_225, "unidad", 60),
        (ing_lima_500, "unidad", 100),
        (ing_lima_15, "unidad", 70),
        (ing_naranja_500, "unidad", 100),
        (ing_naranja_15, "unidad", 70),
    ]
    for ing, unidad, stock in ingredientes_cfg:
        ing.unidad_medida = unidad
        ing.stock_cantidad = float(stock)

    # Productos comidas (variedad)
    prod_hambu_clasica = get_or_create_producto("Hamburguesa Clasica", "Pan, carne, queso, lechuga y tomate", "6500.00", 45)
    prod_hambu_doble = get_or_create_producto("Hamburguesa Doble Queso", "Doble medallon con cheddar y muzza", "8400.00", 32)
    prod_hambu_bbq_bacon = get_or_create_producto("Hamburguesa BBQ Bacon", "Carne, panceta crocante y salsa BBQ", "9200.00", 28)
    prod_hambu_pollo = get_or_create_producto("Hamburguesa Crispy Pollo", "Medallon de pollo con vegetales", "7600.00", 30)
    prod_hambu_veggie = get_or_create_producto("Hamburguesa Veggie", "Medallon de lentejas, tomate y lechuga", "7100.00", 24)
    prod_hambu_americana = get_or_create_producto(
        "Hamburguesa Americana",
        "Doble cheddar, pepinillos y mayonesa",
        "9300.00",
        26,
    )
    prod_hambu_criolla = get_or_create_producto(
        "Hamburguesa Criolla",
        "Carne, cebolla grillada y tomate fresco",
        "8200.00",
        24,
    )

    prod_pizza_muzza = get_or_create_producto("Pizza Muzzarella", "Pizza grande de muzzarella", "9800.00", 26)
    prod_pizza_napo = get_or_create_producto("Pizza Napolitana", "Muzzarella, tomate, ajo y oregano", "11000.00", 22)
    prod_pizza_fugazzeta = get_or_create_producto("Pizza Fugazzeta", "Muzzarella y cebolla", "11200.00", 20)
    prod_pizza_calabresa = get_or_create_producto("Pizza Calabresa", "Muzzarella y salamin", "11800.00", 18)
    prod_pizza_4q = get_or_create_producto("Pizza Cuatro Quesos", "Muzzarella, cheddar, azul y parmesano", "12800.00", 16)
    prod_pizza_jym = get_or_create_producto(
        "Pizza Jamon y Morrones",
        "Muzzarella, jamon cocido y morrones asados",
        "12400.00",
        16,
    )
    prod_pizza_especial = get_or_create_producto(
        "Pizza Especial de la Casa",
        "Muzzarella, jamon, tomate, aceitunas y oregano",
        "13200.00",
        14,
    )

    prod_emp_carne = get_or_create_producto("Empanadas de Carne x12", "Docena de empanadas de carne", "12000.00", 20)
    prod_emp_jyq = get_or_create_producto("Empanadas de Jamon y Queso x12", "Docena de empanadas jyq", "12500.00", 18)
    prod_mila_napo = get_or_create_producto("Milanesa Napolitana con Papas", "Milanesa napolitana con papas fritas", "14500.00", 22)

    # Postres
    prod_chocotorta = get_or_create_producto("Chocotorta (porcion)", "Porcion individual de chocotorta", "4200.00", 40)
    prod_lemon_pie = get_or_create_producto("Lemon Pie (porcion)", "Porcion individual de lemon pie", "4600.00", 30)
    prod_tiramisu = get_or_create_producto("Tiramisu (porcion)", "Porcion individual de tiramisu", "5200.00", 26)
    prod_flan = get_or_create_producto("Flan Casero (porcion)", "Flan casero con dulce de leche", "3600.00", 32)

    # Productos bebidas (tipo y tamano)
    prod_agua_500 = get_or_create_producto("Agua Mineral 500ml", "Agua sin gas 500ml", "1500.00", 140)
    prod_agua_15 = get_or_create_producto("Agua Mineral 1.5L", "Agua sin gas 1.5L", "2800.00", 95)
    prod_soda_500 = get_or_create_producto("Soda 500ml", "Soda clasica 500ml", "1500.00", 100)
    prod_soda_15 = get_or_create_producto("Soda 1.5L", "Soda clasica 1.5L", "2300.00", 75)
    prod_cola_500 = get_or_create_producto("Gaseosa Cola 500ml", "Cola 500ml", "2200.00", 120)
    prod_cola_15 = get_or_create_producto("Gaseosa Cola 1.5L", "Cola 1.5L", "4200.00", 80)
    prod_cola_225 = get_or_create_producto("Gaseosa Cola 2.25L", "Cola 2.25L", "5600.00", 60)
    prod_sprite_500 = get_or_create_producto("Gaseosa Lima Limon 500ml", "Lima limon 500ml", "2100.00", 110)
    prod_sprite_15 = get_or_create_producto("Gaseosa Lima Limon 1.5L", "Lima limon 1.5L", "4000.00", 70)
    prod_fanta_500 = get_or_create_producto("Gaseosa Naranja 500ml", "Naranja 500ml", "2100.00", 105)
    prod_fanta_15 = get_or_create_producto("Gaseosa Naranja 1.5L", "Naranja 1.5L", "4000.00", 68)

    # Productos demo legacy que se desactivan para mantener catalogo de rotiseria actual
    for legacy_name in ("Pan Integral", "Cafe Latte"):
        legacy_prod = find_producto(legacy_name)
        if legacy_prod:
            legacy_prod.is_active = False
            legacy_prod.deleted_at = datetime.utcnow()

    # Categoria principal de cada producto
    for p in [
        prod_hambu_clasica,
        prod_hambu_doble,
        prod_hambu_bbq_bacon,
        prod_hambu_pollo,
        prod_hambu_veggie,
        prod_hambu_americana,
        prod_hambu_criolla,
    ]:
        ensure_producto_categoria(p.id, cat_hamburguesas.id, es_principal=True)
    for p in [
        prod_pizza_muzza,
        prod_pizza_napo,
        prod_pizza_fugazzeta,
        prod_pizza_calabresa,
        prod_pizza_4q,
        prod_pizza_jym,
        prod_pizza_especial,
    ]:
        ensure_producto_categoria(p.id, cat_pizzas.id, es_principal=True)
    ensure_producto_categoria(prod_emp_carne.id, cat_empanadas.id, es_principal=True)
    ensure_producto_categoria(prod_emp_jyq.id, cat_empanadas.id, es_principal=True)
    ensure_producto_categoria(prod_mila_napo.id, cat_milanesas.id, es_principal=True)
    for p in [prod_chocotorta, prod_lemon_pie, prod_tiramisu, prod_flan]:
        ensure_producto_categoria(p.id, cat_postres.id, es_principal=True)

    for p in [prod_agua_500, prod_agua_15]:
        ensure_producto_categoria(p.id, cat_agua.id, es_principal=True)
    for p in [prod_soda_500, prod_soda_15]:
        ensure_producto_categoria(p.id, cat_soda.id, es_principal=True)
    for p in [prod_cola_500, prod_cola_15, prod_cola_225, prod_sprite_500, prod_sprite_15, prod_fanta_500, prod_fanta_15]:
        ensure_producto_categoria(p.id, cat_gaseosas.id, es_principal=True)

    # Asociamos categoria raiz para facilitar filtros por categoria y panel de categorias
    productos_comidas = [
        prod_hambu_clasica,
        prod_hambu_doble,
        prod_hambu_bbq_bacon,
        prod_hambu_pollo,
        prod_hambu_veggie,
        prod_hambu_americana,
        prod_hambu_criolla,
        prod_pizza_muzza,
        prod_pizza_napo,
        prod_pizza_fugazzeta,
        prod_pizza_calabresa,
        prod_pizza_4q,
        prod_pizza_jym,
        prod_pizza_especial,
        prod_emp_carne,
        prod_emp_jyq,
        prod_mila_napo,
        prod_chocotorta,
        prod_lemon_pie,
        prod_tiramisu,
        prod_flan,
    ]
    for p in productos_comidas:
        ensure_producto_categoria(p.id, cat_comidas.id, es_principal=False)

    productos_bebidas = [
        prod_agua_500,
        prod_agua_15,
        prod_soda_500,
        prod_soda_15,
        prod_cola_500,
        prod_cola_15,
        prod_cola_225,
        prod_sprite_500,
        prod_sprite_15,
        prod_fanta_500,
        prod_fanta_15,
    ]
    for p in productos_bebidas:
        ensure_producto_categoria(p.id, cat_bebidas.id, es_principal=False)

    # Recetas hamburguesas (cantidades aproximadas por unidad)
    ensure_producto_ingrediente(prod_hambu_clasica.id, ing_pan_hamb.id, es_removible=False, cantidad=1)
    ensure_producto_ingrediente(prod_hambu_clasica.id, ing_medallon.id, es_removible=False, cantidad=1)
    ensure_producto_ingrediente(prod_hambu_clasica.id, ing_queso_muzza.id, es_removible=True, cantidad=30)
    ensure_producto_ingrediente(prod_hambu_clasica.id, ing_lechuga.id, es_removible=True, cantidad=18)
    ensure_producto_ingrediente(prod_hambu_clasica.id, ing_tomate.id, es_removible=True, cantidad=22)

    ensure_producto_ingrediente(prod_hambu_doble.id, ing_pan_hamb.id, es_removible=False, cantidad=1)
    ensure_producto_ingrediente(prod_hambu_doble.id, ing_medallon.id, es_removible=False, cantidad=2)
    ensure_producto_ingrediente(prod_hambu_doble.id, ing_queso_muzza.id, es_removible=True, cantidad=25)
    ensure_producto_ingrediente(prod_hambu_doble.id, ing_queso_cheddar.id, es_removible=True, cantidad=40)
    ensure_producto_ingrediente(prod_hambu_doble.id, ing_tomate.id, es_removible=True, cantidad=20)

    ensure_producto_ingrediente(prod_hambu_bbq_bacon.id, ing_pan_hamb.id, es_removible=False, cantidad=1)
    ensure_producto_ingrediente(prod_hambu_bbq_bacon.id, ing_medallon.id, es_removible=False, cantidad=1)
    ensure_producto_ingrediente(prod_hambu_bbq_bacon.id, ing_queso_cheddar.id, es_removible=True, cantidad=35)
    ensure_producto_ingrediente(prod_hambu_bbq_bacon.id, ing_panceta.id, es_removible=False, cantidad=35)
    ensure_producto_ingrediente(prod_hambu_bbq_bacon.id, ing_bbq.id, es_removible=False, cantidad=20)

    ensure_producto_ingrediente(prod_hambu_pollo.id, ing_pan_hamb.id, es_removible=False, cantidad=1)
    ensure_producto_ingrediente(prod_hambu_pollo.id, ing_medallon_pollo.id, es_removible=False, cantidad=1)
    ensure_producto_ingrediente(prod_hambu_pollo.id, ing_queso_cheddar.id, es_removible=True, cantidad=25)
    ensure_producto_ingrediente(prod_hambu_pollo.id, ing_lechuga.id, es_removible=True, cantidad=18)
    ensure_producto_ingrediente(prod_hambu_pollo.id, ing_tomate.id, es_removible=True, cantidad=20)

    ensure_producto_ingrediente(prod_hambu_veggie.id, ing_pan_hamb.id, es_removible=False, cantidad=1)
    ensure_producto_ingrediente(prod_hambu_veggie.id, ing_medallon_veggie.id, es_removible=False, cantidad=1)
    ensure_producto_ingrediente(prod_hambu_veggie.id, ing_queso_muzza.id, es_removible=True, cantidad=20)
    ensure_producto_ingrediente(prod_hambu_veggie.id, ing_tomate.id, es_removible=True, cantidad=20)
    ensure_producto_ingrediente(prod_hambu_veggie.id, ing_lechuga.id, es_removible=True, cantidad=18)

    ensure_producto_ingrediente(prod_hambu_americana.id, ing_pan_hamb.id, es_removible=False, cantidad=1)
    ensure_producto_ingrediente(prod_hambu_americana.id, ing_medallon.id, es_removible=False, cantidad=2)
    ensure_producto_ingrediente(prod_hambu_americana.id, ing_queso_cheddar.id, es_removible=False, cantidad=55)
    ensure_producto_ingrediente(prod_hambu_americana.id, ing_pepinillos.id, es_removible=True, cantidad=25)
    ensure_producto_ingrediente(prod_hambu_americana.id, ing_mayo.id, es_removible=True, cantidad=20)

    ensure_producto_ingrediente(prod_hambu_criolla.id, ing_pan_hamb.id, es_removible=False, cantidad=1)
    ensure_producto_ingrediente(prod_hambu_criolla.id, ing_medallon.id, es_removible=False, cantidad=1)
    ensure_producto_ingrediente(prod_hambu_criolla.id, ing_queso_muzza.id, es_removible=True, cantidad=30)
    ensure_producto_ingrediente(prod_hambu_criolla.id, ing_cebolla.id, es_removible=False, cantidad=35)
    ensure_producto_ingrediente(prod_hambu_criolla.id, ing_tomate.id, es_removible=True, cantidad=25)

    # Recetas pizzas (cantidades aproximadas por pizza grande)
    ensure_producto_ingrediente(prod_pizza_muzza.id, ing_masa_pizza.id, es_removible=False, cantidad=1)
    ensure_producto_ingrediente(prod_pizza_muzza.id, ing_salsa_tomate.id, es_removible=False, cantidad=140)
    ensure_producto_ingrediente(prod_pizza_muzza.id, ing_queso_muzza.id, es_removible=False, cantidad=260)
    ensure_producto_ingrediente(prod_pizza_muzza.id, ing_oregano.id, es_removible=True, cantidad=2)

    ensure_producto_ingrediente(prod_pizza_napo.id, ing_masa_pizza.id, es_removible=False, cantidad=1)
    ensure_producto_ingrediente(prod_pizza_napo.id, ing_salsa_tomate.id, es_removible=False, cantidad=140)
    ensure_producto_ingrediente(prod_pizza_napo.id, ing_queso_muzza.id, es_removible=False, cantidad=240)
    ensure_producto_ingrediente(prod_pizza_napo.id, ing_tomate.id, es_removible=False, cantidad=100)
    ensure_producto_ingrediente(prod_pizza_napo.id, ing_ajo.id, es_removible=True, cantidad=8)
    ensure_producto_ingrediente(prod_pizza_napo.id, ing_oregano.id, es_removible=True, cantidad=2)

    ensure_producto_ingrediente(prod_pizza_fugazzeta.id, ing_masa_pizza.id, es_removible=False, cantidad=1)
    ensure_producto_ingrediente(prod_pizza_fugazzeta.id, ing_salsa_tomate.id, es_removible=False, cantidad=120)
    ensure_producto_ingrediente(prod_pizza_fugazzeta.id, ing_queso_muzza.id, es_removible=False, cantidad=280)
    ensure_producto_ingrediente(prod_pizza_fugazzeta.id, ing_cebolla.id, es_removible=False, cantidad=160)

    ensure_producto_ingrediente(prod_pizza_calabresa.id, ing_masa_pizza.id, es_removible=False, cantidad=1)
    ensure_producto_ingrediente(prod_pizza_calabresa.id, ing_salsa_tomate.id, es_removible=False, cantidad=130)
    ensure_producto_ingrediente(prod_pizza_calabresa.id, ing_queso_muzza.id, es_removible=False, cantidad=220)
    ensure_producto_ingrediente(prod_pizza_calabresa.id, ing_salami.id, es_removible=False, cantidad=90)
    ensure_producto_ingrediente(prod_pizza_calabresa.id, ing_aceitunas.id, es_removible=True, cantidad=25)

    ensure_producto_ingrediente(prod_pizza_4q.id, ing_masa_pizza.id, es_removible=False, cantidad=1)
    ensure_producto_ingrediente(prod_pizza_4q.id, ing_salsa_tomate.id, es_removible=False, cantidad=120)
    ensure_producto_ingrediente(prod_pizza_4q.id, ing_queso_muzza.id, es_removible=False, cantidad=160)
    ensure_producto_ingrediente(prod_pizza_4q.id, ing_queso_cheddar.id, es_removible=False, cantidad=70)
    ensure_producto_ingrediente(prod_pizza_4q.id, ing_queso_azul.id, es_removible=False, cantidad=50)
    ensure_producto_ingrediente(prod_pizza_4q.id, ing_parmesano.id, es_removible=False, cantidad=30)

    ensure_producto_ingrediente(prod_pizza_jym.id, ing_masa_pizza.id, es_removible=False, cantidad=1)
    ensure_producto_ingrediente(prod_pizza_jym.id, ing_salsa_tomate.id, es_removible=False, cantidad=130)
    ensure_producto_ingrediente(prod_pizza_jym.id, ing_queso_muzza.id, es_removible=False, cantidad=220)
    ensure_producto_ingrediente(prod_pizza_jym.id, ing_jamon.id, es_removible=False, cantidad=95)
    ensure_producto_ingrediente(prod_pizza_jym.id, ing_morron.id, es_removible=False, cantidad=80)

    ensure_producto_ingrediente(prod_pizza_especial.id, ing_masa_pizza.id, es_removible=False, cantidad=1)
    ensure_producto_ingrediente(prod_pizza_especial.id, ing_salsa_tomate.id, es_removible=False, cantidad=130)
    ensure_producto_ingrediente(prod_pizza_especial.id, ing_queso_muzza.id, es_removible=False, cantidad=200)
    ensure_producto_ingrediente(prod_pizza_especial.id, ing_jamon.id, es_removible=False, cantidad=85)
    ensure_producto_ingrediente(prod_pizza_especial.id, ing_tomate.id, es_removible=True, cantidad=70)
    ensure_producto_ingrediente(prod_pizza_especial.id, ing_aceitunas.id, es_removible=True, cantidad=25)
    ensure_producto_ingrediente(prod_pizza_especial.id, ing_oregano.id, es_removible=True, cantidad=2)

    # Empanadas / milanesas
    ensure_producto_ingrediente(prod_emp_carne.id, ing_masa_emp.id, es_removible=False, cantidad=12)
    ensure_producto_ingrediente(prod_emp_carne.id, ing_carne_picada.id, es_removible=False, cantidad=620)
    ensure_producto_ingrediente(prod_emp_carne.id, ing_cebolla.id, es_removible=False, cantidad=180)
    ensure_producto_ingrediente(prod_emp_jyq.id, ing_masa_emp.id, es_removible=False, cantidad=12)
    ensure_producto_ingrediente(prod_emp_jyq.id, ing_jamon.id, es_removible=False, cantidad=320)
    ensure_producto_ingrediente(prod_emp_jyq.id, ing_queso_muzza.id, es_removible=False, cantidad=320)

    ensure_producto_ingrediente(prod_mila_napo.id, ing_nalga.id, es_removible=False, cantidad=300)
    ensure_producto_ingrediente(prod_mila_napo.id, ing_huevo.id, es_removible=False, cantidad=2)
    ensure_producto_ingrediente(prod_mila_napo.id, ing_pan_rallado.id, es_removible=False, cantidad=90)
    ensure_producto_ingrediente(prod_mila_napo.id, ing_salsa_tomate.id, es_removible=False, cantidad=110)
    ensure_producto_ingrediente(prod_mila_napo.id, ing_queso_muzza.id, es_removible=False, cantidad=120)
    ensure_producto_ingrediente(prod_mila_napo.id, ing_papa.id, es_removible=False, cantidad=350)

    # Postres (cantidades aproximadas por porcion)
    ensure_producto_ingrediente(prod_chocotorta.id, ing_galletitas_choco.id, es_removible=False, cantidad=90)
    ensure_producto_ingrediente(prod_chocotorta.id, ing_queso_crema.id, es_removible=False, cantidad=80)
    ensure_producto_ingrediente(prod_chocotorta.id, ing_dulce_leche.id, es_removible=False, cantidad=80)

    ensure_producto_ingrediente(prod_lemon_pie.id, ing_masa_tarta.id, es_removible=False, cantidad=0.12)
    ensure_producto_ingrediente(prod_lemon_pie.id, ing_limon.id, es_removible=False, cantidad=1)
    ensure_producto_ingrediente(prod_lemon_pie.id, ing_azucar.id, es_removible=False, cantidad=40)
    ensure_producto_ingrediente(prod_lemon_pie.id, ing_huevo.id, es_removible=False, cantidad=1)

    ensure_producto_ingrediente(prod_tiramisu.id, ing_vainillas.id, es_removible=False, cantidad=70)
    ensure_producto_ingrediente(prod_tiramisu.id, ing_mascarpone.id, es_removible=False, cantidad=85)
    ensure_producto_ingrediente(prod_tiramisu.id, ing_cafe.id, es_removible=False, cantidad=8)
    ensure_producto_ingrediente(prod_tiramisu.id, ing_cacao.id, es_removible=False, cantidad=5)
    ensure_producto_ingrediente(prod_tiramisu.id, ing_azucar.id, es_removible=False, cantidad=20)

    ensure_producto_ingrediente(prod_flan.id, ing_huevo.id, es_removible=False, cantidad=1)
    ensure_producto_ingrediente(prod_flan.id, ing_crema_leche.id, es_removible=False, cantidad=50)
    ensure_producto_ingrediente(prod_flan.id, ing_azucar.id, es_removible=False, cantidad=25)
    ensure_producto_ingrediente(prod_flan.id, ing_dulce_leche.id, es_removible=True, cantidad=30)

    # Bebidas por tamano/tipo (1 producto = 1 botella/unidad de la presentacion correspondiente)
    legacy_ingredientes_bebidas = [
        ing_legacy_agua_mineral,
        ing_legacy_soda,
        ing_legacy_cola,
        ing_legacy_lima,
        ing_legacy_naranja,
    ]
    productos_bebidas_detalle = [
        prod_agua_500,
        prod_agua_15,
        prod_soda_500,
        prod_soda_15,
        prod_cola_500,
        prod_cola_15,
        prod_cola_225,
        prod_sprite_500,
        prod_sprite_15,
        prod_fanta_500,
        prod_fanta_15,
    ]
    for prod_bebida in productos_bebidas_detalle:
        for legacy_ing in legacy_ingredientes_bebidas:
            if legacy_ing and legacy_ing.id:
                remove_producto_ingrediente(prod_bebida.id, legacy_ing.id)

    ensure_producto_ingrediente(prod_agua_500.id, ing_agua_mineral_500.id, es_removible=False, cantidad=1)
    ensure_producto_ingrediente(prod_agua_15.id, ing_agua_mineral_15.id, es_removible=False, cantidad=1)
    ensure_producto_ingrediente(prod_soda_500.id, ing_soda_500.id, es_removible=False, cantidad=1)
    ensure_producto_ingrediente(prod_soda_15.id, ing_soda_15.id, es_removible=False, cantidad=1)
    ensure_producto_ingrediente(prod_cola_500.id, ing_cola_500.id, es_removible=False, cantidad=1)
    ensure_producto_ingrediente(prod_cola_15.id, ing_cola_15.id, es_removible=False, cantidad=1)
    ensure_producto_ingrediente(prod_cola_225.id, ing_cola_225.id, es_removible=False, cantidad=1)
    ensure_producto_ingrediente(prod_sprite_500.id, ing_lima_500.id, es_removible=False, cantidad=1)
    ensure_producto_ingrediente(prod_sprite_15.id, ing_lima_15.id, es_removible=False, cantidad=1)
    ensure_producto_ingrediente(prod_fanta_500.id, ing_naranja_500.id, es_removible=False, cantidad=1)
    ensure_producto_ingrediente(prod_fanta_15.id, ing_naranja_15.id, es_removible=False, cantidad=1)

    session.commit()


def run_all_seeds(session: Session) -> None:
    seed_roles(session)
    seed_default_users(session)
    seed_catalogos(session)
    seed_demo_data(session)
