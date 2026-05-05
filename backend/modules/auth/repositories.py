from sqlmodel import Session, select

from backend.core.repository import BaseRepository
from backend.modules.auth.models import Usuario


class UsuarioRepository(BaseRepository[Usuario]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Usuario)

    def get_by_email(self, email: str) -> Usuario | None:
        return self.session.exec(
            select(Usuario).where(Usuario.email == email)
        ).first()
