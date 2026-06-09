import type { MouseEvent as ReactMouseEvent } from "react";

import { Producto } from "../../models/Producto";
import { formatStockWithUnit } from "../../utils/stock";
import { Pagination } from "../../components/Pagination";

type SortBy = "nombre" | "precio" | "stock" | "";
type SortDir = "asc" | "desc";

interface ProductoTableProps {
  productos: Producto[];
  isLoading: boolean;
  isError: boolean;
  isClient: boolean;
  isStock: boolean;
  selectionMode: boolean;
  selectedIds: Set<number>;
  onSelectId: (id: number, checked: boolean) => void;
  stockDrafts: Record<number, string>;
  savingStockId: number | null;
  onStockChange: (id: number, value: string) => void;
  onGuardarStock: (p: Producto) => void;
  onAgregarAlCarrito: (p: Producto, qty: number) => void;
  onOpenDetail: (id?: number) => void;
  onOpenIngredientesPopup: (event: ReactMouseEvent, p: Producto) => void;
  isHighlighted: (id?: number) => boolean;
  resolveImageUrl: (url: string) => string;
  sortBy: SortBy;
  sortDir: SortDir;
  onSortChange: (nextSortBy: SortBy, value: string) => void;
  showing: number;
  total: number;
  stockMessage: string | null;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function ProductoTable({
  productos,
  isLoading,
  isError,
  isClient,
  isStock,
  selectionMode,
  selectedIds,
  onSelectId,
  stockDrafts,
  savingStockId,
  onStockChange,
  onGuardarStock,
  onAgregarAlCarrito,
  onOpenDetail,
  onOpenIngredientesPopup,
  isHighlighted,
  resolveImageUrl,
  sortBy,
  sortDir,
  onSortChange,
  showing,
  total,
  stockMessage,
  currentPage,
  totalPages,
  onPageChange,
}: ProductoTableProps) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Orden</span>
          <select
            value={sortBy === "nombre" ? sortDir : ""}
            onChange={(e) => onSortChange("nombre", e.target.value)}
            className="text-xs text-gray-700 dark:text-slate-200 border border-gray-300 dark:border-slate-700 rounded-lg px-2 py-1 bg-white dark:bg-slate-900/80"
          >
            <option value="">Nombre</option>
            <option value="asc">A-Z</option>
            <option value="desc">Z-A</option>
          </select>
          <select
            value={sortBy === "precio" ? sortDir : ""}
            onChange={(e) => onSortChange("precio", e.target.value)}
            className="text-xs text-gray-700 dark:text-slate-200 border border-gray-300 dark:border-slate-700 rounded-lg px-2 py-1 bg-white dark:bg-slate-900/80"
          >
            <option value="">Precio</option>
            <option value="asc">Menor</option>
            <option value="desc">Mayor</option>
          </select>
          {!isClient && (
            <select
              value={sortBy === "stock" ? sortDir : ""}
              onChange={(e) => onSortChange("stock", e.target.value)}
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
        <div className="mb-4 text-sm text-blue-700 dark:text-blue-100 bg-blue-50 dark:bg-blue-900/35 border border-blue-200 dark:border-blue-700/70 rounded-lg p-3">
          {stockMessage}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900/75 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
          <p className="text-gray-500 dark:text-slate-300 text-lg">Cargando productos...</p>
        </div>
      ) : isError ? (
        <div className="text-red-500 dark:text-red-100 bg-red-50 dark:bg-red-900/35 p-4 rounded-lg border border-red-200 dark:border-red-700/70">
          No se pudo cargar el listado de productos.
        </div>
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
                  onClick={() => canOpen && onOpenDetail(p.id)}
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
                          onChange={(e) => onSelectId(Number(p.id), e.target.checked)}
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
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
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
                          <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-semibold border border-emerald-200">Activo</span>
                        ) : (
                          <span className="bg-red-100 text-red-800 px-2.5 py-1 rounded-full text-xs font-semibold border border-red-200">Inactivo</span>
                        )}
                      </div>
                    )}
                  </div>

                  {isStock && p.id && (
                    <div className="mt-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="number" min={0}
                        value={stockDrafts[p.id] ?? String(p.stock_cantidad)}
                        onChange={(e) => onStockChange(p.id!, e.target.value)}
                        className="w-24 px-2 py-1 border rounded-md text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => onGuardarStock(p)}
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
                          <span key={c.id} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md border border-blue-100">{c.nombre}</span>
                        ))
                      ) : <span className="text-gray-400 text-sm">-</span>}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {p.ingredientes && p.ingredientes.length > 0 ? (
                        <>
                          {p.ingredientes.slice(0, 3).map((i) => (
                            <span key={i.id} title={i.cantidad ? `Cantidad: ${formatStockWithUnit(i.cantidad, i.unidad_medida)}` : "Sin cantidad cargada"}
                              className={`text-xs px-2 py-1 rounded-md border cursor-help ${i.es_alergeno ? "bg-red-50 text-red-700 border-red-100" : "bg-green-50 text-green-700 border-green-100"}`}>
                              {i.nombre}{i.es_alergeno ? " (Alergeno)" : ""}
                            </span>
                          ))}
                          {p.ingredientes.length > 3 && (
                            <button type="button" onClick={(e) => onOpenIngredientesPopup(e, p)}
                              className="text-xs px-2 py-1 rounded-md border bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100">
                              +{p.ingredientes.length - 3}
                            </button>
                          )}
                        </>
                      ) : <span className="text-gray-400 text-sm">-</span>}
                    </div>
                  </div>

                  {isClient && (
                    <div className="mt-3 flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <button type="button"
                        onClick={() => onAgregarAlCarrito(p, 1)}
                        disabled={!p.id || p.stock_cantidad <= 0 || !p.is_active}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
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
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-100/80">Producto</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-100/80">Categorias</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-100/80">Ingredientes</th>
                  {!isClient && <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-100/80">Estado</th>}
                  {isClient && <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Carrito</th>}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200/70">
                {productos.map((p) => {
                  const sinStock = Number(p.stock_cantidad ?? 0) <= 0;
                  const canOpen = Boolean(p.id && !sinStock);
                  return (
                    <tr key={p.id} onClick={() => canOpen && onOpenDetail(p.id)}
                      className={`${isHighlighted(p.id) ? "bg-amber-100 animate-pulse" : sinStock ? "bg-zinc-300 text-zinc-700 cursor-not-allowed" : p.is_active ? "hover:bg-gray-50 cursor-pointer" : "bg-gray-100 text-gray-700"} transition-colors`}>
                      <td className="px-6 py-4 border-r border-gray-100/80">
                        <div className="flex items-start gap-4 w-full">
                          {selectionMode && p.id && (
                            <input type="checkbox" checked={selectedIds.has(Number(p.id))}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => onSelectId(Number(p.id), e.target.checked)}
                              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              aria-label={`Seleccionar ${p.nombre}`}
                            />
                          )}
                          {p.imagenes_url?.[0] ? (
                            <img src={resolveImageUrl(p.imagenes_url[0])} alt={`Imagen de ${p.nombre}`}
                              className="w-28 h-28 rounded-lg object-cover border border-gray-200 bg-gray-50 flex-shrink-0"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                            />
                          ) : (
                            <div className="w-28 h-28 rounded-lg border border-dashed border-gray-300 bg-gray-50 text-xs text-gray-400 flex items-center justify-center flex-shrink-0">Sin img</div>
                          )}
                          <div className="min-w-0 flex-1 flex flex-col justify-between gap-2 min-h-[7rem]">
                            <div className="space-y-1">
                              <div className="text-xl font-bold text-gray-900 line-clamp-2">{p.nombre}</div>
                              <div className="text-sm text-gray-500 line-clamp-3" title={p.descripcion || "Sin descripcion"}>{p.descripcion || "Sin descripcion"}</div>
                            </div>
                            <div className="mt-1 flex items-center gap-2 flex-wrap">
                              <span className="text-base font-semibold px-2.5 py-1 rounded-md border bg-blue-50 text-blue-700 border-blue-100 shrink-0">${p.precio_base}</span>
                              {isStock && p.id ? (
                                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                  <input type="number" min={0}
                                    value={stockDrafts[p.id] ?? String(p.stock_cantidad)}
                                    onChange={(e) => onStockChange(p.id!, e.target.value)}
                                    className="w-20 px-2 py-1 border rounded-md text-xs"
                                  />
                                  <button type="button" onClick={() => onGuardarStock(p)}
                                    disabled={savingStockId === p.id}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-2 py-1 rounded-md text-xs font-medium transition-colors">
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
                              <span key={c.id} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md border border-blue-100">{c.nombre}</span>
                            ))
                          ) : <span className="text-gray-400 text-sm">-</span>}
                        </div>
                      </td>
                      <td className={`px-6 py-4 ${!isClient ? "border-r border-gray-100/80" : ""}`}>
                        <div className="flex flex-wrap gap-1">
                          {p.ingredientes && p.ingredientes.length > 0 ? (
                            <>
                              {p.ingredientes.slice(0, 3).map((i) => (
                                <span key={i.id}
                                  title={i.cantidad ? `Cantidad: ${formatStockWithUnit(i.cantidad, i.unidad_medida)}` : "Sin cantidad cargada"}
                                  className={`text-xs px-2 py-1 rounded-md border cursor-help ${i.es_alergeno ? "bg-red-50 text-red-700 border-red-100" : "bg-green-50 text-green-700 border-green-100"}`}>
                                  {i.nombre}{i.es_alergeno ? " (Alergeno)" : ""}
                                </span>
                              ))}
                              {p.ingredientes.length > 3 && (
                                <button type="button" onClick={(e) => onOpenIngredientesPopup(e, p)}
                                  className="text-xs px-2 py-1 rounded-md border bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100">
                                  +{p.ingredientes.length - 3}
                                </button>
                              )}
                            </>
                          ) : <span className="text-gray-400 text-sm">-</span>}
                        </div>
                      </td>
                      {!isClient && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm border-r border-gray-100/80">
                          {p.is_active ? (
                            <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-semibold border border-emerald-200">Activo</span>
                          ) : (
                            <span className="bg-red-100 text-red-800 px-2.5 py-1 rounded-full text-xs font-semibold border border-red-200">Inactivo</span>
                          )}
                        </td>
                      )}
                      {isClient && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button type="button"
                            onClick={(e) => { e.stopPropagation(); onAgregarAlCarrito(p, 1); }}
                            disabled={!p.id || p.stock_cantidad <= 0 || !p.is_active}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
                            aria-label={`Agregar ${p.nombre} al carrito`} title="Agregar al carrito">
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

          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
        </>
      )}
    </>
  );
}
