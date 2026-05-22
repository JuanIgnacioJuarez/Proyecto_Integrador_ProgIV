from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class Rol:
    ADMIN = "ADMIN"
    STOCK = "STOCK"
    PEDIDOS = "PEDIDOS"
    CLIENT = "CLIENT"


class Usuario(SQLModel, table=True):
    __tablename__ = "usuario"

    id: int | None = Field(default=None, primary_key=True)
    nombre: str
    email: str = Field(unique=True, index=True)
    password_hash: str
    rol: str = Field(default=Rol.CLIENT, max_length=20)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
