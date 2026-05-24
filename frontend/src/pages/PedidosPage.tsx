import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { AvanzarEstadoPayload, Pedido } from "../entities/Pedido";
import { CANCELABLES, ESTADOS, TRANSICIONES } from "../entities/Pedido";
import { avanzarEstado, fetchPedidos } from "../entities/pedidosApi";
import { Pagination } from "../shared/ui/Pagination";
import { getApiErrorMessage } from "../shared/api/http";

const LIMIT = 10;

function formatFecha(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString("es-AR");
}

export function PedidosPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState<string | null>(null);

  const offset = (page - 1) * LIMIT;

  // ── useQuery: listado de pedidos ───────────────────────────────────────────
  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["pedidos", page],
    queryFn: () => fetchPedidos({ offset, limit: LIMIT }),
  });

  // ── useMutation: avanzar / cancelar estado + invalidación de caché ─────────
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
    const motivo = window.prompt("Motivo de la cancelación:");
    if (motivo === null) return; // canceló el prompt
    if (!motivo.trim()) {
      setActionError("El motivo es obligatorio para cancelar un pedido.");
      return;
    }
    estadoMutation.mutate({
      id: pedido.id,
      payload: { estado_hacia: "CANCELADO", motivo: motivo.trim() },
    });
  };

  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);
  const pedidos = data?.items ?? [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Pedidos — Cajero</h2>
            <p className="text-sm text-gray-500 mt-1">
              {total} pedido{total === 1 ? "" : "s"}
              {isFetching && <span className="ml-2 text-blue-500">actualizando…</span>}
            </p>
          </div>
        </div>

        {actionError && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
            {actionError}
          </div>
        )}

        {isLoading ? (
          <p className="text-center py-12 text-gray-500">Cargando pedidos…</p>
        ) : isError ? (
          <div className="text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
            {getApiErrorMessage(error, "No se pudo cargar el listado de pedidos")}
          </div>
        ) : pedidos.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-gray-500 text-lg">No hay pedidos para mostrar.</p>
          </div>
        ) : (
          <>
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
                  {pedidos.map((p) => {
                    const estado = ESTADOS[p.estado_codigo] ?? {
                      label: p.estado_codigo,
                      badgeClass: "bg-gray-100 text-gray-700 border-gray-200",
                    };
                    const transiciones = TRANSICIONES[p.estado_codigo] ?? [];
                    const puedeCancelar = CANCELABLES.includes(p.estado_codigo);

                    return (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          #{p.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatFecha(p.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          ${p.total}
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
                                onClick={() => handleAvanzar(p, t.hacia)}
                                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                              >
                                {t.label}
                              </button>
                            ))}
                            {puedeCancelar && (
                              <button
                                type="button"
                                disabled={estadoMutation.isPending}
                                onClick={() => handleCancelar(p)}
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

            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
