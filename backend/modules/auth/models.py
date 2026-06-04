from datetime import datetime
from typing import ClassVar, Optional

from sqlmodel import Field, Relationship, SQLModel


class Rol(SQLModel, table=True):
    """Tabla de roles del sistema. Los códigos son constantes de clase."""

    __tablename__ = "rol"

    ADMIN: ClassVar[str] = "ADMIN"
    STOCK: ClassVar[str] = "STOCK"
    PEDIDOS: ClassVar[str] = "PEDIDOS"
    CLIENT: ClassVar[str] = "CLIENT"

    id: int | None = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=20, unique=True, index=True)
    descripcion: str = Field(default="")

    @classmethod
    def values(cls) -> set[str]:
        """Conjunto de códigos de rol válidos (para validar asignaciones)."""
        return {cls.ADMIN, cls.STOCK, cls.PEDIDOS, cls.CLIENT}


class UsuarioRolLink(SQLModel, table=True):
    """Tabla intermedia N:M entre Usuario y Rol."""

    __tablename__ = "usuario_rol"

    usuario_id: int = Field(foreign_key="usuario.id", primary_key=True)
    rol_id: int = Field(foreign_key="rol.id", primary_key=True)


class Usuario(SQLModel, table=True):
    __tablename__ = "usuario"

    id: int | None = Field(default=None, primary_key=True)
    nombre: str
    email: str = Field(unique=True, index=True)
    password_hash: str
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    deleted_at: Optional[datetime] = Field(default=None)

    roles: list[Rol] = Relationship(link_model=UsuarioRolLink)

    @property
    def rol(self) -> str:
        """Retorna el nombre del primer rol asignado. Usado para compatibilidad con JWT y respuestas."""
        return self.roles[0].nombre if self.roles else ""


class RefreshToken(SQLModel, table=True):
    __tablename__ = "refresh_token"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="usuario.id", index=True)
    token_hash: str = Field(max_length=64, unique=True, index=True)
    expires_at: datetime = Field(nullable=False)
    revoked_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
