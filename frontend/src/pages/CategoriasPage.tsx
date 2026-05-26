import { Link, useNavigate } from 'react-router-dom';
import { Categoria } from '../entities/Categoria';
import { GrillaCategorias } from '../features/GrillaCategorias';
import { usePermissions } from '../shared/auth/roles';

export function CategoriasPage() {
  const navigate = useNavigate();
  const { canManageCatalogo } = usePermissions();

  const handleEditar = (categoria: Categoria) => {
    if (categoria.id) {
      navigate(`/categorias/${categoria.id}/editar`);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <GrillaCategorias
          onEditar={handleEditar}
          action={
            canManageCatalogo ? (
              <Link
                to="/categorias/nueva"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Nueva Categoria
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
