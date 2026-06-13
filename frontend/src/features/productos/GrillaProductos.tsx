import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";

import { Producto } from "../../models/Producto";
import { fetchProductosPage } from "../../api/catalogoApi";
import { useProductos } from "../../hooks/useProducto";
import { useCategorias } from "../../hooks/useCategoria";
import { useIngredientes } from "../../hooks/useIngrediente";
import { useCarrito } from "../../hooks/useCarrito";
import { usePermissions } from "../../hooks/useRoles";
import { api } from "../../api/http";
import { InfoHint } from "../../components/InfoHint";
import { SearchBar } from "../../components/SearchBar";
import { ProductoTable } from "./ProductoTable";

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
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<number>>(new Set());
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
  const [cartToast, setCartToast] = useState<{ id: number; message: string } | null>(null);

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
    for (const arr of map.values()) arr.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    return map;
  }, [categoriasActivas]);

  const categoriasPrincipales = useMemo(() => categoriasHijos.get(null) || [], [categoriasHijos]);

  const categoriaSeleccionadaLabel = useMemo(() => {
    if (!categoriaFiltroId) return "Todas las categorias";
    return categoriasActivas.find((c) => Number(c.id) === Number(categoriaFiltroId))?.nombre ?? "Todas las categorias";
  }, [categoriasActivas, categoriaFiltroId]);

  const categoriaPathMap = useMemo(() => {
    const map = new Map<number, string>();
    const getPath = (cat: (typeof categoriasActivas)[number]): string => {
      if (!cat.id) return cat.nombre;
      const cached = map.get(Number(cat.id));
      if (cached) return cached;
      if (!cat.parent_id) { map.set(Number(cat.id), cat.nombre); return cat.nombre; }
      const parent = categoriasActivas.find((c) => c.id === cat.parent_id);
      const parentPath = parent ? getPath(parent) : "";
      const path = parentPath ? `${parentPath} > ${cat.nombre}` : cat.nombre;
      map.set(Number(cat.id), path);
      return path;
    };
    for (const cat of categoriasActivas) getPath(cat);
    return map;
  }, [categoriasActivas]);

  const categoriasBusqueda = useMemo(() => {
    if (!categoriaSearch.trim()) return [];
    const term = categoriaSearch.trim().toLowerCase();
    return categoriasActivas
      .filter((cat) => cat.nombre.toLowerCase().includes(term))
      .map((cat) => ({ id: Number(cat.id), label: categoriaPathMap.get(Number(cat.id!)) ?? cat.nombre }));
  }, [categoriaSearch, categoriasActivas, categoriaPathMap]);

  const ingredientesDisponibles = useMemo(() => {
    return listaIngredientes
      .filter((ing) => ing.is_active !== false)
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [listaIngredientes]);

  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  const categoriaId = categoriaFiltroId !== "" ? Number(categoriaFiltroId) : undefined;
  const isActiveParam = canFilterByEstado
    ? estadoFiltro === "activo" ? true : estadoFiltro === "inactivo" ? false : undefined
    : undefined;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["catalogo", "productos", "grid", currentPage, searchTerm, categoriaFiltroId, ingredientesFiltro.join(","), estadoFiltro, sortBy, sortDir],
    queryFn: () =>
      fetchProductosPage({
        offset, limit: ITEMS_PER_PAGE, search: searchTerm,
        categoria_id: categoriaId, subcategoria_id: undefined,
        ingrediente_ids: ingredientesFiltro, is_active: isActiveParam,
        sort_by: sortBy || undefined, sort_dir: sortDir,
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
    if (data && currentPage > totalPages) setCurrentPage(totalPages);
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
      const { searchTerm: ns, categoriaFiltroId: nc, ingredientesFiltro: ni, estadoFiltro: ne, sortBy: nsb, sortDir: nsd } = state.restoreState;
      if (typeof ns === "string") { setSearchTerm(ns); consumed = true; }
      if (nc === "" || (typeof nc === "number" && Number.isFinite(nc))) { setCategoriaFiltroId(nc); consumed = true; }
      if (Array.isArray(ni)) { setIngredientesFiltro(ni.filter((id) => Number.isFinite(id))); consumed = true; }
      if (canFilterByEstado && (ne === "" || ne === "activo" || ne === "inactivo")) { setEstadoFiltro(ne); consumed = true; }
      if (nsb === "" || nsb === "nombre" || nsb === "precio" || nsb === "stock") {
        setSortBy(isClient && nsb === "stock" ? "" : (nsb ?? ""));
        consumed = true;
      }
      if (nsd === "asc" || nsd === "desc") { setSortDir(nsd); consumed = true; }
    }
    if (typeof state.restorePage === "number" && Number.isFinite(state.restorePage) && state.restorePage > 0) {
      setCurrentPage(state.restorePage); consumed = true;
    }
    if (typeof state.highlightProductId === "number" && Number.isFinite(state.highlightProductId) && state.highlightProductId > 0) {
      setHighlightedProductId(state.highlightProductId); consumed = true;
    }
    if (consumed) navigate(location.pathname, { replace: true });
  }, [canFilterByEstado, isClient, location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!highlightedProductId) return;
    const id = window.setTimeout(() => setHighlightedProductId(null), 2500);
    return () => window.clearTimeout(id);
  }, [highlightedProductId]);

  useEffect(() => {
    if (!cartToast) return;
    const id = window.setTimeout(() => setCartToast(null), 3000);
    return () => window.clearTimeout(id);
  }, [cartToast]);

  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set(Array.from(prev).filter((id) => productosById.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [productosById]);

  useEffect(() => {
    if (!categoriaDropdownOpen) return;
    const onClickOutside = (event: MouseEvent) => {
      if (!categoriaDropdownRef.current?.contains(event.target as Node)) setCategoriaDropdownOpen(false);
    };
    const onEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setCategoriaDropdownOpen(false); };
    window.addEventListener("mousedown", onClickOutside);
    window.addEventListener("keydown", onEscape);
    return () => { window.removeEventListener("mousedown", onClickOutside); window.removeEventListener("keydown", onEscape); };
  }, [categoriaDropdownOpen]);

  useEffect(() => {
    if (!categoriaDropdownOpen && categoriaSearch) setCategoriaSearch("");
  }, [categoriaDropdownOpen, categoriaSearch]);

  const handleStockChange = (productoId: number, value: string) => {
    setStockDrafts((prev) => ({ ...prev, [productoId]: value }));
    setStockMessage(null);
  };

  const handleGuardarStock = async (producto: Producto) => {
    if (!producto.id) return;
    const raw = stockDrafts[producto.id] ?? String(producto.stock_cantidad);
    const nuevoStock = Number.parseInt(raw, 10);
    if (Number.isNaN(nuevoStock) || nuevoStock < 0) { setStockMessage("El stock debe ser un numero entero mayor o igual a 0."); return; }
    try {
      setSavingStockId(producto.id);
      await actualizarStock(producto.id, nuevoStock);
      setStockMessage(`Stock actualizado para "${producto.nombre}".`);
      setStockDrafts((prev) => { const next = { ...prev }; delete next[producto.id!]; return next; });
    } catch { setStockMessage("No se pudo actualizar el stock."); }
    finally { setSavingStockId(null); }
  };

  const handleSortChange = (nextSortBy: SortBy, value: string) => {
    if (!value) { if (sortBy === nextSortBy) setSortBy(""); setCurrentPage(1); return; }
    setSortBy(nextSortBy); setSortDir(value as SortDir); setCurrentPage(1);
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
    setSearchTerm(""); setCategoriaFiltroId(""); setCategoriaDropdownOpen(false); setCategoriaSearch("");
    setIngredientesFiltro([]); setEstadoFiltro(""); setSortBy(""); setSortDir("asc"); setCurrentPage(1);
  };

  const openProductDetail = (id?: number) => {
    if (!id) return;
    navigate(`/productos/${id}`, { state: { returnTo: "/productos", returnPage: currentPage, returnState: buildRestoreState() } });
  };

  const openIngredientesPopup = (event: ReactMouseEvent, producto: Producto) => {
    event.stopPropagation();
    const restantes = (producto.ingredientes || []).slice(3).map((i) => i.nombre);
    if (!restantes.length) return;
    setIngredientesPopup({ nombre: producto.nombre, items: restantes });
  };

  const isHighlighted = (productoId?: number) =>
    Boolean(productoId && highlightedProductId && Number(productoId) === highlightedProductId);

  const buildRestoreState = () => ({ searchTerm, categoriaFiltroId, ingredientesFiltro, estadoFiltro, sortBy, sortDir });

  const handleAgregarAlCarrito = (producto: Producto, qty: number) => {
    agregarProducto(producto, qty);
    setCartToast({ id: Date.now(), message: `1 ${producto.nombre} agregado al carrito!` });
  };

  const selectedProductos = Array.from(selectedIds).map((id) => productosById.get(id)).filter((item): item is Producto => Boolean(item));
  const selectedActivos = selectedProductos.filter((p) => p.is_active);
  const selectedInactivos = selectedProductos.filter((p) => !p.is_active);
  const selectedEditables = selectedProductos.filter((p) => p.is_active);

  const executeBulkAction = (kind: ConfirmModalState["kind"]) => {
    if (kind === "desactivar") { for (const p of selectedActivos) { if (p.id) eliminar(p.id); } }
    else if (kind === "reactivar") { for (const p of selectedInactivos) { if (p.id) cambiarEstado(p.id, true); } }
    else { for (const p of selectedInactivos) { if (p.id) eliminarDefinitivo(p.id); } }
    setSelectedIds(new Set());
  };

  return (
    <div className="mt-2">
      <div className="flex justify-between items-start mb-6 gap-3 flex-wrap">
        <h2 className="text-3xl font-black text-gray-900 dark:text-slate-100 tracking-tight">Catalogo de Productos</h2>
        {action && <div className="pt-2">{action}</div>}
      </div>

      <SearchBar value={searchTerm} onChange={(term) => { setSearchTerm(term); setCurrentPage(1); }} placeholder="Buscar producto por nombre..." />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-3">
        <div ref={categoriaDropdownRef} className="relative md:col-span-4">
          <button type="button" onClick={() => setCategoriaDropdownOpen((prev) => !prev)}
            className="w-full px-4 py-3 border rounded-xl shadow-sm bg-white dark:bg-slate-900/80 border-gray-300 dark:border-slate-700 text-left flex items-center justify-between text-gray-700 dark:text-slate-200"
            aria-haspopup="listbox" aria-expanded={categoriaDropdownOpen}>
            <span className={categoriaFiltroId ? "text-gray-900 dark:text-slate-100" : "text-gray-600 dark:text-slate-400"}>{categoriaSeleccionadaLabel}</span>
            <span className="text-gray-500 dark:text-slate-400">{categoriaDropdownOpen ? "^" : "v"}</span>
          </button>

          {categoriaDropdownOpen && (
            <div className="absolute top-full left-0 right-0 z-40 mt-1 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
              <div className="p-2 border-b border-gray-100 dark:border-slate-700">
                <div className="relative">
                  <input type="text" value={categoriaSearch} onChange={(e) => setCategoriaSearch(e.target.value)}
                    placeholder="Buscar categoria..." className="w-full border border-gray-300 dark:border-slate-700 rounded p-2 pr-10 text-sm bg-white dark:bg-slate-950/80 text-gray-800 dark:text-slate-100" />
                  {categoriaSearch && (
                    <button type="button" onClick={() => setCategoriaSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-700"
                      aria-label="Limpiar busqueda de categorias">x</button>
                  )}
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto py-1" role="listbox">
                <button type="button" onClick={() => { setCategoriaFiltroId(""); setCategoriaDropdownOpen(false); setCurrentPage(1); }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                  Todas las categorias
                </button>
                {categoriaSearch.trim() ? (
                  categoriasBusqueda.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-gray-500 dark:text-slate-400">No hay categorias que coincidan.</p>
                  ) : (
                    categoriasBusqueda.map(({ id, label }) => (
                      <button key={id} type="button"
                        onClick={() => { setCategoriaFiltroId(id); setCategoriaDropdownOpen(false); setCurrentPage(1); }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 ${Number(categoriaFiltroId) === id ? "bg-blue-50 dark:bg-blue-900/35 text-blue-700 dark:text-blue-100 font-medium" : "text-gray-700 dark:text-slate-200"}`}>
                        {label}
                      </button>
                    ))
                  )
                ) : categoriasPrincipales.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-gray-500 dark:text-slate-400">No hay categorias.</p>
                ) : (
                  (() => {
                    const renderNodo = (cats: typeof categoriasPrincipales, depth: number): ReactNode =>
                      cats.map((cat) => {
                        if (!cat.id) return null;
                        const hijos = categoriasHijos.get(Number(cat.id)) || [];
                        const tieneHijos = hijos.length > 0;
                        const isExpanded = expandedCategoryIds.has(Number(cat.id));
                        const isSelected = Number(categoriaFiltroId) === Number(cat.id);
                        return (
                          <div key={cat.id}>
                            <div style={{ paddingLeft: `${12 + depth * 16}px` }}
                              className={`flex items-center gap-1 pr-3 py-2 text-sm ${isSelected ? "bg-blue-50 dark:bg-blue-900/35 text-blue-700 dark:text-blue-100 font-medium" : "text-gray-700 dark:text-slate-200"}`}>
                              {tieneHijos ? (
                                <button type="button"
                                  onClick={(e) => { e.stopPropagation(); setExpandedCategoryIds((prev) => { const next = new Set(prev); if (next.has(Number(cat.id))) next.delete(Number(cat.id)); else next.add(Number(cat.id)); return next; }); }}
                                  className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 flex-shrink-0"
                                  aria-label={isExpanded ? "Contraer" : "Expandir"}>
                                  {isExpanded ? "▾" : "▸"}
                                </button>
                              ) : <span className="w-5 flex-shrink-0" />}
                              <button type="button" className="flex-1 text-left hover:underline"
                                onClick={() => { setCategoriaFiltroId(Number(cat.id)); setCategoriaDropdownOpen(false); setCurrentPage(1); }}>
                                {cat.nombre}
                              </button>
                            </div>
                            {tieneHijos && isExpanded && renderNodo(hijos, depth + 1)}
                          </div>
                        );
                      });
                    return renderNodo(categoriasPrincipales, 0);
                  })()
                )}
              </div>
            </div>
          )}
        </div>

        <details className="relative md:col-span-4">
          <summary className="list-none cursor-pointer w-full px-4 py-3 border rounded-xl shadow-sm text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-900/80 border-gray-300 dark:border-slate-700 flex items-center justify-between">
            <span>{ingredientesFiltro.length > 0 ? `${ingredientesFiltro.length} ingrediente(s) seleccionado(s)` : "Filtrar por ingredientes (multiple)"}</span>
            <span className="text-gray-400 dark:text-slate-400 text-sm">v</span>
          </summary>
          <div className="absolute z-10 mt-2 w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg p-3 max-h-64 overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase tracking-wide">Ingredientes</span>
              <button type="button" onClick={() => { setIngredientesFiltro([]); setCurrentPage(1); }} className="text-xs text-blue-600 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-200">Limpiar</button>
            </div>
            {ingredientesDisponibles.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-slate-400">No hay ingredientes para el filtro actual.</p>
            ) : (
              <div className="space-y-2">
                {ingredientesDisponibles.map((ingrediente) => (
                  <label key={ingrediente.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-200">
                    <input type="checkbox" checked={ingredientesFiltro.includes(Number(ingrediente.id))}
                      onChange={() => ingrediente.id && toggleIngredienteFiltro(Number(ingrediente.id))} className="rounded text-blue-600" />
                    {ingrediente.nombre}
                  </label>
                ))}
              </div>
            )}
          </div>
        </details>

        {!isClient && (
          <select value={estadoFiltro} onChange={(e) => { setEstadoFiltro(e.target.value as EstadoFiltro); setCurrentPage(1); }}
            className="w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-900/80 border-gray-300 dark:border-slate-700 md:col-span-2">
            <option value="">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
        )}

        <button type="button" onClick={clearAllFilters}
          className={`w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-100 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors font-medium ${isClient ? "md:col-span-4" : "md:col-span-2"}`}>
          Limpiar filtros
        </button>
      </div>

      {canManageCatalogo && (
        <div className="mb-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900/75 px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2">
            <button type="button"
              onClick={() => { setSelectionMode((prev) => { const next = !prev; if (!next) setSelectedIds(new Set()); return next; }); }}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${selectionMode ? "bg-blue-600 border-blue-600 text-white" : "bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800"}`}>
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M2.5 4A1.5 1.5 0 014 2.5h12A1.5 1.5 0 0117.5 4v12a1.5 1.5 0 01-1.5 1.5H4A1.5 1.5 0 012.5 16V4zM6 6.25a.75.75 0 00-.75.75v1.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V7A.75.75 0 007.5 6.25H6zm0 4.25a.75.75 0 00-.75.75v1.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75v-1.5a.75.75 0 00-.75-.75H6zm4-.25a.75.75 0 000 1.5h4a.75.75 0 000-1.5h-4zm0-4a.75.75 0 000 1.5h4a.75.75 0 000-1.5h-4z" clipRule="evenodd" />
              </svg>
              Seleccionar
            </button>
            <InfoHint text="Apreta Seleccionar, marca productos y despues toca Editar, Desactivar, Reactivar o Eliminar definitivo."
              ariaLabel="Info de seleccion" className="ml-0"
              buttonClassName="h-7 w-7 border-blue-200 text-blue-700 bg-blue-50"
              tooltipClassName="left-0 right-auto w-96 max-w-[calc(100vw-2rem)] text-sm text-gray-800 dark:text-slate-100" />
          </div>
          <div className="flex items-center gap-2">
            {selectionMode && <span className="text-xs text-gray-600 dark:text-slate-300">{selectedIds.size} seleccionado{selectedIds.size === 1 ? "" : "s"}</span>}
            <button type="button"
              onClick={() => { if (selectedIds.size !== 1 || selectedEditables.length !== 1) return; onEditar(selectedEditables[0], { returnPage: currentPage, returnState: buildRestoreState() }); }}
              disabled={!selectionMode || selectedIds.size !== 1 || selectedEditables.length !== 1}
              className="inline-flex items-center gap-1 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded text-xs font-medium">
              Editar
            </button>
            <button type="button"
              onClick={() => { if (!selectedActivos.length) return; setConfirmModal({ kind: "desactivar", total: selectedActivos.length }); }}
              disabled={!selectionMode || selectedActivos.length === 0 || selectedIds.size === 0}
              className="inline-flex items-center gap-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded text-xs font-medium">
              Desactivar
            </button>
            <button type="button"
              onClick={() => { if (!selectedInactivos.length) return; setConfirmModal({ kind: "reactivar", total: selectedInactivos.length }); }}
              disabled={!selectionMode || selectedInactivos.length === 0 || selectedIds.size === 0}
              className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded text-xs font-medium">
              Reactivar
            </button>
            {isAdmin && (
              <button type="button"
                onClick={() => { if (!selectedInactivos.length) return; setConfirmModal({ kind: "eliminar_definitivo", total: selectedInactivos.length }); }}
                disabled={!selectionMode || selectedInactivos.length === 0 || selectedIds.size === 0}
                className="inline-flex items-center gap-1 bg-black hover:bg-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded text-xs font-medium">
                Eliminar definitivo
              </button>
            )}
          </div>
        </div>
      )}

      <ProductoTable
        productos={productos}
        isLoading={isLoading}
        isError={isError}
        isClient={isClient}
        isStock={isStock}
        selectionMode={selectionMode}
        selectedIds={selectedIds}
        onSelectId={(id, checked) => setSelectedIds((prev) => { const next = new Set(prev); if (checked) next.add(id); else next.delete(id); return next; })}
        stockDrafts={stockDrafts}
        savingStockId={savingStockId}
        onStockChange={handleStockChange}
        onGuardarStock={(p) => { void handleGuardarStock(p); }}
        onAgregarAlCarrito={handleAgregarAlCarrito}
        onOpenDetail={openProductDetail}
        onOpenIngredientesPopup={openIngredientesPopup}
        isHighlighted={isHighlighted}
        resolveImageUrl={resolveImageUrl}
        sortBy={sortBy}
        sortDir={sortDir}
        onSortChange={handleSortChange}
        showing={showing}
        total={total}
        stockMessage={stockMessage}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {ingredientesPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" onClick={() => setIngredientesPopup(null)}
            className="absolute inset-0 bg-black/40" aria-label="Cerrar modal de ingredientes" />
          <div className="relative w-full max-w-md rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Ingredientes restantes de {ingredientesPopup.nombre}</h3>
              <button type="button" onClick={() => setIngredientesPopup(null)}
                className="h-8 w-8 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-700"
                aria-label="Cerrar">x</button>
            </div>
            <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {ingredientesPopup.items.map((item) => (
                <li key={item} className="text-sm text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 rounded-md px-3 py-2 bg-gray-50 dark:bg-slate-950/60">{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {cartToast && (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-lg">
          {cartToast.message}
        </div>
      )}

      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" onClick={() => setConfirmModal(null)} className="absolute inset-0 bg-black/40" aria-label="Cerrar confirmacion" />
          <div className="relative w-full max-w-lg rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-2">
              {confirmModal.kind === "desactivar" && "Confirmar desactivacion"}
              {confirmModal.kind === "reactivar" && "Confirmar reactivacion"}
              {confirmModal.kind === "eliminar_definitivo" && "Confirmar eliminacion definitiva"}
            </h3>
            <p className="text-sm text-gray-600 dark:text-slate-300 mb-5">
              {confirmModal.kind === "desactivar" && `Vas a desactivar ${confirmModal.total} producto(s) seleccionado(s).`}
              {confirmModal.kind === "reactivar" && `Vas a reactivar ${confirmModal.total} producto(s) seleccionado(s).`}
              {confirmModal.kind === "eliminar_definitivo" && `Vas a eliminar definitivamente ${confirmModal.total} producto(s) inactivo(s). Esta accion no se puede deshacer.`}
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-700">Cancelar</button>
              <button type="button"
                onClick={() => { executeBulkAction(confirmModal.kind); setConfirmModal(null); }}
                className={`px-4 py-2 rounded-lg text-white ${confirmModal.kind === "eliminar_definitivo" ? "bg-black hover:bg-gray-900" : confirmModal.kind === "desactivar" ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"}`}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
