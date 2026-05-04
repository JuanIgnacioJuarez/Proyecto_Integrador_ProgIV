import { useState, useRef } from 'react';
import { Producto } from '../entities/Producto';
import FormularioProducto from '../features/FormularioProducto';
import { GrillaProductos } from '../features/GrillaProductos';

export function ProductosPage() {
  const [productoAEditar, setProductoAEditar] = useState<Producto | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

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

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <GrillaProductos onEditar={handleEditar} />
      </div>
    </div>
  );
}
