import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import { Ingrediente } from "../entities/Ingrediente";
import { fetchIngredientesPage } from "../entities/catalogoApi";
import { useIngredientes } from "../entities/useIngrediente";
import { useCategorias } from "../entities/useCategoria";
import { usePermissions } from "../shared/auth/roles";
import { formatStockWithUnit } from "../shared/format/stock";
import { Pagination } from "../shared/ui/Pagination";
import { SearchBar } from "../shared/ui/SearchBar";

interface GrillaIngredientesProps {
  onEditar: (ingrediente: Ingrediente) => void;
  action?: ReactNode;
}

const ITEMS_PER_PAGE = 15;

export function GrillaIngredientes({ onEditar, action }: GrillaIngredientesProps) {
  const { eliminar, cambiarEstado } = useIngredientes();
  const { categorias: todasLasCategorias } = useCategorias();
  const { canManageCatalogo } = usePermissions();

  const [searchTerm, setSearchTerm] = useState("");
  const [alergenoFiltro, setAlergenoFiltro] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [subcategoriaFiltro, setSubcategoriaFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<"" | "activo" | "inactivo">("");
  const [sortNombre, setSortNombre] = useState<"" | "asc" | "desc">("");
  const [sortStock, setSortStock] = useState<"" | "asc" | "desc">("");
  const [currentPage, setCurrentPage] = useState(1);

  const categoriasPrincipales = useMemo(
    () =>
      todasLasCategorias
        .filter(
          (cat) =>
            cat.parent_id === null &&
            cat.is_active !== false &&
            (cat.subCategorias || []).some((sub) => sub.id && sub.is_active !== false),
        )
        .sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
    [todasLasCategorias],
  );

  const subcategoriasDisponibles = useMemo(() => {
    if (!categoriaFiltro) return [];
    const categoria = categoriasPrincipales.find((cat) => String(cat.id) === categoriaFiltro);
    return (categoria?.subCategorias || [])
      .filter((sub) => sub.id && sub.is_active !== false)
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [categoriaFiltro, categoriasPrincipales]);

  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  const esAlergeno = alergenoFiltro === "" ? undefined : alergenoFiltro === "si";
  const categoriaId = categoriaFiltro ? Number(categoriaFiltro) : undefined;
  const subcategoriaId = subcategoriaFiltro ? Number(subcategoriaFiltro) : undefined;
  const isActiveParam =
    estadoFiltro === "activo" ? true : estadoFiltro === "inactivo" ? false : undefined;
  const sortBy = sortStock ? "stock" : sortNombre ? "nombre" : undefined;
  const sortDir = sortStock || sortNombre || undefined;

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      "catalogo",
      "ingredientes",
      "grid",
      currentPage,
      searchTerm,
      alergenoFiltro,
      categoriaFiltro,
      subcategoriaFiltro,
      estadoFiltro,
      sortNombre,
      sortStock,
    ],
    queryFn: () =>
      fetchIngredientesPage({
        offset,
        limit: ITEMS_PER_PAGE,
        name: searchTerm,
        es_alergeno: esAlergeno,
        categoria_id: categoriaId,
        subcategoria_id: subcategoriaId,
        is_active: isActiveParam,
        sort_by: sortBy,
        sort_dir: sortDir as "asc" | "desc" | undefined,
        include_inactive: canManageCatalogo,
      }),
  });

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
  const items = data?.items ?? [];
  const showing = Math.min(offset + items.length, total);

  useEffect(() => {
    if (data && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, data, totalPages]);

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Catalogo de Ingredientes</h2>
        {action}
      </div>

      <SearchBar
        value={searchTerm}
        onChange={(term) => {
          setSearchTerm(term);
          setCurrentPage(1);
        }}
        placeholder="Buscar ingrediente por nombre..."
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <select
          value={categoriaFiltro}
          onChange={(e) => {
            setCategoriaFiltro(e.target.value);
            setSubcategoriaFiltro("");
            setCurrentPage(1);
          }}
          className="w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 bg-white"
        >
          <option value="">Todas las categorias</option>
          {categoriasPrincipales.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nombre}
            </option>
          ))}
        </select>

        <select
          value={subcategoriaFiltro}
          onChange={(e) => {
            setSubcategoriaFiltro(e.target.value);
            setCurrentPage(1);
          }}
          disabled={!categoriaFiltro}
          className="w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 bg-white disabled:bg-gray-100 disabled:text-gray-500"
        >
          <option value="">Todas las subcategorias</option>
          {subcategoriasDisponibles.map((subcategoria) => (
            <option key={subcategoria.id} value={subcategoria.id}>
              {subcategoria.nombre}
            </option>
          ))}
        </select>

        <select
          value={alergenoFiltro}
          onChange={(e) => {
            setAlergenoFiltro(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 bg-white"
        >
          <option value="">Todos</option>
          <option value="si">Solo alergenos</option>
          <option value="no">Solo no alergenos</option>
        </select>

        <select
          value={estadoFiltro}
          onChange={(e) => {
            setEstadoFiltro(e.target.value as "" | "activo" | "inactivo");
            setCurrentPage(1);
          }}
          className="w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 bg-white"
        >
          <option value="">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-lg">Cargando ingredientes...</p>
        </div>
      ) : isError ? (
        <div className="text-red-500 bg-red-50 p-4 rounded-lg border border-red-200">
          No se pudo cargar el listado de ingredientes.
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-lg">No se encontraron ingredientes que coincidan con la busqueda.</p>
        </div>
      ) : (
        <>
          <div className="flex justify-end mb-2">
            <div className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              Mostrando {showing} de {total} resultados
            </div>
          </div>

          <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</span>
                      <select
                        value={sortNombre}
                        onChange={(e) => {
                          setSortNombre(e.target.value as "" | "asc" | "desc");
                          if (e.target.value) setSortStock("");
                          setCurrentPage(1);
                        }}
                        className="text-[11px] text-gray-600 border border-gray-200 rounded px-1.5 py-0.5 bg-white"
                      >
                        <option value="">Orden</option>
                        <option value="asc">A-Z</option>
                        <option value="desc">Z-A</option>
                      </select>
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripcion
                  </th>
                  <th scope="col" className="px-6 py-3 text-left">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</span>
                      <select
                        value={sortStock}
                        onChange={(e) => {
                          setSortStock(e.target.value as "" | "asc" | "desc");
                          if (e.target.value) setSortNombre("");
                          setCurrentPage(1);
                        }}
                        className="text-[11px] text-gray-600 border border-gray-200 rounded px-1.5 py-0.5 bg-white"
                      >
                        <option value="">Orden</option>
                        <option value="asc">Menor</option>
                        <option value="desc">Mayor</option>
                      </select>
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                    Es alergeno
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  {canManageCatalogo && (
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((i) => (
                  <tr
                    key={i.id}
                    className={`${i.is_active ? "hover:bg-gray-50" : "bg-gray-300 text-gray-700"} transition-colors`}
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{i.nombre}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 line-clamp-2">{i.descripcion || "Sin descripcion"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatStockWithUnit(i.stock_cantidad, i.unidad_medida)}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {i.is_active ? (
                        <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-semibold border border-emerald-200">
                          Activo
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-xs font-semibold border border-amber-200">
                          Inactivo
                        </span>
                      )}
                    </td>
                    {canManageCatalogo && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex gap-2 justify-end">
                          {i.is_active && (
                            <button
                              onClick={() => onEditar(i)}
                              className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                            >
                              Editar
                            </button>
                          )}
                          {i.is_active ? (
                            <button
                              onClick={() => {
                                if (i.id && window.confirm("Seguro que queres desactivar este ingrediente?")) {
                                  eliminar(i.id);
                                }
                              }}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                            >
                              Desactivar
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                if (i.id) {
                                  cambiarEstado(i.id, true);
                                }
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                            >
                              Reactivar
                            </button>
                          )}
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
