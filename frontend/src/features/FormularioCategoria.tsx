import { Categoria } from "../entities/Categoria";
import { useCategorias } from "../entities/useCategoria";
import { useState, useEffect } from "react";

interface Props {
    categoriaAEditar?: Categoria | null;
    onCancelarEdicion?: () => void;
    onSuccess?: () => void;
}

interface ErroresFormulario {
    nombre?: string;
    categoria_padre_id?: string;
}

const estadoInicial = {
    nombre: '',
    descripcion: '',
    imagen_url: '',
    is_active: true,
    categoria_padre_id: '' as number | string,
    subcategoria_padre_id: '' as number | string,
};

const FormularioCategoria: React.FC<Props> = ({ categoriaAEditar, onCancelarEdicion, onSuccess }) => {
    const { agregar, editar, categorias } = useCategorias();

    const categoriasPrincipales = categorias.filter(
        (cat) => cat.parent_id === null && cat.id !== categoriaAEditar?.id
    );

    const [datosForm, setDatosForm] = useState(() => {
        if (!categoriaAEditar) return estadoInicial;

        const parent = categorias.find((c) => c.id === categoriaAEditar.parent_id);
        const grandParent = parent ? categorias.find((c) => c.id === parent.parent_id) : undefined;

        return {
            nombre: categoriaAEditar.nombre,
            descripcion: categoriaAEditar.descripcion || '',
            imagen_url: categoriaAEditar.imagen_url || '',
            is_active: categoriaAEditar.is_active ?? true,
            categoria_padre_id: grandParent?.id || parent?.id || '',
            subcategoria_padre_id: grandParent ? parent?.id || '' : '',
        };
    });

    const [errores, setErrores] = useState<ErroresFormulario>({});

    useEffect(() => {
        if (!categoriaAEditar) {
            setDatosForm(estadoInicial);
            return;
        }

        const parent = categorias.find((c) => c.id === categoriaAEditar.parent_id);
        const grandParent = parent ? categorias.find((c) => c.id === parent.parent_id) : undefined;

        setDatosForm({
            nombre: categoriaAEditar.nombre,
            descripcion: categoriaAEditar.descripcion || '',
            imagen_url: categoriaAEditar.imagen_url || '',
            is_active: categoriaAEditar.is_active ?? true,
            categoria_padre_id: grandParent?.id || parent?.id || '',
            subcategoria_padre_id: grandParent ? parent?.id || '' : '',
        });
    }, [categoriaAEditar, categorias]);

    const categoriaSeleccionada = categoriasPrincipales.find(
        (cat) => String(cat.id) === String(datosForm.categoria_padre_id)
    );

    const subcategoriasDisponibles = (categoriaSeleccionada?.subCategorias || []).filter(
        (sub) => sub.id !== categoriaAEditar?.id
    );

    const validarFormulario = () => {
        const nuevosErrores: ErroresFormulario = {};

        if (!datosForm.nombre.trim()) {
            nuevosErrores.nombre = 'El nombre es obligatorio.';
        } else if (datosForm.nombre.trim().length < 3) {
            nuevosErrores.nombre = 'El nombre debe tener al menos 3 caracteres.';
        }
        if (!datosForm.categoria_padre_id) {
            nuevosErrores.categoria_padre_id = 'Debes seleccionar una categoría.';
        }

        return nuevosErrores;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setDatosForm({ ...datosForm, [name]: checked });
            return;
        }

        if (name === 'categoria_padre_id') {
            setDatosForm({ ...datosForm, categoria_padre_id: value, subcategoria_padre_id: '' });
            return;
        }

        setDatosForm({ ...datosForm, [name]: value });
    };

    const enviarFormulario = (e: React.FormEvent) => {
        e.preventDefault();
        const nuevosErrores = validarFormulario();
        setErrores(nuevosErrores);
        if (Object.keys(nuevosErrores).length > 0) return;

        const parentId =
            datosForm.subcategoria_padre_id !== ''
                ? Number(datosForm.subcategoria_padre_id)
                : datosForm.categoria_padre_id !== ''
                    ? Number(datosForm.categoria_padre_id)
                    : null;

        const c = new Categoria({
            nombre: datosForm.nombre.trim(),
            descripcion: datosForm.descripcion.trim() || null,
            imagen_url: datosForm.imagen_url.trim() || null,
            is_active: datosForm.is_active,
            parent_id: parentId,
        });

        if (categoriaAEditar?.id) {
            c.id = categoriaAEditar.id;
            editar(c);
        } else {
            agregar(c);
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
                        className={`w-full border rounded p-2 ${errores.nombre ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errores.nombre && <p className="text-red-500 text-xs mt-1">{errores.nombre}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                    <select
                        name="categoria_padre_id"
                        value={datosForm.categoria_padre_id}
                        onChange={handleChange}
                        className={`w-full border rounded p-2 bg-white ${errores.categoria_padre_id ? 'border-red-500' : 'border-gray-300'}`}
                    >
                        <option value="">Seleccionar...</option>
                        {categoriasPrincipales.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.nombre}
                            </option>
                        ))}
                    </select>
                    {errores.categoria_padre_id && <p className="text-red-500 text-xs mt-1">{errores.categoria_padre_id}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subcategoría</label>
                    <select
                        name="subcategoria_padre_id"
                        value={datosForm.subcategoria_padre_id}
                        onChange={handleChange}
                        disabled={datosForm.categoria_padre_id === '' || subcategoriasDisponibles.length === 0}
                        className="w-full border border-gray-300 rounded p-2 bg-white disabled:bg-gray-100 disabled:text-gray-500"
                    >
                        <option value="">Seleccionar...</option>
                        {subcategoriasDisponibles.map((sub) => (
                            <option key={sub.id} value={sub.id}>
                                {sub.nombre}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                        Si elegís una categoría, podés crearla dentro de esa categoría o de una subcategoría existente.
                    </p>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL de la Imagen</label>
                    <input
                        type="text"
                        name="imagen_url"
                        value={datosForm.imagen_url}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded p-2"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
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
                    id="is_active_cat"
                    name="is_active"
                    checked={datosForm.is_active}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="is_active_cat" className="text-sm text-gray-700">Categoría activa</label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
                {(categoriaAEditar || onCancelarEdicion) && (
                    <button
                        type="button"
                        onClick={onCancelarEdicion}
                        className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                    >
                        Cancelar
                    </button>
                )}
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-medium"
                >
                    {categoriaAEditar ? 'Actualizar Categoría' : 'Guardar Categoría'}
                </button>
            </div>
        </form>
    );
};

export default FormularioCategoria;
