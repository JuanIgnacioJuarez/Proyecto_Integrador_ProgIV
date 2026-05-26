import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Categoria } from '../entities/Categoria';
import { fetchCategoriasPage } from '../entities/catalogoApi';
import { useCategorias } from '../entities/useCategoria';
import { usePermissions } from '../shared/auth/roles';
import { Pagination } from '../shared/ui/Pagination';
import { SearchBar } from '../shared/ui/SearchBar';

interface GrillaCategoriasProps {
  onEditar: (categoria: Categoria) => void;
  action?: ReactNode;
}

const ITEMS_PER_PAGE = 15;

export function GrillaCategorias({ onEditar, action }: GrillaCategoriasProps) {
  const { eliminar } = useCategorias();
  const { canManageCatalogo } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['catalogo', 'categorias', 'grid', currentPage, searchTerm],
    queryFn: () =>
      fetchCategoriasPage({
        offset,
        limit: ITEMS_PER_PAGE,
        search: searchTerm,
      }),
  });

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
  const categorias = data?.items ?? [];

  useEffect(() => {
    if (currentPage > totalPages) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Catalogo de Categorias</h2>
        {action}
      </div>

      <SearchBar
        value={searchTerm}
        onChange={(term) => {
          setSearchTerm(term);
          setCurrentPage(1);
        }}
        placeholder="Buscar categoria por nombre..."
      />

      {isLoading ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-lg">Cargando categorias...</p>
        </div>
      ) : isError ? (
        <div className="text-red-500 bg-red-50 p-4 rounded-lg border border-red-200">
          No se pudo cargar el listado de categorias.
        </div>
      ) : categorias.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-lg">No se encontraron categorias que coincidan con la busqueda.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subcategorias</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Productos</th>
                  {canManageCatalogo && (
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categorias.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{c.nombre}</div>
                      <div className="text-sm text-gray-500 line-clamp-1">{c.descripcion || 'Sin descripcion'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {c.subCategorias && c.subCategorias.length > 0 ? (
                          c.subCategorias.map((sub) => (
                            <span key={sub.id} className="bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded-md border border-purple-100">
                              {sub.nombre}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {c.productos && c.productos.length > 0 ? (
                          c.productos.map((p) => (
                            <span key={p.id} className="bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-md border border-indigo-100">
                              {p.nombre}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </div>
                    </td>
                    {canManageCatalogo && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => onEditar(c)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => {
                              if (c.id && window.confirm('Seguro que queres eliminar esta categoria?')) {
                                eliminar(c.id);
                              }
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      )}
    </div>
  );
}
