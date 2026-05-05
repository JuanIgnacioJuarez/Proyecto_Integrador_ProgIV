import { useState, useRef } from 'react';
import { Ingrediente } from '../entities/Ingrediente';
import FormularioIngrediente from '../features/FormularioIngrediente';
import { GrillaIngredientes } from '../features/GrillaIngredientes';

export function IngredientesPage() {
  const [ingredienteAEditar, setIngredienteAEditar] = useState<Ingrediente | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const goToForm = () => {
    setIngredienteAEditar(null);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleEditar = (ingrediente: Ingrediente) => {
    setIngredienteAEditar(ingrediente);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleSuccessOrCancel = () => {
    setIngredienteAEditar(null);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <GrillaIngredientes
          onEditar={handleEditar}
          action={
            <button
              type="button"
              onClick={goToForm}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Nuevo Ingrediente
            </button>
          }
        />
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100" ref={formRef}>
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">
          {ingredienteAEditar ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}
        </h2>
        <FormularioIngrediente
          ingredienteAEditar={ingredienteAEditar}
          onCancelarEdicion={handleSuccessOrCancel}
          onSuccess={handleSuccessOrCancel}
        />
      </div>
    </div>
  );
}
