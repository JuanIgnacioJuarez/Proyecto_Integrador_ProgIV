import React, { useEffect, useMemo, useState } from "react";

import { Producto } from "../entities/Producto";
import { useProductos } from "../entities/useProducto";
import { useCategorias } from "../entities/useCategoria";
import { useIngredientes } from "../entities/useIngrediente";
import { formatStockWithUnit } from "../shared/format/stock";

interface Props {
  productoAEditar?: Producto | null;
  onCancelarEdicion?: () => void;
  onSuccess?: () => void;
}

interface ErroresFormulario {
  nombre?: string;
  precio_base?: string;
  stock_cantidad?: string;
  categoria_id?: string;
  ingredientes?: string;
}

type IngredientesSeleccionados = Record<number, string>;

const estadoInicial = {
  nombre: "",
  descripcion: "",
  precio_base: 0 as number | string,
  stock_cantidad: 0 as number | string,
  imagenes_url: "",
  is_active: true,
  categoria_principal_id: "" as number | string,
  subcategoria_id: "" as number | string,
  ingredientes: {} as IngredientesSeleccionados,
};

const FormularioProducto: React.FC<Props> = ({ productoAEditar, onCancelarEdicion, onSuccess }) => {
  const { agregar, editar } = useProductos();
  const { categorias: listaCategorias } = useCategorias();
  const { ingredientes: listaIngredientes } = useIngredientes();

  const categoriasPrincipales = useMemo(
    () =>
      listaCategorias
        .filter((cat) => cat.parent_id === null && cat.is_active !== false)
        .sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
    [listaCategorias],
  );

  const resolverCategoriaEdicion = (
    categoriaId?: number,
  ): { categoriaPrincipalId: number | ""; subcategoriaId: number | "" } => {
    if (!categoriaId) return { categoriaPrincipalId: "", subcategoriaId: "" };
    const root = categoriasPrincipales.find((cat) => cat.id === categoriaId);
    if (root) return { categoriaPrincipalId: root.id ?? "", subcategoriaId: "" };

    for (const categoria of categoriasPrincipales) {
      const sub = (categoria.subCategorias || []).find((s) => s.id === categoriaId);
      if (sub) {
        return { categoriaPrincipalId: categoria.id ?? "", subcategoriaId: sub.id ?? "" };
      }
    }
    return { categoriaPrincipalId: "", subcategoriaId: "" };
  };

  const [datosForm, setDatosForm] = useState(() => {
    if (!productoAEditar) return estadoInicial;
    const selectedCategoria = resolverCategoriaEdicion(productoAEditar.categorias?.[0]?.id);
    return {
      nombre: productoAEditar.nombre,
      descripcion: productoAEditar.descripcion || "",
      precio_base: productoAEditar.precio_base,
      stock_cantidad: productoAEditar.stock_cantidad,
      imagenes_url: productoAEditar.imagenes_url?.join(", ") || "",
      is_active: productoAEditar.is_active ?? true,
      categoria_principal_id: selectedCategoria.categoriaPrincipalId,
      subcategoria_id: selectedCategoria.subcategoriaId,
      ingredientes: (productoAEditar.ingredientes || []).reduce((acc, ing) => {
        if (ing.id) {
          acc[ing.id] = String(ing.cantidad ?? 1);
        }
        return acc;
      }, {} as IngredientesSeleccionados),
    };
  });

  const [errores, setErrores] = useState<ErroresFormulario>({});

  useEffect(() => {
    if (productoAEditar) {
      const selectedCategoria = resolverCategoriaEdicion(productoAEditar.categorias?.[0]?.id);
      setDatosForm({
        nombre: productoAEditar.nombre,
        descripcion: productoAEditar.descripcion || "",
        precio_base: productoAEditar.precio_base,
        stock_cantidad: productoAEditar.stock_cantidad,
        imagenes_url: productoAEditar.imagenes_url?.join(", ") || "",
        is_active: productoAEditar.is_active ?? true,
        categoria_principal_id: selectedCategoria.categoriaPrincipalId,
        subcategoria_id: selectedCategoria.subcategoriaId,
        ingredientes: (productoAEditar.ingredientes || []).reduce((acc, ing) => {
          if (ing.id) {
            acc[ing.id] = String(ing.cantidad ?? 1);
          }
          return acc;
        }, {} as IngredientesSeleccionados),
      });
    } else {
      setDatosForm(estadoInicial);
    }
  }, [productoAEditar, categoriasPrincipales]);

  const subcategoriasDisponibles = useMemo(() => {
    const categoriaId = Number(datosForm.categoria_principal_id);
    const categoria = categoriasPrincipales.find((cat) => cat.id === categoriaId);
    return (categoria?.subCategorias || [])
      .filter((sub) => sub.id && sub.is_active !== false)
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [datosForm.categoria_principal_id, categoriasPrincipales]);

  const categoriaFinalId = useMemo(() => {
    if (datosForm.subcategoria_id) return Number(datosForm.subcategoria_id);
    if (datosForm.categoria_principal_id) return Number(datosForm.categoria_principal_id);
    return null;
  }, [datosForm.categoria_principal_id, datosForm.subcategoria_id]);

  const ingredientesFiltrados = useMemo(() => {
    if (!categoriaFinalId) return [];
    const idsPermitidos = new Set<number>([categoriaFinalId]);

    categoriasPrincipales.forEach((cat) => {
      if (cat.id === categoriaFinalId) {
        (cat.subCategorias || []).forEach((sub) => {
          if (sub.id) idsPermitidos.add(sub.id);
        });
      }
      (cat.subCategorias || []).forEach((sub) => {
        if (sub.id === categoriaFinalId && cat.id) {
          idsPermitidos.add(cat.id);
        }
      });
    });

    return listaIngredientes.filter((ing) => {
      if (!ing.is_active) return false;
      if (!ing.categoria_id) return true;
      return idsPermitidos.has(Number(ing.categoria_id));
    });
  }, [listaIngredientes, categoriaFinalId, categoriasPrincipales]);

  const stockMaximoPosible = useMemo(() => {
    const seleccionados = Object.entries(datosForm.ingredientes);
    if (seleccionados.length === 0) return null;

    let minimo = Number.POSITIVE_INFINITY;
    for (const [idRaw, cantidadRaw] of seleccionados) {
      const id = Number(idRaw);
      const ing = listaIngredientes.find((item) => item.id === id);
      if (!ing) continue;

      const cantidadPorUnidad = Number(cantidadRaw);
      if (!Number.isFinite(cantidadPorUnidad) || cantidadPorUnidad <= 0) return 0;

      const stockIng = Number(ing.stock_cantidad ?? 0);
      const posible = Math.floor(stockIng / cantidadPorUnidad);
      minimo = Math.min(minimo, posible);
    }

    if (!Number.isFinite(minimo)) return null;
    return Math.max(0, minimo);
  }, [datosForm.ingredientes, listaIngredientes]);

  const validarFormulario = () => {
    const nuevosErrores: ErroresFormulario = {};

    if (!datosForm.nombre.trim()) {
      nuevosErrores.nombre = "El nombre es obligatorio.";
    } else if (datosForm.nombre.trim().length < 3) {
      nuevosErrores.nombre = "El nombre debe tener al menos 3 caracteres.";
    }

    if (datosForm.precio_base === "" || Number(datosForm.precio_base) < 0) {
      nuevosErrores.precio_base = "El precio debe ser un numero valido mayor o igual a 0.";
    }

    if (datosForm.stock_cantidad === "" || Number(datosForm.stock_cantidad) < 0) {
      nuevosErrores.stock_cantidad = "El stock debe ser 0 o mayor.";
    }

    if (!datosForm.categoria_principal_id) {
      nuevosErrores.categoria_id = "Debes seleccionar una categoria.";
    }

    if (Object.keys(datosForm.ingredientes).length === 0) {
      nuevosErrores.ingredientes = "Debes seleccionar al menos un ingrediente.";
    }

    for (const [id, cantidadRaw] of Object.entries(datosForm.ingredientes)) {
      const cantidad = Number(cantidadRaw);
      if (Number.isNaN(cantidad) || cantidad <= 0) {
        nuevosErrores.ingredientes = `La cantidad del ingrediente #${id} debe ser mayor a 0.`;
        break;
      }
    }

    if (stockMaximoPosible !== null && Number(datosForm.stock_cantidad) > stockMaximoPosible) {
      nuevosErrores.stock_cantidad = `Stock insuficiente de ingredientes. Maximo posible: ${stockMaximoPosible}.`;
    }

    return nuevosErrores;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setDatosForm({ ...datosForm, [name]: checked });
      return;
    }

    if (type === "number" && (name === "precio_base" || name === "stock_cantidad")) {
      if (value === "") {
        setDatosForm({ ...datosForm, [name]: value });
        return;
      }
      const numericValue = Number(value.replace(",", "."));
      setDatosForm({ ...datosForm, [name]: Math.max(0, numericValue) });
      return;
    }

    if (name === "categoria_principal_id") {
      setDatosForm({
        ...datosForm,
        categoria_principal_id: value,
        subcategoria_id: "",
        ingredientes: {},
      });
      return;
    }

    if (name === "subcategoria_id") {
      setDatosForm({ ...datosForm, subcategoria_id: value, ingredientes: {} });
      return;
    }

    setDatosForm({ ...datosForm, [name]: value });
  };

  const toggleIngrediente = (id: number) => {
    setDatosForm((prev) => {
      const next = { ...prev.ingredientes };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = "1";
      }
      return { ...prev, ingredientes: next };
    });
  };

  const cambiarCantidadIngrediente = (id: number, value: string) => {
    setDatosForm((prev) => ({
      ...prev,
      ingredientes: {
        ...prev.ingredientes,
        [id]: value,
      },
    }));
  };

  const enviarFormulario = (e: React.FormEvent) => {
    e.preventDefault();
    const nuevosErrores = validarFormulario();
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    const imagenesArray = datosForm.imagenes_url
      .split(",")
      .map((url) => url.trim())
      .filter((url) => url !== "");

    const ingredientesPayload = Object.entries(datosForm.ingredientes).map(([id, cantidad]) => ({
      ingrediente_id: Number(id),
      cantidad: Number(cantidad),
    }));

    const categoriaPayload =
      datosForm.subcategoria_id !== ""
        ? Number(datosForm.subcategoria_id)
        : Number(datosForm.categoria_principal_id);

    const p = new Producto({
      nombre: datosForm.nombre.trim(),
      descripcion: datosForm.descripcion.trim() || null,
      precio_base: Number(datosForm.precio_base),
      stock_cantidad: Number(datosForm.stock_cantidad),
      imagenes_url: imagenesArray,
      is_active: datosForm.is_active,
      categorias: [{ categoria_id: categoriaPayload }] as unknown as Producto["categorias"],
      ingredientes: ingredientesPayload as unknown as Producto["ingredientes"],
    });

    if (productoAEditar?.id) {
      p.id = productoAEditar.id;
      editar(p);
    } else {
      agregar(p);
    }

    setDatosForm(estadoInicial);
    setErrores({});
    onSuccess?.();
  };

  return (
    <form onSubmit={enviarFormulario} className="space-y-6">
      <p className="text-sm text-gray-500">Los campos con * son obligatorios.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
          <input
            type="text"
            name="nombre"
            value={datosForm.nombre}
            onChange={handleChange}
            className={`w-full border rounded p-2 ${errores.nombre ? "border-red-500" : "border-gray-300"}`}
          />
          {errores.nombre && <p className="text-red-500 text-xs mt-1">{errores.nombre}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Precio Base ($) *</label>
          <input
            type="number"
            min={0}
            step={1}
            name="precio_base"
            value={datosForm.precio_base}
            onChange={handleChange}
            className={`w-full border rounded p-2 ${errores.precio_base ? "border-red-500" : "border-gray-300"}`}
          />
          {errores.precio_base && <p className="text-red-500 text-xs mt-1">{errores.precio_base}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stock a producir *</label>
          <input
            type="number"
            min={0}
            step={1}
            name="stock_cantidad"
            value={datosForm.stock_cantidad}
            onChange={handleChange}
            className={`w-full border rounded p-2 ${errores.stock_cantidad ? "border-red-500" : "border-gray-300"}`}
          />
          <p className="text-xs text-gray-500 mt-1">
            {Object.keys(datosForm.ingredientes).length === 0
              ? "Selecciona ingredientes para calcular el maximo segun receta."
              : `Maximo segun ingredientes: ${stockMaximoPosible ?? "-"}`}
          </p>
          {errores.stock_cantidad && <p className="text-red-500 text-xs mt-1">{errores.stock_cantidad}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Imagenes</label>
          <input
            type="text"
            name="imagenes_url"
            value={datosForm.imagenes_url}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded p-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
        <textarea
          name="descripcion"
          rows={3}
          value={datosForm.descripcion}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded p-2"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_active"
          name="is_active"
          checked={datosForm.is_active}
          onChange={handleChange}
          className="w-4 h-4 text-blue-600 rounded"
        />
        <label htmlFor="is_active" className="text-sm text-gray-700">
          Producto activo
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
        <div className="space-y-3">
          <h3 className="font-bold text-gray-700 mb-2">Categoria *</h3>
          <select
            name="categoria_principal_id"
            value={datosForm.categoria_principal_id}
            onChange={handleChange}
            className={`w-full border rounded p-2 bg-white ${errores.categoria_id ? "border-red-500" : "border-gray-300"}`}
          >
            <option value="">Seleccionar categoria...</option>
            {categoriasPrincipales.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
          </select>

          <select
            name="subcategoria_id"
            value={datosForm.subcategoria_id}
            onChange={handleChange}
            disabled={!datosForm.categoria_principal_id}
            className="w-full border border-gray-300 rounded p-2 bg-white disabled:bg-gray-100 disabled:text-gray-500"
          >
            <option value="">Sin subcategoria</option>
            {subcategoriasDisponibles.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.nombre}
              </option>
            ))}
          </select>
          {errores.categoria_id && <p className="text-red-500 text-xs mt-1">{errores.categoria_id}</p>}
        </div>

        <div>
          <h3 className="font-bold text-gray-700 mb-2">Ingredientes y cantidad por unidad</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto p-2 bg-gray-50 border border-gray-200 rounded">
            {!categoriaFinalId && <p className="text-sm text-gray-500">Primero elegi una categoria.</p>}
            {categoriaFinalId && ingredientesFiltrados.length === 0 && (
              <p className="text-sm text-gray-500">No hay ingredientes para esta categoria.</p>
            )}

            {ingredientesFiltrados.map((ing) => {
              const seleccionado = ing.id ? Boolean(datosForm.ingredientes[ing.id]) : false;
              const stock = Number(ing.stock_cantidad ?? 0);
              return (
                <div key={ing.id} className="rounded border border-gray-200 bg-white p-2">
                  <label className="flex items-center justify-between gap-2 text-sm cursor-pointer">
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={seleccionado}
                        onChange={() => ing.id && toggleIngrediente(ing.id)}
                        className="text-blue-600 rounded"
                      />
                      {ing.nombre}
                    </span>
                    <span className="text-xs text-gray-600">
                      Stock: {formatStockWithUnit(stock, ing.unidad_medida)}
                    </span>
                  </label>

                  {seleccionado && ing.id && (
                    <div className="mt-2">
                      <label className="block text-xs text-gray-600 mb-1">
                        Cantidad usada ({ing.unidad_medida}) por unidad de producto
                      </label>
                      <input
                        type="number"
                        min={0.01}
                        step={0.01}
                        value={datosForm.ingredientes[ing.id]}
                        onChange={(e) => cambiarCantidadIngrediente(ing.id!, e.target.value)}
                        className="w-full border rounded p-2 text-sm border-gray-300"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {errores.ingredientes && <p className="text-red-500 text-xs mt-1">{errores.ingredientes}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        {(productoAEditar || onCancelarEdicion) && (
          <button
            type="button"
            onClick={onCancelarEdicion}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancelar
          </button>
        )}
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-medium">
          {productoAEditar ? "Actualizar Producto" : "Guardar Producto"}
        </button>
      </div>
    </form>
  );
};

export default FormularioProducto;
