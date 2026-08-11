import { useEffect, useCallback, useState } from 'react';
import { getThemeById, type ThemeDef } from '../config/themes';

/**
 * Apply a theme's CSS custom properties to the document root.
 */
function applyTheme(theme: ThemeDef, isTriPeaks: boolean): void {
  const root = document.documentElement;
  const c = theme.colors;
  root.style.setProperty('--color-felt', isTriPeaks ? c.feltDark : c.felt);
  root.style.setProperty('--color-felt-dark', c.feltDark);
  root.style.setProperty('--color-hud-bg', c.hudBg);
  root.style.setProperty('--color-hud-text', c.hudText);
  root.style.setProperty('--color-button-bg', c.buttonBg);
  root.style.setProperty('--color-button-text', c.buttonText);
  root.style.setProperty('--color-button-hover', c.buttonHover);
  root.style.setProperty('--color-modal-bg', c.modalBg);
  root.style.setProperty('--color-modal-overlay', c.modalOverlay);
  root.style.setProperty('--color-gold', c.accent);
}

export function useTheme(themeId: string, isTriPeaks: boolean) {
  const [theme, setTheme] = useState<ThemeDef>(() => getThemeById(themeId));

  const updateTheme = useCallback((id: string) => {
    const t = getThemeById(id);
    setTheme(t);
  }, []);

  // Apply whenever theme or mode changes
  useEffect(() => {
    const t = getThemeById(themeId);
    setTheme(t);
    applyTheme(t, isTriPeaks);
  }, [themeId, isTriPeaks]);

  return { theme, updateTheme };
}
