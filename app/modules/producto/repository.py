from app.core.repository import BaseRepository
from app.modules.producto.models import Producto
from sqlmodel import Session, select

class ProductoRepository(BaseRepository[Producto]):
    """
    Repositorio específico de Producto.
    Hereda de BaseRepository para obtener todas las operaciones CRUD generales.
    Acá sólo deberíamos agregar funciones específicas de la clase.
    """
    def __init__(self, session: Session) -> None :
        """
        Inicialiaza el repositorio de Producto

        Args:
            session (Session): Sesión activa de base de datos.
        """
        super().__init__(session, Producto)

    def get_all_active(self) -> list[Producto]:
        """
        Obtiene todos los productos activos de manera lógica.
        Returns: list[Producto]: lista de productos.
        """
        return list(
            self.session.exec(
                select(Producto)
                .where(Producto.is_active)
            ).all()
        )