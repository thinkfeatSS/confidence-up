import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors, ThemeColors } from './colors';

const DARK_MODE_KEY = '@confidence_up_dark_mode';

type ThemeContextValue = {
  colors: ThemeColors;
  isDark: boolean;
  setDarkMode: (enabled: boolean) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  colors: darkColors,
  isDark: true,
  setDarkMode: () => {},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(DARK_MODE_KEY)
      .then(value => {
        if (value === 'false') setIsDark(false);
      })
      .catch(() => {});
  }, []);

  const setDarkMode = useCallback((enabled: boolean) => {
    setIsDark(enabled);
    AsyncStorage.setItem(DARK_MODE_KEY, enabled ? 'true' : 'false').catch(() => {});
  }, []);

  const value = useMemo(
    () => ({
      colors: isDark ? darkColors : lightColors,
      isDark,
      setDarkMode,
    }),
    [isDark, setDarkMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
