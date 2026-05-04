import { Categoria } from "../../models/Categoria";
import { useCategorias } from "../../context/Categoria/useCategoria";
import { useState } from "react";

interface Props {
    categoriaAEditar?: Categoria | null;
    onCancelarEdicion?: () => void;
    onSuccess?: () => void;
}

interface ErroresFormulario {
    nombre?: string;
}

const estadoInicial = {
    nombre: '',
    descripcion: '',
    imagen_url: '',
    is_active: true,
    parent_id: '' as number | string
};

const FormularioCategoria: React.FC<Props> = ({ categoriaAEditar, onCancelarEdicion, onSuccess }) => {
    const { agregar, editar, categorias } = useCategorias();

    const [datosForm, setDatosForm] = useState(() =>
        categoriaAEditar
            ? {
            nombre: categoriaAEditar.nombre,
            descripcion: categoriaAEditar.descripcion || '',
            imagen_url: categoriaAEditar.imagen_url || '',
            is_active: categoriaAEditar.is_active,
            parent_id: categoriaAEditar.parent_id || ''
            }
        : estadoInicial
    );

    const [errores, setErrores] = useState<ErroresFormulario>({});

    const validarFormulario = () => {
        const nuevosErrores: ErroresFormulario = {};

        if (!datosForm.nombre.trim()) {
            nuevosErrores.nombre = 'El nombre es obligatorio.';
        } else if (datosForm.nombre.trim().length < 3) {
            nuevosErrores.nombre = 'El nombre debe tener al menos 3 caracteres.';
        }

        return nuevosErrores;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
    
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setDatosForm({ ...datosForm, [name]: checked });
        } else {
            setDatosForm({ ...datosForm, [name]: value });
        }
    };

    const enviarFormulario = (e: React.FormEvent) => {
        e.preventDefault();
        const nuevosErrores = validarFormulario();
        setErrores(nuevosErrores);
        if (Object.keys(nuevosErrores).length > 0) return;

        const c = new Categoria({
            nombre: datosForm.nombre.trim(),
            descripcion: datosForm.descripcion.trim() || null,
            imagen_url: datosForm.imagen_url.trim() || null,
            is_active: datosForm.is_active,
            parent_id: datosForm.parent_id ? Number(datosForm.parent_id) : null
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre */}
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

                {/* Categoría Padre */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría Padre (Opcional)</label>
                    <select
                        name="parent_id"
                        value={datosForm.parent_id}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded p-2 bg-white"
                        >
                        <option value="">Ninguna (Categoría principal)</option>
                        {categorias
                            .filter(cat => cat.id !== categoriaAEditar?.id) // Evita que sea padre de sí misma
                            .map(cat => (
                            <option key={cat.id} value={cat.id}>
                                {cat.nombre}
                            </option>
                            ))
                        }
                    </select>
                </div>

                {/* Imagen URL */}
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

            {/* Descripción */}
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

            {/* Checkbox Activo */}
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

            {/* Botones */}
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