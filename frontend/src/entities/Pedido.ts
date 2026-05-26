/** Pedido (resumen) tal como lo devuelve GET /pedidos. */
export interface Pedido {
  id: number;
  usuario_id: number;
  direccion_id: number | null;
  estado_codigo: string;
  forma_pago_codigo: string;
  subtotal: number | string;
  descuento: number | string;
  costo_envio: number | string;
  total: number | string;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export interface PedidoPaginatedResponse {
  total: number;
  items: Pedido[];
}

export interface PedidoCreateItemPayload {
  producto_id: number;
  cantidad: number;
  personalizacion: number[];
}

export interface PedidoCreatePayload {
  forma_pago_codigo: "EFECTIVO" | "TARJETA" | "TRANSFERENCIA";
  direccion_id?: number | null;
  notas?: string | null;
  items: PedidoCreateItemPayload[];
}

export interface PedidoDetalle {
  pedido_id: number;
  producto_id: number;
  cantidad: number;
  nombre_snapshot: string;
  precio_snapshot: number | string;
  subtotal_snap: number | string;
  personalizacion: number[];
  created_at: string;
}

export interface PedidoHistorial {
  id: number;
  pedido_id: number;
  estado_desde: string | null;
  estado_hacia: string;
  usuario_id: number | null;
  motivo: string | null;
  created_at: string;
}

export interface PedidoFull extends Pedido {
  detalles: PedidoDetalle[];
  historial: PedidoHistorial[];
}

/** Payload para avanzar el estado de un pedido. */
export interface AvanzarEstadoPayload {
  estado_hacia: string;
  motivo?: string;
}

/** Metadata visual de cada estado (debe coincidir con el backend). */
export const ESTADOS: Record<
  string,
  { label: string; badgeClass: string }
> = {
  PENDIENTE: { label: "Pendiente", badgeClass: "bg-gray-100 text-gray-700 border-gray-200" },
  CONFIRMADO: { label: "Aprobado", badgeClass: "bg-blue-50 text-blue-700 border-blue-100" },
  EN_PREP: { label: "En proceso", badgeClass: "bg-amber-50 text-amber-700 border-amber-100" },
  EN_CAMINO: { label: "Listo / En camino", badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-100" },
  ENTREGADO: { label: "Entregado", badgeClass: "bg-green-50 text-green-700 border-green-100" },
  CANCELADO: { label: "Cancelado", badgeClass: "bg-red-50 text-red-700 border-red-100" },
};

/**
 * Transiciones permitidas por estado (espejo de la máquina de estados del
 * backend). Cada transición trae la etiqueta del botón que la dispara.
 */
export const TRANSICIONES: Record<
  string,
  { hacia: string; label: string }[]
> = {
  PENDIENTE: [{ hacia: "CONFIRMADO", label: "Aprobar" }],
  CONFIRMADO: [{ hacia: "EN_PREP", label: "Pasar a En proceso" }],
  EN_PREP: [{ hacia: "EN_CAMINO", label: "Marcar Listo" }],
  EN_CAMINO: [{ hacia: "ENTREGADO", label: "Marcar Entregado" }],
  ENTREGADO: [],
  CANCELADO: [],
};

/** Estados desde los que el operador puede cancelar (requiere motivo). */
export const CANCELABLES = ["PENDIENTE", "CONFIRMADO"];
