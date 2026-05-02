import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'

// Providers
import { ProductosProvider } from './context/Producto/ProductoContext.tsx'
import { CategoriasProvider } from './context/Categoria/CategoriaContext.tsx'
import { IngredientesProvider } from './context/Ingrediente/IngredienteContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ProductosProvider>
        <CategoriasProvider>
          <IngredientesProvider>
            <App />
          </IngredientesProvider>
        </CategoriasProvider>
      </ProductosProvider>
    </BrowserRouter>
  </StrictMode>,
)
