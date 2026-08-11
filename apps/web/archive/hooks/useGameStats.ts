import { useState, useCallback, useRef } from 'react';
import type { GameMode, AllStats } from '../logic/types';
import { DEFAULT_MODE_STATS } from '../logic/types';
import { getStats, setStats } from '../services/storage';

export function useGameStats() {
  const [stats, setStatsState] = useState<AllStats>(() => getStats());
  // Ref mirrors state so callbacks never go stale
  const statsRef = useRef(stats);
  statsRef.current = stats;

  const persist = useCallback((next: AllStats) => {
    setStatsState(next);
    setStats(next);
  }, []);

  const recordGameStart = useCallback(
    (mode: GameMode) => {
      const next = { ...statsRef.current };
      next[mode] = {
        ...next[mode],
        totalGamesPlayed: next[mode].totalGamesPlayed + 1,
      };
      persist(next);
    },
    [persist],
  );

  const recordWin = useCallback(
    (mode: GameMode, score: number, timeSeconds: number) => {
      const next = { ...statsRef.current };
      const m = { ...next[mode] };

      m.totalWins += 1;
      m.currentWinStreak += 1;
      if (m.currentWinStreak > m.bestWinStreak) {
        m.bestWinStreak = m.currentWinStreak;
      }
      // Golf/Pyramid/FreeCell: lower score is better (fewest cards remaining / moves)
      // All other modes: higher score is better
      if (mode === 'golf' || mode === 'pyramid' || mode === 'freecell') {
        if (m.bestScore === null || score < m.bestScore) {
          m.bestScore = score;
        }
      } else {
        if (m.bestScore === null || score > m.bestScore) {
          m.bestScore = score;
        }
      }
      if (m.bestTime === null || timeSeconds < m.bestTime) {
        m.bestTime = timeSeconds;
      }

      next[mode] = m;
      persist(next);
    },
    [persist],
  );

  const recordLoss = useCallback(
    (mode: GameMode) => {
      const next = { ...statsRef.current };
      next[mode] = { ...next[mode], currentWinStreak: 0 };
      persist(next);
    },
    [persist],
  );

  const resetStats = useCallback(
    (mode: GameMode) => {
      const next = { ...statsRef.current };
      next[mode] = { ...DEFAULT_MODE_STATS };
      persist(next);
    },
    [persist],
  );

  return { stats, recordGameStart, recordWin, recordLoss, resetStats };
}
