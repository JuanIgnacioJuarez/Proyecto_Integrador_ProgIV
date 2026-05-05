import { createContext, useEffect, useMemo, useState } from "react";
import type { AuthUser, TokenResponse } from "./Auth";

interface AuthContextType {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/auth`;

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("auth_token");
    const savedUser = localStorage.getItem("auth_user");

    if (savedToken) {
      setToken(savedToken);
    }
    if (savedUser) {
      setUser(JSON.parse(savedUser) as AuthUser);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error("Email o contraseña inválidos");
    }

    const data = (await response.json()) as TokenResponse;
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem("auth_token", data.access_token);
    localStorage.setItem("auth_user", JSON.stringify(data.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
  };

  const value = useMemo(
    () => ({ token, user, isAuthenticated: Boolean(token), login, logout }),
    [token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
