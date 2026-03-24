import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { storage } from '../utils/storage';
import { darkColors, lightColors, type ThemeColors, type ColorScheme } from '../constants/theme';

const STORAGE_KEY = '@lavaca/theme';

interface ThemeContextValue {
  scheme: ColorScheme;
  colors: ThemeColors;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  scheme: 'dark',
  colors: darkColors,
  toggleTheme: () => {},
  isDark: true,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [scheme, setScheme] = useState<ColorScheme>('dark');

  useEffect(() => {
    storage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark') {
        setScheme(saved);
      }
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setScheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      storage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const value: ThemeContextValue = {
    scheme,
    colors: scheme === 'dark' ? darkColors : lightColors,
    toggleTheme,
    isDark: scheme === 'dark',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
