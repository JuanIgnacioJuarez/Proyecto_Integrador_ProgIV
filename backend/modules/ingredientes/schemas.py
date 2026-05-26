from typing import Optional, List

from sqlmodel import Field, SQLModel


class IngredienteBase(SQLModel):
    nombre: str = Field(min_length=2, max_length=100)
    descripcion: Optional[str] = Field(default=None, max_length=300)
    es_alergeno: bool = False
    unidad_medida: str = Field(default="unidad", min_length=2, max_length=20)
    stock_cantidad: float = Field(default=0, ge=0)
    categoria_id: Optional[int] = Field(default=None, ge=1)


class IngredienteCreate(IngredienteBase):
    pass


class IngredienteUpdate(SQLModel):
    nombre: Optional[str] = Field(default=None, min_length=2, max_length=100)
    descripcion: Optional[str] = Field(default=None, max_length=300)
    es_alergeno: Optional[bool] = None
    unidad_medida: Optional[str] = Field(default=None, min_length=2, max_length=20)
    stock_cantidad: Optional[float] = Field(default=None, ge=0)
    categoria_id: Optional[int] = Field(default=None, ge=1)
    is_active: Optional[bool] = None


class IngredienteRead(IngredienteBase):
    id: int
    is_active: bool = True


class IngredienteBasicRead(SQLModel):
    id: int
    nombre: str
    es_alergeno: bool
    unidad_medida: str
    stock_cantidad: float

#Paginado
class IngredientePaginatedResponse(SQLModel):
    total: int
    items: List[IngredienteRead]


class IngredienteEstadoUpdate(SQLModel):
    is_active: bool
