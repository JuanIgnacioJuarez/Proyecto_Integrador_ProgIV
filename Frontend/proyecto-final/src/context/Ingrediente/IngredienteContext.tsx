import { createContext, useEffect, useReducer, useState } from "react";
import { Ingrediente } from "../../models/Ingrediente"
import { ingredientesReducer } from "../../reducers/ingredientesReducer";

export interface IngredientesContextType {
    ingredientes: Ingrediente[];
    error: string | null;
    limpiarError: () => void;
    agregar: (i: Ingrediente) => void;
    eliminar: (id: number) => void;
    editar: (i: Ingrediente) => void;
    resetear: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const IngredientesContext = createContext<IngredientesContextType | undefined> (undefined);

export const IngredientesProvider = ({ children }: { children: React.ReactNode}) => {
    const [ingredientes, dispatch] = useReducer(ingredientesReducer, []);
    const [error, setError] = useState<string | null>(null);
    const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/ingredientes`;

    // GET inicial
    useEffect(() => {
    fetch(API_URL)
        .then(async (res) => {
            if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
            return res.json();
        })
        .then((data) => {
            // FastAPI devuelve {"total": X, "items": [...] }
            // Extraemos el arreglo de la propiedad "items"
            const lista = data.items !== undefined ? data.items : data;

            if (Array.isArray(lista)) {
                dispatch({ type: 'GET_INGREDIENTES', payload: lista });
            } else {
            throw new Error('La API no devolvió una lista válida de ingredientes.');
            }
        })
        .catch((err) => {
            console.error("Error en GET ingredientes:", err);
            setError('No se pudo cargar el listado de ingredientes.');
        });
    }, [API_URL]);

    const agregar = (i: Ingrediente) => {
        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(i)
        })
            .then(async (res) => {
                if (!res.ok) throw new Error(await res.text());
                return res.json();
            })
            .then((nuevo) => dispatch({ type: 'AGREGAR', payload: nuevo}))
            .catch((err) => {
                console.error("Error al guardar ingrediente: ", err);
                setError(`Hubo un error al guardar: ${err.message}`);
            });
    };

    const editar = (i: Ingrediente) => {
    fetch(`${API_URL}/${i.id}`, {
        method: 'PUT', // o PATCH
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(i)
    })
        .then(async (res) => {
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        })
        .then((actualizado) => dispatch({ type: 'EDITAR', payload: actualizado }))
        .catch((err) => {
            console.error('Error al editar ingrediente:', err);
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
            console.error('Error al eliminar ingrediente:', err);
            setError(`Hubo un error al eliminar: ${err.message}`);
        });
    };

    const resetear = () => dispatch({ type: 'RESET', payload: [] });
    const limpiarError = () => setError(null);

    return (
        <IngredientesContext.Provider value={{ ingredientes, error, limpiarError, agregar, eliminar, editar, resetear}}>
            {children}
        </IngredientesContext.Provider>
    );
};