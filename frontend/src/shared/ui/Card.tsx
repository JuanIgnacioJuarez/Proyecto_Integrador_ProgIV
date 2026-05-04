import type { ReactNode } from 'react';

interface CardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function Card({ title, subtitle, children, actions }: CardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex flex-col hover:shadow-lg transition-all duration-300 h-full transform hover:-translate-y-1">
      <div className="p-5 flex-grow">
        <h3 className="text-xl font-bold text-gray-800 mb-1">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 mb-4">{subtitle}</p>}
        <div className="text-gray-600 text-sm space-y-2">
          {children}
        </div>
      </div>
      {actions && (
        <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 mt-auto">
          {actions}
        </div>
      )}
    </div>
  );
}
