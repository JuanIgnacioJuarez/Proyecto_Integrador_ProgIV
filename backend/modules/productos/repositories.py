from backend.core.repository import BaseRepository
from backend.modules.productos.models import Producto
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


    # Se agrega metodo para filtrar activos
    def get_by_id(self, record_id: int) -> Producto | None:
        """Sobreescribe el base para excluir soft-deleted."""
        return self.session.exec(
            select(Producto)
            .where(Producto.id == record_id)
            .where(Producto.deleted_at.is_(None))   # ← filtro clave
        ).first()

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