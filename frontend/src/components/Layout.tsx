import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../hooks/useAuth";
import { useCarrito } from "../hooks/useCarrito";
import { fetchPedidos } from "../api/pedidosApi";
import type { Pedido } from "../models/Pedido";
import { usePermissions } from "../hooks/useRoles";
import {
  countUnreadClientPedidoUpdates,
  countUnreadOperatorPedidos,
  syncClientPedidoStatuses,
  syncSeenPedidos,
} from "../api/pedidosUnread";
import { useOrderStatusWS } from "../hooks/useOrderStatusWS";

type ThemeMode = "light" | "dark";
type NavLink = {
  name: string;
  path: string;
  badge?: number;
};

const THEME_KEY = "panel-theme-mode";
const FETCH_LIMIT = 100;

async function fetchAllPedidos(): Promise<Pedido[]> {
  let offset = 0;
  let total = Number.POSITIVE_INFINITY;
  const all: Pedido[] = [];

  while (offset < total) {
    const response = await fetchPedidos({ offset, limit: FETCH_LIMIT });
    total = response.total ?? all.length;
    all.push(...(response.items ?? []));
    if (!response.items?.length) break;
    offset += FETCH_LIMIT;
  }

  return all;
}

function readSavedTheme(): ThemeMode {
  const saved = window.localStorage.getItem(THEME_KEY);
  return saved === "dark" ? "dark" : "light";
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden="true">
      <path
        d="M21 12.8A9 9 0 1 1 11.2 3a7.2 7.2 0 1 0 9.8 9.8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 2v2.2M12 19.8V22M2 12h2.2M19.8 12H22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(() => readSavedTheme());

  const location = useLocation();
  const { token, user, logout } = useAuth();
  const userId = user?.id;
  const { canManageUsuarios, canManagePedidos, canViewPedidos, canUseCarrito, roleLabel } = usePermissions();
  const { totalItems } = useCarrito();
  const wsStatus = useOrderStatusWS(Boolean(userId), token);
  const { data: pedidosOperador = [] } = useQuery({
    queryKey: ["pedidos", "all", "navbar"],
    queryFn: fetchAllPedidos,
    enabled: canViewPedidos,
    refetchInterval: 30000,
  });
  const { data: pedidosCliente = [] } = useQuery({
    queryKey: ["mis-pedidos", "navbar"],
    queryFn: fetchAllPedidos,
    enabled: canUseCarrito,
    refetchInterval: 30000,
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const closeMenu = () => setIsMenuOpen(false);

  const toggleTheme = () => setTheme((prev) => (prev === "light" ? "dark" : "light"));
  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    if (!canViewPedidos || !userId) return;
    syncSeenPedidos(userId, pedidosOperador);
  }, [canViewPedidos, pedidosOperador, userId]);

  useEffect(() => {
    if (!canUseCarrito || !userId) return;
    syncClientPedidoStatuses(userId, pedidosCliente);
  }, [canUseCarrito, pedidosCliente, userId]);

  const unreadPedidos = useMemo(() => {
    if (!canViewPedidos || !userId) return 0;
    return countUnreadOperatorPedidos(userId, pedidosOperador);
  }, [canViewPedidos, pedidosOperador, userId]);

  const unreadMisPedidos = useMemo(() => {
    if (!canUseCarrito || !userId) return 0;
    return countUnreadClientPedidoUpdates(userId, pedidosCliente);
  }, [canUseCarrito, pedidosCliente, userId]);

  const navLinks: NavLink[] = [
    { name: canUseCarrito ? "Catalogo" : "Productos", path: "/productos" },
    ...(!canUseCarrito ? [{ name: "Categorias", path: "/categorias" }] : []),
    ...(!canUseCarrito ? [{ name: "Ingredientes", path: "/ingredientes" }] : []),
    ...(canUseCarrito ? [{ name: `Carrito${totalItems > 0 ? ` (${totalItems})` : ""}`, path: "/carrito" }] : []),
    ...(canUseCarrito ? [{ name: "Mis pedidos", path: "/mis-pedidos", badge: unreadMisPedidos }] : []),
    ...(canViewPedidos ? [{ name: "Pedidos", path: "/pedidos", badge: unreadPedidos }] : []),
    ...(canManagePedidos ? [{ name: "Estadisticas", path: "/estadisticas" }] : []),
    ...(canManageUsuarios ? [{ name: "Usuarios", path: "/usuarios" }] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900 dark:text-slate-100 transition-colors">
      <nav className="bg-white/90 dark:bg-slate-950/80 backdrop-blur-xl shadow-sm border-b border-gray-200/80 dark:border-slate-700/70 sticky top-0 z-50 transition-colors">
        <div className="w-full px-3 sm:px-4 lg:px-5">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <Link to="/" className="flex-shrink-0 flex items-center gap-3" onClick={closeMenu}>
                <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">
                  P
                </div>
                <span className="font-bold text-xl tracking-tight text-gray-800 dark:text-slate-100 hidden sm:block">
                  PanelGestion
                </span>
              </Link>
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === "light" ? "Activar modo noche" : "Activar modo dia"}
                title={theme === "light" ? "Modo noche" : "Modo dia"}
                className="hidden md:inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors bg-gray-100/90 dark:bg-slate-800/90 text-gray-700 dark:text-slate-100 border-gray-200 dark:border-slate-700 hover:bg-gray-200 dark:hover:bg-slate-700/90"
              >
                {theme === "light" ? <MoonIcon /> : <SunIcon />}
              </button>
            </div>

            <div className="hidden md:flex items-center gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    isActive(link.path)
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/35 dark:text-blue-100 shadow-sm border border-blue-100 dark:border-blue-700/70"
                      : "text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800/80 hover:text-gray-900 dark:hover:text-slate-100 border border-transparent"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    {link.name}
                    {!!link.badge && (
                      <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-red-600 text-white text-[11px] font-bold px-1.5">
                        {link.badge}
                      </span>
                    )}
                  </span>
                </Link>
              ))}

              <span className="text-sm text-gray-600 dark:text-slate-300 ml-3 px-2.5 py-1 rounded-md bg-white/60 dark:bg-slate-900/70 border border-gray-200/70 dark:border-slate-700/70">{user?.email}</span>
              {roleLabel && (
                <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-800/60 px-2 py-1 rounded-md">
                  {roleLabel}
                </span>
              )}
              {userId && (
                <span className={`text-xs font-semibold px-2 py-1 rounded-md border ${
                  wsStatus === "connected"
                    ? "text-emerald-700 bg-emerald-50 border-emerald-100 dark:text-emerald-100 dark:bg-emerald-900/40 dark:border-emerald-800"
                    : "text-amber-700 bg-amber-50 border-amber-100 dark:text-amber-100 dark:bg-amber-900/40 dark:border-amber-800"
                }`}>
                  {wsStatus === "connected" ? "Tiempo real" : "Sin conexion WS"}
                </span>
              )}

              <button
                type="button"
                onClick={logout}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-red-700 dark:text-red-100 bg-red-50 dark:bg-red-900/35 border border-red-100 dark:border-red-700/70 hover:bg-red-100 dark:hover:bg-red-900/55"
              >
                Salir
              </button>
            </div>

            <div className="flex items-center md:hidden gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === "light" ? "Activar modo noche" : "Activar modo dia"}
                className="inline-flex items-center justify-center p-2 rounded-lg text-gray-600 dark:text-slate-200 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
              >
                {theme === "light" ? <MoonIcon /> : <SunIcon />}
              </button>
              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 rounded-lg text-gray-500 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
                aria-expanded={isMenuOpen}
              >
                <span className="sr-only">Abrir menu principal</span>
                {!isMenuOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-white/95 dark:bg-slate-950/90 backdrop-blur-lg border-t border-gray-100 dark:border-slate-700 shadow-inner transition-colors">
            <div className="px-4 pt-2 pb-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={closeMenu}
                  className={`block px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                    isActive(link.path)
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200 border border-blue-100 dark:border-blue-800/60"
                      : "text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    {link.name}
                    {!!link.badge && (
                      <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-red-600 text-white text-[11px] font-bold px-1.5">
                        {link.badge}
                      </span>
                    )}
                  </span>
                </Link>
              ))}
              <div className="pt-2 px-4 space-y-2 border-t border-gray-100 dark:border-slate-700 mt-2">
                <div className="text-sm text-gray-600 dark:text-slate-300">{user?.email}</div>
                {roleLabel && (
                  <span className="inline-flex text-xs font-semibold text-indigo-700 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-800/60 px-2 py-1 rounded-md">
                    {roleLabel}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    closeMenu();
                  }}
                  className="w-full px-3 py-2 rounded-lg text-sm font-semibold text-red-700 dark:text-red-200 bg-red-50 dark:bg-red-900/40 border border-red-100 dark:border-red-800/60 hover:bg-red-100 dark:hover:bg-red-900/60"
                >
                  Salir
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-grow max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>

      <footer className="bg-white/90 dark:bg-slate-950/80 backdrop-blur-xl border-t border-gray-200 dark:border-slate-700 mt-auto transition-colors">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500 dark:text-slate-400 font-medium">
            &copy; {new Date().getFullYear()} PanelGestion. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
