/**
 * _app.tsx - Application root
 */

import type { AppProps } from 'next/app';
import { AuthProvider } from '@/context/AuthContext';
import { PaperProvider } from '@/context/PaperContext';
import { ThemeContextProvider } from '@/context/ThemeContext';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeContextProvider>
      <AuthProvider>
        <PaperProvider>
          <Component {...pageProps} />
        </PaperProvider>
      </AuthProvider>
    </ThemeContextProvider>
  );
}
