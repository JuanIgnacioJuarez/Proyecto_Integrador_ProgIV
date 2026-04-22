from typing import List, Optional
from datetime import datetime

from sqlmodel import Session, select, delete

from .schemas import ProductoCreate, ProductoUpdate
from .models import Producto
from app.modules.categoria.models import Categoria
from app.core.links import ProductoCategoriaLink, ProductoIngredienteLink

# ─── CRUD ────────────────────────────────────────────────────────────

# ─── Create ──────────────────────────────────────────────────────────
def create_producto(session: Session, data: ProductoCreate) -> Producto:
    producto_data = data.model_dump(exclude={"categorias", "ingredientes"})
    producto = Producto.model_validate(producto_data)
    session.add(producto)
    session.flush() # Para obtener el ID del producto
    
    for cat_data in data.categorias:
        link_cat = ProductoCategoriaLink(
            producto_id=producto.id,
            categoria_id=cat_data.categoria_id,
            es_principal=cat_data.es_principal
        )
        session.add(link_cat)
        
    for ing_data in data.ingredientes:
        link_ing = ProductoIngredienteLink(
            producto_id=producto.id,
            ingrediente_id=ing_data.ingrediente_id,
            es_removible=ing_data.es_removible
        )
        session.add(link_ing)
        
    session.commit()
    session.refresh(producto)
    return producto


# ─── Read ──────────────────────────────────────────────────────────
def get_productos(session: Session) -> List[Producto]:
    statement = select(Producto).where(Producto.deleted_at == None)
    return session.exec(statement).all()

def get_producto(session: Session, producto_id: int) -> Optional[Producto]:
    statement = select(Producto).where(Producto.id == producto_id, Producto.deleted_at == None)
    return session.exec(statement).first()

# ─── Update ──────────────────────────────────────────────────────────
def update_producto(session: Session, producto_id: int, data: ProductoUpdate) -> Optional[Producto]:
    statement = select(Producto).where(Producto.id == producto_id, Producto.deleted_at == None)
    producto = session.exec(statement).first()
    if not producto:
        return None
        
    update_data = data.model_dump(exclude_unset=True, exclude={"categorias", "ingredientes"})
    for key, value in update_data.items():
        setattr(producto, key, value)
        
    producto.updated_at = datetime.utcnow()
    
    if data.categorias is not None:
        session.exec(delete(ProductoCategoriaLink).where(ProductoCategoriaLink.producto_id == producto_id))
        for cat_data in data.categorias:
            link_cat = ProductoCategoriaLink(
                producto_id=producto_id,
                categoria_id=cat_data.categoria_id,
                es_principal=cat_data.es_principal
            )
            session.add(link_cat)

    if data.ingredientes is not None:
        session.exec(delete(ProductoIngredienteLink).where(ProductoIngredienteLink.producto_id == producto_id))
        for ing_data in data.ingredientes:
            link_ing = ProductoIngredienteLink(
                producto_id=producto_id,
                ingrediente_id=ing_data.ingrediente_id,
                es_removible=ing_data.es_removible
            )
            session.add(link_ing)

    session.add(producto)
    session.commit()
    session.refresh(producto)
    return producto

# ─── Delete ──────────────────────────────────────────────────────────
def delete_producto(session: Session, producto_id: int) -> bool:
    statement = select(Producto).where(Producto.id == producto_id, Producto.deleted_at == None)
    producto = session.exec(statement).first()
    if not producto:
        return False
        
    producto.deleted_at = datetime.utcnow()
    session.add(producto)
    session.commit()
    return True


# ─── Operaciones N:M  Hero ↔ Team ─────────────────────────────────────────

# ─── Assing producto to categoria ────────────────────────────────────────────
def add_producto_to_categoria(session: Session, producto_id: int, categoria_id: int) -> Optional[Producto]:
    statement = select(ProductoCategoriaLink).where(
        ProductoCategoriaLink.producto_id == producto_id,
        ProductoCategoriaLink.categoria_id == categoria_id
    )
    existing_link = session.exec(statement).first()
    
    if not existing_link:
        link = ProductoCategoriaLink(producto_id=producto_id, categoria_id=categoria_id)
        session.add(link)
        session.commit()
        
    # Return updated producto
    cat_statement = select(Producto).where(Producto.id == producto_id, Producto.deleted_at == None)
    return session.exec(cat_statement).first()

# ─── Remove producto from categoria ───────────────────────────────────────
def remove_producto_from_categoria(session: Session, producto_id: int, categoria_id: int) -> Optional[Producto]:
    statement = delete(ProductoCategoriaLink).where(
        ProductoCategoriaLink.producto_id == producto_id, 
        ProductoCategoriaLink.categoria_id == categoria_id
    )
    session.exec(statement)
    session.commit()
    
    cat_statement = select(Producto).where(Producto.id == producto_id, Producto.deleted_at == None)
    return session.exec(cat_statement).first()

# ─── Return producto - categorias ─────────────────────────────────────────
def get_producto_categorias(session: Session, producto_id: int) -> List[Categoria]:
    statement = select(Categoria).join(ProductoCategoriaLink).where(
        ProductoCategoriaLink.producto_id == producto_id,
        Categoria.deleted_at == None
    )
    return session.exec(statement).all()