import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { storage } from '../utils/storage';
import { translations, type Locale } from './translations';

const STORAGE_KEY = '@lavaca/locale';

type TranslationKey = keyof typeof translations['es'];

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'es',
  setLocale: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('es');

  useEffect(() => {
    storage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'es' || saved === 'en' || saved === 'pt') {
        setLocaleState(saved);
      }
    });
  }, []);

  const setLocale = useCallback((loc: Locale) => {
    setLocaleState(loc);
    storage.setItem(STORAGE_KEY, loc);
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      let text = translations[locale][key] || translations['es'][key] || key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v));
        });
      }
      return text;
    },
    [locale],
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

