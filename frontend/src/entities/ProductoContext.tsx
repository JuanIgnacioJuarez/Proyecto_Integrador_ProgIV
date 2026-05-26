/* eslint-disable react-refresh/only-export-components */
import { createContext, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Producto } from "./Producto";
import { api, getApiErrorMessage } from "../shared/api/http";

export interface ProductosContextType {
  productos: Producto[];
  error: string | null;
  limpiarError: () => void;
  agregar: (p: Producto) => void;
  eliminar: (id: number) => void;
  editar: (p: Producto) => void;
  actualizarStock: (id: number, stockCantidad: number) => Promise<void>;
  resetear: () => void;
}

export const ProductosContext = createContext<ProductosContextType | undefined>(undefined);

const QUERY_KEY = ["catalogo", "productos"] as const;

async function fetchProductos(): Promise<Producto[]> {
  const { data } = await api.get<{ total?: number; items?: Producto[] } | Producto[]>("/productos", {
    params: { offset: 0, limit: 100 },
  });
  const lista = Array.isArray(data) ? data : (data.items ?? []);
  return lista.map((p) => new Producto(p));
}

export const ProductosProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();
  const [mutationError, setMutationError] = useState<string | null>(null);

  const { data, isError, error } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchProductos,
  });

  const invalidateProductos = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  };

  const agregarMutation = useMutation({
    mutationFn: async (p: Producto) => {
      await api.post("/productos", p);
    },
    onSuccess: () => {
      setMutationError(null);
      invalidateProductos();
    },
    onError: (err) => setMutationError(getApiErrorMessage(err, "No se pudo guardar el producto")),
  });

  const editarMutation = useMutation({
    mutationFn: async (p: Producto) => {
      await api.patch(`/productos/${p.id}`, p);
    },
    onSuccess: () => {
      setMutationError(null);
      invalidateProductos();
    },
    onError: (err) => setMutationError(getApiErrorMessage(err, "No se pudo editar el producto")),
  });

  const eliminarMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/productos/${id}`);
    },
    onSuccess: () => {
      setMutationError(null);
      invalidateProductos();
    },
    onError: (err) => setMutationError(getApiErrorMessage(err, "No se pudo eliminar el producto")),
  });

  const stockMutation = useMutation({
    mutationFn: async ({ id, stockCantidad }: { id: number; stockCantidad: number }) => {
      await api.patch(`/productos/${id}/stock`, { stock_cantidad: stockCantidad });
    },
    onSuccess: () => {
      setMutationError(null);
      invalidateProductos();
    },
  });

  const agregar = (p: Producto) => {
    agregarMutation.mutate(p);
  };

  const editar = (p: Producto) => {
    editarMutation.mutate(p);
  };

  const eliminar = (id: number) => {
    eliminarMutation.mutate(id);
  };

  const actualizarStock = async (id: number, stockCantidad: number) => {
    try {
      await stockMutation.mutateAsync({ id, stockCantidad });
    } catch (err) {
      const msg = getApiErrorMessage(err, "No se pudo actualizar stock");
      setMutationError(msg);
      throw err;
    }
  };

  const resetear = () => {
    queryClient.setQueryData(QUERY_KEY, [] as Producto[]);
  };

  const limpiarError = () => setMutationError(null);

  const queryError = isError ? getApiErrorMessage(error, "No se pudo cargar el listado de productos") : null;

  return (
    <ProductosContext.Provider
      value={{
        productos: data ?? [],
        error: mutationError ?? queryError,
        limpiarError,
        agregar,
        eliminar,
        editar,
        actualizarStock,
        resetear,
      }}
    >
      {children}
    </ProductosContext.Provider>
  );
};

