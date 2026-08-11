import { useSyncExternalStore } from 'react';
const STORAGE_KEY = 'grandma-solitaire-card-backs';
const defaults = {
    useCustomBacks: false,
    cardBackMode: 'single',
    selectedCustomBack: null,
    selectedDefaultBack: 'damask',
};
function loadSettings() {
    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (!stored)
            return defaults;
        return { ...defaults, ...JSON.parse(stored) };
    }
    catch {
        return defaults;
    }
}
let snapshot = typeof window === 'undefined' ? defaults : loadSettings();
const subscribers = new Set();
function save(next) {
    snapshot = next;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
    catch {
        // Local storage can be unavailable in private browsing contexts.
    }
    subscribers.forEach((subscriber) => subscriber());
}
export function updateCardBackSettings(update) {
    save({ ...snapshot, ...update });
}
function subscribe(listener) {
    subscribers.add(listener);
    return () => subscribers.delete(listener);
}
export function useCardBackSettings() {
    return useSyncExternalStore(subscribe, () => snapshot, () => defaults);
}
