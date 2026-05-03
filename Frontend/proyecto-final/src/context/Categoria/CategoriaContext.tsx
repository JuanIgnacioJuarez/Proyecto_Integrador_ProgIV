import { createContext, useEffect, useReducer, useState } from "react";
import { Categoria } from "../../models/Categoria"
import { categoriasReducer } from "../../reducers/categoriasReducer";

export interface CategoriasContextType {
    categorias: Categoria[];
    error: string | null;
    limpiarError: () => void;
    agregar: (c: Categoria) => void;
    eliminar: (id: number) => void;
    editar: (c: Categoria) => void;
    resetear: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const CategoriasContext = createContext<CategoriasContextType | undefined> (undefined);

export const CategoriasProvider = ({ children }: { children: React.ReactNode}) => {
    const [categorias, dispatch] = useReducer(categoriasReducer, []);
    const [error, setError] = useState<string | null>(null);
    const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/categorias`;

    useEffect(() => {
        fetch(API_URL)
            .then((res) => res.json())
            .then((data) => dispatch({ type: 'GET_CATEGORIAS', payload: data}))
            .catch((err) => {
                console.error(err);
                setError("No se pudo cargar e listado de categorías.");
            })
    }, [API_URL]);

    const agregar = (c: Categoria) => {
        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(c)
        })
            .then(async (res) => {
                if (!res.ok) throw new Error(await res.text());
                return res.json();
            })
            .then((nuevo) => dispatch({ type: 'AGREGAR', payload: nuevo}))
            .catch((err) => {
                console.error("Error al guardar categoría: ", err);
                setError(`Hubo un error al guardar: ${err.message}`);
            });
    };

    const editar = (c: Categoria) => {
    fetch(`${API_URL}/${c.id}`, {
        method: 'PUT', // o PATCH
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(c)
    })
        .then(async (res) => {
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        })
        .then((actualizado) => dispatch({ type: 'EDITAR', payload: actualizado }))
        .catch((err) => {
            console.error('Error al editar categoría:', err);
            setError(`Hubo un error al editar: ${err.message}`);
        });
    };

    const eliminar = (id: number) => {
    fetch(`${API_URL}/${id}`, { method: 'DELETE' })
        .then(async (res) => {
            if (!res.ok) throw new Error(await res.text());
            dispatch({ type: 'ELIMINAR', payload: id });
        })
        .catch((err) => {
            console.error('Error al eliminar categoría:', err);
            setError(`Hubo un error al eliminar: ${err.message}`);
        });
    };

    const resetear = () => dispatch({ type: 'RESET', payload: [] });
    const limpiarError = () => setError(null);

    return (
        <CategoriasContext.Provider value={{ categorias, error, limpiarError, agregar, eliminar, editar, resetear}}>
            {children}
        </CategoriasContext.Provider>
    );
};