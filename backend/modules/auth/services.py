import hashlib
import secrets
from datetime import datetime, timedelta

from fastapi import HTTPException, status
from sqlmodel import Session

from backend.core.unit_of_work import UnitOfWork
from backend.modules.auth.models import RefreshToken, Rol, Usuario
from backend.modules.auth.schemas import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from backend.modules.auth.security import create_access_token, hash_password, verify_password


class AuthService:
    def __init__(self, session: Session) -> None:
        self._session = session
        self._refresh_days = 7

    def _build_user_response(self, user: Usuario) -> UserResponse:
        return UserResponse(
            id=user.id,
            nombre=user.nombre,
            email=user.email,
            rol=user.rol,
            is_active=user.is_active,
        )

    def _issue_refresh_token(self, uow: UnitOfWork, user_id: int) -> str:
        plain_token = secrets.token_urlsafe(48)
        token_hash = hashlib.sha256(plain_token.encode("utf-8")).hexdigest()
        expires_at = datetime.utcnow() + timedelta(days=self._refresh_days)
        uow.refresh_tokens.add(
            RefreshToken(
                user_id=user_id,
                token_hash=token_hash,
                expires_at=expires_at,
            )
        )
        return plain_token

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
            return self._build_user_response(user)

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

            access_token = create_access_token(user_id=user.id, email=user.email, rol=user.rol)
            refresh_token = self._issue_refresh_token(uow, user.id)
            return TokenResponse(
                access_token=access_token,
                refresh_token=refresh_token,
                user=self._build_user_response(user),
            )

    def refresh(self, refresh_token: str) -> TokenResponse:
        with UnitOfWork(self._session) as uow:
            token_hash = hashlib.sha256(refresh_token.encode("utf-8")).hexdigest()
            stored_token = uow.refresh_tokens.get_active_by_hash(token_hash)
            invalid_error = HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token inválido o expirado",
            )

            if not stored_token:
                raise invalid_error

            if stored_token.expires_at <= datetime.utcnow():
                stored_token.revoked_at = datetime.utcnow()
                uow.refresh_tokens.add(stored_token)
                raise invalid_error

            user = uow.usuarios.get_by_id(stored_token.user_id)
            if not user or not user.is_active:
                raise invalid_error

            stored_token.revoked_at = datetime.utcnow()
            uow.refresh_tokens.add(stored_token)

            access_token = create_access_token(user_id=user.id, email=user.email, rol=user.rol)
            new_refresh_token = self._issue_refresh_token(uow, user.id)

            return TokenResponse(
                access_token=access_token,
                refresh_token=new_refresh_token,
                user=self._build_user_response(user),
            )

    def logout(self, user_id: int, refresh_token: str) -> None:
        with UnitOfWork(self._session) as uow:
            token_hash = hashlib.sha256(refresh_token.encode("utf-8")).hexdigest()
            stored_token = uow.refresh_tokens.get_active_by_hash(token_hash)

            if not stored_token or stored_token.user_id != user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Refresh token inválido",
                )

            stored_token.revoked_at = datetime.utcnow()
            uow.refresh_tokens.add(stored_token)
