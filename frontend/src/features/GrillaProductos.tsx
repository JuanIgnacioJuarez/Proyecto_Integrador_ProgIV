import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";

import { Producto } from "../entities/Producto";
import { fetchProductosPage } from "../entities/catalogoApi";
import { useProductos } from "../entities/useProducto";
import { useCategorias } from "../entities/useCategoria";
import { useIngredientes } from "../entities/useIngrediente";
import { useCarrito } from "../entities/useCarrito";
import { usePermissions } from "../shared/auth/roles";
import { api } from "../shared/api/http";
import { formatStockWithUnit } from "../shared/format/stock";
import { InfoHint } from "../shared/ui/InfoHint";
import { Pagination } from "../shared/ui/Pagination";
import { SearchBar } from "../shared/ui/SearchBar";

interface GrillaProductosProps {
  onEditar: (
    producto: Producto,
    context?: {
      returnPage: number;
      returnState: {
        searchTerm: string;
        categoriaFiltroId: number | "";
        ingredientesFiltro: number[];
        estadoFiltro: EstadoFiltro;
        sortBy: SortBy;
        sortDir: SortDir;
      };
    },
  ) => void;
  action?: ReactNode;
}

type SortBy = "nombre" | "precio" | "stock" | "";
type SortDir = "asc" | "desc";
type EstadoFiltro = "" | "activo" | "inactivo";

type CategoriaFiltroOpcion = {
  id: number;
  label: string;
  group: string;
  kind: "principal" | "sub";
};

type ConfirmModalState = {
  kind: "desactivar" | "reactivar" | "eliminar_definitivo";
  total: number;
};

const ITEMS_PER_PAGE = 15;

export function GrillaProductos({ onEditar, action }: GrillaProductosProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { eliminar, eliminarDefinitivo, cambiarEstado, actualizarStock, productos: listaProductos } = useProductos();
  const { categorias: listaCategorias } = useCategorias();
  const { ingredientes: listaIngredientes } = useIngredientes();
  const { canManageCatalogo, isClient, isStock, isAdmin } = usePermissions();
  const { agregarProducto } = useCarrito();
  const canFilterByEstado = !isClient;

  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaFiltroId, setCategoriaFiltroId] = useState<number | "">("");
  const [categoriaDropdownOpen, setCategoriaDropdownOpen] = useState(false);
  const [categoriaSearch, setCategoriaSearch] = useState("");
  const [ingredientesFiltro, setIngredientesFiltro] = useState<number[]>([]);
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>("");
  const [sortBy, setSortBy] = useState<SortBy>("");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [stockDrafts, setStockDrafts] = useState<Record<number, string>>({});
  const [savingStockId, setSavingStockId] = useState<number | null>(null);
  const [stockMessage, setStockMessage] = useState<string | null>(null);
  const [ingredientesPopup, setIngredientesPopup] = useState<{ nombre: string; items: string[] } | null>(null);
  const [highlightedProductId, setHighlightedProductId] = useState<number | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null);

  const categoriaDropdownRef = useRef<HTMLDivElement | null>(null);
  const apiOrigin = useMemo(() => (api.defaults.baseURL || "").replace(/\/api\/v1\/?$/, ""), []);

  const categoriasActivas = useMemo(
    () => listaCategorias.filter((cat) => cat.id && cat.is_active !== false),
    [listaCategorias],
  );

  const categoriasHijos = useMemo(() => {
    const map = new Map<number | null, typeof categoriasActivas>();
    for (const cat of categoriasActivas) {
      const key = cat.parent_id ?? null;
      const arr = map.get(key) || [];
      arr.push(cat);
      map.set(key, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    }
    return map;
  }, [categoriasActivas]);

  const categoriasPrincipales = useMemo(() => categoriasHijos.get(null) || [], [categoriasHijos]);

  const categoriasOpciones = useMemo<CategoriaFiltroOpcion[]>(() => {
    const opciones: CategoriaFiltroOpcion[] = [];
    const walk = (cat: (typeof categoriasActivas)[number], rootName: string, path: string) => {
      if (!cat.id) return;
      const hijos = categoriasHijos.get(Number(cat.id)) || [];
      for (const hijo of hijos) {
        if (!hijo.id) continue;
        const label = `${path} > ${hijo.nombre}`;
        opciones.push({
          id: Number(hijo.id),
          label,
          group: rootName,
          kind: "sub",
        });
        walk(hijo, rootName, label);
      }
    };

    for (const root of categoriasPrincipales) {
      if (!root.id) continue;
      opciones.push({
        id: Number(root.id),
        label: `Usar solo ${root.nombre}`,
        group: root.nombre,
        kind: "principal",
      });
      walk(root, root.nombre, root.nombre);
    }
    return opciones;
  }, [categoriasActivas, categoriasHijos, categoriasPrincipales]);

  const categoriaSeleccionada = useMemo(
    () => categoriasOpciones.find((opcion) => opcion.id === Number(categoriaFiltroId)) ?? null,
    [categoriasOpciones, categoriaFiltroId],
  );
  const categoriaSeleccionadaLabel = categoriaSeleccionada?.label || "Todas las categorias";

  const categoriasFiltradas = useMemo(() => {
    const term = categoriaSearch.trim().toLowerCase();
    if (!term) return categoriasOpciones;
    return categoriasOpciones.filter((opt) => opt.label.toLowerCase().includes(term));
  }, [categoriaSearch, categoriasOpciones]);

  const categoriasFiltradasAgrupadas = useMemo(() => {
    const grouped = new Map<string, CategoriaFiltroOpcion[]>();
    for (const opcion of categoriasFiltradas) {
      const existing = grouped.get(opcion.group);
      if (existing) {
        existing.push(opcion);
      } else {
        grouped.set(opcion.group, [opcion]);
      }
    }
    return Array.from(grouped.entries()).map(([group, opciones]) => ({ group, opciones }));
  }, [categoriasFiltradas]);

  const ingredientesDisponibles = useMemo(() => {
    return listaIngredientes
      .filter((ing) => ing.is_active !== false)
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [listaIngredientes]);

  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  const categoriaId = categoriaSeleccionada?.kind === "principal" ? categoriaSeleccionada.id : undefined;
  const subcategoriaId = categoriaSeleccionada?.kind === "sub" ? categoriaSeleccionada.id : undefined;
  const isActiveParam = canFilterByEstado
    ? estadoFiltro === "activo"
      ? true
      : estadoFiltro === "inactivo"
        ? false
        : undefined
    : undefined;

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      "catalogo",
      "productos",
      "grid",
      currentPage,
      searchTerm,
      categoriaFiltroId,
      ingredientesFiltro.join(","),
      estadoFiltro,
      sortBy,
      sortDir,
    ],
    queryFn: () =>
      fetchProductosPage({
        offset,
        limit: ITEMS_PER_PAGE,
        search: searchTerm,
        categoria_id: categoriaId,
        subcategoria_id: subcategoriaId,
        ingrediente_ids: ingredientesFiltro,
        is_active: isActiveParam,
        sort_by: sortBy || undefined,
        sort_dir: sortDir,
        include_inactive: canManageCatalogo,
      }),
  });

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
  const productos = data?.items ?? [];
  const productosById = useMemo(
    () => new Map(listaProductos.filter((p) => p.id).map((p) => [Number(p.id), p])),
    [listaProductos],
  );
  const showing = Math.min(offset + productos.length, total);

  useEffect(() => {
    if (data && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, data, totalPages]);

  useEffect(() => {
    const state = location.state as {
      restorePage?: number;
      highlightProductId?: number;
      restoreState?: {
        searchTerm?: string;
        categoriaFiltroId?: number | "";
        ingredientesFiltro?: number[];
        estadoFiltro?: EstadoFiltro;
        sortBy?: SortBy;
        sortDir?: SortDir;
      };
    } | null;
    if (!state) return;

    let consumed = false;

    if (state.restoreState) {
      const nextSearch = state.restoreState.searchTerm;
      const nextCategoriaFiltroId = state.restoreState.categoriaFiltroId;
      const nextIngredientesFiltro = state.restoreState.ingredientesFiltro;
      const nextEstadoFiltro = state.restoreState.estadoFiltro;
      const nextSortBy = state.restoreState.sortBy;
      const nextSortDir = state.restoreState.sortDir;

      if (typeof nextSearch === "string") {
        setSearchTerm(nextSearch);
        consumed = true;
      }
      if (
        nextCategoriaFiltroId === "" ||
        (typeof nextCategoriaFiltroId === "number" && Number.isFinite(nextCategoriaFiltroId))
      ) {
        setCategoriaFiltroId(nextCategoriaFiltroId);
        consumed = true;
      }
      if (Array.isArray(nextIngredientesFiltro)) {
        setIngredientesFiltro(nextIngredientesFiltro.filter((id) => Number.isFinite(id)));
        consumed = true;
      }
      if (
        canFilterByEstado &&
        (nextEstadoFiltro === "" || nextEstadoFiltro === "activo" || nextEstadoFiltro === "inactivo")
      ) {
        setEstadoFiltro(nextEstadoFiltro);
        consumed = true;
      }
      if (nextSortBy === "" || nextSortBy === "nombre" || nextSortBy === "precio" || nextSortBy === "stock") {
        const sanitizedSortBy = isClient && nextSortBy === "stock" ? "" : nextSortBy;
        setSortBy(sanitizedSortBy);
        consumed = true;
      }
      if (nextSortDir === "asc" || nextSortDir === "desc") {
        setSortDir(nextSortDir);
        consumed = true;
      }
    }

    if (typeof state.restorePage === "number" && Number.isFinite(state.restorePage) && state.restorePage > 0) {
      setCurrentPage(state.restorePage);
      consumed = true;
    }

    if (
      typeof state.highlightProductId === "number" &&
      Number.isFinite(state.highlightProductId) &&
      state.highlightProductId > 0
    ) {
      setHighlightedProductId(state.highlightProductId);
      consumed = true;
    }

    if (consumed) {
      navigate(location.pathname, { replace: true });
    }
  }, [canFilterByEstado, isClient, location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!highlightedProductId) return;
    const timeoutId = window.setTimeout(() => setHighlightedProductId(null), 2500);
    return () => window.clearTimeout(timeoutId);
  }, [highlightedProductId]);

  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set(Array.from(prev).filter((id) => productosById.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [productosById]);

  useEffect(() => {
    if (!categoriaDropdownOpen) return;
    const onClickOutside = (event: MouseEvent) => {
      if (!categoriaDropdownRef.current) return;
      if (!categoriaDropdownRef.current.contains(event.target as Node)) {
        setCategoriaDropdownOpen(false);
      }
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCategoriaDropdownOpen(false);
      }
    };
    window.addEventListener("mousedown", onClickOutside);
    window.addEventListener("keydown", onEscape);
    return () => {
      window.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("keydown", onEscape);
    };
  }, [categoriaDropdownOpen]);

  useEffect(() => {
    if (!categoriaDropdownOpen && categoriaSearch) {
      setCategoriaSearch("");
    }
  }, [categoriaDropdownOpen, categoriaSearch]);

  const handleStockChange = (productoId: number, value: string) => {
    setStockDrafts((prev) => ({ ...prev, [productoId]: value }));
    setStockMessage(null);
  };

  const handleGuardarStock = async (producto: Producto) => {
    if (!producto.id) return;
    const raw = stockDrafts[producto.id] ?? String(producto.stock_cantidad);
    const nuevoStock = Number.parseInt(raw, 10);
    if (Number.isNaN(nuevoStock) || nuevoStock < 0) {
      setStockMessage("El stock debe ser un numero entero mayor o igual a 0.");
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
      setStockMessage("No se pudo actualizar el stock.");
    } finally {
      setSavingStockId(null);
    }
  };

  const handleSortChange = (nextSortBy: SortBy, value: string) => {
    if (!value) {
      if (sortBy === nextSortBy) setSortBy("");
      setCurrentPage(1);
      return;
    }
    setSortBy(nextSortBy);
    setSortDir(value as SortDir);
    setCurrentPage(1);
  };

  const toggleIngredienteFiltro = (id: number) => {
    setIngredientesFiltro((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
    setCurrentPage(1);
  };

  const resolveImageUrl = (url: string) => {
    if (!url) return url;
    if (url.startsWith("/uploads/")) return `${apiOrigin}${url}`;
    return url;
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setCategoriaFiltroId("");
    setCategoriaDropdownOpen(false);
    setCategoriaSearch("");
    setIngredientesFiltro([]);
    setEstadoFiltro("");
    setSortBy("");
    setSortDir("asc");
    setCurrentPage(1);
  };

  const openProductDetail = (id?: number) => {
    if (!id) return;
    navigate(`/productos/${id}`, {
      state: {
        returnTo: "/productos",
        returnPage: currentPage,
        returnState: buildRestoreState(),
      },
    });
  };

  const openIngredientesPopup = (event: ReactMouseEvent, producto: Producto) => {
    event.stopPropagation();
    const restantes = (producto.ingredientes || []).slice(3).map((i) => i.nombre);
    if (!restantes.length) return;
    setIngredientesPopup({ nombre: producto.nombre, items: restantes });
  };

  const isHighlighted = (productoId?: number) =>
    Boolean(productoId && highlightedProductId && Number(productoId) === highlightedProductId);

  const buildRestoreState = () => ({
    searchTerm,
    categoriaFiltroId,
    ingredientesFiltro,
    estadoFiltro,
    sortBy,
    sortDir,
  });

  const selectedProductos = Array.from(selectedIds)
    .map((id) => productosById.get(id))
    .filter((item): item is Producto => Boolean(item));
  const selectedActivos = selectedProductos.filter((p) => p.is_active);
  const selectedInactivos = selectedProductos.filter((p) => !p.is_active);
  const selectedEditables = selectedProductos.filter((p) => p.is_active);

  const executeBulkAction = (kind: ConfirmModalState["kind"]) => {
    if (kind === "desactivar") {
      for (const p of selectedActivos) {
        if (p.id) eliminar(p.id);
      }
      setSelectedIds(new Set());
      return;
    }
    if (kind === "reactivar") {
      for (const p of selectedInactivos) {
        if (p.id) cambiarEstado(p.id, true);
      }
      setSelectedIds(new Set());
      return;
    }
    for (const p of selectedInactivos) {
      if (p.id) eliminarDefinitivo(p.id);
    }
    setSelectedIds(new Set());
  };

  return (
    <div className="mt-2">
      <div className="flex justify-between items-start mb-6 gap-3 flex-wrap">
        <h2 className="text-3xl font-black text-gray-900 dark:text-slate-100 tracking-tight">Catalogo de Productos</h2>
        {action && <div className="pt-2">{action}</div>}
      </div>

      <SearchBar
        value={searchTerm}
        onChange={(term) => {
          setSearchTerm(term);
          setCurrentPage(1);
        }}
        placeholder="Buscar producto por nombre..."
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-3">
        <div ref={categoriaDropdownRef} className="relative md:col-span-4">
          <button
            type="button"
            onClick={() => setCategoriaDropdownOpen((prev) => !prev)}
            className="w-full px-4 py-3 border rounded-xl shadow-sm bg-white dark:bg-slate-900/80 border-gray-300 dark:border-slate-700 text-left flex items-center justify-between text-gray-700 dark:text-slate-200"
            aria-haspopup="listbox"
            aria-expanded={categoriaDropdownOpen}
          >
            <span className={categoriaFiltroId ? "text-gray-900 dark:text-slate-100" : "text-gray-600 dark:text-slate-400"}>{categoriaSeleccionadaLabel}</span>
            <span className="text-gray-500 dark:text-slate-400">{categoriaDropdownOpen ? "^" : "v"}</span>
          </button>

          {categoriaDropdownOpen && (
            <div className="absolute top-full left-0 right-0 z-40 mt-1 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
              <div className="p-2 border-b border-gray-100 dark:border-slate-700">
                <div className="relative">
                  <input
                    type="text"
                    value={categoriaSearch}
                    onChange={(e) => setCategoriaSearch(e.target.value)}
                    placeholder="Buscar categoria..."
                    className="w-full border border-gray-300 dark:border-slate-700 rounded p-2 pr-10 text-sm bg-white dark:bg-slate-950/80 text-gray-800 dark:text-slate-100"
                  />
                  {categoriaSearch && (
                    <button
                      type="button"
                      onClick={() => setCategoriaSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-700"
                      aria-label="Limpiar busqueda de categorias"
                    >
                      x
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto py-1" role="listbox">
                <button
                  type="button"
                  onClick={() => {
                    setCategoriaFiltroId("");
                    setCategoriaDropdownOpen(false);
                    setCurrentPage(1);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                >
                  Todas las categorias
                </button>

                {categoriasFiltradasAgrupadas.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-gray-500 dark:text-slate-400">No hay categorias que coincidan.</p>
                ) : (
                  categoriasFiltradasAgrupadas.map(({ group, opciones }) => (
                    <div key={group} className="py-1">
                      <p className="px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-gray-900 dark:text-slate-100 bg-gray-300 dark:bg-slate-800 border-y border-gray-200 dark:border-slate-700">
                        {group}
                      </p>
                      {opciones.map((opcion) => {
                        const selected = Number(categoriaFiltroId) === opcion.id;
                        return (
                          <button
                            key={opcion.id}
                            type="button"
                            onClick={() => {
                              setCategoriaFiltroId(opcion.id);
                              setCategoriaDropdownOpen(false);
                              setCurrentPage(1);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 ${
                              selected ? "bg-blue-50 dark:bg-blue-900/35 text-blue-700 dark:text-blue-100 font-medium" : "text-gray-700 dark:text-slate-200"
                            }`}
                          >
                            {opcion.label}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <details className="relative md:col-span-4">
          <summary className="list-none cursor-pointer w-full px-4 py-3 border rounded-xl shadow-sm text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-900/80 border-gray-300 dark:border-slate-700 flex items-center justify-between">
            <span>
              {ingredientesFiltro.length > 0
                ? `${ingredientesFiltro.length} ingrediente(s) seleccionado(s)`
                : "Filtrar por ingredientes (multiple)"}
            </span>
            <span className="text-gray-400 dark:text-slate-400 text-sm">v</span>
          </summary>
          <div className="absolute z-10 mt-2 w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg p-3 max-h-64 overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase tracking-wide">Ingredientes</span>
              <button
                type="button"
                onClick={() => {
                  setIngredientesFiltro([]);
                  setCurrentPage(1);
                }}
                className="text-xs text-blue-600 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-200"
              >
                Limpiar
              </button>
            </div>
            {ingredientesDisponibles.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-slate-400">No hay ingredientes para el filtro actual.</p>
            ) : (
              <div className="space-y-2">
                {ingredientesDisponibles.map((ingrediente) => (
                  <label key={ingrediente.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={ingredientesFiltro.includes(Number(ingrediente.id))}
                      onChange={() => ingrediente.id && toggleIngredienteFiltro(Number(ingrediente.id))}
                      className="rounded text-blue-600"
                    />
                    {ingrediente.nombre}
                  </label>
                ))}
              </div>
            )}
          </div>
        </details>

        {!isClient && (
          <select
            value={estadoFiltro}
            onChange={(e) => {
              setEstadoFiltro(e.target.value as EstadoFiltro);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-900/80 border-gray-300 dark:border-slate-700 md:col-span-2"
          >
            <option value="">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
        )}

        <button
          type="button"
          onClick={clearAllFilters}
          className={`w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-100 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors font-medium ${
            isClient ? "md:col-span-4" : "md:col-span-2"
          }`}
        >
          Limpiar filtros
        </button>
      </div>

      {canManageCatalogo && (
        <div className="mb-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900/75 px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectionMode((prev) => {
                  const next = !prev;
                  if (!next) setSelectedIds(new Set());
                  return next;
                });
              }}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                selectionMode
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800"
              }`}
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M2.5 4A1.5 1.5 0 014 2.5h12A1.5 1.5 0 0117.5 4v12a1.5 1.5 0 01-1.5 1.5H4A1.5 1.5 0 012.5 16V4zM6 6.25a.75.75 0 00-.75.75v1.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V7A.75.75 0 007.5 6.25H6zm0 4.25a.75.75 0 00-.75.75v1.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75v-1.5a.75.75 0 00-.75-.75H6zm4-.25a.75.75 0 000 1.5h4a.75.75 0 000-1.5h-4zm0-4a.75.75 0 000 1.5h4a.75.75 0 000-1.5h-4z" clipRule="evenodd" />
              </svg>
              Seleccionar
            </button>
            <InfoHint
              text="Apreta Seleccionar, marca productos y despues toca Editar, Desactivar, Reactivar o Eliminar definitivo."
              ariaLabel="Info de seleccion"
              className="ml-0"
              buttonClassName="h-7 w-7 border-blue-200 text-blue-700 bg-blue-50"
              tooltipClassName="left-0 right-auto w-96 max-w-[calc(100vw-2rem)] text-sm text-gray-800 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center gap-2">
            {selectionMode && (
              <span className="text-xs text-gray-600 dark:text-slate-300">
                {selectedIds.size} seleccionado{selectedIds.size === 1 ? "" : "s"}
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                if (selectedIds.size !== 1 || selectedEditables.length !== 1) return;
                const producto = selectedEditables[0];
                onEditar(producto, {
                  returnPage: currentPage,
                  returnState: buildRestoreState(),
                });
              }}
              disabled={!selectionMode || selectedIds.size !== 1 || selectedEditables.length !== 1}
              className="inline-flex items-center gap-1 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded text-xs font-medium"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => {
                if (!selectedActivos.length) return;
                setConfirmModal({ kind: "desactivar", total: selectedActivos.length });
              }}
              disabled={!selectionMode || selectedActivos.length === 0 || selectedIds.size === 0}
              className="inline-flex items-center gap-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded text-xs font-medium"
            >
              Desactivar
            </button>
            <button
              type="button"
              onClick={() => {
                if (!selectedInactivos.length) return;
                setConfirmModal({ kind: "reactivar", total: selectedInactivos.length });
              }}
              disabled={!selectionMode || selectedInactivos.length === 0 || selectedIds.size === 0}
              className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded text-xs font-medium"
            >
              Reactivar
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  if (!selectedInactivos.length) return;
                  setConfirmModal({ kind: "eliminar_definitivo", total: selectedInactivos.length });
                }}
                disabled={!selectionMode || selectedInactivos.length === 0 || selectedIds.size === 0}
                className="inline-flex items-center gap-1 bg-black hover:bg-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded text-xs font-medium"
              >
                Eliminar definitivo
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Orden</span>
          <select
            value={sortBy === "nombre" ? sortDir : ""}
            onChange={(e) => handleSortChange("nombre", e.target.value)}
            className="text-xs text-gray-700 dark:text-slate-200 border border-gray-300 dark:border-slate-700 rounded-lg px-2 py-1 bg-white dark:bg-slate-900/80"
          >
            <option value="">Nombre</option>
            <option value="asc">A-Z</option>
            <option value="desc">Z-A</option>
          </select>
          <select
            value={sortBy === "precio" ? sortDir : ""}
            onChange={(e) => handleSortChange("precio", e.target.value)}
            className="text-xs text-gray-700 dark:text-slate-200 border border-gray-300 dark:border-slate-700 rounded-lg px-2 py-1 bg-white dark:bg-slate-900/80"
          >
            <option value="">Precio</option>
            <option value="asc">Menor</option>
            <option value="desc">Mayor</option>
          </select>
          {!isClient && (
            <select
              value={sortBy === "stock" ? sortDir : ""}
              onChange={(e) => handleSortChange("stock", e.target.value)}
              className="text-xs text-gray-700 dark:text-slate-200 border border-gray-300 dark:border-slate-700 rounded-lg px-2 py-1 bg-white dark:bg-slate-900/80"
            >
              <option value="">Stock</option>
              <option value="asc">Menor</option>
              <option value="desc">Mayor</option>
            </select>
          )}
        </div>
        {!isLoading && !isError && productos.length > 0 && (
          <div className="text-sm text-blue-700 dark:text-blue-100 bg-blue-50 dark:bg-blue-900/35 border border-blue-200 dark:border-blue-700/70 rounded-lg px-3 py-2">
            Mostrando {showing} de {total} resultados
          </div>
        )}
      </div>

      {stockMessage && (
        <div className="mb-4 text-sm text-blue-700 dark:text-blue-100 bg-blue-50 dark:bg-blue-900/35 border border-blue-200 dark:border-blue-700/70 rounded-lg p-3">{stockMessage}</div>
      )}

      {isLoading ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900/75 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
          <p className="text-gray-500 dark:text-slate-300 text-lg">Cargando productos...</p>
        </div>
      ) : isError ? (
        <div className="text-red-500 dark:text-red-100 bg-red-50 dark:bg-red-900/35 p-4 rounded-lg border border-red-200 dark:border-red-700/70">No se pudo cargar el listado de productos.</div>
      ) : productos.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900/75 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
          <p className="text-gray-500 dark:text-slate-300 text-lg">No se encontraron productos que coincidan con la busqueda.</p>
        </div>
      ) : (
        <>
          <div className="md:hidden space-y-3">
            {productos.map((p) => {
              const sinStock = Number(p.stock_cantidad ?? 0) <= 0;
              const canOpen = Boolean(p.id && !sinStock);
              return (
                <article
                  key={p.id}
                  onClick={() => canOpen && openProductDetail(p.id)}
                  className={`rounded-xl border p-4 transition-colors ${
                    isHighlighted(p.id)
                      ? "bg-amber-50 border-amber-300 ring-2 ring-amber-200"
                      : sinStock
                      ? "bg-zinc-300 border-zinc-400 text-zinc-700 cursor-not-allowed"
                      : p.is_active
                        ? "bg-white border-gray-200"
                        : "bg-gray-100 border-gray-300"
                  } ${canOpen ? "cursor-pointer hover:shadow-sm" : ""}`}
                >
                  {selectionMode && p.id && (
                    <div className="mb-2" onClick={(e) => e.stopPropagation()}>
                      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(Number(p.id))}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setSelectedIds((prev) => {
                              const next = new Set(prev);
                              if (checked) next.add(Number(p.id));
                              else next.delete(Number(p.id));
                              return next;
                            });
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          aria-label={`Seleccionar ${p.nombre}`}
                        />
                        Seleccionar
                      </label>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    {p.imagenes_url?.[0] ? (
                      <img
                        src={resolveImageUrl(p.imagenes_url[0])}
                        alt={`Imagen de ${p.nombre}`}
                        className="w-24 h-24 rounded-lg object-cover border border-gray-200 bg-gray-50 flex-shrink-0"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-lg border border-dashed border-gray-300 bg-gray-50 text-xs text-gray-400 flex items-center justify-center flex-shrink-0">
                        Sin img
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-lg font-bold text-gray-900 line-clamp-2">{p.nombre}</div>
                      <div className="text-sm text-gray-500 line-clamp-2" title={p.descripcion || "Sin descripcion"}>
                        {p.descripcion || "Sin descripcion"}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="text-sm font-semibold px-2.5 py-1 rounded-md border bg-blue-50 text-blue-700 border-blue-100">
                          ${p.precio_base}
                        </span>
                        {!isClient && (
                          <span className="text-sm font-medium px-2.5 py-1 rounded-md border bg-gray-50 text-gray-700 border-gray-200">
                            {formatStockWithUnit(p.stock_cantidad, "unidad")}
                          </span>
                        )}
                      </div>
                    </div>
                    {!isClient && (
                      <div>
                        {p.is_active ? (
                          <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-semibold border border-emerald-200">
                            Activo
                          </span>
                        ) : (
                          <span className="bg-red-100 text-red-800 px-2.5 py-1 rounded-full text-xs font-semibold border border-red-200">
                            Inactivo
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {isStock && p.id && (
                    <div className="mt-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
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
                        {savingStockId === p.id ? "Guardando..." : "Guardar"}
                      </button>
                    </div>
                  )}

                  <div className="mt-3 space-y-2">
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
                    <div className="flex flex-wrap gap-1">
                      {p.ingredientes && p.ingredientes.length > 0 ? (
                        <>
                          {p.ingredientes.slice(0, 3).map((i) => (
                            <span
                              key={i.id}
                              title={
                                i.cantidad
                                  ? `Cantidad: ${formatStockWithUnit(i.cantidad, i.unidad_medida)}`
                                  : "Sin cantidad cargada"
                              }
                              className={`text-xs px-2 py-1 rounded-md border cursor-help ${
                                i.es_alergeno ? "bg-red-50 text-red-700 border-red-100" : "bg-green-50 text-green-700 border-green-100"
                              }`}
                            >
                              {i.nombre}
                              {i.es_alergeno ? " (Alergeno)" : ""}
                            </span>
                          ))}
                          {p.ingredientes.length > 3 && (
                            <button
                              type="button"
                              onClick={(event) => openIngredientesPopup(event, p)}
                              className="text-xs px-2 py-1 rounded-md border bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                            >
                              +{p.ingredientes.length - 3}
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </div>
                  </div>

                  {isClient && (
                    <div className="mt-3 flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => agregarProducto(p, 1)}
                        disabled={!p.id || p.stock_cantidad <= 0 || !p.is_active}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      >
                        {p.is_active ? (p.stock_cantidad > 0 ? "Agregar" : "Sin stock") : "Inactivo"}
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          <div className="hidden md:block overflow-x-auto bg-white dark:bg-slate-900/75 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 mt-1">
            <table className="min-w-full table-fixed divide-y divide-gray-200/70">
              <colgroup>
                <col className={isClient ? "w-[46%]" : "w-[45%]"} />
                <col className={isClient ? "w-[18%]" : "w-[16%]"} />
                <col className={isClient ? "w-[28%]" : "w-[29%]"} />
                {!isClient && <col className="w-[10%]" />}
                {isClient && <col className="w-[8%]" />}
              </colgroup>
              <thead className="bg-gray-50/70 border-b border-gray-200/70">
                <tr>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-100/80">
                    Producto
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-100/80">
                    Categorias
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-100/80">
                    Ingredientes
                  </th>
                  {!isClient && (
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-100/80">
                      Estado
                    </th>
                  )}
                  {isClient && (
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Carrito
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200/70">
                {productos.map((p) => {
                  const sinStock = Number(p.stock_cantidad ?? 0) <= 0;
                  const canOpen = Boolean(p.id && !sinStock);
                  return (
                    <tr
                      key={p.id}
                      onClick={() => canOpen && openProductDetail(p.id)}
                      className={`${
                        isHighlighted(p.id)
                          ? "bg-amber-100 animate-pulse"
                          : sinStock
                            ? "bg-zinc-300 text-zinc-700 cursor-not-allowed"
                            : p.is_active
                              ? "hover:bg-gray-50 cursor-pointer"
                              : "bg-gray-100 text-gray-700"
                      } transition-colors`}
                    >
                      <td className="px-6 py-4 border-r border-gray-100/80">
                        <div className="flex items-start gap-4 w-full">
                          {selectionMode && p.id && (
                            <input
                              type="checkbox"
                              checked={selectedIds.has(Number(p.id))}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setSelectedIds((prev) => {
                                  const next = new Set(prev);
                                  if (checked) next.add(Number(p.id));
                                  else next.delete(Number(p.id));
                                  return next;
                                });
                              }}
                              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              aria-label={`Seleccionar ${p.nombre}`}
                            />
                          )}
                          {p.imagenes_url?.[0] ? (
                            <img
                              src={resolveImageUrl(p.imagenes_url[0])}
                              alt={`Imagen de ${p.nombre}`}
                              className="w-28 h-28 rounded-lg object-cover border border-gray-200 bg-gray-50 flex-shrink-0"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-28 h-28 rounded-lg border border-dashed border-gray-300 bg-gray-50 text-xs text-gray-400 flex items-center justify-center flex-shrink-0">
                              Sin img
                            </div>
                          )}
                          <div className="min-w-0 flex-1 flex flex-col justify-between gap-2 min-h-[7rem]">
                            <div className="space-y-1">
                              <div className="text-xl font-bold text-gray-900 line-clamp-2">{p.nombre}</div>
                              <div className="text-sm text-gray-500 line-clamp-3" title={p.descripcion || "Sin descripcion"}>
                                {p.descripcion || "Sin descripcion"}
                              </div>
                            </div>
                            <div className="mt-1 flex items-center gap-2 flex-wrap">
                              <span className="text-base font-semibold px-2.5 py-1 rounded-md border bg-blue-50 text-blue-700 border-blue-100 shrink-0">
                                ${p.precio_base}
                              </span>
                              {isStock && p.id ? (
                                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="number"
                                    min={0}
                                    value={stockDrafts[p.id] ?? String(p.stock_cantidad)}
                                    onChange={(e) => handleStockChange(p.id!, e.target.value)}
                                    className="w-20 px-2 py-1 border rounded-md text-xs"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => void handleGuardarStock(p)}
                                    disabled={savingStockId === p.id}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-2 py-1 rounded-md text-xs font-medium transition-colors"
                                  >
                                    {savingStockId === p.id ? "..." : "OK"}
                                  </button>
                                </div>
                              ) : !isClient ? (
                                <span className="text-base font-medium px-2.5 py-1 rounded-md border bg-gray-50 text-gray-700 border-gray-200 shrink-0">
                                  {formatStockWithUnit(p.stock_cantidad, "unidad")}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 border-r border-gray-100/80">
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
                      <td className={`px-6 py-4 ${!isClient ? "border-r border-gray-100/80" : ""}`}>
                        <div className="flex flex-wrap gap-1">
                          {p.ingredientes && p.ingredientes.length > 0 ? (
                            <>
                              {p.ingredientes.slice(0, 3).map((i) => (
                                <span
                                  key={i.id}
                                  title={
                                    i.cantidad ? `Cantidad: ${formatStockWithUnit(i.cantidad, i.unidad_medida)}` : "Sin cantidad cargada"
                                  }
                                  className={`text-xs px-2 py-1 rounded-md border cursor-help ${
                                    i.es_alergeno ? "bg-red-50 text-red-700 border-red-100" : "bg-green-50 text-green-700 border-green-100"
                                  }`}
                                >
                                  {i.nombre}
                                  {i.es_alergeno ? " (Alergeno)" : ""}
                                </span>
                              ))}
                              {p.ingredientes.length > 3 && (
                                <button
                                  type="button"
                                  onClick={(event) => openIngredientesPopup(event, p)}
                                  className="text-xs px-2 py-1 rounded-md border bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                                >
                                  +{p.ingredientes.length - 3}
                                </button>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </div>
                      </td>
                      {!isClient && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm border-r border-gray-100/80">
                          {p.is_active ? (
                            <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-semibold border border-emerald-200">
                              Activo
                            </span>
                          ) : (
                            <span className="bg-red-100 text-red-800 px-2.5 py-1 rounded-full text-xs font-semibold border border-red-200">
                              Inactivo
                            </span>
                          )}
                        </td>
                              )}
                      {isClient && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              agregarProducto(p, 1);
                            }}
                            disabled={!p.id || p.stock_cantidad <= 0 || !p.is_active}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
                            aria-label={`Agregar ${p.nombre} al carrito`}
                            title="Agregar al carrito"
                          >
                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                              <path d="M3 4a1 1 0 0 1 1-1h1.3a1 1 0 0 1 .97.757L6.5 5H16a1 1 0 0 1 .97 1.243l-1.2 5A1 1 0 0 1 14.8 12H7.2a1 1 0 0 1-.97-.757L4.54 5H4a1 1 0 0 1-1-1Zm5 11a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
                            </svg>
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      )}

      {ingredientesPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setIngredientesPopup(null)}
            className="absolute inset-0 bg-black/40"
            aria-label="Cerrar modal de ingredientes"
          />
          <div className="relative w-full max-w-md rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Ingredientes restantes de {ingredientesPopup.nombre}</h3>
              <button
                type="button"
                onClick={() => setIngredientesPopup(null)}
                className="h-8 w-8 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-700"
                aria-label="Cerrar"
              >
                x
              </button>
            </div>
            <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {ingredientesPopup.items.map((item) => (
                <li key={item} className="text-sm text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 rounded-md px-3 py-2 bg-gray-50 dark:bg-slate-950/60">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setConfirmModal(null)}
            className="absolute inset-0 bg-black/40"
            aria-label="Cerrar confirmacion"
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-2">
              {confirmModal.kind === "desactivar" && "Confirmar desactivacion"}
              {confirmModal.kind === "reactivar" && "Confirmar reactivacion"}
              {confirmModal.kind === "eliminar_definitivo" && "Confirmar eliminacion definitiva"}
            </h3>
            <p className="text-sm text-gray-600 dark:text-slate-300 mb-5">
              {confirmModal.kind === "desactivar" &&
                `Vas a desactivar ${confirmModal.total} producto(s) seleccionado(s).`}
              {confirmModal.kind === "reactivar" &&
                `Vas a reactivar ${confirmModal.total} producto(s) seleccionado(s).`}
              {confirmModal.kind === "eliminar_definitivo" &&
                `Vas a eliminar definitivamente ${confirmModal.total} producto(s) inactivo(s). Esta accion no se puede deshacer.`}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  executeBulkAction(confirmModal.kind);
                  setConfirmModal(null);
                }}
                className={`px-4 py-2 rounded-lg text-white ${
                  confirmModal.kind === "eliminar_definitivo"
                    ? "bg-black hover:bg-gray-900"
                    : confirmModal.kind === "desactivar"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
