import { createContext, useEffect, useReducer, useState } from "react";
import { Producto } from "./Producto"
import { productoReducer } from "./productosReducer";

export interface ProductosContextType {
    productos: Producto[];
    error: string | null;
    limpiarError: () => void;
    agregar: (p: Producto) => void;
    eliminar: (id: number) => void;
    editar: (p: Producto) => void;
    resetear: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const ProductosContext = createContext<ProductosContextType | undefined> (undefined);

export const ProductosProvider = ({ children }: { children: React.ReactNode}) => {
    const [productos, dispatch] = useReducer(productoReducer, []);
    const [error, setError] = useState<string | null>(null);
    const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/productos`;

    const cargarProductos = () => {
        fetch(API_URL)
        .then(async (res) => {
            if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
            return res.json();
        })
        .then((data) => {
            // FastAPI devuelve { "total": X, "items": [...] }; extraemos "items"
            const lista = data.items !== undefined ? data.items : data;
            if (Array.isArray(lista)) {
                dispatch({ type: 'GET_PRODUCTOS', payload: lista });
            } else {
                throw new Error('La API no devolvió una lista válida de productos.');
            }
        })
        .catch((err) => {
            console.error("Error en GET productos:", err);
            setError('No se pudo cargar el listado de productos.');
        });
    };

    // GET inicial
    useEffect(() => {
        cargarProductos();
    }, [API_URL]);

    const agregar = (p: Producto) => {
        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(p)
        })
            .then(async (res) => {
                if (!res.ok) throw new Error(await res.text());
                return res.json();
            })
            .then(() => cargarProductos())
            .catch((err) => {
                console.error("Error al guardar producto: ", err);
                setError(`Hubo un error al guardar: ${err.message}`);
            });
    };

    const editar = (p: Producto) => {
    fetch(`${API_URL}/${p.id}`, {
        method: 'PATCH', // o PATCH
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p)
    })
        .then(async (res) => {
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        })
        .then(() => cargarProductos())
        .catch((err) => {
            console.error('Error al editar producto:', err);
            setError(`Hubo un error al editar: ${err.message}`);
        });
    };

    const eliminar = (id: number) => {
    fetch(`${API_URL}/${id}`, { method: 'DELETE' })
        .then(async (res) => {
            if (!res.ok) throw new Error(await res.text());
            cargarProductos();
        })
        .catch((err) => {
            console.error('Error al eliminar producto:', err);
            setError(`Hubo un error al eliminar: ${err.message}`);
        });
    };

    const resetear = () => dispatch({ type: 'RESET', payload: [] });
    const limpiarError = () => setError(null);

    return (
        <ProductosContext.Provider value={{ productos, error, limpiarError, agregar, eliminar, editar, resetear}}>
            {children}
        </ProductosContext.Provider>
    );
};