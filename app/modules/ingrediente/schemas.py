from typing import Optional

from sqlmodel import Field, SQLModel


class IngredienteBase(SQLModel):
    nombre: str = Field(min_length=2, max_length=100)
    descripcion: Optional[str] = Field(default=None, max_length=300)
    es_alergeno: bool = False


class IngredienteCreate(IngredienteBase):
    pass


class IngredienteUpdate(SQLModel):
    nombre: Optional[str] = Field(default=None, min_length=2, max_length=100)
    descripcion: Optional[str] = Field(default=None, max_length=300)
    es_alergeno: Optional[bool] = None


class IngredienteRead(IngredienteBase):
    id: int


class IngredienteBasicRead(SQLModel):
    id: int
    nombre: str
    es_alergeno: bool
