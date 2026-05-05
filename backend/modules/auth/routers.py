from fastapi import APIRouter, Depends, status
from sqlmodel import Session

from backend.core.database import get_session
from backend.modules.auth.dependencies import get_current_user
from backend.modules.auth.models import Usuario
from backend.modules.auth.schemas import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from backend.modules.auth.services import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


def get_auth_service(session: Session = Depends(get_session)) -> AuthService:
    return AuthService(session)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(data: RegisterRequest, svc: AuthService = Depends(get_auth_service)):
    return svc.register(data)


@router.post("/login", response_model=TokenResponse)
def login_user(data: LoginRequest, svc: AuthService = Depends(get_auth_service)):
    return svc.login(data)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: Usuario = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        nombre=current_user.nombre,
        email=current_user.email,
        rol=current_user.rol,
    )
