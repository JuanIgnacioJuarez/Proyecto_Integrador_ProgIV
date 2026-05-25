import { useAuth } from "../../entities/useAuth";

/** Códigos de rol del sistema (deben coincidir con el backend). */
export const ROLES = {
  ADMIN: "ADMIN",
  STOCK: "STOCK",
  PEDIDOS: "PEDIDOS",
  CLIENT: "CLIENT",
} as const;

export type Rol = (typeof ROLES)[keyof typeof ROLES];

/** Etiquetas legibles para mostrar en la UI. */
export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  STOCK: "Gestor de Stock",
  PEDIDOS: "Gestor de Pedidos",
  CLIENT: "Cliente",
};

/**
 * Hook de permisos: centraliza las reglas de "qué puede hacer cada rol".
 *
 * Regla general del panel:
 *  - ADMIN  → puede realizar acciones (CRUD completo + gestión de usuarios).
 *  - Empleado (STOCK / PEDIDOS) → modo solo lectura del catálogo.
 *  - PEDIDOS (y ADMIN) → puede operar la pantalla de cajero (estados de pedido).
 */
export function usePermissions() {
  const { user } = useAuth();
  const rol = user?.rol ?? null;

  const isAdmin = rol === ROLES.ADMIN;
  const isStock = rol === ROLES.STOCK;
  const isPedidos = rol === ROLES.PEDIDOS;

  return {
    rol,
    roleLabel: rol ? ROLE_LABELS[rol] ?? rol : "",
    isAdmin,
    isStock,
    isPedidos,
    /** Solo el admin puede crear/editar/eliminar en el catálogo. */
    canManageCatalogo: isAdmin,
    /** Solo el admin puede gestionar usuarios. */
    canManageUsuarios: isAdmin,
    /** Admin y gestor de pedidos pueden avanzar estados (cajero). */
    canManagePedidos: isAdmin || isPedidos,
  };
}
