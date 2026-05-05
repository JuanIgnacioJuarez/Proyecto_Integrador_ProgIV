import { useState, useMemo } from 'react';
import { Producto } from '../entities/Producto';
import { useProductos } from '../entities/useProducto';

import { Pagination } from '../shared/ui/Pagination';
import { SearchBar } from '../shared/ui/SearchBar';

interface GrillaProductosProps {
  onEditar: (producto: Producto) => void;
}

const ITEMS_PER_PAGE = 15;

export function GrillaProductos({ onEditar }: GrillaProductosProps) {
  const { productos, eliminar, error } = useProductos();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filtrado y paginación
  const filteredProductos = useMemo(() => {
    return productos.filter((p) =>
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [productos, searchTerm]);

  const totalPages = Math.ceil(filteredProductos.length / ITEMS_PER_PAGE);
  const currentProductos = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProductos.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProductos, currentPage]);

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
        <h2 className="text-2xl font-bold text-gray-800">Catálogo de Productos</h2>
      </div>

      <SearchBar value={searchTerm} onChange={handleSearch} placeholder="Buscar producto por nombre..." />

      {currentProductos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-lg">No se encontraron productos que coincidan con la búsqueda.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categorías</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ingredientes</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentProductos.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{p.nombre}</div>
                      <div className="text-sm text-gray-500 line-clamp-1">{p.descripcion || 'Sin descripción'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      ${p.precio_base}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {p.stock_cantidad}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {p.categorias && p.categorias.length > 0 ? (
                          p.categorias.map(c => (
                            <span key={c.id} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md border border-blue-100">
                              {c.nombre}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {p.ingredientes && p.ingredientes.length > 0 ? (
                          p.ingredientes.map(i => (
                            <span key={i.id} className={`text-xs px-2 py-1 rounded-md border ${i.es_alergeno ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                              {i.nombre} {i.es_alergeno && '⚠️'}
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
                          onClick={() => onEditar(p)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => {
                          if (p.id && window.confirm('?Seguro que quer?s eliminar este producto?')) {
                            eliminar(p.id);
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
