import { Link } from 'react-router-dom';

import { usePermissions } from '../shared/auth/roles';

export function HomePage() {
  const { canManagePedidos, canManageUsuarios } = usePermissions();

  const cards = [
    {
      to: '/productos',
      title: 'Productos',
      description: 'Gestiona el catalogo principal, precios, stock y asociaciones.',
      gradient: 'from-blue-500 to-indigo-600',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      ),
    },
    {
      to: '/categorias',
      title: 'Categorias',
      description: 'Organiza los productos en diferentes secciones y jerarquias.',
      gradient: 'from-purple-500 to-pink-600',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      ),
    },
    {
      to: '/ingredientes',
      title: 'Ingredientes',
      description: 'Administra los componentes base y marca posibles alergenos.',
      gradient: 'from-green-500 to-teal-600',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      ),
    },
    ...(canManagePedidos
      ? [
          {
            to: '/pedidos',
            title: 'Pedidos',
            description: 'Administra pedidos, estados, pagos y entregas del sistema.',
            gradient: 'from-amber-500 to-orange-600',
            icon: (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5h6m-7 4h8m-8 4h5m-8 8h14a2 2 0 002-2V7.5a2 2 0 00-.586-1.414l-2.5-2.5A2 2 0 0016.5 3H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
            ),
          },
        ]
      : []),
    ...(canManageUsuarios
      ? [
          {
            to: '/usuarios',
            title: 'Usuarios',
            description: 'Gestiona cuentas, roles y accesos administrativos.',
            gradient: 'from-cyan-500 to-blue-600',
            icon: (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m4-4a4 4 0 100-8 4 4 0 000 8zm6 2a3 3 0 100-6" />
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 animate-fade-in">
      <div className="max-w-3xl text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
          Panel de Gestion Central
        </h1>
        <p className="text-lg text-gray-600">
          Selecciona una de las siguientes opciones para administrar los recursos del sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
        {cards.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="group flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-2"
          >
            <div className={`h-32 bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white`}>
              <svg
                className="w-16 h-16 opacity-80 group-hover:scale-110 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                {card.icon}
              </svg>
            </div>
            <div className="p-6 text-center flex-grow">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{card.title}</h2>
              <p className="text-gray-600">{card.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
