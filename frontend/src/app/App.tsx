import { Routes, Route } from 'react-router-dom';

import { Layout } from '../widgets/Layout';
import { HomePage } from '../pages/HomePage';
import { ProductosPage } from '../pages/ProductosPage';
import { CategoriasPage } from '../pages/CategoriasPage';
import { IngredientesPage } from '../pages/IngredientesPage';

// Contextos para mostrar errores globales si existen
import { useProductos } from '../entities/useProducto';
import { useCategorias } from '../entities/useCategoria';
import { useIngredientes } from '../entities/useIngrediente';

export default function App() {
  const { error: errorProd } = useProductos();
  const { error: errorCat } = useCategorias();
  const { error: errorIng } = useIngredientes();

  return (
    <>
      {/* Mostrar errores globales si existen */}
      {(errorProd || errorCat || errorIng) && (
        <div className="bg-red-500 text-white p-3 text-center text-sm font-medium z-50 relative shadow-md">
          <p>⚠️ Error de conexión con el servidor: {errorProd || errorCat || errorIng}</p>
        </div>
      )}

      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="productos" element={<ProductosPage />} />
          <Route path="categorias" element={<CategoriasPage />} />
          <Route path="ingredientes" element={<IngredientesPage />} />
        </Route>
      </Routes>
    </>
  );
}