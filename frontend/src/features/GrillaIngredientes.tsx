import { useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import { Ingrediente } from '../entities/Ingrediente';
import { useIngredientes } from '../entities/useIngrediente';

import { Pagination } from '../shared/ui/Pagination';
import { SearchBar } from '../shared/ui/SearchBar';

interface GrillaIngredientesProps {
  onEditar: (ingrediente: Ingrediente) => void;
  action?: ReactNode;
}

const ITEMS_PER_PAGE = 15;

export function GrillaIngredientes({ onEditar, action }: GrillaIngredientesProps) {
  const { ingredientes, eliminar, error } = useIngredientes();
  const [searchTerm, setSearchTerm] = useState('');
  const [alergenoFiltro, setAlergenoFiltro] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredIngredientes = useMemo(() => {
    return ingredientes.filter((i) => {
      const coincideNombre = i.nombre.toLowerCase().includes(searchTerm.toLowerCase());
      const coincideAlergeno =
        alergenoFiltro === '' ||
        (alergenoFiltro === 'si' ? i.es_alergeno : !i.es_alergeno);

      return coincideNombre && coincideAlergeno;
    });
  }, [ingredientes, searchTerm, alergenoFiltro]);

  const totalPages = Math.ceil(filteredIngredientes.length / ITEMS_PER_PAGE);
  const currentIngredientes = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredIngredientes.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredIngredientes, currentPage]);

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
        <h2 className="text-2xl font-bold text-gray-800">Catalogo de Ingredientes</h2>
        {action}
      </div>

      <SearchBar value={searchTerm} onChange={handleSearch} placeholder="Buscar ingrediente por nombre..." />

      <div className="mb-6">
        <select
          value={alergenoFiltro}
          onChange={(e) => {
            setAlergenoFiltro(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full md:w-80 px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 bg-white"
        >
          <option value="">Todos</option>
          <option value="si">Solo alergenos</option>
          <option value="no">Solo no alergenos</option>
        </select>
      </div>

      {currentIngredientes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-lg">No se encontraron ingredientes que coincidan con la busqueda.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripcion</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Es alergeno</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentIngredientes.map((i) => (
                  <tr key={i.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{i.nombre}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 line-clamp-2">{i.descripcion || 'Sin descripcion'}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {i.es_alergeno ? (
                        <span className="bg-red-100 text-red-800 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide border border-red-200">
                          Si
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide border border-gray-200">
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => onEditar(i)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => {
                            if (i.id && window.confirm('¿Seguro que queres eliminar este ingrediente?')) {
                              eliminar(i.id);
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

