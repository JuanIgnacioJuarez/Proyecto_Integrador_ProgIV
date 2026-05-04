import { useState } from 'react';

// Formularios
import FormularioProducto from './components/Producto/FormularioProducto';
import FormularioCategoria from './components/Categoria/FormularioCategoria';
import FormularioIngrediente from './components/Ingrediente/FormularioIngrediente';

// Contextos
import { useProductos } from './context/Producto/useProducto';
import { useCategorias } from './context/Categoria/useCategoria';
import { useIngredientes } from './context/Ingrediente/useIngrediente';

// Modelos
import { Producto } from './models/Producto';
import { Categoria } from './models/Categoria';
import { Ingrediente } from './models/Ingrediente';

export default function App() {
  // Consumo de Contextos
  const { productos, eliminar: eliminarProducto, error: errorProd } = useProductos();
  const { categorias, eliminar: eliminarCategoria, error: errorCat } = useCategorias();
  const { ingredientes, eliminar: eliminarIngrediente, error: errorIng } = useIngredientes();

  // Estados locales para controlar qué elemento se está editando
  const [productoAEditar, setProductoAEditar] = useState<Producto | null>(null);
  const [categoriaAEditar, setCategoriaAEditar] = useState<Categoria | null>(null);
  const [ingredienteAEditar, setIngredienteAEditar] = useState<Ingrediente | null>(null);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-12">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">Panel de Gestión</h1>

        {/* Mostrar errores globales si existen */}
        {(errorProd || errorCat || errorIng) && (
          <div className="bg-red-100 text-red-700 p-4 rounded shadow">
            <p>{errorProd}</p>
            <p>{errorCat}</p>
            <p>{errorIng}</p>
          </div>
        )}

        {/* ==========================================
            SECCIÓN: PRODUCTOS
        ========================================== */}
        <section className="bg-white p-6 rounded shadow">
          <h2 className="text-2xl font-bold text-gray-700 mb-6 border-b pb-2">Gestión de Productos</h2>
          
          <FormularioProducto 
            productoAEditar={productoAEditar} 
            onCancelarEdicion={() => setProductoAEditar(null)}
            onSuccess={() => setProductoAEditar(null)}
          />

          <div className="mt-10">
            <h3 className="text-xl font-semibold mb-4 text-gray-600">Listado de Productos</h3>
            {productos.length === 0 ? (
              <p className="text-gray-500 italic">No hay productos registrados.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.isArray(productos) && productos.map(p => (
                  <div key={p.id} className="border border-gray-200 rounded p-4 shadow-sm bg-gray-50 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-lg">{p.nombre}</h4>
                      <p className="text-sm text-gray-600 mb-2">{p.descripcion || 'Sin descripción'}</p>
                      <p className="text-sm"><strong>Precio:</strong> ${p.precio_base}</p>
                      <p className="text-sm"><strong>Stock:</strong> {p.stock_cantidad}</p>
                      <p className="text-sm">
                        <strong>Estado:</strong> {p.is_active ? <span className="text-green-600">Activo</span> : <span className="text-red-600">Inactivo</span>}
                      </p>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button 
                        onClick={() => setProductoAEditar(p)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 w-full"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => p.id && eliminarProducto(p.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 w-full"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ==========================================
            SECCIÓN: CATEGORÍAS
        ========================================== */}
        <section className="bg-white p-6 rounded shadow">
          <h2 className="text-2xl font-bold text-gray-700 mb-6 border-b pb-2">Gestión de Categorías</h2>
          
          <FormularioCategoria 
            categoriaAEditar={categoriaAEditar} 
            onCancelarEdicion={() => setCategoriaAEditar(null)}
            onSuccess={() => setCategoriaAEditar(null)}
          />

          <div className="mt-10">
            <h3 className="text-xl font-semibold mb-4 text-gray-600">Listado de Categorías</h3>
            {categorias.length === 0 ? (
              <p className="text-gray-500 italic">No hay categorías registradas.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.isArray(categorias) && categorias.map(c => (
                  <div key={c.id} className="border border-gray-200 rounded p-4 shadow-sm bg-gray-50 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-lg">{c.nombre}</h4>
                      {c.parent_id && <p className="text-xs text-blue-600 mb-2">Subcategoría (Padre ID: {c.parent_id})</p>}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button 
                        onClick={() => setCategoriaAEditar(c)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 w-full"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => c.id && eliminarCategoria(c.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 w-full"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ==========================================
            SECCIÓN: INGREDIENTES
        ========================================== */}
        <section className="bg-white p-6 rounded shadow">
          <h2 className="text-2xl font-bold text-gray-700 mb-6 border-b pb-2">Gestión de Ingredientes</h2>
          
          <FormularioIngrediente 
            ingredienteAEditar={ingredienteAEditar} 
            onCancelarEdicion={() => setIngredienteAEditar(null)}
            onSuccess={() => setIngredienteAEditar(null)}
          />

          <div className="mt-10">
            <h3 className="text-xl font-semibold mb-4 text-gray-600">Listado de Ingredientes</h3>
            {ingredientes.length === 0 ? (
              <p className="text-gray-500 italic">No hay ingredientes registrados.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.isArray(ingredientes) && ingredientes.map(i => (
                  <div key={i.id} className="border border-gray-200 rounded p-4 shadow-sm bg-gray-50 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-lg">{i.nombre}</h4>
                      {i.es_alergeno && (
                        <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded mt-1 font-bold">
                          Alérgeno
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button 
                        onClick={() => setIngredienteAEditar(i)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 w-full"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => i.id && eliminarIngrediente(i.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 w-full"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}