import { useState, useCallback, useRef } from 'react';
import { checkAchievements, ACHIEVEMENTS as ACHIEVEMENT_DEFS } from '../logic/achievements';
import { getAchievements, setAchievements, getPlayDates, recordPlayDate } from '../services/storage';
export function useAchievements() {
    const [unlocked, setUnlocked] = useState(() => getAchievements());
    const [toastQueue, setToastQueue] = useState([]);
    const unlockedRef = useRef(unlocked);
    unlockedRef.current = unlocked;
    const persist = useCallback((next) => {
        setUnlocked(next);
        setAchievements(next);
    }, []);
    /**
     * Check achievements after a game event (win, game start, etc.)
     */
    const check = useCallback((ctx) => {
        // Record play date every time we check
        recordPlayDate();
        const playDates = getPlayDates();
        const fullCtx = { ...ctx, playDates };
        const newUnlocks = checkAchievements(fullCtx, unlockedRef.current);
        if (newUnlocks.length > 0) {
            // Merge with existing
            const merged = [...unlockedRef.current];
            for (const nu of newUnlocks) {
                const idx = merged.findIndex((u) => u.id === nu.id);
                if (idx >= 0) {
                    merged[idx] = nu; // update tier
                }
                else {
                    merged.push(nu);
                }
            }
            persist(merged);
            // Queue toasts
            const toasts = newUnlocks.map((nu) => {
                const def = ACHIEVEMENT_DEFS.find((a) => a.id === nu.id);
                return {
                    id: nu.id,
                    name: def?.name ?? nu.id,
                    icon: def?.icon ?? '🏆',
                    tier: nu.tier,
                };
            });
            setToastQueue((prev) => [...prev, ...toasts]);
        }
    }, [persist]);
    const dismissToast = useCallback(() => {
        setToastQueue((prev) => prev.slice(1));
    }, []);
    const checkOnWin = useCallback((stats, mode, elapsed, usedUndo, usedStock, peaksClearedInStreak, tripeaksState) => {
        check({
            stats,
            mode,
            elapsed,
            usedUndo,
            usedStock,
            peaksClearedInStreak,
            tripeaksState,
        });
    }, [check]);
    const checkOnGameStart = useCallback((stats, mode) => {
        check({
            stats,
            mode,
            elapsed: 0,
            usedUndo: false,
            usedStock: false,
            peaksClearedInStreak: false,
        });
    }, [check]);
    return {
        unlocked,
        toastQueue,
        dismissToast,
        checkOnWin,
        checkOnGameStart,
    };
}
