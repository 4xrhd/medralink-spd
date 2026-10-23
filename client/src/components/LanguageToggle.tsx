import React from 'react';
import { useLanguage, type Lang } from '../context/LanguageContext.js';

const OPTIONS: Array<{ value: Lang; label: string; name: string }> = [
  { value: 'en', label: 'EN', name: 'English' },
  { value: 'bn', label: 'বাংলা', name: 'বাংলা (Bangla)' },
];

/** Two-option switch between English and Bangla. */
export const LanguageToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { lang, setLang } = useLanguage();
  return (
    <div role="group" aria-label="Language" className={`inline-flex rounded-lg border border-hair bg-canvas p-0.5 ${className}`}>
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          lang={o.value}
          aria-pressed={lang === o.value}
          aria-label={o.name}
          onClick={() => setLang(o.value)}
          className={`h-7 min-w-9 rounded-md px-2 text-xs font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 ${
            o.value === 'bn' ? 'font-bangla text-[0.8125rem]' : ''
          } ${lang === o.value ? 'bg-white text-ink-900 shadow-[0_1px_2px_rgb(20_33_28/0.12)]' : 'text-ink-600 hover:bg-white/70 hover:text-primary-800'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
};
