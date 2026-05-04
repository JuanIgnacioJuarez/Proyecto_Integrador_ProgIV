import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

// Providers
import { ProductosProvider } from '../entities/ProductoContext.tsx'
import { CategoriasProvider } from '../entities/CategoriaContext.tsx'
import { IngredientesProvider } from '../entities/IngredienteContext.tsx'

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
