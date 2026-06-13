import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Producto } from "../models/Producto";
import { useProductos } from "../hooks/useProducto";
import { usePermissions } from "../hooks/useRoles";
import { useCarrito } from "../hooks/useCarrito";
import { api } from "../api/http";
import { formatStockWithUnit } from "../utils/stock";

export function ProductoDetallePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const { canManageCatalogo, isClient, isStock } = usePermissions();
  const { productos, eliminar, cambiarEstado, actualizarStock } = useProductos();
  const { agregarProducto } = useCarrito();
  const [confirmDesactivarOpen, setConfirmDesactivarOpen] = useState(false);
  const [stockDraft, setStockDraft] = useState("");
  const [stockMessage, setStockMessage] = useState<string | null>(null);
  const [savingStock, setSavingStock] = useState(false);
  const [cartMessage, setCartMessage] = useState<{ id: number; message: string } | null>(null);

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

  useEffect(() => {
    if (!producto) return;
    setStockDraft(String(producto.stock_cantidad ?? 0));
  }, [producto]);

  useEffect(() => {
    if (!cartMessage) return;
    const id = window.setTimeout(() => setCartMessage(null), 3000);
    return () => window.clearTimeout(id);
  }, [cartMessage]);

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

  const handleGuardarStock = async () => {
    if (!producto?.id) return;
    const nuevoStock = Number.parseInt(stockDraft, 10);
    if (Number.isNaN(nuevoStock) || nuevoStock < 0) {
      setStockMessage("El stock debe ser un numero entero mayor o igual a 0.");
      return;
    }
    try {
      setSavingStock(true);
      await actualizarStock(producto.id, nuevoStock);
      setStockMessage(`Stock actualizado para "${producto.nombre}".`);
      queryClient.invalidateQueries({ queryKey: ["catalogo", "productos", "detalle", producto.id] });
    } catch {
      setStockMessage("No se pudo actualizar el stock.");
    } finally {
      setSavingStock(false);
    }
  };

  const handleAgregarAlCarrito = () => {
    if (!producto || producto.stock_cantidad <= 0 || !producto.is_active) return;
    agregarProducto(producto, 1);
    setCartMessage({ id: Date.now(), message: `1 ${producto.nombre} agregado al carrito!` });
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

            {isClient && (
              <button
                type="button"
                onClick={handleAgregarAlCarrito}
                disabled={producto.stock_cantidad <= 0 || !producto.is_active}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="text-lg leading-none" aria-hidden="true">+</span>
                Agregar al carrito
              </button>
            )}

            {isStock && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                <label className="block text-sm font-semibold text-gray-700" htmlFor="stock-detalle">
                  Modificar stock
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    id="stock-detalle"
                    type="number"
                    min={0}
                    value={stockDraft}
                    onChange={(e) => {
                      setStockDraft(e.target.value);
                      setStockMessage(null);
                    }}
                    className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => { void handleGuardarStock(); }}
                    disabled={savingStock}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingStock ? "Guardando..." : "Guardar"}
                  </button>
                </div>
                {stockMessage && <p className="text-sm text-blue-700">{stockMessage}</p>}
              </div>
            )}

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

      {cartMessage && (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-lg">
          {cartMessage.message}
        </div>
      )}
    </div>
  );
}
