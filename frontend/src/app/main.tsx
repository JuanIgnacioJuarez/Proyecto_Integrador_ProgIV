import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './index.css'

// Providers
import { ProductosProvider } from '../entities/ProductoContext.tsx'
import { CategoriasProvider } from '../entities/CategoriaContext.tsx'
import { IngredientesProvider } from '../entities/IngredienteContext.tsx'
import { AuthProvider } from '../entities/AuthContext.tsx'
import { queryClient } from '../shared/api/queryClient.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ProductosProvider>
            <CategoriasProvider>
              <IngredientesProvider>
                <App />
              </IngredientesProvider>
            </CategoriasProvider>
          </ProductosProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
)
