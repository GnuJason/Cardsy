import { useEffect, useRef } from 'react';

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
export function useDebouncedAutoSave(
  shouldSave: boolean,
  saveFn: () => void,
  delay = 300,
): void {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const latestSaveFn = useRef(saveFn);
  const latestShouldSave = useRef(shouldSave);

  // Keep refs current on every render
  latestSaveFn.current = saveFn;
  latestShouldSave.current = shouldSave;

  useEffect(() => {
    if (!shouldSave) {
      // Clear any pending save when we leave saveable state
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = undefined;
      }
      return;
    }

    // Restart debounce timer
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      latestSaveFn.current();
      timerRef.current = undefined;
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = undefined;
      }
    };
  }, [shouldSave, saveFn, delay]);

  // Flush pending save on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = undefined;
      }
      // Always flush if game was in progress
      if (latestShouldSave.current) {
        latestSaveFn.current();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
