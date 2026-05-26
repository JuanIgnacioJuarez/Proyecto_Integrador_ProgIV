import { Producto } from "../entities/Producto";
import { useProductos } from "../entities/useProducto";
import { useCategorias } from "../entities/useCategoria";
import { useIngredientes } from "../entities/useIngrediente";
import React, { useState, useEffect } from "react";

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
}

const estadoInicial = {
    nombre: '',
    descripcion: '',
    precio_base: 0 as number | string,
    stock_cantidad: 0 as number | string,
    imagenes_url: '',
    is_active: true,
    categoria_id: '' as number | string,
    ingredientes: [] as number[]
};

const FormularioProducto: React.FC<Props> = ({ productoAEditar, onCancelarEdicion, onSuccess }) => {
    const { agregar, editar } = useProductos();
    const { categorias: listaCategorias } = useCategorias();
    const { ingredientes: listaIngredientes } = useIngredientes();

    const [datosForm, setDatosForm] = useState(() =>
        productoAEditar
            ? {
                nombre: productoAEditar.nombre,
                descripcion: productoAEditar.descripcion || '',
                precio_base: productoAEditar.precio_base,
                stock_cantidad: productoAEditar.stock_cantidad,
                imagenes_url: productoAEditar.imagenes_url?.join(', ') || '',
                is_active: productoAEditar.is_active,
                categoria_id: productoAEditar.categorias?.[0]?.id || '',
                ingredientes: productoAEditar.ingredientes?.map((i) => i.id!) || []
            }
            : estadoInicial
    );

    const [errores, setErrores] = useState<ErroresFormulario>({});

    useEffect(() => {
        if (productoAEditar) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setDatosForm({
                nombre: productoAEditar.nombre,
                descripcion: productoAEditar.descripcion || '',
                precio_base: productoAEditar.precio_base,
                stock_cantidad: productoAEditar.stock_cantidad,
                imagenes_url: productoAEditar.imagenes_url?.join(', ') || '',
                is_active: productoAEditar.is_active ?? true,
                categoria_id: productoAEditar.categorias?.[0]?.id || '',
                ingredientes: productoAEditar.ingredientes?.map((i) => i.id!) || []
            });
        } else {
            setDatosForm(estadoInicial);
        }
    }, [productoAEditar]);

    const validarFormulario = () => {
        const nuevosErrores: ErroresFormulario = {};

        if (!datosForm.nombre.trim()) {
            nuevosErrores.nombre = 'El nombre es obligatorio.';
        } else if (datosForm.nombre.trim().length < 3) {
            nuevosErrores.nombre = 'El nombre debe tener al menos 3 caracteres.';
        }

        if (datosForm.precio_base === '' || Number(datosForm.precio_base) < 0) {
            nuevosErrores.precio_base = 'El precio debe ser un numero valido mayor o igual a 0.';
        }

        if (datosForm.stock_cantidad === '' || Number(datosForm.stock_cantidad) < 0) {
            nuevosErrores.stock_cantidad = 'El stock no puede ser negativo.';
        }

        if (!datosForm.categoria_id) {
            nuevosErrores.categoria_id = 'Debes seleccionar una categoria.';
        }

        return nuevosErrores;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setDatosForm({ ...datosForm, [name]: checked });
        } else if (type === 'number' && (name === 'precio_base' || name === 'stock_cantidad')) {
            if (value === '') {
                setDatosForm({ ...datosForm, [name]: value });
                return;
            }
            const numericValue = Number(value.replace(',', '.'));
            setDatosForm({ ...datosForm, [name]: Math.max(0, numericValue) });
        } else {
            setDatosForm({ ...datosForm, [name]: value });
        }
    };

    const cambiarIngredientes = (id: number) => {
        const actuales = datosForm.ingredientes;
        setDatosForm({
            ...datosForm,
            ingredientes: actuales.includes(id)
                ? actuales.filter((i) => i !== id)
                : [...actuales, id]
        });
    };

    const enviarFormulario = (e: React.FormEvent) => {
        e.preventDefault();
        const nuevosErrores = validarFormulario();
        setErrores(nuevosErrores);
        if (Object.keys(nuevosErrores).length > 0) return;

        const imagenesArray = datosForm.imagenes_url
            .split(',')
            .map((url) => url.trim())
            .filter((url) => url !== '');

        const p = new Producto({
            nombre: datosForm.nombre.trim(),
            descripcion: datosForm.descripcion.trim() || null,
            precio_base: Number(datosForm.precio_base),
            stock_cantidad: Number(datosForm.stock_cantidad),
            imagenes_url: imagenesArray,
            is_active: datosForm.is_active,
            categorias: [{ categoria_id: Number(datosForm.categoria_id) }] as unknown as Producto["categorias"],
            ingredientes: datosForm.ingredientes.map((id) => ({ ingrediente_id: id })) as unknown as Producto["ingredientes"],
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
                        className={`w-full border rounded p-2 ${errores.nombre ? 'border-red-500' : 'border-gray-300'}`}
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
                        className={`w-full border rounded p-2 ${errores.precio_base ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errores.precio_base && <p className="text-red-500 text-xs mt-1">{errores.precio_base}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
                    <input
                        type="number"
                        min={0}
                        step={1}
                        name="stock_cantidad"
                        value={datosForm.stock_cantidad}
                        onChange={handleChange}
                        className={`w-full border rounded p-2 ${errores.stock_cantidad ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errores.stock_cantidad && <p className="text-red-500 text-xs mt-1">{errores.stock_cantidad}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Imágenes</label>
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
                    id="is_active"
                    name="is_active"
                    checked={datosForm.is_active}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">Producto activo</label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
                <div>
                    <h3 className="font-bold text-gray-700 mb-2">Categoría *</h3>
                    <select
                        name="categoria_id"
                        value={datosForm.categoria_id}
                        onChange={handleChange}
                        className={`w-full border rounded p-2 bg-white ${errores.categoria_id ? 'border-red-500' : 'border-gray-300'}`}
                    >
                        <option value="">Seleccionar...</option>
                        {listaCategorias.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.nombre}
                            </option>
                        ))}
                    </select>
                    {errores.categoria_id && <p className="text-red-500 text-xs mt-1">{errores.categoria_id}</p>}
                </div>

                <div>
                    <h3 className="font-bold text-gray-700 mb-2">Ingredientes</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto p-2 bg-gray-50 border border-gray-200 rounded">
                        {listaIngredientes.map((ing) => (
                            <label key={ing.id} className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={ing.id ? datosForm.ingredientes.includes(ing.id) : false}
                                    onChange={() => ing.id && cambiarIngredientes(ing.id)}
                                    className="text-blue-600 rounded"
                                />
                                {ing.nombre}
                            </label>
                        ))}
                    </div>
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
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-medium"
                >
                    {productoAEditar ? 'Actualizar Producto' : 'Guardar Producto'}
                </button>
            </div>
        </form>
    );
};

export default FormularioProducto;


