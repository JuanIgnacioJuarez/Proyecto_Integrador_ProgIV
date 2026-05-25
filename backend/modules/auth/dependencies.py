from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session

from backend.core.database import get_session
from backend.modules.auth.models import Rol, Usuario
from backend.modules.auth.repositories import UsuarioRepository
from backend.modules.auth.security import decode_access_token

bearer_scheme = HTTPBearer(auto_error=True)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    session: Session = Depends(get_session),
) -> Usuario:
    auth_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido o expirado",
    )

    try:
        payload = decode_access_token(credentials.credentials)
        user_id = int(payload.get("sub"))
    except Exception as exc:
        raise auth_error from exc

    user = UsuarioRepository(session).get_by_id(user_id)
    if not user or not user.is_active:
        raise auth_error

    return user


def require_admin(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    """Solo ADMIN."""
    if current_user.rol != Rol.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Se requiere rol ADMIN")
    return current_user


def require_admin_or_stock(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    """ADMIN o STOCK: gestión de stock y disponibilidad."""
    if current_user.rol not in (Rol.ADMIN, Rol.STOCK):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Se requiere rol ADMIN o STOCK")
    return current_user


def require_admin_or_pedidos(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    """ADMIN o PEDIDOS: ver y avanzar estados de pedidos."""
    if current_user.rol not in (Rol.ADMIN, Rol.PEDIDOS):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Se requiere rol ADMIN o PEDIDOS")
    return current_user


def require_client(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    """CLIENT (o ADMIN): catálogo, carrito y pedidos propios."""
    if current_user.rol not in (Rol.CLIENT, Rol.ADMIN):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Se requiere rol CLIENT")
    return current_user
