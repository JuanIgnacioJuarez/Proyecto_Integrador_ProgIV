import { Ingrediente } from "../entities/Ingrediente";
import { useIngredientes } from "../entities/useIngrediente";
import { useState, useEffect } from "react";

interface Props {
    ingredienteAEditar?: Ingrediente | null;
    onCancelarEdicion?: () => void;
    onSuccess?: () => void;
}

interface ErroresFormulario {
    nombre?: string;
}

const estadoInicial = {
    nombre: '',
    descripcion: '',
    es_alergeno: false
};

const FormularioIngrediente: React.FC<Props> = ({ ingredienteAEditar, onCancelarEdicion, onSuccess }) => {
    const { agregar, editar } = useIngredientes();

    const [datosForm, setDatosForm] = useState(() =>
        ingredienteAEditar
            ? {
                nombre: ingredienteAEditar.nombre,
                descripcion: ingredienteAEditar.descripcion || '',
                es_alergeno: ingredienteAEditar.es_alergeno
            }
        : estadoInicial
    );

    const [errores, setErrores] = useState<ErroresFormulario>({});

    useEffect(() => {
        if (ingredienteAEditar) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setDatosForm({
                nombre: ingredienteAEditar.nombre,
                descripcion: ingredienteAEditar.descripcion || '',
                es_alergeno: ingredienteAEditar.es_alergeno ?? false
            });
        } else {
            setDatosForm(estadoInicial);
        }
    }, [ingredienteAEditar]);

    const validarFormulario = () => {
        const nuevosErrores: ErroresFormulario = {};

        if (!datosForm.nombre.trim()) {
            nuevosErrores.nombre = 'El nombre es obligatorio.';
        } else if (datosForm.nombre.trim().length < 2) {
            nuevosErrores.nombre = 'El nombre debe tener al menos 2 caracteres.';
        }

        return nuevosErrores;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

        const i = new Ingrediente({
            nombre: datosForm.nombre.trim(),
            descripcion: datosForm.descripcion.trim() || null,
            es_alergeno: datosForm.es_alergeno
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
            <div className="grid grid-cols-1 gap-4">
                {/* Nombre */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Ingrediente *</label>
                    <input
                        type="text"
                        name="nombre"
                        value={datosForm.nombre}
                        onChange={handleChange}
                        className={`w-full border rounded p-2 ${errores.nombre ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errores.nombre && <p className="text-red-500 text-xs mt-1">{errores.nombre}</p>}
                </div>

                {/* DescripciÃ³n */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">DescripciÃ³n</label>
                    <textarea
                        name="descripcion"
                        rows={3}
                        value={datosForm.descripcion}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded p-2"
                    />
                </div>

                {/* Checkbox AlÃ©rgeno */}
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
                        Es un alÃ©rgeno
                    </label>
                </div>
            </div>

            {/* Botones */}
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
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-medium"
                    >
                    {ingredienteAEditar ? 'Actualizar Ingrediente' : 'Guardar Ingrediente'}
                </button>
            </div>
        </form>
    );
};

export default FormularioIngrediente;


