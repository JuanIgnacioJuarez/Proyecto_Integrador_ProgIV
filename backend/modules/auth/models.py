from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class Rol:
    ADMIN = "ADMIN"
    STOCK = "STOCK"
    PEDIDOS = "PEDIDOS"
    CLIENT = "CLIENT"

    @classmethod
    def values(cls) -> set[str]:
        """Conjunto de códigos de rol válidos (para validar asignaciones)."""
        return {cls.ADMIN, cls.STOCK, cls.PEDIDOS, cls.CLIENT}


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
    deleted_at: Optional[datetime] = Field(default=None)


class RefreshToken(SQLModel, table=True):
    __tablename__ = "refresh_token"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="usuario.id", index=True)
    token_hash: str = Field(max_length=64, unique=True, index=True)
    expires_at: datetime = Field(nullable=False)
    revoked_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
