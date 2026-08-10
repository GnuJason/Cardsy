import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'grandma-solitaire-card-backs';

type BackVariant = 'damask' | 'leather' | 'fabric' | 'floral';

export interface CardBackSettings {
  useCustomBacks: boolean;
  cardBackMode: 'single' | 'random';
  selectedCustomBack: string | null;
  selectedDefaultBack: BackVariant;
}

const defaults: CardBackSettings = {
  useCustomBacks: false,
  cardBackMode: 'single',
  selectedCustomBack: null,
  selectedDefaultBack: 'damask',
};

function loadSettings(): CardBackSettings {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaults;
    return { ...defaults, ...(JSON.parse(stored) as Partial<CardBackSettings>) };
  } catch {
    return defaults;
  }
}

let snapshot = typeof window === 'undefined' ? defaults : loadSettings();
const subscribers = new Set<() => void>();

function save(next: CardBackSettings): void {
  snapshot = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Local storage can be unavailable in private browsing contexts.
  }
  subscribers.forEach((subscriber) => subscriber());
}

export function updateCardBackSettings(update: Partial<CardBackSettings>): void {
  save({ ...snapshot, ...update });
}

function subscribe(listener: () => void): () => void {
  subscribers.add(listener);
  return () => subscribers.delete(listener);
}

export function useCardBackSettings(): CardBackSettings {
  return useSyncExternalStore(subscribe, () => snapshot, () => defaults);
}
