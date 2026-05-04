import { useState, useRef } from 'react';
import { Categoria } from '../entities/Categoria';
import FormularioCategoria from '../features/FormularioCategoria';
import { GrillaCategorias } from '../features/GrillaCategorias';

export function CategoriasPage() {
  const [categoriaAEditar, setCategoriaAEditar] = useState<Categoria | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const handleEditar = (categoria: Categoria) => {
    setCategoriaAEditar(categoria);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleSuccessOrCancel = () => {
    setCategoriaAEditar(null);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100" ref={formRef}>
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">
          {categoriaAEditar ? 'Editar Categoría' : 'Nueva Categoría'}
        </h2>
        <FormularioCategoria 
          categoriaAEditar={categoriaAEditar} 
          onCancelarEdicion={handleSuccessOrCancel}
          onSuccess={handleSuccessOrCancel}
        />
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <GrillaCategorias onEditar={handleEditar} />
      </div>
    </div>
  );
}
