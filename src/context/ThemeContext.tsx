import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeId = 'emerald' | 'indigo' | 'rose' | 'terracotta' | 'obsidian';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  description: string;
  primaryColor: string;
  accentColor: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'emerald',
    name: 'GoCart Emerald',
    description: 'Fresh botanic green & warm tangerine',
    primaryColor: '#059669',
    accentColor: '#f97316',
  },
  {
    id: 'indigo',
    name: 'Royal Sapphire',
    description: 'Vibrant royal cobalt & golden amber',
    primaryColor: '#4f46e5',
    accentColor: '#f59e0b',
  },
  {
    id: 'rose',
    name: 'Sunset Rose',
    description: 'Modern luxury crimson & electric azure',
    primaryColor: '#e11d48',
    accentColor: '#0284c7',
  },
  {
    id: 'terracotta',
    name: 'Nordic Clay',
    description: 'Warm artisan terracotta & deep cyan',
    primaryColor: '#c2410c',
    accentColor: '#0891b2',
  },
  {
    id: 'obsidian',
    name: 'Midnight Gold',
    description: 'Minimalist obsidian & champagne bronze',
    primaryColor: '#0f172a',
    accentColor: '#d97706',
  },
];

interface ThemeContextType {
  currentTheme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  themes: ThemeOption[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentThemeState] = useState<ThemeId>(() => {
    const saved = localStorage.getItem('gocart_theme');
    if (saved && THEME_OPTIONS.some((t) => t.id === saved)) {
      return saved as ThemeId;
    }
    return 'emerald'; // Fresh signature GoCart Emerald default!
  });

  const setTheme = (theme: ThemeId) => {
    setCurrentThemeState(theme);
    localStorage.setItem('gocart_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        setTheme,
        themes: THEME_OPTIONS,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
