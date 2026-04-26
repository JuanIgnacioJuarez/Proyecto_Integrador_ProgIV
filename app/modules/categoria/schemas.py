from __future__ import annotations
from typing import Optional

from sqlmodel import Field, SQLModel


class CategoriaBase(SQLModel):
    nombre: str = Field(min_length=2, max_length=100)
    descripcion: Optional[str] = Field(default=None, max_length=300)
    imagen_url: Optional[str] = Field(default=None, max_length=500)


class CategoriaCreate(CategoriaBase):
    parent_id: Optional[int] = Field(default=None, ge=1)
    is_active: Optional[bool] = Field(default=True)


class CategoriaUpdate(SQLModel):
    nombre: Optional[str] = Field(default=None, min_length=2, max_length=100)
    descripcion: Optional[str] = Field(default=None, max_length=300)
    imagen_url: Optional[str] = Field(default=None, max_length=500)
    parent_id: Optional[int] = Field(default=None, ge=1)
    is_active: Optional[bool] = Field(default=True)


class CategoriaRead(CategoriaBase):
    id: int
    parent_id: Optional[int] = None
    nombre: str


class CategoriaBasicRead(SQLModel):
    id: int
    nombre: str


class CategoriaReadFull(CategoriaRead):
    parent: Optional[CategoriaBasicRead] = None
    subcategorias: list[CategoriaReadFull] = Field(default_factory=list)
