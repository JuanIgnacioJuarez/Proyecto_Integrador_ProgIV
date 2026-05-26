import { Link, useNavigate } from 'react-router-dom';
import { Producto } from '../entities/Producto';
import { GrillaProductos } from '../features/GrillaProductos';
import { usePermissions } from '../shared/auth/roles';

export function ProductosPage() {
  const navigate = useNavigate();
  const { canManageCatalogo, canUseCarrito } = usePermissions();

  const handleEditar = (producto: Producto) => {
    if (producto.id) {
      navigate(`/productos/${producto.id}/editar`);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <GrillaProductos
          onEditar={handleEditar}
          action={
            canManageCatalogo ? (
              <Link
                to="/productos/nuevo"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Nuevo Producto
              </Link>
            ) : canUseCarrito ? (
              <Link
                to="/carrito"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Ver carrito
              </Link>
            ) : (
              <span className="text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg">
                Modo solo lectura
              </span>
            )
          }
        />
      </div>
    </div>
  );
}
