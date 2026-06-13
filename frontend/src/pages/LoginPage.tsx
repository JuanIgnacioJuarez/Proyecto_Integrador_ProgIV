import axios from "axios";
import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

type LockoutNotice = {
  message: string;
  retryAfterSeconds: number | null;
};

function formatWait(seconds: number | null): string {
  if (!seconds || seconds <= 0) return "unos minutos";
  const minutes = Math.ceil(seconds / 60);
  return minutes === 1 ? "1 minuto" : `${minutes} minutos`;
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@foodstore.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const [lockoutNotice, setLockoutNotice] = useState<LockoutNotice | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLockoutNotice(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      const cause = err instanceof Error ? err.cause : undefined;
      if (axios.isAxiosError(cause) && cause.response?.status === 429) {
        const retryAfterRaw = cause.response.headers["retry-after"];
        const retryAfter = Number.parseInt(String(retryAfterRaw ?? ""), 10);
        setLockoutNotice({
          message: "Se bloquearon temporalmente los intentos de ingreso.",
          retryAfterSeconds: Number.isFinite(retryAfter) ? retryAfter : null,
        });
      }
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Iniciar sesion</h1>
        <p className="text-sm text-gray-600 mb-6">Accede al panel con tu usuario</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contrasena</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-4 py-2 disabled:opacity-60"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>

      {lockoutNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setLockoutNotice(null)}
            className="absolute inset-0 bg-slate-950/50"
            aria-label="Cerrar aviso de bloqueo"
          />
          <div className="relative w-full max-w-md rounded-2xl border border-red-100 bg-white p-6 shadow-xl">
            <button
              type="button"
              onClick={() => setLockoutNotice(null)}
              className="absolute right-4 top-4 h-8 w-8 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
              aria-label="Cerrar"
            >
              x
            </button>
            <h2 className="text-xl font-bold text-gray-900">Ingreso bloqueado</h2>
            <p className="mt-3 text-sm text-gray-600">
              {lockoutNotice.message} Espera {formatWait(lockoutNotice.retryAfterSeconds)} antes de volver a intentar.
            </p>
            <button
              type="button"
              onClick={() => setLockoutNotice(null)}
              className="mt-6 w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
