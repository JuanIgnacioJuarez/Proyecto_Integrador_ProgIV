import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 animate-fade-in">
      <div className="max-w-3xl text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
          Panel de Gestión Central
        </h1>
        <p className="text-lg text-gray-600">
          Selecciona una de las siguientes opciones para administrar los recursos del sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
        <Link to="/productos" className="group flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-2">
          <div className="h-32 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
            <svg className="w-16 h-16 opacity-80 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <div className="p-6 text-center flex-grow">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Productos</h2>
            <p className="text-gray-600">Gestiona el catálogo principal, precios, stock y asociaciones.</p>
          </div>
        </Link>

        <Link to="/categorias" className="group flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-2">
          <div className="h-32 bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white">
            <svg className="w-16 h-16 opacity-80 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div className="p-6 text-center flex-grow">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Categorías</h2>
            <p className="text-gray-600">Organiza los productos en diferentes secciones y jerarquías.</p>
          </div>
        </Link>

        <Link to="/ingredientes" className="group flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-2">
          <div className="h-32 bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white">
            <svg className="w-16 h-16 opacity-80 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <div className="p-6 text-center flex-grow">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Ingredientes</h2>
            <p className="text-gray-600">Administra los componentes base y marca posibles alérgenos.</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
