import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import FormularioProducto from '../features/FormularioProducto';
import { usePermissions } from '../shared/auth/roles';
import { useProductos } from '../entities/useProducto';
import { api } from '../shared/api/http';
import { Producto } from '../entities/Producto';

export function ProductoFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { canManageCatalogo } = usePermissions();
  const { productos } = useProductos();

  const productoId = id ? Number(id) : null;
  const productoEnMemoria =
    productoId && Number.isFinite(productoId) ? productos.find((p) => p.id === productoId) ?? null : null;

  const { data: productoDesdeApi, isLoading } = useQuery({
    queryKey: ['catalogo', 'productos', 'detalle', productoId],
    queryFn: async () => {
      const { data } = await api.get(`/productos/${productoId}`);
      return new Producto(data);
    },
    enabled: Boolean(productoId && !productoEnMemoria),
  });

  const productoAEditar = productoEnMemoria ?? productoDesdeApi ?? null;

  if (!canManageCatalogo) {
    return (
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <p className="text-gray-600">No tenes permisos para gestionar productos.</p>
      </div>
    );
  }

  if (id && isLoading) {
    return (
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <p className="text-gray-600">Cargando producto...</p>
      </div>
    );
  }

  if (id && !productoAEditar) {
    return (
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <p className="text-gray-700">No se encontro el producto a editar.</p>
        <Link
          to="/productos"
          className="inline-block bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Volver al listado
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{productoAEditar ? 'Editar Producto' : 'Nuevo Producto'}</h1>
        <Link
          to="/productos"
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Volver al listado
        </Link>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <FormularioProducto
          productoAEditar={productoAEditar}
          onCancelarEdicion={() => navigate('/productos')}
          onSuccess={() => navigate('/productos')}
        />
      </div>
    </div>
  );
}
