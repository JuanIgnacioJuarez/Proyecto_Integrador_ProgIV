from app.core.repository import BaseRepository
from app.modules.ingrediente.models import Ingrediente
from sqlmodel import Session, select

class IngredienteRepository(BaseRepository[Ingrediente]):
    """
    Repositorio específico de Ingrediente.
    Hereda de BaseRepository para obtener todas las operaciones CRUD generales.
    Acá sólo deberíamos agregar funciones específicas de la clase.
    """
    def __init__(self, session: Session) -> None :
        """
        Inicialiaza el repositorio de Ingrediente

        Args:
            session (Session): Sesión activa de base de datos.
        """
        super().__init__(session, Ingrediente)

    def get_by_nombre(self, nombre: str) -> Ingrediente | None:
        # Obtiene un ingrediente por nombre, ya que definimos el campo nombre como unique
        return self.session.exec(
            select(Ingrediente)
            .where(Ingrediente.nombre == nombre)
        ).first()
    
    def get_all_active(self) -> list[Ingrediente]:
        """
        Obtiene todos los ingredientes activos de manera lógica.
        Returns: list[Ingrediente]: lista de ingredientes.
        """
        return list(
            self.session.exec(
                select(Ingrediente)
                .where(Ingrediente.is_active)
            ).all()
        )