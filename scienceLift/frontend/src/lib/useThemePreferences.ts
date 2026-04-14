import { useEffect, useState } from 'react';

export interface UserPreferences {
  id: number;
  user_id: number;
  theme_mode: string;
  primary_color: string;
  accent_color: string;
  text_primary_color: string;
  text_secondary_color: string;
  bg_primary_color: string;
  bg_secondary_color: string;
  created_at: string;
  updated_at: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Hook to manage user theme preferences
 */
export const useThemePreferences = () => {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user preferences from backend
  const fetchPreferences = async (token: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/profile/me/preferences`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch preferences: ${response.statusText}`);
      }

      const data = await response.json();
      setPreferences(data);
      applyThemeColors(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preferences');
      console.error('Error fetching preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update user preferences
  const updatePreferences = async (
    token: string,
    updates: Partial<UserPreferences>
  ) => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/profile/me/preferences`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update preferences: ${response.statusText}`);
      }

      const data = await response.json();
      setPreferences(data);
      applyThemeColors(data);
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update preferences';
      setError(errorMsg);
      console.error('Error updating preferences:', err);
      throw err;
    }
  };

  // Apply theme colors to CSS variables
  const applyThemeColors = (prefs: UserPreferences) => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    
    // Determine if dark mode
    const isDark = prefs.theme_mode === 'dark';
    
    // Set CSS custom properties
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Set color variables for both light and dark modes
    root.style.setProperty('--primary', prefs.primary_color);
    root.style.setProperty('--accent', prefs.accent_color);
    root.style.setProperty('--text-primary', prefs.text_primary_color);
    root.style.setProperty('--text-secondary', prefs.text_secondary_color);
    root.style.setProperty('--bg-primary', prefs.bg_primary_color);
    root.style.setProperty('--bg-secondary', prefs.bg_secondary_color);

    // Store in localStorage for persistence across page reloads
    localStorage.setItem('userThemePreferences', JSON.stringify(prefs));
  };

  // Load preferences from localStorage as fallback
  const loadFromLocalStorage = () => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('userThemePreferences');
    if (stored) {
      try {
        const prefs = JSON.parse(stored);
        applyThemeColors(prefs);
        return prefs;
      } catch (err) {
        console.error('Error parsing stored preferences:', err);
      }
    }
    return null;
  };

  // Initialize on mount
  useEffect(() => {
    // Try to load from localStorage first (for offline/quick load)
    const stored = loadFromLocalStorage();
    setPreferences(stored as UserPreferences | null);
    
    // Then fetch from backend if token exists
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token) {
        fetchPreferences(token);
      } else {
        setLoading(false);
      }
    }
  }, []);

  return {
    preferences,
    loading,
    error,
    fetchPreferences,
    updatePreferences,
    applyThemeColors,
  };
};
