import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Producto } from '../entities/Producto';
import { fetchProductosPage } from '../entities/catalogoApi';
import { useProductos } from '../entities/useProducto';
import { useCategorias } from '../entities/useCategoria';
import { useIngredientes } from '../entities/useIngrediente';
import { useCarrito } from '../entities/useCarrito';
import { usePermissions } from '../shared/auth/roles';
import { Pagination } from '../shared/ui/Pagination';
import { SearchBar } from '../shared/ui/SearchBar';

interface GrillaProductosProps {
  onEditar: (producto: Producto) => void;
  action?: ReactNode;
}

const ITEMS_PER_PAGE = 15;

export function GrillaProductos({ onEditar, action }: GrillaProductosProps) {
  const { eliminar, actualizarStock } = useProductos();
  const { categorias: listaCategorias } = useCategorias();
  const { ingredientes: listaIngredientes } = useIngredientes();
  const { canManageCatalogo, isClient, isStock } = usePermissions();
  const { agregarProducto } = useCarrito();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [ingredienteFiltro, setIngredienteFiltro] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [stockDrafts, setStockDrafts] = useState<Record<number, string>>({});
  const [savingStockId, setSavingStockId] = useState<number | null>(null);
  const [stockMessage, setStockMessage] = useState<string | null>(null);

  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const categoriaId = categoriaFiltro ? Number(categoriaFiltro) : undefined;
  const ingredienteId = ingredienteFiltro ? Number(ingredienteFiltro) : undefined;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['catalogo', 'productos', 'grid', currentPage, searchTerm, categoriaFiltro, ingredienteFiltro],
    queryFn: () =>
      fetchProductosPage({
        offset,
        limit: ITEMS_PER_PAGE,
        search: searchTerm,
        categoria_id: categoriaId,
        ingrediente_id: ingredienteId,
      }),
  });

  const categoriasDisponibles = useMemo(() => {
    return listaCategorias.map((cat) => ({ value: String(cat.id), label: cat.nombre }));
  }, [listaCategorias]);

  const ingredientesDisponibles = useMemo(() => {
    return listaIngredientes.map((ing) => ({ value: String(ing.id), label: ing.nombre }));
  }, [listaIngredientes]);

  const handleStockChange = (productoId: number, value: string) => {
    setStockDrafts((prev) => ({ ...prev, [productoId]: value }));
    setStockMessage(null);
  };

  const handleGuardarStock = async (producto: Producto) => {
    if (!producto.id) return;
    const raw = stockDrafts[producto.id] ?? String(producto.stock_cantidad);
    const nuevoStock = Number.parseInt(raw, 10);

    if (Number.isNaN(nuevoStock) || nuevoStock < 0) {
      setStockMessage('El stock debe ser un numero entero mayor o igual a 0.');
      return;
    }

    try {
      setSavingStockId(producto.id);
      await actualizarStock(producto.id, nuevoStock);
      setStockMessage(`Stock actualizado para "${producto.nombre}".`);
      setStockDrafts((prev) => {
        const next = { ...prev };
        delete next[producto.id!];
        return next;
      });
    } catch {
      setStockMessage('No se pudo actualizar el stock.');
    } finally {
      setSavingStockId(null);
    }
  };

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
  const productos = data?.items ?? [];

  useEffect(() => {
    if (currentPage > totalPages) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Catalogo de Productos</h2>
        {action}
      </div>

      <SearchBar
        value={searchTerm}
        onChange={(term) => {
          setSearchTerm(term);
          setCurrentPage(1);
        }}
        placeholder="Buscar producto por nombre..."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <select
          value={categoriaFiltro}
          onChange={(e) => {
            setCategoriaFiltro(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 bg-white"
        >
          <option value="">Todas las categorias</option>
          {categoriasDisponibles.map((categoria) => (
            <option key={categoria.value} value={categoria.value}>
              {categoria.label}
            </option>
          ))}
        </select>

        <select
          value={ingredienteFiltro}
          onChange={(e) => {
            setIngredienteFiltro(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 bg-white"
        >
          <option value="">Todos los ingredientes</option>
          {ingredientesDisponibles.map((ingrediente) => (
            <option key={ingrediente.value} value={ingrediente.value}>
              {ingrediente.label}
            </option>
          ))}
        </select>
      </div>

      {stockMessage && (
        <div className="mb-4 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-3">
          {stockMessage}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-lg">Cargando productos...</p>
        </div>
      ) : isError ? (
        <div className="text-red-500 bg-red-50 p-4 rounded-lg border border-red-200">
          No se pudo cargar el listado de productos.
        </div>
      ) : productos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-lg">No se encontraron productos que coincidan con la busqueda.</p>
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
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categorias</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ingredientes</th>
                  {canManageCatalogo && (
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  )}
                  {isClient && (
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Carrito</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {productos.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{p.nombre}</div>
                      <div className="text-sm text-gray-500 line-clamp-1">{p.descripcion || 'Sin descripcion'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${p.precio_base}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {isStock && p.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            value={stockDrafts[p.id] ?? String(p.stock_cantidad)}
                            onChange={(e) => handleStockChange(p.id!, e.target.value)}
                            className="w-24 px-2 py-1 border rounded-md text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => void handleGuardarStock(p)}
                            disabled={savingStockId === p.id}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors"
                          >
                            {savingStockId === p.id ? 'Guardando...' : 'Guardar'}
                          </button>
                        </div>
                      ) : (
                        p.stock_cantidad
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {p.categorias && p.categorias.length > 0 ? (
                          p.categorias.map((c) => (
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
                          p.ingredientes.map((i) => (
                            <span
                              key={i.id}
                              className={`text-xs px-2 py-1 rounded-md border ${i.es_alergeno ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}
                            >
                              {i.nombre}
                              {i.es_alergeno ? ' (Alergeno)' : ''}
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
                            onClick={() => onEditar(p)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => {
                              if (p.id && window.confirm('Seguro que queres eliminar este producto?')) {
                                eliminar(p.id);
                              }
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    )}
                    {isClient && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          type="button"
                          onClick={() => agregarProducto(p, 1)}
                          disabled={!p.id || p.stock_cantidad <= 0}
                          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        >
                          {p.stock_cantidad > 0 ? 'Agregar' : 'Sin stock'}
                        </button>
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
