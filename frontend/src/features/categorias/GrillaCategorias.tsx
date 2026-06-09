import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Categoria } from "../../models/Categoria";
import { useCategorias } from "../../hooks/useCategoria";
import { usePermissions } from "../../hooks/useRoles";
import { InfoHint } from "../../components/InfoHint";
import { Pagination } from "../../components/Pagination";
import { SearchBar } from "../../components/SearchBar";
import { CategoriaProductoModal } from "./CategoriaProductoModal";

interface GrillaCategoriasProps {
  onEditar: (
    categoria: Categoria,
    context?: {
      returnPage: number;
      returnState: {
        searchTerm: string;
        categoriaFiltroId: number | "";
        estadoFiltro: "" | "activo" | "inactivo";
        sortBy: "" | "categoria" | "subcategoria" | "subcategoria2";
        sortDir: "" | "asc" | "desc";
      };
    },
  ) => void;
  action?: ReactNode;
}

type CategoriaFiltroOpcion = { id: number; label: string; group: string; };

type CategoriaRow = {
  id: number; categoriaId: number; subcategoriaId?: number; subcategoria2Id?: number;
  categoria: string; subcategoria: string; subcategoria2: string;
  pathIds: number[]; pathLabel: string; categoriaActual: Categoria;
};

const ITEMS_PER_PAGE = 15;

export function GrillaCategorias({ onEditar, action }: GrillaCategoriasProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { eliminarDefinitivo, cambiarEstado, categorias: todasLasCategorias } = useCategorias();
  const { canManageCatalogo, isAdmin } = usePermissions();

  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaFiltroId, setCategoriaFiltroId] = useState<number | "">("");
  const [categoriaDropdownOpen, setCategoriaDropdownOpen] = useState(false);
  const [categoriaSearch, setCategoriaSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<"" | "activo" | "inactivo">("");
  const [sortBy, setSortBy] = useState<"" | "categoria" | "subcategoria" | "subcategoria2">("");
  const [sortDir, setSortDir] = useState<"" | "asc" | "desc">("");
  const [currentPage, setCurrentPage] = useState(1);
  const [productoPopup, setProductoPopup] = useState<{ categoriaNombre: string; total: number; items: string[] } | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [highlightedCategoryId, setHighlightedCategoryId] = useState<number | null>(null);

  const categoriaDropdownRef = useRef<HTMLDivElement | null>(null);

  const categoriasPorId = useMemo(
    () => new Map(todasLasCategorias.filter((cat) => cat.id).map((cat) => [Number(cat.id), cat])),
    [todasLasCategorias],
  );

  const hijosAllPorParentId = useMemo(() => {
    const map = new Map<number, number[]>();
    for (const cat of todasLasCategorias) {
      if (!cat.id || cat.parent_id === null) continue;
      const arr = map.get(Number(cat.parent_id)) || [];
      arr.push(Number(cat.id));
      map.set(Number(cat.parent_id), arr);
    }
    return map;
  }, [todasLasCategorias]);

  const categoriasParaFiltro = useMemo(
    () => todasLasCategorias.filter((cat) => cat.id && (canManageCatalogo || cat.is_active !== false)),
    [todasLasCategorias, canManageCatalogo],
  );

  const hijosFiltro = useMemo(() => {
    const map = new Map<number | null, Categoria[]>();
    for (const cat of categoriasParaFiltro) {
      if (!cat.id) continue;
      const key = cat.parent_id ?? null;
      const arr = map.get(key) || [];
      arr.push(cat);
      map.set(key, arr);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    return map;
  }, [categoriasParaFiltro]);

  const categoriasPrincipalesFiltro = useMemo(() => hijosFiltro.get(null) || [], [hijosFiltro]);

  const categoriasOpciones = useMemo<CategoriaFiltroOpcion[]>(() => {
    const opciones: CategoriaFiltroOpcion[] = [];
    const walk = (cat: Categoria, rootName: string, path: string) => {
      if (!cat.id) return;
      const hijos = hijosFiltro.get(Number(cat.id)) || [];
      for (const hijo of hijos) {
        if (!hijo.id) continue;
        const label = `${path} > ${hijo.nombre}`;
        opciones.push({ id: Number(hijo.id), label, group: rootName });
        walk(hijo, rootName, label);
      }
    };
    for (const raiz of categoriasPrincipalesFiltro) {
      if (!raiz.id) continue;
      opciones.push({ id: Number(raiz.id), label: `Usar solo ${raiz.nombre}`, group: raiz.nombre });
      walk(raiz, raiz.nombre, raiz.nombre);
    }
    return opciones;
  }, [categoriasPrincipalesFiltro, hijosFiltro]);

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
      if (existing) existing.push(opcion);
      else grouped.set(opcion.group, [opcion]);
    }
    return Array.from(grouped.entries()).map(([group, opciones]) => ({ group, opciones }));
  }, [categoriasFiltradas]);

  const categoriasVisibles = useMemo(() => {
    return todasLasCategorias.filter((cat) => {
      if (!cat.id) return false;
      if (!canManageCatalogo) return cat.is_active !== false;
      if (estadoFiltro === "activo") return cat.is_active !== false;
      if (estadoFiltro === "inactivo") return cat.is_active === false;
      return true;
    });
  }, [todasLasCategorias, canManageCatalogo, estadoFiltro]);

  const hijosVisibles = useMemo(() => {
    const map = new Map<number | null, Categoria[]>();
    for (const cat of categoriasVisibles) {
      if (!cat.id) continue;
      const key = cat.parent_id ?? null;
      const arr = map.get(key) || [];
      arr.push(cat);
      map.set(key, arr);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    return map;
  }, [categoriasVisibles]);

  const allRows = useMemo<CategoriaRow[]>(() => {
    const rows: CategoriaRow[] = [];
    const roots = (hijosVisibles.get(null) || []).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

    const pushRow = (cat: Categoria, pathIds: number[], pathNames: string[]) => {
      if (!cat.id) return;
      const categoria = pathNames[0] || "-";
      const subcategoria = pathNames[1] || "-";
      const subcategoria2 = pathNames.length > 2 ? pathNames.slice(2).join(" > ") : "-";
      rows.push({
        id: Number(cat.id), categoriaId: pathIds[0], subcategoriaId: pathIds[1],
        subcategoria2Id: pathIds.length > 2 ? pathIds[pathIds.length - 1] : undefined,
        categoria, subcategoria, subcategoria2, pathIds, pathLabel: pathNames.join(" > "), categoriaActual: cat,
      });
    };

    const walk = (cat: Categoria, pathIds: number[], pathNames: string[]) => {
      if (!cat.id) return;
      const hijos = hijosVisibles.get(Number(cat.id)) || [];
      const isSubcategoriaLevel = pathIds.length === 2;
      const shouldRenderSelfRow = !(isSubcategoriaLevel && hijos.length > 0);
      if (shouldRenderSelfRow) pushRow(cat, pathIds, pathNames);
      for (const hijo of hijos) {
        if (!hijo.id) continue;
        walk(hijo, [...pathIds, Number(hijo.id)], [...pathNames, hijo.nombre]);
      }
    };

    for (const root of roots) {
      if (!root.id) continue;
      const hijos = hijosVisibles.get(Number(root.id)) || [];
      if (hijos.length === 0) { pushRow(root, [Number(root.id)], [root.nombre]); continue; }
      for (const hijo of hijos) {
        if (!hijo.id) continue;
        walk(hijo, [Number(root.id), Number(hijo.id)], [root.nombre, hijo.nombre]);
      }
    }
    return rows;
  }, [hijosVisibles]);

  const rowsFiltradas = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let rows = allRows;
    if (categoriaFiltroId !== "") {
      const id = Number(categoriaFiltroId);
      rows = rows.filter((row) => row.pathIds.includes(id));
    }
    if (term) rows = rows.filter((row) => `${row.categoria} ${row.subcategoria} ${row.subcategoria2}`.toLowerCase().includes(term));
    if (sortBy && sortDir) {
      const valueFor = (row: CategoriaRow) => {
        if (sortBy === "categoria") return row.categoria;
        if (sortBy === "subcategoria") return row.subcategoria === "-" ? "zzzzzzzz" : row.subcategoria;
        return row.subcategoria2 === "-" ? "zzzzzzzz" : row.subcategoria2;
      };
      rows = [...rows].sort((a, b) => {
        const av = valueFor(a); const bv = valueFor(b);
        return sortDir === "asc" ? av.localeCompare(bv, "es") : bv.localeCompare(av, "es");
      });
    }
    return rows;
  }, [allRows, categoriaFiltroId, searchTerm, sortBy, sortDir]);

  const total = rowsFiltradas.length;
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const offset = (currentPageSafe - 1) * ITEMS_PER_PAGE;
  const rowsPagina = rowsFiltradas.slice(offset, offset + ITEMS_PER_PAGE);
  const showing = Math.min(offset + rowsPagina.length, total);

  const categoryGroupSizeByStart = useMemo(() => {
    const groupSizeByStart = new Map<number, number>();
    let i = 0;
    while (i < rowsPagina.length) {
      let j = i + 1;
      while (j < rowsPagina.length && rowsPagina[j].categoria === rowsPagina[i].categoria) j += 1;
      groupSizeByStart.set(i, j - i); i = j;
    }
    return groupSizeByStart;
  }, [rowsPagina]);

  const subcategoryGroupSizeByStart = useMemo(() => {
    const groupSizeByStart = new Map<number, number>();
    let i = 0;
    while (i < rowsPagina.length) {
      let j = i + 1;
      while (j < rowsPagina.length && rowsPagina[j].categoria === rowsPagina[i].categoria && rowsPagina[j].subcategoria === rowsPagina[i].subcategoria) j += 1;
      groupSizeByStart.set(i, j - i); i = j;
    }
    return groupSizeByStart;
  }, [rowsPagina]);

  const clearAllFilters = () => {
    setSearchTerm(""); setCategoriaFiltroId(""); setCategoriaDropdownOpen(false);
    setCategoriaSearch(""); setEstadoFiltro(""); setSortBy(""); setSortDir(""); setCurrentPage(1);
  };

  const handleSortChange = (nextSortBy: "" | "categoria" | "subcategoria" | "subcategoria2", value: string) => {
    if (!value) { if (sortBy === nextSortBy) { setSortBy(""); setSortDir(""); } setCurrentPage(1); return; }
    setSortBy(nextSortBy); setSortDir(value as "asc" | "desc"); setCurrentPage(1);
  };

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

  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set(Array.from(prev).filter((id) => categoriasPorId.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [categoriasPorId]);

  useEffect(() => {
    const state = location.state as {
      restorePage?: number; highlightCategoryId?: number;
      restoreState?: {
        searchTerm?: string; categoriaFiltroId?: number | ""; estadoFiltro?: "" | "activo" | "inactivo";
        sortBy?: "" | "categoria" | "subcategoria" | "subcategoria2"; sortDir?: "" | "asc" | "desc";
      };
    } | null;
    if (!state) return;
    let consumed = false;
    if (state.restoreState) {
      const { searchTerm: ns, categoriaFiltroId: nc, estadoFiltro: ne, sortBy: nsb, sortDir: nsd } = state.restoreState;
      if (typeof ns === "string") { setSearchTerm(ns); consumed = true; }
      if (nc === "" || (typeof nc === "number" && Number.isFinite(nc))) { setCategoriaFiltroId(nc); consumed = true; }
      if (ne === "" || ne === "activo" || ne === "inactivo") { setEstadoFiltro(ne); consumed = true; }
      if (nsb === "" || nsb === "categoria" || nsb === "subcategoria" || nsb === "subcategoria2") { setSortBy(nsb); consumed = true; }
      if (nsd === "" || nsd === "asc" || nsd === "desc") { setSortDir(nsd); consumed = true; }
    }
    if (typeof state.restorePage === "number" && Number.isFinite(state.restorePage) && state.restorePage > 0) { setCurrentPage(state.restorePage); consumed = true; }
    if (typeof state.highlightCategoryId === "number" && Number.isFinite(state.highlightCategoryId) && state.highlightCategoryId > 0) { setHighlightedCategoryId(state.highlightCategoryId); consumed = true; }
    if (consumed) navigate(location.pathname, { replace: true });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!highlightedCategoryId) return;
    const id = window.setTimeout(() => setHighlightedCategoryId(null), 2500);
    return () => window.clearTimeout(id);
  }, [highlightedCategoryId]);

  const productosPorCategoria = useMemo(() => {
    const byCat = new Map<number, { total: number; items: string[] }>();
    const collect = (categoriaId: number) => {
      const subtree = new Set<number>();
      const queue = [categoriaId];
      while (queue.length > 0) {
        const current = queue.shift()!;
        if (subtree.has(current)) continue;
        subtree.add(current);
        queue.push(...(hijosAllPorParentId.get(current) || []));
      }
      const productos = new Map<number, string>();
      for (const id of subtree) {
        const cat = categoriasPorId.get(id);
        for (const p of cat?.productos || []) {
          if (!p.id || p.is_active === false) continue;
          productos.set(p.id, p.nombre);
        }
      }
      const items = Array.from(productos.values()).sort((a, b) => a.localeCompare(b, "es"));
      byCat.set(categoriaId, { total: items.length, items });
    };
    for (const cat of todasLasCategorias) { if (cat.id) collect(Number(cat.id)); }
    return byCat;
  }, [todasLasCategorias, categoriasPorId, hijosAllPorParentId]);

  const openProductosPopup = (categoriaId?: number) => {
    if (!categoriaId) return;
    const categoria = categoriasPorId.get(categoriaId);
    if (!categoria) return;
    const productos = productosPorCategoria.get(categoriaId) || { total: 0, items: [] };
    setProductoPopup({ categoriaNombre: categoria.nombre, total: productos.total, items: productos.items });
  };

  const getCategoriaById = (categoriaId?: number) => categoriaId ? categoriasPorId.get(categoriaId) : undefined;

  const collectDescendantIds = (rootId: number) => {
    const ids: number[] = [rootId];
    const queue: number[] = [rootId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      const children = hijosAllPorParentId.get(current) || [];
      for (const childId of children) { ids.push(childId); queue.push(childId); }
    }
    return ids;
  };

  const renderNivel = (categoriaId: number | undefined, label: string, info: { total: number; items: string[] }, align: "left" | "center" = "left") => {
    if (label === "-") return <span className="text-gray-400 text-sm">-</span>;
    const isSelected = categoriaId ? selectedIds.has(categoriaId) : false;
    return (
      <div className={`relative inline-flex items-center gap-2 group ${align === "center" ? "justify-center" : ""}`}>
        {selectionMode && categoriaId && (
          <input type="checkbox" checked={isSelected}
            onChange={(e) => {
              const checked = e.target.checked;
              setSelectedIds((prev) => {
                const next = new Set(prev);
                const hierarchyIds = collectDescendantIds(categoriaId);
                for (const id of hierarchyIds) { if (checked) next.add(id); else next.delete(id); }
                return next;
              });
            }}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            aria-label={`Seleccionar ${label}`}
          />
        )}
        <button type="button" onClick={() => openProductosPopup(categoriaId)}
          className={`text-left text-sm text-blue-700 hover:underline ${isHighlighted(categoriaId) ? "bg-amber-100 border border-amber-300 rounded px-1 py-0.5 animate-pulse" : ""}`}>
          {label}
        </button>
        <div className="absolute left-0 top-full z-20 mt-0 hidden w-64 rounded-md border border-gray-200 bg-white p-2 text-xs text-gray-700 shadow-lg group-hover:block group-focus-within:block">
          <p>Total productos: <span className="font-semibold text-gray-900">{info.total}</span></p>
          <button type="button" onClick={() => openProductosPopup(categoriaId)} className="text-blue-700 mt-1 underline underline-offset-2 hover:text-blue-900">
            Click para ver todos los productos.
          </button>
        </div>
      </div>
    );
  };

  const selectedCategorias = Array.from(selectedIds).map((id) => categoriasPorId.get(id)).filter((cat): cat is Categoria => Boolean(cat));
  const selectedActivas = selectedCategorias.filter((cat) => cat.is_active);
  const selectedInactivas = selectedCategorias.filter((cat) => !cat.is_active);
  const isHighlighted = (categoriaId?: number) =>
    Boolean(categoriaId && highlightedCategoryId && Number(categoriaId) === highlightedCategoryId);

  const buildRestoreState = () => ({ searchTerm, categoriaFiltroId, estadoFiltro, sortBy, sortDir });

  return (
    <div className="mt-2">
      <div className="flex justify-between items-start mb-6 gap-3 flex-wrap">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Catalogo de Categorias</h2>
        {action && <div className="pt-2">{action}</div>}
      </div>

      <SearchBar value={searchTerm} onChange={(term) => { setSearchTerm(term); setCurrentPage(1); }} placeholder="Buscar categoria por nombre..." />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
        <div ref={categoriaDropdownRef} className="relative md:col-span-6">
          <button type="button" onClick={() => setCategoriaDropdownOpen((prev) => !prev)}
            className="w-full px-4 py-3 border rounded-xl shadow-sm bg-white text-left flex items-center justify-between text-gray-700"
            aria-haspopup="listbox" aria-expanded={categoriaDropdownOpen}>
            <span className={categoriaFiltroId ? "text-gray-900" : "text-gray-600"}>{categoriaSeleccionadaLabel}</span>
            <span className="text-gray-500">{categoriaDropdownOpen ? "^" : "v"}</span>
          </button>
          {categoriaDropdownOpen && (
            <div className="absolute top-full left-0 right-0 z-40 mt-1 rounded-lg border border-gray-300 bg-white shadow-lg">
              <div className="p-2 border-b border-gray-100">
                <div className="relative">
                  <input type="text" value={categoriaSearch} onChange={(e) => setCategoriaSearch(e.target.value)}
                    placeholder="Buscar categoria..." className="w-full border border-gray-300 rounded p-2 pr-10 text-sm" />
                  {categoriaSearch && (
                    <button type="button" onClick={() => setCategoriaSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                      aria-label="Limpiar busqueda de categorias">x</button>
                  )}
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto py-1" role="listbox">
                <button type="button" onClick={() => { setCategoriaFiltroId(""); setCategoriaDropdownOpen(false); setCurrentPage(1); }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50">Todas las categorias</button>
                {categoriasFiltradasAgrupadas.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-gray-500">No hay categorias que coincidan.</p>
                ) : (
                  categoriasFiltradasAgrupadas.map(({ group, opciones }) => (
                    <div key={group} className="py-1">
                      <p className="px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-gray-900 bg-gray-300 border-y border-gray-200">{group}</p>
                      {opciones.map((opcion) => {
                        const selected = Number(categoriaFiltroId) === opcion.id;
                        return (
                          <button key={opcion.id} type="button"
                            onClick={() => { setCategoriaFiltroId(opcion.id); setCategoriaDropdownOpen(false); setCurrentPage(1); }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 ${selected ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"}`}>
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
        <select value={estadoFiltro} onChange={(e) => { setEstadoFiltro(e.target.value as "" | "activo" | "inactivo"); setCurrentPage(1); }}
          className="w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 bg-white md:col-span-3">
          <option value="">Todos los estados</option>
          <option value="activo">Activas</option>
          <option value="inactivo">Inactivas</option>
        </select>
        <button type="button" onClick={clearAllFilters}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors font-medium md:col-span-3">
          Limpiar filtros
        </button>
      </div>

      {canManageCatalogo && (
        <div className="mb-4 rounded-xl border border-gray-200 bg-white px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2">
            <button type="button"
              onClick={() => { setSelectionMode((prev) => { const next = !prev; if (!next) setSelectedIds(new Set()); return next; }); }}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${selectionMode ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}`}>
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M2.5 4A1.5 1.5 0 014 2.5h12A1.5 1.5 0 0117.5 4v12a1.5 1.5 0 01-1.5 1.5H4A1.5 1.5 0 012.5 16V4zM6 6.25a.75.75 0 00-.75.75v1.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V7A.75.75 0 007.5 6.25H6zm0 4.25a.75.75 0 00-.75.75v1.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75v-1.5a.75.75 0 00-.75-.75H6zm4-.25a.75.75 0 000 1.5h4a.75.75 0 000-1.5h-4zm0-4a.75.75 0 000 1.5h4a.75.75 0 000-1.5h-4z" clipRule="evenodd" />
              </svg>
              Seleccionar
            </button>
            <InfoHint text="Apreta Seleccionar, marca las categorias o subcategorias que quieras y despues toca Editar o Desactivar."
              ariaLabel="Info de seleccion" className="ml-0"
              buttonClassName="h-7 w-7 border-blue-200 text-blue-700 bg-blue-50"
              tooltipClassName="left-0 right-auto w-96 max-w-[calc(100vw-2rem)] text-sm text-gray-800" />
          </div>
          <div className="flex items-center gap-2">
            {selectionMode && <span className="text-xs text-gray-600">{selectedIds.size} seleccionado{selectedIds.size === 1 ? "" : "s"}</span>}
            <button type="button"
              onClick={() => { if (selectedIds.size !== 1) return; const cat = categoriasPorId.get(Array.from(selectedIds)[0]); if (cat) onEditar(cat, { returnPage: currentPageSafe, returnState: buildRestoreState() }); }}
              disabled={!selectionMode || selectedIds.size !== 1}
              className="inline-flex items-center gap-1 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded text-xs font-medium">
              Editar
            </button>
            <button type="button"
              onClick={() => { if (!selectedActivas.length) return; if (window.confirm(`Desactivar ${selectedActivas.length} categoria(s) seleccionada(s)?`)) { for (const cat of selectedActivas) { if (cat.id) cambiarEstado(cat.id, false); } setSelectedIds(new Set()); } }}
              disabled={!selectionMode || selectedActivas.length === 0 || selectedIds.size === 0}
              className="inline-flex items-center gap-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded text-xs font-medium">
              Desactivar
            </button>
            <button type="button"
              onClick={() => { if (!selectedInactivas.length) return; if (window.confirm(`Reactivar ${selectedInactivas.length} categoria(s) seleccionada(s)?`)) { for (const cat of selectedInactivas) { if (cat.id) cambiarEstado(cat.id, true); } setSelectedIds(new Set()); } }}
              disabled={!selectionMode || selectedInactivas.length === 0 || selectedIds.size === 0}
              className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded text-xs font-medium">
              Reactivar
            </button>
            {isAdmin && (
              <button type="button"
                onClick={() => {
                  if (!selectedInactivas.length) return;
                  if (!window.confirm(`Eliminar definitivamente ${selectedInactivas.length} categoria(s) inactiva(s)? Esta accion no se puede deshacer.`)) return;
                  if (!window.confirm("Confirmacion final: verificaste que no tengan hijas ni productos asociados?")) return;
                  for (const cat of selectedInactivas) { if (cat.id) eliminarDefinitivo(cat.id); }
                  setSelectedIds(new Set());
                }}
                disabled={!selectionMode || selectedInactivas.length === 0 || selectedIds.size === 0}
                className="inline-flex items-center gap-1 bg-black hover:bg-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded text-xs font-medium">
                Eliminar definitivo
              </button>
            )}
          </div>
        </div>
      )}

      {rowsPagina.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-lg">No se encontraron categorias que coincidan con la busqueda.</p>
        </div>
      ) : (
        <>
          <div className="flex justify-end mb-2">
            <div className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">Mostrando {showing} de {total} resultados</div>
          </div>
          <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
            <table className="min-w-full divide-y divide-gray-200/70">
              <thead className="bg-gray-50 border-b border-gray-200/70">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left border-r border-gray-100">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</span>
                      <select value={sortBy === "categoria" ? sortDir : ""} onChange={(e) => handleSortChange("categoria", e.target.value)} className="text-[11px] text-gray-600 border border-gray-200 rounded px-1.5 py-0.5 bg-white">
                        <option value="">Orden</option><option value="asc">A-Z</option><option value="desc">Z-A</option>
                      </select>
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left border-r border-gray-100">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Subcategoria</span>
                      <select value={sortBy === "subcategoria" ? sortDir : ""} onChange={(e) => handleSortChange("subcategoria", e.target.value)} className="text-[11px] text-gray-600 border border-gray-200 rounded px-1.5 py-0.5 bg-white">
                        <option value="">Orden</option><option value="asc">A-Z</option><option value="desc">Z-A</option>
                      </select>
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left border-r border-gray-100">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Subcategoria Secundaria</span>
                      <select value={sortBy === "subcategoria2" ? sortDir : ""} onChange={(e) => handleSortChange("subcategoria2", e.target.value)} className="text-[11px] text-gray-600 border border-gray-200 rounded px-1.5 py-0.5 bg-white">
                        <option value="">Orden</option><option value="asc">A-Z</option><option value="desc">Z-A</option>
                      </select>
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200/70">
                {rowsPagina.map((row, idx) => {
                  const categoriaRepetida = idx > 0 && rowsPagina[idx - 1].categoria === row.categoria;
                  const subcategoriaRepetida = idx > 0 && rowsPagina[idx - 1].categoria === row.categoria && rowsPagina[idx - 1].subcategoria === row.subcategoria;
                  const categoriaNivel = getCategoriaById(row.categoriaId);
                  const subcategoriaNivel = getCategoriaById(row.subcategoriaId);
                  const subcategoria2Nivel = getCategoriaById(row.subcategoria2Id);
                  const categoriaInactiva = categoriaNivel?.is_active === false;
                  const subcategoriaInactiva = categoriaInactiva || subcategoriaNivel?.is_active === false;
                  const subcategoria2Inactiva = subcategoriaInactiva || subcategoria2Nivel?.is_active === false;
                  const filaInactivaPorJerarquia = row.pathIds.some((pathId) => categoriasPorId.get(pathId)?.is_active === false);
                  const catInfo = productosPorCategoria.get(row.categoriaId) || { total: 0, items: [] };
                  const subInfo = row.subcategoriaId ? productosPorCategoria.get(row.subcategoriaId) || { total: 0, items: [] } : { total: 0, items: [] };
                  const sub2Info = row.subcategoria2Id ? productosPorCategoria.get(row.subcategoria2Id) || { total: 0, items: [] } : { total: 0, items: [] };
                  return (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      {!categoriaRepetida && (
                        <td rowSpan={categoryGroupSizeByStart.get(idx) || 1}
                          className={`px-6 py-4 align-middle text-center border-r border-gray-100 ${categoriaInactiva ? "bg-gray-300 text-gray-700" : ""}`}>
                          {renderNivel(row.categoriaId, row.categoria, catInfo, "center")}
                        </td>
                      )}
                      {!subcategoriaRepetida && (
                        <td rowSpan={subcategoryGroupSizeByStart.get(idx) || 1}
                          className={`px-6 py-4 align-middle border-r border-gray-100 ${subcategoriaInactiva ? "bg-gray-300 text-gray-700" : ""}`}>
                          {renderNivel(row.subcategoriaId, row.subcategoria, subInfo)}
                        </td>
                      )}
                      <td className={`px-6 py-4 border-r border-gray-100 ${subcategoria2Inactiva ? "bg-gray-300 text-gray-700" : ""}`}>
                        {renderNivel(row.subcategoria2Id, row.subcategoria2, sub2Info)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${filaInactivaPorJerarquia ? "bg-gray-300 text-gray-700" : ""}`}>
                        {!filaInactivaPorJerarquia ? (
                          <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-semibold border border-emerald-200">Activa</span>
                        ) : (
                          <span className="bg-red-100 text-red-800 px-2.5 py-1 rounded-full text-xs font-semibold border border-red-200">Inactiva</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={currentPageSafe} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      )}

      <CategoriaProductoModal popup={productoPopup} onClose={() => setProductoPopup(null)} />
    </div>
  );
}
