import type { Pedido } from "../entities/Pedido";

const STORAGE_PREFIX = "pedidos_vistos_user_";

function buildKey(userId: number): string {
  return `${STORAGE_PREFIX}${userId}`;
}

export function readSeenPedidoIds(userId: number): Set<number> {
  try {
    const raw = window.localStorage.getItem(buildKey(userId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as number[];
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id) => Number.isFinite(id) && id > 0));
  } catch {
    return new Set();
  }
}

function persistSeenPedidoIds(userId: number, ids: Set<number>): void {
  window.localStorage.setItem(buildKey(userId), JSON.stringify(Array.from(ids)));
}

export function markPedidoAsSeen(userId: number, pedidoId: number): void {
  const seen = readSeenPedidoIds(userId);
  seen.add(pedidoId);
  persistSeenPedidoIds(userId, seen);
}

export function syncSeenPedidos(userId: number, pedidos: Pedido[]): void {
  const existentes = new Set(pedidos.map((p) => p.id));
  const seen = readSeenPedidoIds(userId);
  const next = new Set(Array.from(seen).filter((id) => existentes.has(id)));
  persistSeenPedidoIds(userId, next);
}

export function countUnreadPendingPedidos(userId: number, pedidos: Pedido[]): number {
  const seen = readSeenPedidoIds(userId);
  return pedidos.filter((pedido) => pedido.estado_codigo === "PENDIENTE" && !seen.has(pedido.id)).length;
}
