import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  showLabel = false,
}) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all duration-200 cursor-pointer ${
        isDark
          ? 'bg-slate-800 hover:bg-slate-700/80 text-amber-300 border-slate-700 hover:border-amber-400/40 shadow-xs'
          : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border-slate-200/80 hover:border-slate-300 shadow-xs'
      } ${className}`}
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro para leitura confortável'}
      title={
        isDark
          ? 'Modo Escuro ativo (Clique para alternar para Modo Claro)'
          : 'Modo Claro ativo (Clique para alternar para Modo Escuro / Conforto visual)'
      }
    >
      <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 animate-in fade-in zoom-in-75 duration-200" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-600 animate-in fade-in zoom-in-75 duration-200" />
        )}
      </div>

      {showLabel && (
        <span className="text-xs font-semibold whitespace-nowrap select-none">
          {isDark ? 'Modo Escuro' : 'Modo Claro'}
        </span>
      )}
    </button>
  );
};
