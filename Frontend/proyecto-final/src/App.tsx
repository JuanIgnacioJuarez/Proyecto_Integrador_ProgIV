import { useProductos } from './context/Producto/useProducto';
import { useCategorias } from './context/Categoria/useCategoria';
import { useIngredientes } from './context/Ingrediente/useIngrediente';
import { Producto } from './models/Producto';

export default function App() {
  // Consumimos los 3 contextos
  const { productos, error: errorProd, agregar: agregarProducto } = useProductos();
  const { categorias, error: errorCat } = useCategorias();
  const { ingredientes, error: errorIng } = useIngredientes();

  // Función temporal para probar el POST
  const probarCrearProducto = () => {
    const nuevo = new Producto({
      nombre: "Producto de Prueba " + Math.floor(Math.random() * 100),
      precio_base: 1500.50,
      stock_cantidad: 10,
      descripcion: "Esto es una prueba para ver si el context y FastAPI funcionan"
    });
    
    agregarProducto(nuevo);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-blue-600">Testing de Contexts y API</h1>

      {/* Mostrar errores si los hay */}
      {(errorProd || errorCat || errorIng) && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-6">
          <p>{errorProd}</p>
          <p>{errorCat}</p>
          <p>{errorIng}</p>
        </div>
      )}

      {/* Botón de prueba POST */}
      <div className="mb-8">
        <button 
          onClick={probarCrearProducto}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Probar Agregar Producto
        </button>
        <p className="text-sm text-gray-500 mt-2">Haz clic y mira si aparece abajo y en tu base de datos (PostgreSQL).</p>
      </div>

      {/* Volcamos los datos en crudo para ver si el GET funcionó */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-gray-80 shadow p-4 rounded overflow-auto max-h-96">
          <h2 className="font-bold text-xl mb-2">Productos ({productos.length})</h2>
          <pre className="text-xs bg-gray-200 p-2 rounded">
            {JSON.stringify(productos, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-50 shadow p-4 rounded overflow-auto max-h-96">
          <h2 className="font-bold text-xl mb-2">Categorías ({categorias.length})</h2>
          <pre className="text-xs bg-gray-200 p-2 rounded">
            {JSON.stringify(categorias, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-50 shadow p-4 rounded overflow-auto max-h-96">
          <h2 className="font-bold text-xl mb-2">Ingredientes ({ingredientes.length})</h2>
          <pre className="text-xs bg-gray-200 p-2 rounded">
            {JSON.stringify(ingredientes, null, 2)}
          </pre>
        </div>

      </div>
    </div>
  );
}