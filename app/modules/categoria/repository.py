from app.core.repository import BaseRepository
from app.modules.categoria.models import Categoria
from sqlmodel import Session, select

class CategoriaRepository(BaseRepository[Categoria]):
    """
    Repositorio específico de Categoria.
    Hereda de BaseRepository para obtener todas las operaciones CRUD generales.
    Acá sólo deberíamos agregar funciones específicas de la clase.
    """
    def __init__(self, session: Session) -> None :
        """
        Inicialiaza el repositorio de Categoría

        Args:
            session (Session): Sesión activa de base de datos.
        """
        super().__init__(session, Categoria)

    def get_by_nombre(self, nombre: str) -> Categoria | None:
        # Obtiene una categoría por nombre, ya que definimos el campo nombre como unique
        return self.session.exec(
            select(Categoria)
            .where(Categoria.nombre == nombre)
        ).first()

    def get_all_active(self) -> list[Categoria]:
        """
        Obtiene todas las categorías activas de manera lógica.
        Returns: list[Categoria]: lista de categorías categorías.
        """
        return list(
            self.session.exec(
                select(Categoria)
                .where(Categoria.is_active)
            ).all()
        )
    
    def get_all_raices_activas(self) -> list[Categoria]:
        """
        Obtiene solo las categorias principales (raíces) que no tienen padre.
        Esto evita que las subcategorías aparezcan en el primer nivel del JSON.
        """
        return list(
            self.session.exec(
                select(Categoria)
                .where(Categoria.is_active, Categoria.parent_id == None)
            ).all()
        )
