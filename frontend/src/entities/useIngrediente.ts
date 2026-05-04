import { useContext } from "react"
import { IngredientesContext } from "./IngredienteContext"

export const useIngredientes = () => {
    const context = useContext(IngredientesContext);
    if (!context) throw new Error("useIngredientes debe usarsde dentro del Provider");
    return context;
};