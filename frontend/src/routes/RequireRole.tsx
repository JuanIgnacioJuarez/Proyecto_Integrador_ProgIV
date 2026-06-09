import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface RequireRoleProps {
  allowed: string[];
}

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
