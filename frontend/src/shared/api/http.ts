import axios from "axios";

/**
 * Instancia única de Axios para todo el panel de administración.
 *
 * - baseURL: se toma de VITE_API_URL (fallback a localhost:8000).
 * - Request interceptor: adjunta el token Bearer guardado en localStorage.
 * - Response interceptor: ante un 401 limpia la sesión y redirige al login.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request interceptor ─────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor ────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token vencido o inválido: limpiamos la sesión.
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

/**
 * Normaliza el mensaje de error de una respuesta de FastAPI.
 * FastAPI suele devolver { detail: "..." } o un array de errores de Pydantic.
 */
export function getApiErrorMessage(error: unknown, fallback = "Ocurrió un error"): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { detail?: unknown } | undefined;
    const detail = data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      // Errores de validación de Pydantic: [{ loc, msg, type }, ...]
      return detail
        .map((d: { msg?: string }) => d.msg ?? JSON.stringify(d))
        .join(" · ");
    }
    return error.message || fallback;
  }
  return fallback;
}
