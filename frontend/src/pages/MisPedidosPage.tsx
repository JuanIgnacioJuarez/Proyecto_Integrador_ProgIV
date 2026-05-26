import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { AvanzarEstadoPayload, Pedido } from "../entities/Pedido";
import { CANCELABLES, ESTADOS } from "../entities/Pedido";
import { avanzarEstado, fetchPedidos } from "../entities/pedidosApi";
import { getApiErrorMessage } from "../shared/api/http";

const LIMIT = 100;

type FiltroPedidos = "TODOS" | "EN_PROCESO" | "REALIZADOS" | "CANCELADOS";

const FILTROS: { id: FiltroPedidos; label: string; estados: string[] | null }[] = [
  { id: "TODOS", label: "Todos", estados: null },
  { id: "EN_PROCESO", label: "En proceso", estados: ["PENDIENTE", "CONFIRMADO", "EN_PREP", "EN_CAMINO"] },
  { id: "REALIZADOS", label: "Realizados", estados: ["ENTREGADO"] },
  { id: "CANCELADOS", label: "Cancelados", estados: ["CANCELADO"] },
];

function currency(value: number | string): string {
  return Number(value).toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}

function formatFecha(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString("es-AR");
}

export function MisPedidosPage() {
  const queryClient = useQueryClient();
  const [filtro, setFiltro] = useState<FiltroPedidos>("TODOS");
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["mis-pedidos"],
    queryFn: () => fetchPedidos({ offset: 0, limit: LIMIT }),
  });

  const pedidos = data?.items ?? [];
  const pedidosFiltrados = useMemo(() => {
    const filtroActivo = FILTROS.find((item) => item.id === filtro);
    if (!filtroActivo?.estados) return pedidos;
    return pedidos.filter((pedido) => filtroActivo.estados?.includes(pedido.estado_codigo));
  }, [filtro, pedidos]);

  const estadoMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: AvanzarEstadoPayload }) =>
      avanzarEstado(id, payload),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ["mis-pedidos"] });
    },
    onError: (err) => setActionError(getApiErrorMessage(err, "No se pudo cancelar el pedido")),
  });

  const handleCancelar = (pedido: Pedido) => {
    const motivo = window.prompt("Motivo de la cancelacion:");
    if (motivo === null) return;
    if (!motivo.trim()) {
      setActionError("El motivo es obligatorio para cancelar un pedido.");
      return;
    }
    estadoMutation.mutate({
      id: pedido.id,
      payload: { estado_hacia: "CANCELADO", motivo: motivo.trim() },
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Mis pedidos</h2>
            <p className="text-sm text-gray-500 mt-1">
              {pedidos.length} pedido{pedidos.length === 1 ? "" : "s"}
              {isFetching && <span className="ml-2 text-blue-500">actualizando...</span>}
            </p>
          </div>
          <Link
            to="/hacer-pedido"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Hacer pedido
          </Link>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {FILTROS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFiltro(item.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                filtro === item.id
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {actionError && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
            {actionError}
          </div>
        )}

        {isLoading ? (
          <p className="text-center py-12 text-gray-500">Cargando pedidos...</p>
        ) : isError ? (
          <div className="text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
            {getApiErrorMessage(error, "No se pudo cargar tus pedidos")}
          </div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-gray-500 text-lg">No hay pedidos para este filtro.</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl border border-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pedido</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pago</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pedidosFiltrados.map((pedido) => {
                  const estado = ESTADOS[pedido.estado_codigo] ?? {
                    label: pedido.estado_codigo,
                    badgeClass: "bg-gray-100 text-gray-700 border-gray-200",
                  };
                  const puedeCancelar = CANCELABLES.includes(pedido.estado_codigo);

                  return (
                    <tr key={pedido.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        #{pedido.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatFecha(pedido.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {pedido.forma_pago_codigo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {currency(pedido.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${estado.badgeClass}`}>
                          {estado.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {puedeCancelar ? (
                          <button
                            type="button"
                            disabled={estadoMutation.isPending}
                            onClick={() => handleCancelar(pedido)}
                            className="bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                          >
                            Cancelar
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">Sin acciones</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
