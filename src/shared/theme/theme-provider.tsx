import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';
import { AppTheme, ThemeMode, themes } from './tokens';

type ThemeContextValue = {
  mode: ThemeMode;
  theme: AppTheme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = PropsWithChildren<{
  initialMode: ThemeMode;
}>;

export function ThemeProvider({ children, initialMode }: ThemeProviderProps) {
  const [mode, setMode] = useState<ThemeMode>(initialMode);
  const value = useMemo(
    () => ({
      mode,
      theme: themes[mode],
      toggleTheme: () => setMode((current) => (current === 'light' ? 'dark' : 'light')),
    }),
    [mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);

  if (!value) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }

  return value;
}
