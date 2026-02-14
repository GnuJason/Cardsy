import { useState, useCallback, useRef } from 'react';
import type { UnlockedAchievement, AllStats, GameMode, TriPeaksGameState } from '../logic/types';
import { checkAchievements, ACHIEVEMENTS as ACHIEVEMENT_DEFS, type AchievementContext } from '../logic/achievements';
import { getAchievements, setAchievements, getPlayDates, recordPlayDate } from '../services/storage';

export interface AchievementToastData {
  id: string;
  name: string;
  icon: string;
  tier?: number;
}

export function useAchievements() {
  const [unlocked, setUnlocked] = useState<UnlockedAchievement[]>(() => getAchievements());
  const [toastQueue, setToastQueue] = useState<AchievementToastData[]>([]);
  const unlockedRef = useRef(unlocked);
  unlockedRef.current = unlocked;

  const persist = useCallback((next: UnlockedAchievement[]) => {
    setUnlocked(next);
    setAchievements(next);
  }, []);

  /**
   * Check achievements after a game event (win, game start, etc.)
   */
  const check = useCallback(
    (ctx: Omit<AchievementContext, 'playDates'>) => {
      // Record play date every time we check
      recordPlayDate();
      const playDates = getPlayDates();

      const fullCtx: AchievementContext = { ...ctx, playDates };
      const newUnlocks = checkAchievements(fullCtx, unlockedRef.current);

      if (newUnlocks.length > 0) {
        // Merge with existing
        const merged = [...unlockedRef.current];
        for (const nu of newUnlocks) {
          const idx = merged.findIndex((u) => u.id === nu.id);
          if (idx >= 0) {
            merged[idx] = nu; // update tier
          } else {
            merged.push(nu);
          }
        }
        persist(merged);

        // Queue toasts
        const toasts: AchievementToastData[] = newUnlocks.map((nu) => {
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
    },
    [persist],
  );

  const dismissToast = useCallback(() => {
    setToastQueue((prev) => prev.slice(1));
  }, []);

  const checkOnWin = useCallback(
    (
      stats: AllStats,
      mode: GameMode,
      elapsed: number,
      usedUndo: boolean,
      usedStock: boolean,
      peaksClearedInStreak: boolean,
      tripeaksState?: TriPeaksGameState,
    ) => {
      check({
        stats,
        mode,
        elapsed,
        usedUndo,
        usedStock,
        peaksClearedInStreak,
        tripeaksState,
      });
    },
    [check],
  );

  const checkOnGameStart = useCallback(
    (stats: AllStats, mode: GameMode) => {
      check({
        stats,
        mode,
        elapsed: 0,
        usedUndo: false,
        usedStock: false,
        peaksClearedInStreak: false,
      });
    },
    [check],
  );

  return {
    unlocked,
    toastQueue,
    dismissToast,
    checkOnWin,
    checkOnGameStart,
  };
}
