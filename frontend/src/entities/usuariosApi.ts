import { api } from "../shared/api/http";
import type {
  RolAssignPayload,
  Usuario,
  UsuarioPaginatedResponse,
  UsuarioUpdatePayload,
} from "./Usuario";

interface ListUsuariosParams {
  rol?: string;
  offset?: number;
  limit?: number;
}

/** GET /admin/usuarios — listado paginado con filtro opcional por rol. */
export async function fetchUsuarios(
  params: ListUsuariosParams,
): Promise<UsuarioPaginatedResponse> {
  const { data } = await api.get<UsuarioPaginatedResponse>("/admin/usuarios", {
    params: {
      rol: params.rol || undefined,
      offset: params.offset ?? 0,
      limit: params.limit ?? 10,
    },
  });
  return data;
}

/** PATCH /admin/usuarios/{id} — actualiza nombre y/o estado. */
export async function updateUsuario(
  id: number,
  payload: UsuarioUpdatePayload,
): Promise<Usuario> {
  const { data } = await api.patch<Usuario>(`/admin/usuarios/${id}`, payload);
  return data;
}

/** PATCH /admin/usuarios/{id}/rol — asigna un rol al usuario. */
export async function assignRol(
  id: number,
  payload: RolAssignPayload,
): Promise<Usuario> {
  const { data } = await api.patch<Usuario>(`/admin/usuarios/${id}/rol`, payload);
  return data;
}

/** DELETE /admin/usuarios/{id} — soft delete del usuario. */
export async function deleteUsuario(id: number): Promise<void> {
  await api.delete(`/admin/usuarios/${id}`);
}
