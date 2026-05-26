import axios from "axios";

/**
 * Instancia unica de Axios para todo el frontend.
 *
 * - baseURL: se toma de VITE_API_URL (fallback localhost:8000).
 * - withCredentials: true para enviar/recibir cookies httpOnly.
 * - interceptor: ante 401 limpia sesion local y redirige a login.
 */
function resolveApiOrigin(): string {
  const configured = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  const fallback = typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:8000`
    : "http://localhost:8000";

  const rawOrigin = configured || fallback;

  try {
    const url = new URL(rawOrigin);
    if (typeof window !== "undefined") {
      const loopbacks = new Set(["localhost", "127.0.0.1"]);
      const browserHost = window.location.hostname;
      if (
        loopbacks.has(url.hostname)
        && loopbacks.has(browserHost)
        && url.hostname !== browserHost
      ) {
        url.hostname = browserHost;
      }
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    return rawOrigin.replace(/\/$/, "");
  }
}

export const api = axios.create({
  baseURL: `${resolveApiOrigin()}/api/v1`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise: Promise<void> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const originalRequest = error.config as (typeof error.config & { _retry?: boolean }) | undefined;
    const requestUrl = originalRequest?.url ?? "";

    // Si expira el access token, intentamos refrescar una sola vez y reintentar.
    if (
      status === 401
      && originalRequest
      && !originalRequest._retry
      && !requestUrl.includes("/auth/login")
      && !requestUrl.includes("/auth/refresh")
      && !requestUrl.includes("/auth/logout")
    ) {
      originalRequest._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = api
            .post("/auth/refresh")
            .then(() => undefined)
            .finally(() => {
              refreshPromise = null;
            });
        }
        await refreshPromise;
        return api(originalRequest);
      } catch {
        // Si falla refresh, seguimos con logout y redirección.
      }
    }

    if (status === 401) {
      localStorage.removeItem("auth_user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

/**
 * Normaliza errores de FastAPI.
 * Puede llegar `detail` string o array de errores de validacion.
 */
export function getApiErrorMessage(error: unknown, fallback = "Ocurrio un error"): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { detail?: unknown } | undefined;
    const detail = data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      return detail
        .map((d: { msg?: string }) => d.msg ?? JSON.stringify(d))
        .join(" | ");
    }
    return error.message || fallback;
  }
  return fallback;
}
