import React from 'react';
import type { UnlockedAchievement } from '../../logic/types';
import { ACHIEVEMENTS, getTierProgress } from '../../logic/achievements';
import { Modal } from '../Modal/Modal';
import styles from './AchievementsModal.module.css';

interface AchievementsModalProps {
  unlocked: UnlockedAchievement[];
  onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  unlocked,
  onClose,
}) => {
  const unlockedMap = new Map<string, UnlockedAchievement>();
  for (const u of unlocked) {
    unlockedMap.set(u.id, u);
  }

  return (
    <Modal onClose={onClose} ariaLabel="Achievements" className={styles.achievementsPanel}>
        <h2 className={styles.title}>🏆 Achievements</h2>

        <div className={styles.grid}>
          {ACHIEVEMENTS.map((def) => {
            const u = unlockedMap.get(def.id);
            const isUnlocked = !!u;

            const tierInfo = def.tiers ? getTierProgress(def, u) : null;

            return (
              <div
                key={def.id}
                className={isUnlocked ? styles.cardUnlocked : styles.card}
              >
                <span className={isUnlocked ? styles.cardIcon : styles.cardLocked}>
                  {def.icon}
                </span>
                <div className={styles.cardBody}>
                  <div className={styles.cardName}>{def.name}</div>
                  <div className={styles.cardDesc}>{def.description}</div>
                  {tierInfo && (
                    <div className={styles.cardTier}>
                      {tierInfo.currentTier > 0
                        ? `Reached: ${tierInfo.currentTier}`
                        : 'Not started'}
                      {tierInfo.nextTier
                        ? ` · Next: ${tierInfo.nextTier}`
                        : tierInfo.currentTier >= tierInfo.maxTier
                          ? ' · Max!'
                          : ''}
                    </div>
                  )}
                </div>
                {isUnlocked && (
                  <span className={styles.cardBadge}>
                    {u.tier ? `${u.tier}` : '✓'}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <button className={styles.closeBtn} onClick={onClose}>
          Done
        </button>
    </Modal>
  );
};
