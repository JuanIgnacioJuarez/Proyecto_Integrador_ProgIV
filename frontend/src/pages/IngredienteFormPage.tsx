import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import FormularioIngrediente from '../features/FormularioIngrediente';
import { usePermissions } from '../shared/auth/roles';
import { useIngredientes } from '../entities/useIngrediente';
import { api } from '../shared/api/http';
import { Ingrediente } from '../entities/Ingrediente';

export function IngredienteFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { canManageCatalogo } = usePermissions();
  const { ingredientes } = useIngredientes();

  const ingredienteId = id ? Number(id) : null;
  const ingredienteEnMemoria =
    ingredienteId && Number.isFinite(ingredienteId) ? ingredientes.find((i) => i.id === ingredienteId) ?? null : null;

  const { data: ingredienteDesdeApi, isLoading } = useQuery({
    queryKey: ['catalogo', 'ingredientes', 'detalle', ingredienteId],
    queryFn: async () => {
      const { data } = await api.get(`/ingredientes/${ingredienteId}`);
      return new Ingrediente(data);
    },
    enabled: Boolean(ingredienteId && !ingredienteEnMemoria),
  });

  const ingredienteAEditar = ingredienteEnMemoria ?? ingredienteDesdeApi ?? null;

  if (!canManageCatalogo) {
    return (
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <p className="text-gray-600">No tenes permisos para gestionar ingredientes.</p>
      </div>
    );
  }

  if (id && isLoading) {
    return (
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <p className="text-gray-600">Cargando ingrediente...</p>
      </div>
    );
  }

  if (id && !ingredienteAEditar) {
    return (
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <p className="text-gray-700">No se encontro el ingrediente a editar.</p>
        <Link
          to="/ingredientes"
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
        <h1 className="text-2xl font-bold text-gray-800">
          {ingredienteAEditar ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}
        </h1>
        <Link
          to="/ingredientes"
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Volver al listado
        </Link>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <FormularioIngrediente
          ingredienteAEditar={ingredienteAEditar}
          onCancelarEdicion={() => navigate('/ingredientes')}
          onSuccess={() => navigate('/ingredientes')}
        />
      </div>
    </div>
  );
}
