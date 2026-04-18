import React, { useEffect } from 'react';
import styles from './NoticeToast.module.css';

interface NoticeToastProps {
  message: string;
  onDismiss: () => void;
}

export const NoticeToast: React.FC<NoticeToastProps> = ({ message, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3600);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className={styles.toast} role="status" aria-live="polite">
      <span className={styles.label}>Card Backs</span>
      <span className={styles.message}>{message}</span>
    </div>
  );
};