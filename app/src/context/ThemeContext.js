import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { setColorScheme } from 'nativewind';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('system'); // 'light' | 'dark' | 'system'
  const [resolved, setResolved] = useState(Appearance.getColorScheme?.() || 'light');

  useEffect(() => {
    const sub = Appearance.addChangeListener?.(({ colorScheme }) => setResolved(colorScheme || 'light'));
    (async () => {
      const saved = await AsyncStorage.getItem('theme_mode');
      if (saved) setMode(saved);
    })();
    return () => sub?.remove?.();
  }, []);

  const effective = mode === 'system' ? resolved : mode;

  const setTheme = async (next) => {
    setMode(next);
    await AsyncStorage.setItem('theme_mode', next);
    // Force update resolved theme
    if (next !== 'system') {
      setResolved(next);
    }
  };

  // keep NativeWind color scheme in sync
  useEffect(() => {
    try {
      setColorScheme(effective);
    } catch {}
  }, [effective]);

  const value = useMemo(() => ({ mode, effective, setTheme }), [mode, effective]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeMode() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeMode must be used within ThemeProvider');
  return ctx;
}
