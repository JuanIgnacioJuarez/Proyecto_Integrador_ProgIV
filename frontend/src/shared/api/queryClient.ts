import { QueryClient } from "@tanstack/react-query";

/**
 * Cliente global de TanStack Query.
 * Configuración conservadora: 1 reintento y datos frescos por 30s.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});
