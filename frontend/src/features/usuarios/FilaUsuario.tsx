import { ROLE_LABELS, ROLES } from "../../hooks/useRoles";
import type { Usuario } from "../../models/Usuario";

export interface FilaUsuarioProps {
  usuario: Usuario;
  currentUserId: number | null;
  isMutating: boolean;
  onCambiarRol: (id: number, rol: string) => void;
  onToggleActivo: (usuario: Usuario) => void;
  onEliminar: (usuario: Usuario) => void;
}

const ROLES_DISPONIBLES = [ROLES.ADMIN, ROLES.STOCK, ROLES.PEDIDOS, ROLES.CLIENT];

export function FilaUsuario({
  usuario,
  currentUserId,
  isMutating,
  onCambiarRol,
  onToggleActivo,
  onEliminar,
}: FilaUsuarioProps) {
  const esPropiaCuenta = usuario.id === currentUserId;

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-gray-900">
          {usuario.nombre}
          {esPropiaCuenta && (
            <span className="ml-2 text-xs text-blue-600 font-normal">(vos)</span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{usuario.email}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <select
          value={usuario.rol}
          disabled={isMutating || esPropiaCuenta}
          onChange={(e) => onCambiarRol(usuario.id, e.target.value)}
          className="border border-gray-300 rounded-lg px-2 py-1 text-sm bg-white disabled:bg-gray-100 disabled:text-gray-400"
          title={esPropiaCuenta ? "No podés cambiar tu propio rol" : "Cambiar rol"}
        >
          {ROLES_DISPONIBLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center">
        {usuario.is_active ? (
          <span className="bg-green-50 text-green-700 text-xs px-3 py-1 rounded-full font-semibold border border-green-100">
            Activo
          </span>
        ) : (
          <span className="bg-red-100 text-red-800 text-xs px-3 py-1 rounded-full font-semibold border border-red-200">
            Inactivo
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            disabled={isMutating || esPropiaCuenta}
            onClick={() => onToggleActivo(usuario)}
            className="bg-yellow-500 hover:bg-yellow-600 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          >
            {usuario.is_active ? "Desactivar" : "Activar"}
          </button>
          <button
            type="button"
            disabled={isMutating || esPropiaCuenta}
            onClick={() => onEliminar(usuario)}
            className="bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          >
            Eliminar
          </button>
        </div>
      </td>
    </tr>
  );
}
