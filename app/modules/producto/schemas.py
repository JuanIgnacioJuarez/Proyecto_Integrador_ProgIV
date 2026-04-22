from decimal import Decimal
from typing import Optional

from sqlmodel import Field, SQLModel


class ProductoBase(SQLModel):
    nombre: str = Field(min_length=2, max_length=150)
    descripcion: Optional[str] = Field(default=None, max_length=500)
    precio_base: Decimal = Field(default=0, ge=0, max_digits=10, decimal_places=2)


class ProductoCategoriaAssign(SQLModel):
    categoria_id: int = Field(ge=1)
    es_principal: bool = False


class ProductoIngredienteAssign(SQLModel):
    ingrediente_id: int = Field(ge=1)
    es_removible: bool = False


class ProductoCreate(ProductoBase):
    categorias: list[ProductoCategoriaAssign] = Field(default_factory=list)
    ingredientes: list[ProductoIngredienteAssign] = Field(default_factory=list)


class ProductoUpdate(SQLModel):
    nombre: Optional[str] = Field(default=None, min_length=2, max_length=150)
    descripcion: Optional[str] = Field(default=None, max_length=500)
    precio_base: Optional[Decimal] = Field(default=None, ge=0, max_digits=10, decimal_places=2)
    categorias: Optional[list[ProductoCategoriaAssign]] = None
    ingredientes: Optional[list[ProductoIngredienteAssign]] = None


class ProductoRead(ProductoBase):
    id: int


class CategoriaBasicRead(SQLModel):
    id: int
    nombre: str
    es_principal: bool = False


class IngredienteBasicRead(SQLModel):
    id: int
    nombre: str
    es_alergeno: bool
    es_removible: bool = False


class ProductoReadFull(ProductoRead):
    categorias: list[CategoriaBasicRead] = Field(default_factory=list)
    ingredientes: list[IngredienteBasicRead] = Field(default_factory=list)

#Alias
CategoriaEnProductoRead = CategoriaBasicRead
IngredienteEnProductoRead = IngredienteBasicRead


class ProductoPaginatedResponse(SQLModel):
    total: int
    items: list[ProductoRead]
