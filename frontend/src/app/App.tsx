import { Routes, Route } from 'react-router-dom';

import { Layout } from '../widgets/Layout';
import { HomePage } from '../pages/HomePage';
import { ProductosPage } from '../pages/ProductosPage';
import { CategoriasPage } from '../pages/CategoriasPage';
import { IngredientesPage } from '../pages/IngredientesPage';
import { UsuariosPage } from '../pages/UsuariosPage';
import { PedidosPage } from '../pages/PedidosPage';
import { LoginPage } from '../pages/LoginPage';
import { RequireAuth } from '../shared/ui/RequireAuth';
import { RequireRole } from '../shared/ui/RequireRole';
import { ROLES } from '../shared/auth/roles';

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
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="productos" element={<ProductosPage />} />
            <Route path="categorias" element={<CategoriasPage />} />
            <Route path="ingredientes" element={<IngredientesPage />} />

            {/* Gestión de usuarios: solo ADMIN */}
            <Route element={<RequireRole allowed={[ROLES.ADMIN]} />}>
              <Route path="usuarios" element={<UsuariosPage />} />
            </Route>

            {/* Pantalla cajero: ADMIN y gestor de PEDIDOS */}
            <Route element={<RequireRole allowed={[ROLES.ADMIN, ROLES.PEDIDOS]} />}>
              <Route path="pedidos" element={<PedidosPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </>
  );
}
