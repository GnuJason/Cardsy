import React from 'react';
import styles from './SplashScreen.module.css';

interface SplashScreenProps {
  onStart: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onStart }) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <div className={styles.cake}>🎂</div>
        <h1 className={styles.title}>Happy Birthday, Mom!</h1>
        <p className={styles.message}>
          I made this game just for you.
          <br />
          Love, Jason.
        </p>
        <button className={styles.startBtn} onClick={onStart}>
          Start Playing ♠
        </button>
        <div className={styles.hearts}>♥ ♦ ♣ ♠</div>
      </div>
    </div>
  );
};
