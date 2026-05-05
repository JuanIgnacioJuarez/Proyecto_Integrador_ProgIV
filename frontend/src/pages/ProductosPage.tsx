import { useState, useRef } from 'react';
import { Producto } from '../entities/Producto';
import FormularioProducto from '../features/FormularioProducto';
import { GrillaProductos } from '../features/GrillaProductos';

export function ProductosPage() {
  const [productoAEditar, setProductoAEditar] = useState<Producto | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const goToForm = () => {
    setProductoAEditar(null);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleEditar = (producto: Producto) => {
    setProductoAEditar(producto);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleSuccessOrCancel = () => {
    setProductoAEditar(null);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <GrillaProductos
          onEditar={handleEditar}
          action={
            <button
              type="button"
              onClick={goToForm}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Nuevo Producto
            </button>
          }
        />
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100" ref={formRef}>
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">
          {productoAEditar ? 'Editar Producto' : 'Nuevo Producto'}
        </h2>
        <FormularioProducto
          productoAEditar={productoAEditar}
          onCancelarEdicion={handleSuccessOrCancel}
          onSuccess={handleSuccessOrCancel}
        />
      </div>
    </div>
  );
}
