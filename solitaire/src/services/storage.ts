import type { UserSettings } from '../logic/types';

const KEYS = {
  bestScore: 'solitaire_best_score',
  settings: 'solitaire_settings',
  splashSeen: 'solitaire_splash_seen',
} as const;

const DEFAULT_SETTINGS: UserSettings = {
  reducedMotion: false,
  cardSize: 'medium',
  cardBack: 'default.png',
};

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage unavailable — silent fail
  }
}

// ── Public API (backend-ready interface) ──

export function getBestScore(): number | null {
  const raw = safeGet(KEYS.bestScore);
  if (raw === null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function setBestScore(score: number): void {
  safeSet(KEYS.bestScore, String(score));
}

export function getSettings(): UserSettings {
  const raw = safeGet(KEYS.settings);
  if (!raw) return { ...DEFAULT_SETTINGS };
  try {
    const parsed = JSON.parse(raw);
    return {
      reducedMotion: typeof parsed.reducedMotion === 'boolean' ? parsed.reducedMotion : DEFAULT_SETTINGS.reducedMotion,
      cardSize: ['small', 'medium', 'large'].includes(parsed.cardSize) ? parsed.cardSize : DEFAULT_SETTINGS.cardSize,
      cardBack: typeof parsed.cardBack === 'string' ? parsed.cardBack : DEFAULT_SETTINGS.cardBack,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function setSettings(settings: UserSettings): void {
  safeSet(KEYS.settings, JSON.stringify(settings));
}

export function getSplashSeen(): boolean {
  return safeGet(KEYS.splashSeen) === 'true';
}

export function setSplashSeen(): void {
  safeSet(KEYS.splashSeen, 'true');
}
