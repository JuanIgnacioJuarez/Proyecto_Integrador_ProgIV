from typing import Optional, List, TYPE_CHECKING
from datetime import datetime

from sqlmodel import SQLModel, Field, Relationship
from app.core.links import ProductoIngredienteLink

if TYPE_CHECKING:
    from app.modules.producto.models import Producto

class Ingrediente(SQLModel, table=True):
    """
    Entidad Ingrediente con 1 relación:

    N:N productos -> Varios ingredientes pueden tener varios productos
    """

    # Nombre de la tabla
    __tablename__ = "ingrediente"

    # PK
    id: Optional[int] = Field(default=None, primary_key=True)

    # Atributos de la clase
    nombre: str = Field(max_length=100, unique=True, nullable=False)
    descripcion: str = Field(default=None)
    es_alergeno: bool = Field(default=False, nullable=False)

    # Audit (IA)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Relaciones

    # Relación N:M con Producto
    productos: List["Producto"] = Relationship(back_populates="ingredientes", link_model=ProductoIngredienteLink)