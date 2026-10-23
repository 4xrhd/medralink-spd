import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { translate, type Lang } from '../i18n/translate.js';

export type { Lang };

interface LanguageValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Translate an English UI string. Missing Bangla entries fall back to English. */
  t: (english: string, vars?: Record<string, string | number>) => string;
}

const STORAGE_KEY = 'medralink.lang';

const readStoredLang = (): Lang => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'bn' ? 'bn' : 'en';
  } catch {
    return 'en';
  }
};

const LanguageContext = createContext<LanguageValue>({
  lang: 'en',
  setLang: () => undefined,
  t: (english, vars) => translate('en', english, vars),
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(readStoredLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private mode or blocked storage: the choice lasts for this visit only
    }
  }, []);

  const t = useCallback(
    (english: string, vars?: Record<string, string | number>) => translate(lang, english, vars),
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);
