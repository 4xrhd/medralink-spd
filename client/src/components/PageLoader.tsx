import { useLanguage } from '../context/LanguageContext.js';
import React from 'react';
import { Icon } from '../ui/primitives.js';

export const PageLoader: React.FC<{ message?: string }> = ({
  message = 'Loading clinical portal module...',
}) => {
  const { t: tr } = useLanguage();
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="min-h-[60vh] flex flex-col items-center justify-center p-6"
    >
      <div className="relative flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-3 border-hair border-t-primary-600 animate-spin" />
        <div className="absolute inset-0 grid place-items-center text-primary-700">
          <img src="/logo-mark.png" alt={tr("Logo")} className="h-4 w-4 object-contain" />
        </div>
      </div>
      <p className="mt-4 text-xs font-medium text-ink-600">
        {tr(message)}
      </p>
    </div>
  );
};

export default PageLoader;
