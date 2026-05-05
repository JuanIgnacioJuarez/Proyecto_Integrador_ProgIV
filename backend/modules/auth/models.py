from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class Usuario(SQLModel, table=True):
    __tablename__ = "usuario"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=120)
    email: str = Field(max_length=255, unique=True, index=True)
    password_hash: str = Field(max_length=255)
    rol: str = Field(default="ADMIN", max_length=20)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
