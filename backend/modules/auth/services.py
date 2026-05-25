from datetime import datetime

from fastapi import HTTPException, status
from sqlmodel import Session

from backend.core.unit_of_work import UnitOfWork
from backend.modules.auth.models import Rol, Usuario
from backend.modules.auth.schemas import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from backend.modules.auth.security import create_access_token, hash_password, verify_password


class AuthService:
    def __init__(self, session: Session) -> None:
        self._session = session

    def register(self, data: RegisterRequest) -> UserResponse:
        with UnitOfWork(self._session) as uow:
            existing = uow.usuarios.get_by_email(data.email)
            if existing:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El email ya está registrado")

            user = Usuario(
                nombre=data.nombre,
                email=data.email,
                password_hash=hash_password(data.password),
                rol=Rol.CLIENT,
            )
            uow.usuarios.add(user)
            return UserResponse(id=user.id, nombre=user.nombre, email=user.email, rol=user.rol, is_active=user.is_active)

    def login(self, data: LoginRequest) -> TokenResponse:
        with UnitOfWork(self._session) as uow:
            user = uow.usuarios.get_by_email(data.email)
            invalid_error = HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales inválidas",
            )

            if not user or not user.is_active:
                raise invalid_error

            if not verify_password(data.password, user.password_hash):
                raise invalid_error

            user.updated_at = datetime.utcnow()
            uow.usuarios.add(user)

            token = create_access_token(user_id=user.id, email=user.email, rol=user.rol)
            return TokenResponse(
                access_token=token,
                user=UserResponse(id=user.id, nombre=user.nombre, email=user.email, rol=user.rol, is_active=user.is_active),
            )
