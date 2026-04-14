/**
 * Theme context for dark mode management
 */

import React, { ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';

interface ThemeContextProviderProps {
  children: ReactNode;
}

export const ThemeContextProvider: React.FC<ThemeContextProviderProps> = ({ children }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
};
