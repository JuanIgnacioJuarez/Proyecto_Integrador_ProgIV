import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import FormularioCategoria from '../features/FormularioCategoria';
import { usePermissions } from '../shared/auth/roles';
import { useCategorias } from '../entities/useCategoria';
import { api } from '../shared/api/http';
import { Categoria } from '../entities/Categoria';

export function CategoriaFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { canManageCatalogo } = usePermissions();
  const { categorias } = useCategorias();

  const categoriaId = id ? Number(id) : null;
  const categoriaEnMemoria =
    categoriaId && Number.isFinite(categoriaId) ? categorias.find((c) => c.id === categoriaId) ?? null : null;

  const { data: categoriaDesdeApi, isLoading } = useQuery({
    queryKey: ['catalogo', 'categorias', 'detalle', categoriaId],
    queryFn: async () => {
      const { data } = await api.get(`/categorias/${categoriaId}`);
      return new Categoria(data);
    },
    enabled: Boolean(categoriaId && !categoriaEnMemoria),
  });

  const categoriaAEditar = categoriaEnMemoria ?? categoriaDesdeApi ?? null;

  if (!canManageCatalogo) {
    return (
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <p className="text-gray-600">No tenes permisos para gestionar categorias.</p>
      </div>
    );
  }

  if (id && isLoading) {
    return (
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <p className="text-gray-600">Cargando categoria...</p>
      </div>
    );
  }

  if (id && !categoriaAEditar) {
    return (
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <p className="text-gray-700">No se encontro la categoria a editar.</p>
        <Link
          to="/categorias"
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
        <h1 className="text-2xl font-bold text-gray-800">{categoriaAEditar ? 'Editar Categoria' : 'Nueva Categoria'}</h1>
        <Link
          to="/categorias"
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Volver al listado
        </Link>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <FormularioCategoria
          categoriaAEditar={categoriaAEditar}
          onCancelarEdicion={() => navigate('/categorias')}
          onSuccess={() => navigate('/categorias')}
        />
      </div>
    </div>
  );
}
