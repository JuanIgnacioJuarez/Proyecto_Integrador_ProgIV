import { useMemo, useState, useEffect } from "react";

import { Ingrediente } from "../entities/Ingrediente";
import { useIngredientes } from "../entities/useIngrediente";
import { useCategorias } from "../entities/useCategoria";

interface Props {
  ingredienteAEditar?: Ingrediente | null;
  onCancelarEdicion?: () => void;
  onSuccess?: () => void;
}

interface ErroresFormulario {
  nombre?: string;
  unidad_medida?: string;
  stock_cantidad?: string;
  categoria_id?: string;
}

const estadoInicial = {
  nombre: "",
  descripcion: "",
  es_alergeno: false,
  unidad_medida: "gr",
  stock_cantidad: 0 as number | string,
  categoria_principal_id: "" as number | string,
  subcategoria_id: "" as number | string,
};

const FormularioIngrediente: React.FC<Props> = ({ ingredienteAEditar, onCancelarEdicion, onSuccess }) => {
  const { agregar, editar } = useIngredientes();
  const { categorias } = useCategorias();

  const categoriasPrincipales = useMemo(
    () =>
      categorias
        .filter((cat) => cat.parent_id === null && cat.is_active !== false)
        .sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
    [categorias],
  );

  const resolverCategoriaEdicion = (
    categoriaId?: number | null,
  ): { categoriaPrincipalId: number | ""; subcategoriaId: number | "" } => {
    if (!categoriaId) return { categoriaPrincipalId: "", subcategoriaId: "" };
    const root = categoriasPrincipales.find((cat) => cat.id === categoriaId);
    if (root) return { categoriaPrincipalId: root.id ?? "", subcategoriaId: "" };
    for (const categoria of categoriasPrincipales) {
      const sub = (categoria.subCategorias || []).find((s) => s.id === categoriaId);
      if (sub) return { categoriaPrincipalId: categoria.id ?? "", subcategoriaId: sub.id ?? "" };
    }
    return { categoriaPrincipalId: "", subcategoriaId: "" };
  };

  const [datosForm, setDatosForm] = useState(() => {
    if (!ingredienteAEditar) return estadoInicial;
    const selected = resolverCategoriaEdicion(ingredienteAEditar.categoria_id);
    return {
      nombre: ingredienteAEditar.nombre,
      descripcion: ingredienteAEditar.descripcion || "",
      es_alergeno: ingredienteAEditar.es_alergeno,
      unidad_medida: ingredienteAEditar.unidad_medida || "gr",
      stock_cantidad: ingredienteAEditar.stock_cantidad ?? 0,
      categoria_principal_id: selected.categoriaPrincipalId,
      subcategoria_id: selected.subcategoriaId,
    };
  });

  const [errores, setErrores] = useState<ErroresFormulario>({});

  useEffect(() => {
    if (ingredienteAEditar) {
      const selected = resolverCategoriaEdicion(ingredienteAEditar.categoria_id);
      setDatosForm({
        nombre: ingredienteAEditar.nombre,
        descripcion: ingredienteAEditar.descripcion || "",
        es_alergeno: ingredienteAEditar.es_alergeno ?? false,
        unidad_medida: ingredienteAEditar.unidad_medida || "gr",
        stock_cantidad: ingredienteAEditar.stock_cantidad ?? 0,
        categoria_principal_id: selected.categoriaPrincipalId,
        subcategoria_id: selected.subcategoriaId,
      });
    } else {
      setDatosForm(estadoInicial);
    }
  }, [ingredienteAEditar, categoriasPrincipales]);

  const subcategoriasDisponibles = useMemo(() => {
    if (!datosForm.categoria_principal_id) return [];
    const categoria = categoriasPrincipales.find(
      (cat) => String(cat.id) === String(datosForm.categoria_principal_id),
    );
    return (categoria?.subCategorias || [])
      .filter((sub) => sub.id && sub.is_active !== false)
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [categoriasPrincipales, datosForm.categoria_principal_id]);

  const validarFormulario = () => {
    const nuevosErrores: ErroresFormulario = {};

    if (!datosForm.nombre.trim()) {
      nuevosErrores.nombre = "El nombre es obligatorio.";
    } else if (datosForm.nombre.trim().length < 2) {
      nuevosErrores.nombre = "El nombre debe tener al menos 2 caracteres.";
    }

    if (!datosForm.unidad_medida) {
      nuevosErrores.unidad_medida = "Selecciona una unidad de medida.";
    }

    if (datosForm.stock_cantidad === "" || Number(datosForm.stock_cantidad) < 0) {
      nuevosErrores.stock_cantidad = "El stock inicial debe ser 0 o mayor.";
    }

    if (!datosForm.categoria_principal_id) {
      nuevosErrores.categoria_id = "Debes seleccionar una categoria.";
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

    if (name === "stock_cantidad") {
      if (value === "") {
        setDatosForm({ ...datosForm, stock_cantidad: value });
        return;
      }
      const numero = Number(value.replace(",", "."));
      setDatosForm({ ...datosForm, stock_cantidad: Math.max(0, numero) });
      return;
    }

    if (name === "categoria_principal_id") {
      setDatosForm({ ...datosForm, categoria_principal_id: value, subcategoria_id: "" });
      return;
    }

    setDatosForm({ ...datosForm, [name]: value });
  };

  const enviarFormulario = (e: React.FormEvent) => {
    e.preventDefault();
    const nuevosErrores = validarFormulario();
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    const categoriaFinalId =
      datosForm.subcategoria_id !== ""
        ? Number(datosForm.subcategoria_id)
        : Number(datosForm.categoria_principal_id);

    const i = new Ingrediente({
      nombre: datosForm.nombre.trim(),
      descripcion: datosForm.descripcion.trim() || null,
      es_alergeno: datosForm.es_alergeno,
      unidad_medida: datosForm.unidad_medida,
      stock_cantidad: Number(datosForm.stock_cantidad),
      categoria_id: categoriaFinalId,
    });

    if (ingredienteAEditar?.id) {
      i.id = ingredienteAEditar.id;
      editar(i);
    } else {
      agregar(i);
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Ingrediente *</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
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
          {errores.categoria_id && <p className="text-red-500 text-xs mt-1">{errores.categoria_id}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subcategoria</label>
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
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Unidad de Medida *</label>
          <select
            name="unidad_medida"
            value={datosForm.unidad_medida}
            onChange={handleChange}
            className={`w-full border rounded p-2 bg-white ${errores.unidad_medida ? "border-red-500" : "border-gray-300"}`}
          >
            <option value="gr">gr</option>
            <option value="litros">litros</option>
            <option value="unidad">unidad</option>
          </select>
          {errores.unidad_medida && <p className="text-red-500 text-xs mt-1">{errores.unidad_medida}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stock Inicial *</label>
          <input
            type="number"
            min={0}
            step={0.01}
            name="stock_cantidad"
            value={datosForm.stock_cantidad}
            onChange={handleChange}
            className={`w-full border rounded p-2 ${errores.stock_cantidad ? "border-red-500" : "border-gray-300"}`}
          />
          {errores.stock_cantidad && <p className="text-red-500 text-xs mt-1">{errores.stock_cantidad}</p>}
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

      <div className="flex items-center gap-2 mt-2">
        <input
          type="checkbox"
          id="es_alergeno"
          name="es_alergeno"
          checked={datosForm.es_alergeno}
          onChange={handleChange}
          className="w-4 h-4 text-red-600 rounded"
        />
        <label htmlFor="es_alergeno" className="text-sm text-gray-700 font-medium">
          Es un alergeno
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        {(ingredienteAEditar || onCancelarEdicion) && (
          <button
            type="button"
            onClick={onCancelarEdicion}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancelar
          </button>
        )}
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-medium">
          {ingredienteAEditar ? "Actualizar Ingrediente" : "Guardar Ingrediente"}
        </button>
      </div>
    </form>
  );
};

export default FormularioIngrediente;

