/* eslint-disable react-refresh/only-export-components */
import { createContext, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Ingrediente } from "./Ingrediente";
import { api, getApiErrorMessage } from "../shared/api/http";

export interface IngredientesContextType {
  ingredientes: Ingrediente[];
  error: string | null;
  limpiarError: () => void;
  agregar: (i: Ingrediente) => void;
  eliminar: (id: number) => void;
  editar: (i: Ingrediente) => void;
  resetear: () => void;
}

export const IngredientesContext = createContext<IngredientesContextType | undefined>(undefined);

const QUERY_KEY = ["catalogo", "ingredientes"] as const;

async function fetchIngredientes(): Promise<Ingrediente[]> {
  const { data } = await api.get<{ total?: number; items?: Ingrediente[] } | Ingrediente[]>("/ingredientes", {
    params: { offset: 0, limit: 100 },
  });
  const lista = Array.isArray(data) ? data : (data.items ?? []);
  return lista.map((i) => new Ingrediente(i));
}

export const IngredientesProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();
  const [mutationError, setMutationError] = useState<string | null>(null);

  const { data, isError, error } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchIngredientes,
  });

  const invalidateIngredientes = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  };

  const agregarMutation = useMutation({
    mutationFn: async (i: Ingrediente) => {
      await api.post("/ingredientes", i);
    },
    onSuccess: () => {
      setMutationError(null);
      invalidateIngredientes();
    },
    onError: (err) => setMutationError(getApiErrorMessage(err, "No se pudo guardar el ingrediente")),
  });

  const editarMutation = useMutation({
    mutationFn: async (i: Ingrediente) => {
      await api.patch(`/ingredientes/${i.id}`, i);
    },
    onSuccess: () => {
      setMutationError(null);
      invalidateIngredientes();
    },
    onError: (err) => setMutationError(getApiErrorMessage(err, "No se pudo editar el ingrediente")),
  });

  const eliminarMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/ingredientes/${id}`);
    },
    onSuccess: () => {
      setMutationError(null);
      invalidateIngredientes();
    },
    onError: (err) => setMutationError(getApiErrorMessage(err, "No se pudo eliminar el ingrediente")),
  });

  const agregar = (i: Ingrediente) => agregarMutation.mutate(i);
  const editar = (i: Ingrediente) => editarMutation.mutate(i);
  const eliminar = (id: number) => eliminarMutation.mutate(id);

  const resetear = () => {
    queryClient.setQueryData(QUERY_KEY, [] as Ingrediente[]);
  };

  const limpiarError = () => setMutationError(null);

  const queryError = isError ? getApiErrorMessage(error, "No se pudo cargar el listado de ingredientes") : null;

  return (
    <IngredientesContext.Provider
      value={{
        ingredientes: data ?? [],
        error: mutationError ?? queryError,
        limpiarError,
        agregar,
        eliminar,
        editar,
        resetear,
      }}
    >
      {children}
    </IngredientesContext.Provider>
  );
};

