import { atom } from 'nanostores';
import { logStore } from './logs';

export type Theme = 'dark' | 'light';

export const kTheme = 'bolt_theme';

export function themeIsDark() {
  return themeStore.get() === 'dark';
}

export const DEFAULT_THEME = 'light';

export const themeStore = atom<Theme>(initStore());

function initStore() {
  // Check if running in browser environment
  if (typeof window !== 'undefined') {
    try {
      const persistedTheme = localStorage.getItem(kTheme) as Theme | undefined;
      const themeAttribute = document.querySelector('html')?.getAttribute('data-theme');

      return persistedTheme ?? (themeAttribute as Theme) ?? DEFAULT_THEME;
    } catch (e) {
      console.warn('Failed to access localStorage or DOM:', e);
    }
  }

  return DEFAULT_THEME;
}

export function toggleTheme() {
  // Only proceed if in browser environment
  if (typeof window === 'undefined') return;
  
  const currentTheme = themeStore.get();
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  // Update the theme store
  themeStore.set(newTheme);

  try {
    // Update localStorage
    localStorage.setItem(kTheme, newTheme);

    // Update the HTML attribute
    document.querySelector('html')?.setAttribute('data-theme', newTheme);

    // Update user profile if it exists
    const userProfile = localStorage.getItem('bolt_user_profile');

    if (userProfile) {
      const profile = JSON.parse(userProfile);
      profile.theme = newTheme;
      localStorage.setItem('bolt_user_profile', JSON.stringify(profile));
    }
  } catch (error) {
    console.error('Error updating user profile theme:', error);
  }

  logStore.logSystem(`Theme changed to ${newTheme} mode`);
}
