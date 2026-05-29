import { api } from "../shared/api/http";
import type {
  AvanzarEstadoPayload,
  PedidoCreatePayload,
  PedidoFull,
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

/** POST /pedidos — crea un pedido desde carrito del usuario autenticado. */
export async function createPedido(payload: PedidoCreatePayload): Promise<PedidoFull> {
  const { data } = await api.post<PedidoFull>("/pedidos/", payload);
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

/** GET /pedidos/{id} - detalle completo del pedido. */
export async function fetchPedidoById(id: number): Promise<PedidoFull> {
  const { data } = await api.get<PedidoFull>(`/pedidos/${id}`);
  return data;
}
