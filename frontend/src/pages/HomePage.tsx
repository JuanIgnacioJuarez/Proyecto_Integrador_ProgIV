import { Link } from 'react-router-dom';

import { usePermissions } from '../hooks/useRoles';

export function HomePage() {
  const { canManagePedidos, canManageUsuarios, canUseCarrito } = usePermissions();

  const cards = [
    ...(canUseCarrito
      ? [
          {
            to: '/hacer-pedido',
            title: 'Hacer pedido',
            description: 'Elegi productos, agregalos al carrito y confirma tu compra.',
            gradient: 'from-emerald-500 to-teal-600',
            icon: (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 6h14M9 19a1 1 0 11-2 0 1 1 0 012 0zm10 0a1 1 0 11-2 0 1 1 0 012 0z" />
            ),
          },
          {
            to: '/productos',
            title: 'Catalogo',
            description: 'Explora los productos disponibles y arma tu pedido.',
            gradient: 'from-blue-500 to-indigo-600',
            icon: (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7H4m16 5H4m16 5H4M7 4v16m10-16v16" />
            ),
          },
          {
            to: '/mis-pedidos',
            title: 'Mis pedidos',
            description: 'Consulta tus pedidos en proceso, finalizados y cancelados.',
            gradient: 'from-amber-500 to-orange-600',
            icon: (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5h6m-7 4h8m-8 4h5m-8 8h14a2 2 0 002-2V7.5a2 2 0 00-.586-1.414l-2.5-2.5A2 2 0 0016.5 3H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
            ),
          },
        ]
      : []),
    ...(!canUseCarrito
      ? [
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
        ]
      : []),
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
    <div className="flex flex-col items-center justify-center py-10 px-4 animate-fade-in">
      <div className="max-w-3xl text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight mb-4">
          Panel de Gestion Central
        </h1>
        <p className="text-lg text-gray-600 dark:text-slate-300">
          Selecciona una de las siguientes opciones para administrar los recursos del sistema.
        </p>
      </div>

      <div className="w-full max-w-6xl flex flex-wrap justify-center gap-8">
        {cards.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="group w-full max-w-[30rem] lg:max-w-[29%] min-w-[17.5rem] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-slate-700 hover:-translate-y-2"
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
              <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100 mb-2">{card.title}</h2>
              <p className="text-gray-600 dark:text-slate-300">{card.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
