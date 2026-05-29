import type { ChangeEvent } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Buscar...' }: SearchBarProps) {
  return (
    <div className="relative mb-6">
      <input
        type="text"
        className="w-full pl-10 pr-12 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500 text-gray-700 dark:text-slate-100 bg-white/95 dark:bg-slate-900/85 border-gray-300/90 dark:border-slate-700 transition-colors"
        placeholder={placeholder}
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      />
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg className="h-5 w-5 text-gray-400 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
      </div>
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-2 my-auto h-7 w-7 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
          aria-label="Limpiar busqueda"
        >
          x
        </button>
      )}
    </div>
  );
}
