import React, { useState } from 'react';
import type { AllStats, GameMode, GameModeStats } from '../../logic/types';
import { formatTime } from '../../hooks/useTimer';
import { ConfirmModal } from '../ConfirmModal/ConfirmModal';
import styles from './StatsModal.module.css';

interface StatsModalProps {
  stats: AllStats;
  currentMode: GameMode;
  onResetStats: (mode: GameMode) => void;
  onClose: () => void;
}

const MODE_LABELS: Record<GameMode, string> = {
  klondike: 'Klondike',
  tripeaks: 'TriPeaks',
  golf: 'Golf',
  pyramid: 'Pyramid',
  freecell: 'FreeCell',
  spider: 'Spider',
};

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.statRow}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value}</span>
    </div>
  );
}

function renderModeStats(m: GameModeStats, mode: GameMode) {
  const winRate =
    m.totalGamesPlayed > 0
      ? `${Math.round((m.totalWins / m.totalGamesPlayed) * 100)}%`
      : '—';

  const scoreLabel =
    mode === 'golf' || mode === 'pyramid'
      ? 'Best (Cards Left)'
      : mode === 'freecell'
        ? 'Best (Moves)'
        : mode === 'spider'
          ? 'Best Score'
          : 'Best Score';

  return (
    <>
      <StatRow label={scoreLabel} value={m.bestScore !== null ? String(m.bestScore) : '—'} />
      <StatRow label="Best Time" value={m.bestTime !== null ? formatTime(m.bestTime) : '—'} />
      <StatRow label="Win Streak" value={`${m.currentWinStreak} (best: ${m.bestWinStreak})`} />
      <StatRow label="Total Wins" value={String(m.totalWins)} />
      <StatRow label="Games Played" value={String(m.totalGamesPlayed)} />
      <StatRow label="Win Rate" value={winRate} />
    </>
  );
}

export const StatsModal: React.FC<StatsModalProps> = ({
  stats,
  currentMode,
  onResetStats,
  onClose,
}) => {
  const [viewMode, setViewMode] = useState<GameMode>(currentMode);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <>
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <h2 className={styles.title}>Statistics</h2>

          <div className={styles.tabs}>
            {(['klondike', 'tripeaks', 'golf', 'pyramid', 'freecell', 'spider'] as GameMode[]).map((mode) => (
              <button
                key={mode}
                className={viewMode === mode ? styles.tabActive : styles.tab}
                onClick={() => setViewMode(mode)}
              >
                {MODE_LABELS[mode]}
              </button>
            ))}
          </div>

          <div className={styles.statsBody}>
            {renderModeStats(stats[viewMode], viewMode)}
          </div>

          <div className={styles.actions}>
            <button
              className={styles.resetBtn}
              onClick={() => setConfirmReset(true)}
            >
              Reset {MODE_LABELS[viewMode]} Stats
            </button>
            <button className={styles.closeBtn} onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>

      {confirmReset && (
        <ConfirmModal
          title="Reset Statistics?"
          message={`This will permanently erase all ${MODE_LABELS[viewMode]} statistics. This cannot be undone.`}
          confirmLabel="Reset"
          cancelLabel="Keep"
          onConfirm={() => {
            onResetStats(viewMode);
            setConfirmReset(false);
          }}
          onCancel={() => setConfirmReset(false)}
        />
      )}
    </>
  );
};
