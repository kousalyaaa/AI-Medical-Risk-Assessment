import React, { createContext, useContext, useEffect, useState } from 'react';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (dark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { data: profile } = useProfile();
  const { mutateAsync: updateProfile } = useUpdateProfile();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize dark mode from profile
  useEffect(() => {
    if (profile?.dark_mode !== undefined) {
      setIsDarkMode(profile.dark_mode);
    }
  }, [profile?.dark_mode]);

  // Apply dark class to document
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const setDarkMode = async (dark: boolean) => {
    setIsDarkMode(dark);
    try {
      await updateProfile({ dark_mode: dark });
    } catch (error) {
      // Revert on error
      setIsDarkMode(!dark);
      console.error('Failed to update dark mode preference:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
