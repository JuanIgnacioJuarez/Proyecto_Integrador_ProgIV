import { useContext } from "react"
import { CategoriasContext } from "./CategoriaContext"

export const useCategorias = () => {
    const context = useContext(CategoriasContext);
    if (!context) throw new Error("useCategorias debe usarsde dentro del Provider");
    return context;
};