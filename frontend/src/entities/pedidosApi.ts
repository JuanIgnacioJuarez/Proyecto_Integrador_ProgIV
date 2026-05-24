import { api } from "../shared/api/http";
import type {
  AvanzarEstadoPayload,
  Pedido,
  PedidoPaginatedResponse,
} from "./Pedido";

interface ListPedidosParams {
  offset?: number;
  limit?: number;
}

/** GET /pedidos — ADMIN/PEDIDOS ven todos; CLIENT solo los propios. */
export async function fetchPedidos(
  params: ListPedidosParams,
): Promise<PedidoPaginatedResponse> {
  const { data } = await api.get<PedidoPaginatedResponse>("/pedidos", {
    params: {
      offset: params.offset ?? 0,
      limit: params.limit ?? 10,
    },
  });
  return data;
}

/** PATCH /pedidos/{id}/estado — avanza el estado según la máquina de estados. */
export async function avanzarEstado(
  id: number,
  payload: AvanzarEstadoPayload,
): Promise<Pedido> {
  const { data } = await api.patch<Pedido>(`/pedidos/${id}/estado`, payload);
  return data;
}
