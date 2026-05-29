import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ESTADOS, TRANSICIONES } from "../entities/Pedido";
import { avanzarEstado, fetchPedidoById } from "../entities/pedidosApi";
import { useAuth } from "../entities/useAuth";
import { useProductos } from "../entities/useProducto";
import { getApiErrorMessage } from "../shared/api/http";
import { usePermissions } from "../shared/auth/roles";
import { markPedidoAsSeen } from "../shared/pedidosUnread";

function formatFechaHora(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString("es-AR");
}

function formatFecha(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("es-AR");
}

function formatHora(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatImporte(value: number | string): string {
  const parsed = typeof value === "number" ? value : Number(value);
  const amount = Number.isFinite(parsed) ? parsed : 0;
  return amount.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}

function formatEstadoLabel(codigo: string): string {
  if (ESTADOS[codigo]) return ESTADOS[codigo].label;
  return codigo
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (s) => s.toUpperCase());
}

function formatFormaPago(codigo: string): string {
  const labels: Record<string, string> = {
    EFECTIVO: "Efectivo",
    TRANSFERENCIA: "Transferencia",
    TARJETA: "Tarjeta",
  };
  return labels[codigo] ?? codigo;
}

function getItemNote(item: Record<string, unknown>): string | null {
  const candidates = ["nota", "notas", "comentario", "observacion", "observaciones"];
  for (const key of candidates) {
    const value = item[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export function PedidoDetallePage() {
  const { id } = useParams();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { canManagePedidos } = usePermissions();
  const { user } = useAuth();
  const { productos } = useProductos();
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [motivoModalOpen, setMotivoModalOpen] = useState(false);
  const [motivoSeleccionado, setMotivoSeleccionado] = useState("Me equivoque al hacer el pedido.");
  const [motivoLibre, setMotivoLibre] = useState("");
  const [motivoError, setMotivoError] = useState<string | null>(null);

  const pedidoId = id ? Number(id) : NaN;
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo;
  const returnPage = (location.state as { returnPage?: number } | null)?.returnPage;
  const returnState = (location.state as { returnState?: unknown } | null)?.returnState;
  const fallbackReturnTo = canManagePedidos ? "/pedidos" : "/mis-pedidos";
  const resolvedReturnTo = returnTo || fallbackReturnTo;
  const volverAlListadoState = returnTo ? { restorePage: returnPage, restoreState: returnState } : undefined;

  const { data: pedido, isLoading, isError, error } = useQuery({
    queryKey: ["pedidos", "detalle", pedidoId],
    queryFn: () => fetchPedidoById(pedidoId),
    enabled: Number.isFinite(pedidoId) && pedidoId > 0,
  });

  const avanzarMutation = useMutation({
    mutationFn: (estadoHacia: string) => avanzarEstado(pedidoId, { estado_hacia: estadoHacia }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
      queryClient.invalidateQueries({ queryKey: ["pedidos", "detalle", pedidoId] });
    },
  });

  const cancelarMutation = useMutation({
    mutationFn: (motivo: string) =>
      avanzarEstado(pedidoId, { estado_hacia: "CANCELADO", motivo }),
    onSuccess: () => {
      setConfirmCancelOpen(false);
      setMotivoModalOpen(false);
      setMotivoLibre("");
      setMotivoError(null);
      queryClient.invalidateQueries({ queryKey: ["mis-pedidos"] });
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
      queryClient.invalidateQueries({ queryKey: ["pedidos", "detalle", pedidoId] });
    },
  });

  const productosById = useMemo(
    () => new Map(productos.filter((p) => p.id).map((p) => [Number(p.id), p])),
    [productos],
  );

  const siguienteEtapa = useMemo(() => {
    if (!pedido) return null;
    const transiciones = TRANSICIONES[pedido.estado_codigo] ?? [];
    return transiciones[0] ?? null;
  }, [pedido]);

  const puedeCancelarCliente = !canManagePedidos && pedido?.estado_codigo === "PENDIENTE";

  const motivosCancelacion = [
    "Me equivoque al hacer el pedido.",
    "Quiero cambiar productos del pedido.",
    "Ya no lo necesito en este momento.",
    "Tuve un problema con el metodo de pago.",
    "__OTRO__",
    "__OMITIR__",
  ];

  const resolverPersonalizacion = (productoId: number, personalizacion: number[]) => {
    if (!personalizacion.length) return [];
    const producto = productosById.get(productoId);
    if (!producto) return personalizacion.map((id) => `Ingrediente #${id}`);
    const nombres = personalizacion.map((id) => {
      const ing = (producto.ingredientes || []).find((item) => Number(item.id) === id);
      return ing?.nombre ?? `Ingrediente #${id}`;
    });
    return Array.from(new Set(nombres));
  };

  const handleConfirmarCancelacion = () => {
    if (motivoSeleccionado === "__OTRO__") {
      const motivo = motivoLibre.trim();
      if (!motivo) {
        setMotivoError("Escribi el motivo para continuar.");
        return;
      }
      cancelarMutation.mutate(motivo);
      return;
    }
    if (motivoSeleccionado === "__OMITIR__") {
      cancelarMutation.mutate("El cliente prefirio no indicar un motivo de cancelacion.");
      return;
    }
    cancelarMutation.mutate(motivoSeleccionado);
  };

  useEffect(() => {
    if (!canManagePedidos || !user?.id || !Number.isFinite(pedidoId) || pedidoId <= 0) return;
    markPedidoAsSeen(user.id, pedidoId);
  }, [canManagePedidos, pedidoId, user?.id]);

  if (isLoading) {
    return (
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <p className="text-gray-600">Cargando detalle del pedido...</p>
      </div>
    );
  }

  if (isError || !pedido) {
    return (
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <p className="text-red-700">{getApiErrorMessage(error, "No se pudo cargar el detalle del pedido.")}</p>
        <Link
          to={resolvedReturnTo}
          state={volverAlListadoState}
          className="inline-block bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Volver al listado
        </Link>
      </div>
    );
  }

  const estado = ESTADOS[pedido.estado_codigo] ?? {
    label: pedido.estado_codigo,
    badgeClass: "bg-gray-100 text-gray-700 border-gray-200",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Pedido #{pedido.id}</h1>
        <div className="flex items-center gap-2">
          {puedeCancelarCliente && (
            <button
              type="button"
              onClick={() => setConfirmCancelOpen(true)}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Cancelar pedido
            </button>
          )}
          <Link
            to={resolvedReturnTo}
            state={volverAlListadoState}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Volver al listado
          </Link>
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Fecha</p>
            <p className="text-base font-bold text-gray-900 mt-1">{formatFecha(pedido.created_at)}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Hora</p>
            <p className="text-base font-bold text-gray-900 mt-1">{formatHora(pedido.created_at)}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Forma de pago</p>
            <p className="text-base font-bold text-gray-900 mt-1">{formatFormaPago(pedido.forma_pago_codigo)}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Estado actual del pedido</p>
            <span className={`inline-flex mt-1 text-sm font-semibold px-3 py-1.5 rounded-full border ${estado.badgeClass}`}>
              {estado.label}
            </span>
          </div>
        </div>

        {canManagePedidos ? (
          <div className="flex flex-wrap items-center gap-3">
            {siguienteEtapa ? (
              <button
                type="button"
                onClick={() => avanzarMutation.mutate(siguienteEtapa.hacia)}
                disabled={avanzarMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {avanzarMutation.isPending
                  ? "Actualizando..."
                  : `Pasar a ${formatEstadoLabel(siguienteEtapa.hacia)}`}
              </button>
            ) : (
              <span className="inline-flex items-center rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-600">
                Este pedido ya no tiene etapas pendientes.
              </span>
            )}
            {avanzarMutation.isError && (
              <span className="text-sm text-red-700">{getApiErrorMessage(avanzarMutation.error, "No se pudo avanzar el estado.")}</span>
            )}
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-gray-200 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Subtotal</p>
            <p className="text-lg font-bold text-gray-900 mt-1">{formatImporte(pedido.subtotal)}</p>
          </div>
          <div className="rounded-xl border border-gray-200 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Descuento</p>
            <p className="text-lg font-bold text-gray-900 mt-1">{formatImporte(pedido.descuento)}</p>
          </div>
          <div className="rounded-xl border border-gray-200 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Total</p>
            <p className="text-lg font-bold text-gray-900 mt-1">{formatImporte(pedido.total)}</p>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Items del pedido</h2>
          {pedido.detalles.length === 0 ? (
            <p className="text-sm text-gray-500">No hay items cargados para este pedido.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pedido.detalles.map((item) => {
                    const rowKey = `${item.pedido_id}-${item.producto_id}-${item.created_at}`;
                    const itemNote = getItemNote(item as unknown as Record<string, unknown>);
                    const isExpanded = Boolean(expandedNotes[rowKey]);

                    return (
                      <tr key={rowKey}>
                        <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                          <div className="space-y-1">
                            <p>{item.nombre_snapshot}</p>
                            {item.personalizacion.length > 0 && (
                              <div className="text-xs rounded-lg border border-amber-200 bg-amber-50 text-amber-800 px-2 py-1">
                                Sin: {resolverPersonalizacion(item.producto_id, item.personalizacion).join(", ")}
                              </div>
                            )}
                            {itemNote && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedNotes((prev) => ({ ...prev, [rowKey]: !prev[rowKey] }))
                                  }
                                  className="text-xs font-semibold text-blue-700 hover:text-blue-800"
                                >
                                  Nota {isExpanded ? "-" : "+"}
                                </button>
                                {isExpanded && (
                                  <p className="text-xs font-normal text-gray-600 rounded-lg border border-blue-100 bg-blue-50 p-2">
                                    {itemNote}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{item.cantidad}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{formatImporte(item.precio_snapshot)}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{formatImporte(item.subtotal_snap)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {pedido.notas && (
          <div className="mt-3">
            <h2 className="text-base font-bold text-gray-900 mb-2">Nota general del pedido</h2>
            <p className="text-sm text-gray-700">{pedido.notas}</p>
          </div>
        )}

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Historial de estados</h2>
          {pedido.historial.length === 0 ? (
            <p className="text-sm text-gray-500">No hay historial registrado.</p>
          ) : (
            <div className="space-y-3">
              {pedido.historial.map((h, index) => {
                const fromLabel = h.estado_desde ? formatEstadoLabel(h.estado_desde) : null;
                const toLabel = formatEstadoLabel(h.estado_hacia);
                const transitionText = fromLabel ? `${fromLabel} -> ${toLabel}` : `Estado inicial: ${toLabel}`;

                return (
                  <div key={h.id} className="relative pl-7">
                    {index < pedido.historial.length - 1 && (
                      <span className="absolute left-3 top-7 h-[calc(100%+0.5rem)] w-px bg-gray-200" />
                    )}
                    <span className="absolute left-1.5 top-3.5 h-3 w-3 rounded-full bg-blue-600 ring-4 ring-blue-50" />
                    <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
                      <p className="font-semibold text-gray-900">{transitionText}</p>
                      <p className="text-gray-500 mt-1">{formatFechaHora(h.created_at)}</p>
                      {h.motivo && <p className="text-gray-600 mt-2">Motivo: {h.motivo}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {confirmCancelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setConfirmCancelOpen(false)}
            className="absolute inset-0 bg-black/40"
            aria-label="Cerrar confirmacion de cancelacion"
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirmar cancelacion del pedido</h3>
            <p className="text-sm text-gray-600 mb-5">
              Vas a cancelar el pedido <span className="font-semibold">#{pedido.id}</span>. Esta accion no se puede deshacer.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmCancelOpen(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={() => {
                  setMotivoModalOpen(true);
                  setConfirmCancelOpen(false);
                  setMotivoError(null);
                  setMotivoLibre("");
                }}
                className="px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700"
              >
                Si, cancelar pedido
              </button>
            </div>
          </div>
        </div>
      )}

      {motivoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setMotivoModalOpen(false)}
            className="absolute inset-0 bg-black/40"
            aria-label="Cerrar modal de motivo"
          />
          <div className="relative w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Motivo de cancelacion</h3>
            <p className="text-sm text-gray-600 mb-4">Si queres, podes indicar el motivo.</p>

            <div className="space-y-2 mb-4">
              {motivosCancelacion.map((motivo) => (
                <label key={motivo} className="flex items-start gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="motivo-cancelacion-detalle"
                    checked={motivoSeleccionado === motivo}
                    onChange={() => {
                      setMotivoSeleccionado(motivo);
                      setMotivoError(null);
                    }}
                    className="mt-1"
                  />
                  <span>
                    {motivo === "__OTRO__" ? "Otro motivo (escribir)" : motivo === "__OMITIR__" ? "Prefiero no indicar motivo" : motivo}
                  </span>
                </label>
              ))}
            </div>

            {motivoSeleccionado === "__OTRO__" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Escribi tu motivo</label>
                <textarea
                  value={motivoLibre}
                  onChange={(e) => {
                    setMotivoLibre(e.target.value);
                    setMotivoError(null);
                  }}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contanos brevemente el motivo..."
                />
              </div>
            )}

            {motivoError && (
              <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                {motivoError}
              </div>
            )}

            {cancelarMutation.isError && (
              <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                {getApiErrorMessage(cancelarMutation.error, "No se pudo cancelar el pedido")}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMotivoModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Volver
              </button>
              <button
                type="button"
                disabled={cancelarMutation.isPending}
                onClick={handleConfirmarCancelacion}
                className="px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelarMutation.isPending ? "Cancelando..." : "Confirmar cancelacion"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
