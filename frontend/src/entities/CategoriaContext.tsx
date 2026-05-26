/* eslint-disable react-refresh/only-export-components */
import { createContext, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Categoria } from "./Categoria";
import { api, getApiErrorMessage } from "../shared/api/http";

export interface CategoriasContextType {
  categorias: Categoria[];
  error: string | null;
  limpiarError: () => void;
  agregar: (c: Categoria) => void;
  eliminar: (id: number) => void;
  editar: (c: Categoria) => void;
  resetear: () => void;
}

export const CategoriasContext = createContext<CategoriasContextType | undefined>(undefined);

const QUERY_KEY = ["catalogo", "categorias"] as const;

async function fetchCategorias(): Promise<Categoria[]> {
  const { data } = await api.get<{ total?: number; items?: Categoria[] } | Categoria[]>("/categorias", {
    params: { offset: 0, limit: 100 },
  });
  const lista = Array.isArray(data) ? data : (data.items ?? []);
  return lista.map((c) => new Categoria(c));
}

export const CategoriasProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();
  const [mutationError, setMutationError] = useState<string | null>(null);

  const { data, isError, error } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchCategorias,
  });

  const invalidateCategorias = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  };

  const agregarMutation = useMutation({
    mutationFn: async (c: Categoria) => {
      await api.post("/categorias", c);
    },
    onSuccess: () => {
      setMutationError(null);
      invalidateCategorias();
    },
    onError: (err) => setMutationError(getApiErrorMessage(err, "No se pudo guardar la categoria")),
  });

  const editarMutation = useMutation({
    mutationFn: async (c: Categoria) => {
      await api.patch(`/categorias/${c.id}`, c);
    },
    onSuccess: () => {
      setMutationError(null);
      invalidateCategorias();
    },
    onError: (err) => setMutationError(getApiErrorMessage(err, "No se pudo editar la categoria")),
  });

  const eliminarMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/categorias/${id}`);
    },
    onSuccess: () => {
      setMutationError(null);
      invalidateCategorias();
    },
    onError: (err) => setMutationError(getApiErrorMessage(err, "No se pudo eliminar la categoria")),
  });

  const agregar = (c: Categoria) => agregarMutation.mutate(c);
  const editar = (c: Categoria) => editarMutation.mutate(c);
  const eliminar = (id: number) => eliminarMutation.mutate(id);

  const resetear = () => {
    queryClient.setQueryData(QUERY_KEY, [] as Categoria[]);
  };

  const limpiarError = () => setMutationError(null);

  const queryError = isError ? getApiErrorMessage(error, "No se pudo cargar el listado de categorias") : null;

  return (
    <CategoriasContext.Provider
      value={{
        categorias: data ?? [],
        error: mutationError ?? queryError,
        limpiarError,
        agregar,
        eliminar,
        editar,
        resetear,
      }}
    >
      {children}
    </CategoriasContext.Provider>
  );
};

