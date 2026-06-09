import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { AvanzarEstadoPayload, Pedido } from "../models/Pedido";
import { ESTADOS } from "../models/Pedido";
import { avanzarEstado, fetchPedidos } from "../api/pedidosApi";
import { getApiErrorMessage } from "../api/http";

const LIMIT = 100;

type FiltroPedidos = "TODOS" | "EN_PROCESO" | "REALIZADOS" | "CANCELADOS";

const FILTROS: { id: FiltroPedidos; label: string; estados: string[] | null }[] = [
  { id: "TODOS", label: "Todos", estados: null },
  { id: "EN_PROCESO", label: "En proceso", estados: ["PENDIENTE", "CONFIRMADO", "EN_PREP", "EN_CAMINO"] },
  { id: "REALIZADOS", label: "Realizados", estados: ["ENTREGADO"] },
  { id: "CANCELADOS", label: "Cancelados", estados: ["CANCELADO"] },
];

const MOTIVOS_CANCELACION = [
  { id: "EQUIVOCACION", label: "Me equivoque al hacer el pedido", value: "Me equivoque al hacer el pedido." },
  { id: "CAMBIO", label: "Quiero cambiar productos del pedido", value: "Quiero cambiar productos del pedido." },
  { id: "TIEMPO", label: "Ya no lo necesito en este momento", value: "Ya no lo necesito en este momento." },
  { id: "PAGO", label: "Tuve un problema con el metodo de pago", value: "Tuve un problema con el metodo de pago." },
  { id: "OTRO", label: "Otro motivo (escribir)", value: "__OTRO__" },
  { id: "OMITIR", label: "Prefiero no indicar motivo", value: "__OMITIR__" },
] as const;

function currency(value: number | string): string {
  return Number(value).toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}

function formatFecha(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString("es-AR");
}

export function MisPedidosPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filtro, setFiltro] = useState<FiltroPedidos>("TODOS");
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmPedido, setConfirmPedido] = useState<Pedido | null>(null);
  const [motivoPedido, setMotivoPedido] = useState<Pedido | null>(null);
  const [motivoSeleccionado, setMotivoSeleccionado] = useState<string>(MOTIVOS_CANCELACION[0].value);
  const [motivoLibre, setMotivoLibre] = useState("");
  const [motivoError, setMotivoError] = useState<string | null>(null);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["mis-pedidos"],
    queryFn: () => fetchPedidos({ offset: 0, limit: LIMIT }),
  });

  const pedidos = useMemo(() => data?.items ?? [], [data?.items]);
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
      setMotivoError(null);
      setConfirmPedido(null);
      setMotivoPedido(null);
      setMotivoLibre("");
      setMotivoSeleccionado(MOTIVOS_CANCELACION[0].value);
      queryClient.invalidateQueries({ queryKey: ["mis-pedidos"] });
    },
    onError: (err) => setActionError(getApiErrorMessage(err, "No se pudo cancelar el pedido")),
  });

  const handleCancelar = (pedido: Pedido, motivo: string) => {
    estadoMutation.mutate({
      id: pedido.id,
      payload: { estado_hacia: "CANCELADO", motivo },
    });
  };

  const openPedidoDetalle = (pedido: Pedido) => {
    navigate(`/mis-pedidos/${pedido.id}`, {
      state: { returnTo: "/mis-pedidos" },
    });
  };

  const handleContinuarConMotivo = () => {
    if (!motivoPedido) return;

    if (motivoSeleccionado === "__OTRO__") {
      const personalizado = motivoLibre.trim();
      if (!personalizado) {
        setMotivoError("Escribi el motivo para poder continuar.");
        return;
      }
      handleCancelar(motivoPedido, personalizado);
      return;
    }

    if (motivoSeleccionado === "__OMITIR__") {
      handleCancelar(motivoPedido, "El cliente prefirio no indicar un motivo de cancelacion.");
      return;
    }

    handleCancelar(motivoPedido, motivoSeleccionado);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Mis pedidos</h2>
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
          <>
            <p className="text-sm text-gray-500 mb-3">Haz click en el pedido para ver su detalle.</p>
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
                    const puedeCancelar = pedido.estado_codigo === "PENDIENTE";

                    return (
                      <tr
                        key={pedido.id}
                        onClick={() => openPedidoDetalle(pedido)}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                      >
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
                              onClick={(e) => {
                                e.stopPropagation();
                                setActionError(null);
                                setMotivoError(null);
                                setConfirmPedido(pedido);
                              }}
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
          </>
        )}
      </div>

      {confirmPedido && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setConfirmPedido(null)}
            className="absolute inset-0 bg-black/40"
            aria-label="Cerrar confirmacion de cancelacion"
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirmar cancelacion del pedido</h3>
            <p className="text-sm text-gray-600 mb-5">
              Vas a cancelar el pedido <span className="font-semibold">#{confirmPedido.id}</span>. Esta accion no se puede deshacer.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmPedido(null)}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={() => {
                  setMotivoError(null);
                  setMotivoSeleccionado(MOTIVOS_CANCELACION[0].value);
                  setMotivoLibre("");
                  setMotivoPedido(confirmPedido);
                  setConfirmPedido(null);
                }}
                className="px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700"
              >
                Si, cancelar pedido
              </button>
            </div>
          </div>
        </div>
      )}

      {motivoPedido && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => {
              setMotivoPedido(null);
              setMotivoError(null);
            }}
            className="absolute inset-0 bg-black/40"
            aria-label="Cerrar modal de motivo"
          />
          <div className="relative w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Motivo de cancelacion</h3>
            <p className="text-sm text-gray-600 mb-4">
              Si queres, podes elegir un motivo para cancelar el pedido <span className="font-semibold">#{motivoPedido.id}</span>.
            </p>

            <div className="space-y-2 mb-4">
              {MOTIVOS_CANCELACION.map((motivo) => (
                <label key={motivo.id} className="flex items-start gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="motivo-cancelacion"
                    checked={motivoSeleccionado === motivo.value}
                    onChange={() => {
                      setMotivoSeleccionado(motivo.value);
                      setMotivoError(null);
                    }}
                    className="mt-1"
                  />
                  <span>{motivo.label}</span>
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

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setMotivoPedido(null);
                  setMotivoError(null);
                }}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={estadoMutation.isPending}
                onClick={handleContinuarConMotivo}
                className="px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {estadoMutation.isPending ? "Cancelando..." : "Confirmar cancelacion"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
