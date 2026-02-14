import React, { useEffect } from 'react';
import type { AchievementToastData } from '../../hooks/useAchievements';
import styles from './AchievementToast.module.css';

interface AchievementToastProps {
  toast: AchievementToastData;
  onDismiss: () => void;
}

export const AchievementToast: React.FC<AchievementToastProps> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className={styles.toast}>
      <span className={styles.icon}>{toast.icon}</span>
      <div className={styles.text}>
        <span className={styles.label}>Achievement Unlocked!</span>
        <span className={styles.name}>
          {toast.name}
          {toast.tier ? ` (${toast.tier})` : ''}
        </span>
      </div>
    </div>
  );
};
