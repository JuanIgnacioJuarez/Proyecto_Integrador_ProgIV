import { createContext, useEffect, useReducer, useState } from "react";
import { Categoria } from "./Categoria"
import { categoriasReducer } from "./categoriasReducer";

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

    // GET inicial
    useEffect(() => {
        fetch(API_URL)
        .then(async (res) => {
            if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
            return res.json();
        })
        .then((data) => {
            if (Array.isArray(data)) {
                const mappedData = data.map((cat: any) => new Categoria(cat));
                dispatch({ type: 'GET_CATEGORIAS', payload: mappedData });
            } else {
                throw new Error('La API no devolvió una lista válida de categorías.');
            }
        })
        .catch((err) => {
            console.error("Error en GET categorías:", err);
            setError('No se pudo cargar el listado de categorías.');
        });
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
            .then((nuevo) => dispatch({ type: 'AGREGAR', payload: new Categoria(nuevo)}))
            .catch((err) => {
                console.error("Error al guardar categoría: ", err);
                setError(`Hubo un error al guardar: ${err.message}`);
            });
    };

    const editar = (c: Categoria) => {
    fetch(`${API_URL}/${c.id}`, {
        method: 'PATCH', // o PATCH
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(c)
    })
        .then(async (res) => {
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        })
        .then((actualizado) => dispatch({ type: 'EDITAR', payload: new Categoria(actualizado) }))
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