import { useState, useRef } from 'react';
import { Categoria } from '../entities/Categoria';
import FormularioCategoria from '../features/FormularioCategoria';
import { GrillaCategorias } from '../features/GrillaCategorias';
import { usePermissions } from '../shared/auth/roles';

export function CategoriasPage() {
  const { canManageCatalogo } = usePermissions();
  const [categoriaAEditar, setCategoriaAEditar] = useState<Categoria | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const goToForm = () => {
    setCategoriaAEditar(null);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleEditar = (categoria: Categoria) => {
    setCategoriaAEditar(categoria);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleSuccessOrCancel = () => {
    setCategoriaAEditar(null);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <GrillaCategorias
          onEditar={handleEditar}
          action={
            canManageCatalogo ? (
              <button
                type="button"
                onClick={goToForm}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Nueva Categoria
              </button>
            ) : (
              <span className="text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg">
                Modo solo lectura
              </span>
            )
          }
        />
      </div>

      {canManageCatalogo && (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100" ref={formRef}>
          <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">
            {categoriaAEditar ? 'Editar Categoria' : 'Nueva Categoria'}
          </h2>
          <FormularioCategoria
            categoriaAEditar={categoriaAEditar}
            onCancelarEdicion={handleSuccessOrCancel}
            onSuccess={handleSuccessOrCancel}
          />
        </div>
      )}
    </div>
  );
}
