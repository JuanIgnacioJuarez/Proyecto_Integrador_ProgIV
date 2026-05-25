/** Usuario tal como lo devuelve el panel de administración (/admin/usuarios). */
export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Respuesta paginada del listado de usuarios. */
export interface UsuarioPaginatedResponse {
  total: number;
  items: Usuario[];
}

/** Payload para actualizar datos básicos del usuario. */
export interface UsuarioUpdatePayload {
  nombre?: string;
  is_active?: boolean;
}

/** Payload para asignar un rol. */
export interface RolAssignPayload {
  rol: string;
}
