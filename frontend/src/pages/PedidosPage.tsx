import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";

import type { AvanzarEstadoPayload, Pedido } from "../models/Pedido";
import { CANCELABLES, ESTADOS, TRANSICIONES } from "../models/Pedido";
import { avanzarEstado, fetchPedidos } from "../api/pedidosApi";
import { Pagination } from "../components/Pagination";
import { getApiErrorMessage } from "../api/http";
import { getUnreadOperatorPedidoIds, markPedidosAsSeen } from "../api/pedidosUnread";
import { useAuth } from "../hooks/useAuth";
import { usePermissions } from "../hooks/useRoles";

const PAGE_SIZE = 10;
const FETCH_LIMIT = 100;

type DateFilterMode = "dia" | "rango";
type PedidosRestoreState = {
  dateMode?: DateFilterMode;
  fechaDia?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  estadoFiltro?: string;
  importeSearch?: string;
  selectedImportes?: string[];
};

function formatFecha(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString("es-AR");
}

function formatImporte(value: number): string {
  return value.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}

function parseImporte(raw: number | string): number {
  const parsed = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function dateInputKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function fetchAllPedidos(): Promise<Pedido[]> {
  let offset = 0;
  let total = Number.POSITIVE_INFINITY;
  const all: Pedido[] = [];

  while (offset < total) {
    const response = await fetchPedidos({ offset, limit: FETCH_LIMIT });
    total = response.total ?? all.length;
    all.push(...(response.items ?? []));
    if (!response.items?.length) break;
    offset += FETCH_LIMIT;
  }

  return all;
}

export function PedidosPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;
  const { canManagePedidos } = usePermissions();
  const isRestoringRef = useRef(false);
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState<string | null>(null);
  const [cancelPedido, setCancelPedido] = useState<Pedido | null>(null);
  const [cancelMotivo, setCancelMotivo] = useState("");
  const [cancelError, setCancelError] = useState<string | null>(null);

  const [dateMode, setDateMode] = useState<DateFilterMode>("dia");
  const [fechaDia, setFechaDia] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [importeSearch, setImporteSearch] = useState("");
  const [selectedImportes, setSelectedImportes] = useState<Set<string>>(new Set());

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["pedidos", "all"],
    queryFn: fetchAllPedidos,
  });

  const pedidos = useMemo(() => data ?? [], [data]);
  const highlightedIds = useMemo(() => {
    if (!userId) return new Set<number>();
    return new Set(getUnreadOperatorPedidoIds(userId, pedidos));
  }, [pedidos, userId]);

  const importesDisponibles = useMemo(() => {
    const map = new Map<string, number>();
    for (const pedido of pedidos) {
      const amount = parseImporte(pedido.total);
      const key = amount.toFixed(2);
      if (!map.has(key)) map.set(key, amount);
    }
    return Array.from(map.entries())
      .map(([key, value]) => ({ key, value, label: formatImporte(value) }))
      .sort((a, b) => a.value - b.value);
  }, [pedidos]);

  const importesFiltrados = useMemo(() => {
    const search = importeSearch.trim().toLowerCase();
    if (!search) return importesDisponibles;
    return importesDisponibles.filter((importe) => {
      const normalized = importe.label.toLowerCase();
      return normalized.includes(search) || importe.key.includes(search.replace(",", "."));
    });
  }, [importeSearch, importesDisponibles]);

  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter((pedido) => {
      if (estadoFiltro && pedido.estado_codigo !== estadoFiltro) return false;

      const amount = parseImporte(pedido.total);
      if (selectedImportes.size > 0 && !selectedImportes.has(amount.toFixed(2))) return false;

      const fecha = new Date(pedido.created_at);
      if (Number.isNaN(fecha.getTime())) return false;
      const key = dateInputKey(fecha);

      if (dateMode === "dia") {
        if (fechaDia && key !== fechaDia) return false;
      } else {
        if (fechaDesde && key < fechaDesde) return false;
        if (fechaHasta && key > fechaHasta) return false;
      }

      return true;
    });
  }, [pedidos, estadoFiltro, selectedImportes, dateMode, fechaDia, fechaDesde, fechaHasta]);

  const totalFiltrados = pedidosFiltrados.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltrados / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const pedidosPagina = pedidosFiltrados.slice(offset, offset + PAGE_SIZE);
  const showing = Math.min(offset + pedidosPagina.length, totalFiltrados);

  const buildRestoreState = (): PedidosRestoreState => ({
    dateMode,
    fechaDia,
    fechaDesde,
    fechaHasta,
    estadoFiltro,
    importeSearch,
    selectedImportes: Array.from(selectedImportes),
  });

  useEffect(() => {
    const state = location.state as { restorePage?: number; restoreState?: PedidosRestoreState } | null;
    if (!state) return;

    isRestoringRef.current = true;

    const next = state.restoreState;
    if (next) {
      if (next.dateMode === "dia" || next.dateMode === "rango") setDateMode(next.dateMode);
      if (typeof next.fechaDia === "string") setFechaDia(next.fechaDia);
      if (typeof next.fechaDesde === "string") setFechaDesde(next.fechaDesde);
      if (typeof next.fechaHasta === "string") setFechaHasta(next.fechaHasta);
      if (typeof next.estadoFiltro === "string") setEstadoFiltro(next.estadoFiltro);
      if (typeof next.importeSearch === "string") setImporteSearch(next.importeSearch);
      if (Array.isArray(next.selectedImportes)) setSelectedImportes(new Set(next.selectedImportes));
    }

    if (typeof state.restorePage === "number" && Number.isFinite(state.restorePage) && state.restorePage > 0) {
      setPage(state.restorePage);
    }

    navigate(location.pathname, { replace: true });
    queueMicrotask(() => {
      isRestoringRef.current = false;
    });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (isRestoringRef.current) return;
    setPage(1);
  }, [dateMode, fechaDia, fechaDesde, fechaHasta, estadoFiltro, selectedImportes]);

  useEffect(() => {
    if (currentPage !== page) setPage(currentPage);
  }, [currentPage, page]);

  useEffect(() => {
    if (!userId || highlightedIds.size === 0) return;
    const highlightedPedidoIds = Array.from(highlightedIds);
    const id = window.setTimeout(() => {
      markPedidosAsSeen(userId, highlightedPedidoIds);
      queryClient.invalidateQueries({ queryKey: ["pedidos", "all", "navbar"] });
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
    }, 5000);
    return () => window.clearTimeout(id);
  }, [highlightedIds, queryClient, userId]);

  const estadoMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: AvanzarEstadoPayload }) =>
      avanzarEstado(id, payload),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
    },
    onError: (err) => setActionError(getApiErrorMessage(err, "No se pudo cambiar el estado")),
  });

  const handleAvanzar = (pedido: Pedido, hacia: string) => {
    estadoMutation.mutate({ id: pedido.id, payload: { estado_hacia: hacia } });
  };

  const handleCancelar = (pedido: Pedido) => {
    setCancelPedido(pedido);
    setCancelMotivo("");
    setCancelError(null);
  };

  const confirmarCancelacion = () => {
    if (!cancelPedido) return;
    const motivo = cancelMotivo.trim();
    if (!motivo) {
      setCancelError("El motivo es obligatorio para cancelar un pedido.");
      return;
    }
    estadoMutation.mutate({
      id: cancelPedido.id,
      payload: { estado_hacia: "CANCELADO", motivo },
    });
    setCancelPedido(null);
    setCancelMotivo("");
    setCancelError(null);
  };

  const toggleImporte = (importeKey: string) => {
    setSelectedImportes((prev) => {
      const next = new Set(prev);
      if (next.has(importeKey)) next.delete(importeKey);
      else next.add(importeKey);
      return next;
    });
  };

  const clearAllFilters = () => {
    setDateMode("dia");
    setFechaDia("");
    setFechaDesde("");
    setFechaHasta("");
    setEstadoFiltro("");
    setImporteSearch("");
    setSelectedImportes(new Set());
  };

  const activeFilterCount =
    (fechaDia ? 1 : 0) +
    ((fechaDesde || fechaHasta) ? 1 : 0) +
    (estadoFiltro ? 1 : 0) +
    (selectedImportes.size > 0 ? 1 : 0);

  const openPedidoDetalle = (pedido: Pedido) => {
    navigate(`/pedidos/${pedido.id}`, {
      state: {
        returnTo: "/pedidos",
        returnPage: currentPage,
        returnState: buildRestoreState(),
      },
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="mb-4">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Gestion de pedidos</h2>
        </div>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-6 xl:grid-cols-12 gap-3 items-stretch">
          <div className="rounded-xl border border-gray-200 bg-white p-3 md:col-span-3 xl:col-span-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Fecha</label>
              <select
                value={dateMode}
                onChange={(e) => setDateMode(e.target.value as DateFilterMode)}
                className="text-xs text-gray-700 border border-gray-300 rounded-md px-2 py-1 bg-white"
              >
                <option value="dia">Dia</option>
                <option value="rango">Rango</option>
              </select>
            </div>
            {dateMode === "dia" ? (
              <input
                type="date"
                value={fechaDia}
                onChange={(e) => setFechaDia(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          <details className="relative rounded-xl border border-gray-200 bg-white p-3 md:col-span-3 xl:col-span-4">
            <summary className="list-none cursor-pointer">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Importe</label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white flex items-center justify-between">
                <span className="font-normal">
                  {selectedImportes.size > 0
                    ? `${selectedImportes.size} importe(s) seleccionado(s)`
                    : "Seleccionar importes..."}
                </span>
                <span className="text-gray-500">v</span>
              </div>
            </summary>

            <div className="absolute left-0 right-0 mt-3 z-20 rounded-xl border border-gray-200 bg-white shadow-lg p-3 space-y-3">
              <input
                type="text"
                value={importeSearch}
                onChange={(e) => setImporteSearch(e.target.value)}
                placeholder="Buscar importe..."
                className="w-full px-3 py-2 border rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
                {importesFiltrados.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay importes que coincidan.</p>
                ) : (
                  importesFiltrados.map((importe) => (
                    <label key={importe.key} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={selectedImportes.has(importe.key)}
                        onChange={() => toggleImporte(importe.key)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      {importe.label}
                    </label>
                  ))
                )}
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const allVisible = importesFiltrados.every((importe) => selectedImportes.has(importe.key));
                    setSelectedImportes((prev) => {
                      const next = new Set(prev);
                      if (allVisible) {
                        for (const importe of importesFiltrados) next.delete(importe.key);
                      } else {
                        for (const importe of importesFiltrados) next.add(importe.key);
                      }
                      return next;
                    });
                  }}
                  className="text-xs font-medium text-blue-700 hover:underline"
                >
                  Seleccionar visibles
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedImportes(new Set())}
                  className="text-xs font-medium text-gray-600 hover:underline"
                >
                  Limpiar importes
                </button>
              </div>
            </div>
          </details>

          <div className="rounded-xl border border-gray-200 bg-white p-3 md:col-span-2 xl:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Estado</label>
            <select
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              {Object.entries(ESTADOS).map(([codigo, meta]) => (
                <option key={codigo} value={codigo}>
                  {meta.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1 xl:col-span-2 flex flex-col justify-center gap-2">
            <button
              type="button"
              onClick={clearAllFilters}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors font-medium"
            >
              Limpiar filtros
              {activeFilterCount > 0 && <span className="ml-1 text-xs text-gray-600">({activeFilterCount})</span>}
            </button>
          </div>
        </div>

        {!isLoading && !isError && pedidos.length > 0 && (
          <div className="mb-3 flex justify-end">
            <div className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              Mostrando {showing} de {totalFiltrados} resultados
              {isFetching && <span className="ml-2 text-blue-500">actualizando...</span>}
            </div>
          </div>
        )}

        {actionError && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
            {actionError}
          </div>
        )}

        {isLoading ? (
          <p className="text-center py-12 text-gray-500">Cargando pedidos...</p>
        ) : isError ? (
          <div className="text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
            {getApiErrorMessage(error, "No se pudo cargar el listado de pedidos")}
          </div>
        ) : pedidosPagina.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-gray-500 text-lg">No hay pedidos para los filtros seleccionados.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-3">Haz click en el pedido para ver su detalle.</p>
            <div className="overflow-x-auto bg-white rounded-xl border border-gray-100">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pedido</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pedidosPagina.map((p) => {
                    const estado = ESTADOS[p.estado_codigo] ?? {
                      label: p.estado_codigo,
                      badgeClass: "bg-gray-100 text-gray-700 border-gray-200",
                    };
                    const transiciones = canManagePedidos ? (TRANSICIONES[p.estado_codigo] ?? []) : [];
                    const puedeCancelar = canManagePedidos && CANCELABLES.includes(p.estado_codigo);
                    const isHighlighted = highlightedIds.has(p.id);

                    return (
                      <tr
                        key={p.id}
                        onClick={() => openPedidoDetalle(p)}
                        className={`${isHighlighted ? "bg-amber-100 animate-pulse" : "hover:bg-gray-50"} transition-colors cursor-pointer`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          #{p.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatFecha(p.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {formatImporte(parseImporte(p.total))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${estado.badgeClass}`}>
                            {estado.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex gap-2 justify-end">
                            {transiciones.map((t) => (
                              <button
                                key={t.hacia}
                                type="button"
                                disabled={estadoMutation.isPending}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAvanzar(p, t.hacia);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                              >
                                {t.label}
                              </button>
                            ))}
                            {puedeCancelar && (
                              <button
                                type="button"
                                disabled={estadoMutation.isPending}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelar(p);
                                }}
                                className="bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                              >
                                Cancelar
                              </button>
                            )}
                            {transiciones.length === 0 && !puedeCancelar && (
                              <span className="text-xs text-gray-400">Sin acciones</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 ? (
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
            ) : (
              <div className="mt-4 flex justify-center">
                <span className="text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-full px-3 py-1">
                  Pagina 1 de 1
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {cancelPedido && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setCancelPedido(null)}
            className="absolute inset-0 bg-slate-950/50"
            aria-label="Cerrar cancelacion"
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Cancelar pedido #{cancelPedido.id}</h3>
                <p className="mt-1 text-sm text-gray-600">Indica el motivo para registrar la cancelacion.</p>
              </div>
              <button
                type="button"
                onClick={() => setCancelPedido(null)}
                className="h-8 w-8 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                aria-label="Cerrar"
              >
                x
              </button>
            </div>
            <label className="mt-5 block text-sm font-semibold text-gray-700" htmlFor="motivo-cancelacion-admin">
              Motivo de cancelacion
            </label>
            <textarea
              id="motivo-cancelacion-admin"
              value={cancelMotivo}
              onChange={(event) => {
                setCancelMotivo(event.target.value);
                setCancelError(null);
              }}
              rows={4}
              className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ejemplo: sin stock, pedido duplicado, solicitud del cliente..."
            />
            {cancelError && <p className="mt-2 text-sm text-red-700">{cancelError}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelPedido(null)}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={confirmarCancelacion}
                disabled={estadoMutation.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Confirmar cancelacion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
