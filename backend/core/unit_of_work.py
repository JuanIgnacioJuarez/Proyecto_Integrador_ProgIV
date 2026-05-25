from sqlmodel import Session

# Importación de repositorios específicos.
from backend.modules.categorias.repositories import CategoriaRepository
from backend.modules.ingredientes.repositories import IngredienteRepository
from backend.modules.productos.repositories import ProductoRepository
from backend.modules.auth.repositories import UsuarioRepository
from backend.modules.direcciones.repositories import DireccionEntregaRepository
from backend.modules.pedidos.repositories import (
    DetallePedidoRepository,
    FormaPagoRepository,
    HistorialEstadoPedidoRepository,
    PedidoRepository,
)

class UnitOfWork:
    """
    Gestiona el ciclo de vida de la transacción de base de datos.

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
        self.usuarios = UsuarioRepository(self._session)
        self.direcciones = DireccionEntregaRepository(self._session)
        self.formas_pago = FormaPagoRepository(self._session)
        self.pedidos = PedidoRepository(self._session)
        self.detalles_pedido = DetallePedidoRepository(self._session)
        self.historial_pedido = HistorialEstadoPedidoRepository(self._session)

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
