import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { Producto } from "../models/Producto";
import { useProductos } from "../hooks/useProducto";
import { usePermissions } from "../hooks/useRoles";
import { api } from "../api/http";
import { formatStockWithUnit } from "../utils/stock";

export function ProductoDetallePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { canManageCatalogo } = usePermissions();
  const { productos, eliminar, cambiarEstado } = useProductos();
  const [confirmDesactivarOpen, setConfirmDesactivarOpen] = useState(false);

  const productoId = id ? Number(id) : null;
  const productoEnMemoria =
    productoId && Number.isFinite(productoId) ? productos.find((p) => p.id === productoId) ?? null : null;

  const { data: productoDesdeApi, isLoading } = useQuery({
    queryKey: ["catalogo", "productos", "detalle", productoId],
    queryFn: async () => {
      const { data } = await api.get(`/productos/${productoId}`);
      return new Producto(data);
    },
    enabled: Boolean(productoId && !productoEnMemoria),
  });

  const producto = productoEnMemoria ?? productoDesdeApi ?? null;
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo;
  const returnPage = (location.state as { returnPage?: number } | null)?.returnPage;
  const returnState = (location.state as {
    returnState?: {
      searchTerm?: string;
      categoriaFiltroId?: number | "";
      ingredientesFiltro?: number[];
      estadoFiltro?: "" | "activo" | "inactivo";
      sortBy?: "nombre" | "precio" | "stock" | "";
      sortDir?: "asc" | "desc";
    };
  } | null)?.returnState;
  const volverAlCatalogoState = returnTo ? { restorePage: returnPage, restoreState: returnState } : undefined;

  const apiOrigin = useMemo(() => (api.defaults.baseURL || "").replace(/\/api\/v1\/?$/, ""), []);
  const mainImage = producto?.imagenes_url?.[0];
  const mainImageResolved = mainImage?.startsWith("/uploads/") ? `${apiOrigin}${mainImage}` : mainImage;

  const handleEliminar = async () => {
    if (!producto?.id) return;
    await eliminar(producto.id);
    navigate(returnTo || "/productos", { state: volverAlCatalogoState });
  };

  const handleReactivar = async () => {
    if (!producto?.id) return;
    await cambiarEstado(producto.id, true);
    navigate(0);
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <p className="text-gray-600">Cargando producto...</p>
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <p className="text-gray-700">No se encontro el producto.</p>
        <Link
          to={returnTo || "/productos"}
          state={volverAlCatalogoState}
          className="inline-block bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Volver al catalogo
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-3xl font-black text-gray-900">{producto.nombre}</h1>
        <Link
          to={returnTo || "/productos"}
          state={volverAlCatalogoState}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Volver al catalogo
        </Link>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 flex items-center justify-center min-h-72">
            {mainImageResolved ? (
              <img
                src={mainImageResolved}
                alt={`Imagen de ${producto.nombre}`}
                className="max-h-80 w-auto object-contain rounded-xl"
              />
            ) : (
              <div className="text-sm text-gray-500">Sin imagen</div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-sm uppercase tracking-wide text-gray-500 font-semibold">Descripcion</h2>
              <p className="mt-1 text-gray-700 text-base leading-relaxed">{producto.descripcion || "Sin descripcion"}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="text-lg font-bold px-3 py-1.5 rounded-lg border bg-blue-50 text-blue-700 border-blue-100">
                ${producto.precio_base}
              </span>
              <span className="text-lg font-semibold px-3 py-1.5 rounded-lg border bg-gray-50 text-gray-700 border-gray-200">
                {formatStockWithUnit(producto.stock_cantidad, "unidad")}
              </span>
              {producto.is_active ? (
                <span className="text-sm font-semibold px-3 py-1.5 rounded-full border bg-emerald-100 text-emerald-800 border-emerald-200">
                  Activo
                </span>
              ) : (
                <span className="text-sm font-semibold px-3 py-1.5 rounded-full border bg-red-100 text-red-800 border-red-200">
                  Inactivo
                </span>
              )}
            </div>

            <div>
              <h2 className="text-sm uppercase tracking-wide text-gray-500 font-semibold">Categorias</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {producto.categorias && producto.categorias.length > 0 ? (
                  producto.categorias.map((cat) => (
                    <span key={cat.id} className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-md border border-blue-100">
                      {cat.nombre}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400 text-sm">Sin categorias</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm uppercase tracking-wide text-gray-500 font-semibold">Ingredientes</h2>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
            {producto.ingredientes && producto.ingredientes.length > 0 ? (
              producto.ingredientes.map((ing) => (
                <div
                  key={ing.id}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    ing.es_alergeno ? "bg-red-50 text-red-700 border-red-100" : "bg-green-50 text-green-700 border-green-100"
                  }`}
                >
                  <div className="font-medium">{ing.nombre}</div>
                  <div className="text-xs opacity-80">
                    {ing.cantidad ? `Cantidad por unidad: ${formatStockWithUnit(ing.cantidad, ing.unidad_medida)}` : "Sin cantidad cargada"}
                  </div>
                </div>
              ))
            ) : (
              <span className="text-gray-400 text-sm">Sin ingredientes</span>
            )}
          </div>
        </div>

        {canManageCatalogo && (
          <div className="pt-2 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() =>
                navigate(`/productos/${producto.id}/editar`, {
                  state: {
                    returnTo: returnTo || "/productos",
                    returnPage,
                    returnState,
                  },
                })
              }
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Editar
            </button>
            {producto.is_active ? (
              <button
                type="button"
                onClick={() => setConfirmDesactivarOpen(true)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Eliminar
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleReactivar()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Reactivar
              </button>
            )}
          </div>
        )}
      </div>

      {confirmDesactivarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setConfirmDesactivarOpen(false)}
            className="absolute inset-0 bg-black/40"
            aria-label="Cerrar confirmacion"
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirmar desactivacion</h3>
            <p className="text-sm text-gray-600 mb-5">
              Vas a desactivar este producto. Lo vas a poder reactivar cuando quieras.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDesactivarOpen(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleEliminar();
                  setConfirmDesactivarOpen(false);
                }}
                className="px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
