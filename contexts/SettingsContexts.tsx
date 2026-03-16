"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';
type FontSize = 'sm' | 'base' | 'lg';

interface SettingsContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');
  const [fontSize, setFontSize] = useState<FontSize>('base');
  const [mounted, setMounted] = useState(false);

  // 1. Load preferences from LocalStorage on mount
  useEffect(() => {
    const savedTheme = (localStorage.getItem('nimbus-theme') as Theme) || 'system';
    const savedFont = (localStorage.getItem('nimbus-font') as FontSize) || 'base';
    setTheme(savedTheme);
    setFontSize(savedFont);
    setMounted(true);
  }, []);

  // 2. Apply Theme to the HTML root
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('nimbus-theme', theme);
    const root = window.document.documentElement;
    
    root.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme, mounted]);

  // 3. Apply Font Size Scaling to the HTML root
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('nimbus-font', fontSize);
    const root = window.document.documentElement;
    
    // By changing the root font-size, ALL Tailwind rem-based classes (p-4, m-2, text-lg) 
    // scale proportionately, creating a true "density/zoom" effect.
    if (fontSize === 'sm') root.style.fontSize = '14px';
    else if (fontSize === 'base') root.style.fontSize = '16px';
    else if (fontSize === 'lg') root.style.fontSize = '18px';
  }, [fontSize, mounted]);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) return <>{children}</>;

  return (
    <SettingsContext.Provider value={{ theme, setTheme, fontSize, setFontSize }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};