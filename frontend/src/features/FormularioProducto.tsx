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
}

const estadoInicial = {
    nombre: '',
    descripcion: '',
    precio_base: 0 as number | string,
    stock_cantidad: 0 as number | string,
    imagenes_url: '', // String separado por comas
    is_active: true,
    categorias: [] as number[], // IDs de categorías
    ingredientes: [] as number[] // IDs de ingredientes
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
                categorias: productoAEditar.categorias?.map(c => c.id!) || [],
                ingredientes: productoAEditar.ingredientes?.map(i => i.id!) || []
            }
        : estadoInicial
    );

    const [errores, setErrores] = useState<ErroresFormulario>({});

    useEffect(() => {
        if (productoAEditar) {
            setDatosForm({
                nombre: productoAEditar.nombre,
                descripcion: productoAEditar.descripcion || '',
                precio_base: productoAEditar.precio_base,
                stock_cantidad: productoAEditar.stock_cantidad,
                imagenes_url: productoAEditar.imagenes_url?.join(', ') || '',
                is_active: productoAEditar.is_active ?? true,
                categorias: productoAEditar.categorias?.map(c => c.id!) || [],
                ingredientes: productoAEditar.ingredientes?.map(i => i.id!) || []
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
            nuevosErrores.precio_base = 'El precio debe ser un número válido mayor o igual a 0.';
        }

        if (datosForm.stock_cantidad === '' || Number(datosForm.stock_cantidad) < 0) {
            nuevosErrores.stock_cantidad = 'El stock no puede ser negativo.';
        }

        return nuevosErrores;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
    
        // Manejo para el checkbox principal (is_active)
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setDatosForm({ ...datosForm, [name]: checked });
        } else {
            setDatosForm({ ...datosForm, [name]: value });
        }
    };

    const cambiarCategorias = (id: number) => {
        const actuales = datosForm.categorias;
        setDatosForm({
            ...datosForm,
            categorias: actuales.includes(id)
            ? actuales.filter((c) => c !== id)
            : [...actuales, id]
        });
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

        // Convierte el string de imágenes a un array limpio
        const imagenesArray = datosForm.imagenes_url
            .split(',')
            .map(url => url.trim())
            .filter(url => url !== '');

        // Instancia el producto usando el constructor
        const p = new Producto({
            nombre: datosForm.nombre.trim(),
            descripcion: datosForm.descripcion.trim() || null,
            precio_base: Number(datosForm.precio_base),
            stock_cantidad: Number(datosForm.stock_cantidad),
            imagenes_url: imagenesArray,
            is_active: datosForm.is_active,
        });

        if (productoAEditar?.id) {
            p.id = productoAEditar.id;
            editar(p);
        } else {
            agregar(p);
        }

        setDatosForm(estadoInicial);
        setErrores({});
        onSuccess?.(); // Ejecutamos la función de éxito[cite: 2]
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

                {/* Precio Base */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio Base ($) *</label>
                    <input
                        type="number"
                        step="0.01"
                        name="precio_base"
                        value={datosForm.precio_base}
                        onChange={handleChange}
                        className={`w-full border rounded p-2 ${errores.precio_base ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errores.precio_base && <p className="text-red-500 text-xs mt-1">{errores.precio_base}</p>}
                </div>

                {/* Stock */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
                    <input
                        type="number"
                        name="stock_cantidad"
                        value={datosForm.stock_cantidad}
                        onChange={handleChange}
                        className={`w-full border rounded p-2 ${errores.stock_cantidad ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errores.stock_cantidad && <p className="text-red-500 text-xs mt-1">{errores.stock_cantidad}</p>}
                </div>

                {/* Imágenes */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Imágenes (URLs separadas por coma)</label>
                    <input
                        type="text"
                        name="imagenes_url"
                        value={datosForm.imagenes_url}
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
                    id="is_active"
                    name="is_active"
                    checked={datosForm.is_active}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">Producto activo</label>
            </div>

            {/* Relaciones (Categorías e Ingredientes) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
                <div>
                    <h3 className="font-bold text-gray-700 mb-2">Categorías</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto p-2 bg-gray-50 border border-gray-200 rounded">
                        {listaCategorias.map((cat) => (
                            <label key={cat.id} className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={cat.id ? datosForm.categorias.includes(cat.id) : false}
                                    onChange={() => cat.id && cambiarCategorias(cat.id)}
                                    className="text-blue-600 rounded"
                                />
                                {cat.nombre}
                            </label>
                        ))}
                    </div>
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