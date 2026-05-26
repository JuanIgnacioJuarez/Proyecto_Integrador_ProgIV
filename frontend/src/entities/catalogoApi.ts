import { api } from "../shared/api/http";
import { Categoria } from "./Categoria";
import { Ingrediente } from "./Ingrediente";
import { Producto } from "./Producto";

interface PaginatedResponse<T> {
  total: number;
  items: T[];
}

interface BasePageParams {
  offset?: number;
  limit?: number;
}

interface ProductosPageParams extends BasePageParams {
  search?: string;
  categoria_id?: number;
  ingrediente_id?: number;
}

interface CategoriasPageParams extends BasePageParams {
  search?: string;
  parent_id?: number;
}

interface IngredientesPageParams extends BasePageParams {
  name?: string;
  es_alergeno?: boolean;
}

export async function fetchProductosPage(
  params: ProductosPageParams,
): Promise<PaginatedResponse<Producto>> {
  const { data } = await api.get<PaginatedResponse<Producto>>("/productos", {
    params: {
      offset: params.offset ?? 0,
      limit: params.limit ?? 10,
      search: params.search || undefined,
      categoria_id: params.categoria_id ?? undefined,
      ingrediente_id: params.ingrediente_id ?? undefined,
    },
  });
  return { total: data.total, items: data.items.map((item) => new Producto(item)) };
}

export async function fetchCategoriasPage(
  params: CategoriasPageParams,
): Promise<PaginatedResponse<Categoria>> {
  const { data } = await api.get<PaginatedResponse<Categoria>>("/categorias", {
    params: {
      offset: params.offset ?? 0,
      limit: params.limit ?? 10,
      search: params.search || undefined,
      parent_id: params.parent_id ?? undefined,
    },
  });
  return { total: data.total, items: data.items.map((item) => new Categoria(item)) };
}

export async function fetchIngredientesPage(
  params: IngredientesPageParams,
): Promise<PaginatedResponse<Ingrediente>> {
  const { data } = await api.get<PaginatedResponse<Ingrediente>>("/ingredientes", {
    params: {
      offset: params.offset ?? 0,
      limit: params.limit ?? 10,
      name: params.name || undefined,
      es_alergeno: params.es_alergeno ?? undefined,
    },
  });
  return { total: data.total, items: data.items.map((item) => new Ingrediente(item)) };
}
