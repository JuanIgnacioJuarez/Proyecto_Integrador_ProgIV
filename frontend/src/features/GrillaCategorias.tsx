import { useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import { Categoria } from '../entities/Categoria';
import { useCategorias } from '../entities/useCategoria';

import { Pagination } from '../shared/ui/Pagination';
import { SearchBar } from '../shared/ui/SearchBar';

interface GrillaCategoriasProps {
  onEditar: (categoria: Categoria) => void;
  action?: ReactNode;
}

const ITEMS_PER_PAGE = 15;

export function GrillaCategorias({ onEditar, action }: GrillaCategoriasProps) {
  const { categorias, eliminar, error } = useCategorias();
  const [searchTerm, setSearchTerm] = useState('');
  const [subcategoriaFiltro, setSubcategoriaFiltro] = useState('');
  const [productoFiltro, setProductoFiltro] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const subcategoriasDisponibles = useMemo(() => {
    const map = new Map<string, string>();
    categorias.forEach((c) => {
      (c.subCategorias ?? []).forEach((sub) => {
        const key = sub.id ? String(sub.id) : sub.nombre;
        map.set(key, sub.nombre);
      });
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [categorias]);

  const productosDisponibles = useMemo(() => {
    const map = new Map<string, string>();
    categorias.forEach((c) => {
      (c.productos ?? []).forEach((p) => {
        const key = p.id ? String(p.id) : p.nombre;
        map.set(key, p.nombre);
      });
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [categorias]);

  const filteredCategorias = useMemo(() => {
    return categorias.filter((c) => {
      const coincideNombre = c.nombre.toLowerCase().includes(searchTerm.toLowerCase());
      const coincideSubcategoria =
        subcategoriaFiltro === '' ||
        (c.subCategorias ?? []).some((sub) => (sub.id ? String(sub.id) : sub.nombre) === subcategoriaFiltro);
      const coincideProducto =
        productoFiltro === '' ||
        (c.productos ?? []).some((p) => (p.id ? String(p.id) : p.nombre) === productoFiltro);

      return coincideNombre && coincideSubcategoria && coincideProducto;
    });
  }, [categorias, searchTerm, subcategoriaFiltro, productoFiltro]);

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
        <h2 className="text-2xl font-bold text-gray-800">Catalogo de Categorias</h2>
        {action}
      </div>

      <SearchBar value={searchTerm} onChange={handleSearch} placeholder="Buscar categoria por nombre..." />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <select
          value={subcategoriaFiltro}
          onChange={(e) => {
            setSubcategoriaFiltro(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 bg-white"
        >
          <option value="">Todas las subcategorias</option>
          {subcategoriasDisponibles.map((sub) => (
            <option key={sub.value} value={sub.value}>
              {sub.label}
            </option>
          ))}
        </select>

        <select
          value={productoFiltro}
          onChange={(e) => {
            setProductoFiltro(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 bg-white"
        >
          <option value="">Todos los productos</option>
          {productosDisponibles.map((prod) => (
            <option key={prod.value} value={prod.value}>
              {prod.label}
            </option>
          ))}
        </select>
      </div>

      {currentCategorias.length === 0 ? (
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
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentCategorias.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{c.nombre}</div>
                      <div className="text-sm text-gray-500 line-clamp-1">{c.descripcion || 'Sin descripcion'}</div>
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
                          onClick={() => {
                            if (c.id && window.confirm('¿Seguro que queres eliminar esta categoria?')) {
                              eliminar(c.id);
                            }
                          }}
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

