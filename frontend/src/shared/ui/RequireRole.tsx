import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../entities/useAuth";

interface RequireRoleProps {
  /** Roles permitidos para acceder a las rutas hijas. */
  allowed: string[];
}

/**
 * Protección de rutas por ROL (complementa a RequireAuth, que solo verifica
 * que haya sesión iniciada).
 *
 * - Si no hay sesión → redirige a /login.
 * - Si el rol del usuario no está permitido → redirige al inicio.
 */
export function RequireRole({ allowed }: RequireRoleProps) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user || !allowed.includes(user.rol)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
