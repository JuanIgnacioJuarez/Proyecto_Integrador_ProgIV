from sqlmodel import Session

# Importación de repositorios específicos.
from app.modules.categoria.repository import CategoriaRepository
from app.modules.ingrediente.repository import IngredienteRepository
from app.modules.producto.repository import ProductoRepository

class UnitOfWork:
    """
    Gestiona el ciclo de vida de la transacción de base de datos.

    Uso en servicios:
        with uow:
            uow.heroes.add(hero)
            uow.teams.add(team)
        # commit automático si no hay excepción
        # rollback automático si hay excepción

    El UoW es la única capa que llama a commit() y rollback().
    Los repositorios solo llaman a flush() para obtener IDs en memoria.
    """

    def __init__(self, session: Session) -> None:
        """
        Inicializa el UnitOfWork con una sesión activa de base de datos.

        Args:
            session (Session): Instancia de SQLModel/SQLAlchemy Session.
                               Representa el contexto de conexión y transacción.
        """
        self._session = session

        # Inicialización de los repositorios para que el servicio los utilice.
        self.categorias = CategoriaRepository(self._session)
        self.ingredientes = IngredienteRepository(self._session)
        self.productos = ProductoRepository(self._session)

    def __enter__(self) -> "UnitOfWork":
        """
        Método invocado al entrar en el contexto `with`.

        Returns:
            UnitOfWork: Retorna la propia instancia para operar dentro del bloque.
        """
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        """
        Método invocado al salir del contexto `with`.

        Controla automáticamente la transacción:
        - Si no hubo excepción → commit()
        - Si hubo excepción → rollback()

        Args:
            exc_type: Tipo de excepción (None si no hubo error)
            exc_val: Valor de la excepción
            exc_tb: Traceback de la excepción
        """
        if exc_type is None:
            self._session.commit()
        else:
            self._session.rollback()
        self._session.close()

    def commit(self) -> None:
        """
        Ejecuta un commit explícito de la transacción actual.
        """
        self._session.commit()

    def rollback(self) -> None:
        """
        Ejecuta un rollback explícito de la transacción actual.
        """
        self._session.rollback()