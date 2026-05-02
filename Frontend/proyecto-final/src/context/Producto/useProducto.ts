import { useContext } from "react"
import { ProductosContext } from "./ProductoContext"

export const useProductos = () => {
    const context = useContext(ProductosContext);
    if (!context) throw new Error("useProductos debe usarsde dentro del Provider");
    return context;
};