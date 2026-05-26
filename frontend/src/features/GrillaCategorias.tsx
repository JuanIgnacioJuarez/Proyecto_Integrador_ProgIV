import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import { Categoria } from "../entities/Categoria";
import { fetchCategoriasPage } from "../entities/catalogoApi";
import { useCategorias } from "../entities/useCategoria";
import { usePermissions } from "../shared/auth/roles";
import { Pagination } from "../shared/ui/Pagination";
import { SearchBar } from "../shared/ui/SearchBar";

interface GrillaCategoriasProps {
  onEditar: (categoria: Categoria) => void;
  action?: ReactNode;
}

const ITEMS_PER_PAGE = 15;

export function GrillaCategorias({ onEditar, action }: GrillaCategoriasProps) {
  const { eliminar, cambiarEstado, categorias: todasLasCategorias } = useCategorias();
  const { canManageCatalogo } = usePermissions();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [subcategoriaFiltro, setSubcategoriaFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<"" | "activo" | "inactivo">("activo");
  const [sortDir, setSortDir] = useState<"" | "asc" | "desc">("");
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

  const categoriaSeleccionadaId = categoriaFiltro ? Number(categoriaFiltro) : undefined;
  const subcategoriaSeleccionadaId = subcategoriaFiltro ? Number(subcategoriaFiltro) : undefined;
  const categoriaIdQuery = subcategoriaSeleccionadaId ?? categoriaSeleccionadaId;
  const isActiveParam =
    estadoFiltro === "activo" ? true : estadoFiltro === "inactivo" ? false : undefined;

  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      "catalogo",
      "categorias",
      "grid",
      currentPage,
      searchTerm,
      categoriaFiltro,
      subcategoriaFiltro,
      estadoFiltro,
      sortDir,
    ],
    queryFn: () =>
      fetchCategoriasPage({
        offset,
        limit: ITEMS_PER_PAGE,
        search: searchTerm,
        categoria_id: categoriaIdQuery,
        is_active: isActiveParam,
        sort_by: sortDir ? "nombre" : undefined,
        sort_dir: sortDir || undefined,
        include_inactive: canManageCatalogo,
      }),
  });

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
  const categorias = data?.items ?? [];
  const showing = Math.min(offset + categorias.length, total);

  useEffect(() => {
    if (data && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, data, totalPages]);

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
      </div>

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
                        value={sortDir}
                        onChange={(e) => {
                          setSortDir(e.target.value as "" | "asc" | "desc");
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
                    Subcategorias
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Productos
                  </th>
                  <th scope="col" className="px-6 py-3 text-left">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</span>
                      <select
                        value={estadoFiltro}
                        onChange={(e) => {
                          setEstadoFiltro(e.target.value as "" | "activo" | "inactivo");
                          setCurrentPage(1);
                        }}
                        className="text-[11px] text-gray-600 border border-gray-200 rounded px-1.5 py-0.5 bg-white"
                      >
                        <option value="">Todos</option>
                        <option value="activo">Activo</option>
                        <option value="inactivo">Inactivo</option>
                      </select>
                    </div>
                  </th>
                  {canManageCatalogo && (
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categorias.map((c) => (
                  <tr
                    key={c.id}
                    className={`${c.is_active ? "hover:bg-gray-50" : "bg-gray-300 text-gray-700"} transition-colors`}
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{c.nombre}</div>
                      <div className="text-sm text-gray-500 line-clamp-1">{c.descripcion || "Sin descripcion"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {c.subCategorias && c.subCategorias.length > 0 ? (
                          c.subCategorias.map((sub) => (
                            <span
                              key={sub.id}
                              className="bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded-md border border-purple-100"
                            >
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
                            <span
                              key={p.id}
                              className="bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-md border border-indigo-100"
                            >
                              {p.nombre}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {c.is_active ? (
                        <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-semibold border border-emerald-200">
                          Activa
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-xs font-semibold border border-amber-200">
                          Inactiva
                        </span>
                      )}
                    </td>
                    {canManageCatalogo && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex gap-2 justify-end">
                          {c.is_active && (
                            <button
                              onClick={() => onEditar(c)}
                              className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                            >
                              Editar
                            </button>
                          )}
                          {c.is_active ? (
                            <button
                              onClick={() => {
                                if (c.id && window.confirm("Seguro que queres desactivar esta categoria?")) {
                                  eliminar(c.id);
                                }
                              }}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                            >
                              Desactivar
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                if (c.id) {
                                  cambiarEstado(c.id, true);
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
