/**
 * Debounces auto-save writes to localStorage.
 *
 * Restarts the timer whenever `saveFn` identity changes (i.e. when the
 * game state it captures changes).  Flushes any pending save on unmount
 * so in-progress games are never lost.
 *
 * @param shouldSave  — only save while the game is in a saveable state
 * @param saveFn      — closure that writes current state to storage
 * @param delay       — debounce interval in ms (default 300)
 */
export declare function useDebouncedAutoSave(shouldSave: boolean, saveFn: () => void, delay?: number): void;
