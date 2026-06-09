import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../hooks/useAuth";
import type { Usuario } from "../models/Usuario";
import {
  assignRol,
  deleteUsuario,
  fetchUsuarios,
  updateUsuario,
} from "../api/usuariosApi";
import { FilaUsuario } from "../features/usuarios/FilaUsuario";
import { Pagination } from "../components/Pagination";
import { getApiErrorMessage } from "../api/http";
import { ROLE_LABELS, ROLES } from "../hooks/useRoles";

const LIMIT = 10;

export function UsuariosPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [rolFiltro, setRolFiltro] = useState<string>("");
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState<string | null>(null);

  const offset = (page - 1) * LIMIT;

  // ── useQuery: listado paginado con filtro por rol ──────────────────────────
  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["usuarios", rolFiltro, page],
    queryFn: () => fetchUsuarios({ rol: rolFiltro, offset, limit: LIMIT }),
  });

  // ── Invalidación común tras una mutación ───────────────────────────────────
  const invalidarUsuarios = () => {
    queryClient.invalidateQueries({ queryKey: ["usuarios"] });
  };

  const onMutationError = (err: unknown) => {
    setActionError(getApiErrorMessage(err, "No se pudo completar la acción"));
  };

  // ── useMutation: cambiar rol ───────────────────────────────────────────────
  const rolMutation = useMutation({
    mutationFn: ({ id, rol }: { id: number; rol: string }) => assignRol(id, { rol }),
    onSuccess: () => {
      setActionError(null);
      invalidarUsuarios();
    },
    onError: onMutationError,
  });

  // ── useMutation: activar/desactivar ────────────────────────────────────────
  const toggleMutation = useMutation({
    mutationFn: (usuario: Usuario) =>
      updateUsuario(usuario.id, { is_active: !usuario.is_active }),
    onSuccess: () => {
      setActionError(null);
      invalidarUsuarios();
    },
    onError: onMutationError,
  });

  // ── useMutation: eliminar (soft delete) ────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteUsuario(id),
    onSuccess: () => {
      setActionError(null);
      invalidarUsuarios();
    },
    onError: onMutationError,
  });

  const isMutating =
    rolMutation.isPending || toggleMutation.isPending || deleteMutation.isPending;

  const handleEliminar = (usuario: Usuario) => {
    if (window.confirm(`¿Seguro que querés eliminar a "${usuario.nombre}"?`)) {
      deleteMutation.mutate(usuario.id);
    }
  };

  const handleFiltroRol = (value: string) => {
    setRolFiltro(value);
    setPage(1);
  };

  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);
  const usuarios = data?.items ?? [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Gestion de Usuarios</h2>
            <p className="text-sm text-gray-500 mt-1">
              {total} usuario{total === 1 ? "" : "s"}
              {isFetching && <span className="ml-2 text-blue-500">actualizando…</span>}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">Rol:</label>
            <select
              value={rolFiltro}
              onChange={(e) => handleFiltroRol(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">Todos</option>
              {[ROLES.ADMIN, ROLES.STOCK, ROLES.PEDIDOS, ROLES.CLIENT].map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {actionError && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
            {actionError}
          </div>
        )}

        {isLoading ? (
          <p className="text-center py-12 text-gray-500">Cargando usuarios…</p>
        ) : isError ? (
          <div className="text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
            {getApiErrorMessage(error, "No se pudo cargar el listado de usuarios")}
          </div>
        ) : usuarios.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-gray-500 text-lg">No hay usuarios para mostrar.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto bg-white rounded-xl border border-gray-100">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usuarios.map((u) => (
                    <FilaUsuario
                      key={u.id}
                      usuario={u}
                      currentUserId={user?.id ?? null}
                      isMutating={isMutating}
                      onCambiarRol={(id, rol) => rolMutation.mutate({ id, rol })}
                      onToggleActivo={(usuario) => toggleMutation.mutate(usuario)}
                      onEliminar={handleEliminar}
                    />
                  ))}
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

