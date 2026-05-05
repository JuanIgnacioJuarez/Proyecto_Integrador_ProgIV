from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session

from backend.core.database import get_session
from backend.modules.auth.models import Usuario
from backend.modules.auth.repositories import UsuarioRepository
from backend.modules.auth.security import decode_access_token

bearer_scheme = HTTPBearer(auto_error=True)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    session: Session = Depends(get_session),
) -> Usuario:
    auth_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inv?lido o expirado",
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
