from decimal import Decimal
from typing import Optional

from pydantic import model_validator
from sqlmodel import Field, SQLModel


class ProductoBase(SQLModel):
    nombre: str = Field(min_length=2, max_length=150)
    descripcion: Optional[str] = Field(default=None, max_length=500)
    precio_base: Decimal = Field(default=0, ge=0, max_digits=10, decimal_places=2)
    stock_cantidad: int = Field(default=0, ge=0)
    disponible: bool = Field(default=True)


class CategoriaRef(SQLModel):
    id: int = Field(ge=1)


class IngredienteRef(SQLModel):
    id: int = Field(ge=1)


class ProductoCategoriaAssign(SQLModel):
    categoria_id: Optional[int] = Field(default=None, ge=1)
    categoria: Optional[CategoriaRef] = None
    es_principal: bool = False

    @model_validator(mode="after")
    def normalize_categoria(self) -> "ProductoCategoriaAssign":
        if self.categoria_id is None and self.categoria is not None:
            self.categoria_id = self.categoria.id
        if self.categoria_id is None:
            raise ValueError("Debe enviarse categoria_id o categoria.id")
        return self


class ProductoIngredienteAssign(SQLModel):
    ingrediente_id: Optional[int] = Field(default=None, ge=1)
    ingrediente: Optional[IngredienteRef] = None
    es_removible: bool = False

    @model_validator(mode="after")
    def normalize_ingrediente(self) -> "ProductoIngredienteAssign":
        if self.ingrediente_id is None and self.ingrediente is not None:
            self.ingrediente_id = self.ingrediente.id
        if self.ingrediente_id is None:
            raise ValueError("Debe enviarse ingrediente_id o ingrediente.id")
        return self


class ProductoCreate(ProductoBase):
    categorias: list[ProductoCategoriaAssign] = Field(default_factory=list)
    ingredientes: list[ProductoIngredienteAssign] = Field(default_factory=list)


class ProductoUpdate(SQLModel):
    nombre: Optional[str] = Field(default=None, min_length=2, max_length=150)
    descripcion: Optional[str] = Field(default=None, max_length=500)
    precio_base: Optional[Decimal] = Field(default=None, ge=0, max_digits=10, decimal_places=2)
    stock_cantidad: Optional[int] = Field(default=None, ge=0)
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


class ProductoDisponibilidadUpdate(SQLModel):
    disponible: bool


class ProductoStockUpdate(SQLModel):
    stock_cantidad: int = Field(ge=0)


class ProductoPaginatedResponse(SQLModel):
    total: int
    items: list[ProductoReadFull]
