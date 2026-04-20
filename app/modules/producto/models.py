from typing import Optional, List, TYPE_CHECKING
from datetime import datetime
from decimal import Decimal

from sqlmodel import Field, Relationship, SQLModel, CheckConstraint
from app.core.links import ProductoCategoriaLink, ProductoIngredienteLink

# Evita importación circular
if TYPE_CHECKING:
    from app.modules.categoria.models import Categoria
    from app.modules.ingrediente.models import Ingrediente


class Producto(SQLModel, table=True):
    """
    Entidad Producto con 1 relación:

    N:M categoria -> Varios productos pueden tener varias categorias
    N:M ingrediente -> Varios productos pueden tener varios ingredientes
    """

    # Nombre de la tabla
    __tablename__ = "producto"

    # PK
    id: Optional[int] = Field(default=None, primary_key=True)

    # Atributos de la clase
    nombre: str = Field(max_length=150, nullable=False)
    descripcion: str = Field(default=None)
    precio_base: Decimal = Field(default=0, max_digits=10, decimal_places=2, sa_column_kwargs={"server_default":"0"})

    # Para el check >= 0 a nivel de base de datos
    __table_args__ = (CheckConstraint("precio_base >= 0", name="check_precio_base_positive"),)

    # Audit (IA)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    deleted_at: Optional[datetime] = Field(default=None)

    # Relaciones

    # Relación N:M con Categoría
    cateogrias: List["Categoria"] = Relationship(back_populates="productos", link_model=ProductoCategoriaLink)

    # Relación N:M con Ingrediente
    ingredientes: List["Ingrediente"] = Relationship(back_populates="productos", link_model=ProductoIngredienteLink)