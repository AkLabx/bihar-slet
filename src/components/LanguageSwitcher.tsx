import React from 'react';
import { useQuizStore } from '../store/useQuizStore';
import { Language } from '../types';
import { Languages } from 'lucide-react';

interface LanguageSwitcherProps {
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  size = 'sm',
  showIcon = true,
  className = '',
}) => {
  const { language, setLanguage } = useQuizStore();

  const options: { id: Language; label: string; short: string; title: string }[] = [
    {
      id: 'bilingual',
      label: 'द्विभाषी',
      short: 'Both',
      title: 'द्विभाषी / Bilingual (Hindi & English)',
    },
    {
      id: 'hindi',
      label: 'हिन्दी',
      short: 'हिं',
      title: 'केवल हिन्दी / Hindi Only',
    },
    {
      id: 'english',
      label: 'English',
      short: 'EN',
      title: 'English Only',
    },
  ];

  const isSmall = size === 'sm';

  return (
    <div
      role="group"
      aria-label="Language selector"
      className={`inline-flex items-center bg-gray-100 dark:bg-slate-800 rounded-lg p-0.5 border border-gray-200 dark:border-slate-700 shadow-2xs shrink-0 ${className}`}
    >
      {showIcon && (
        <span className="hidden sm:inline-flex items-center pl-1.5 pr-1 text-gray-500 dark:text-gray-400">
          <Languages className={isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        </span>
      )}
      {options.map((opt) => {
        const isActive = language === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => setLanguage(opt.id)}
            title={opt.title}
            aria-pressed={isActive}
            className={`transition-all rounded-md font-semibold select-none cursor-pointer ${
              isSmall ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'
            } ${
              isActive
                ? 'bg-amber-500 text-white shadow-xs font-bold'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-slate-700/50'
            }`}
          >
            <span className="hidden sm:inline">{opt.label}</span>
            <span className="sm:hidden">{opt.short}</span>
          </button>
        );
      })}
    </div>
  );
};
