import { useState, useMemo } from 'react';
import { Categoria } from '../entities/Categoria';
import { useCategorias } from '../entities/useCategoria';

import { Pagination } from '../shared/ui/Pagination';
import { SearchBar } from '../shared/ui/SearchBar';

interface GrillaCategoriasProps {
  onEditar: (categoria: Categoria) => void;
}

const ITEMS_PER_PAGE = 15;

export function GrillaCategorias({ onEditar }: GrillaCategoriasProps) {
  const { categorias, eliminar, error } = useCategorias();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredCategorias = useMemo(() => {
    return categorias.filter((c) =>
      c.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categorias, searchTerm]);

  const totalPages = Math.ceil(filteredCategorias.length / ITEMS_PER_PAGE);
  const currentCategorias = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCategorias.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredCategorias, currentPage]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  if (error) {
    return <div className="text-red-500 bg-red-50 p-4 rounded-lg border border-red-200">{error}</div>;
  }

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Catálogo de Categorías</h2>
      </div>

      <SearchBar value={searchTerm} onChange={handleSearch} placeholder="Buscar categoría por nombre..." />

      {currentCategorias.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-lg">No se encontraron categorías que coincidan con la búsqueda.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subcategorías</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Productos</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentCategorias.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{c.nombre}</div>
                      <div className="text-sm text-gray-500 line-clamp-1">{c.descripcion || 'Sin descripción'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {c.subCategorias && c.subCategorias.length > 0 ? (
                          c.subCategorias.map(sub => (
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
                          c.productos.map(p => (
                            <span key={p.id} className="bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-md border border-indigo-100">
                              {p.nombre}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex gap-2 justify-end">
                        <button 
                          onClick={() => onEditar(c)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => c.id && eliminar(c.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={setCurrentPage} 
          />
        </>
      )}
    </div>
  );
}
