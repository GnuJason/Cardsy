import React, { useEffect, useRef, useState, useMemo } from 'react';
import { getCardBackImage } from '../../config/cardArt';
import { SUITS, RANKS } from '../../logic/types';
import styles from './WinCelebration.module.css';

interface WinCelebrationProps {
  onComplete: () => void;
  reducedMotion?: boolean;
}

/** All 52 card IDs for animation */
function allCardIds(): string[] {
  const ids: string[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      ids.push(`${suit}-${rank}`);
    }
  }
  return ids;
}

/** Get a random card-back image URL from the per-card back mappings */
function getRandomCardBack(): string {
  const ids = allCardIds();
  // Shuffle and find one with an assigned image
  const shuffled = ids.sort(() => Math.random() - 0.5);
  for (const id of shuffled) {
    const img = getCardBackImage(id);
    if (img) return img;
  }
  // Fallback
  return '/cards/backs/20210620_131500.jpg';
}

interface CardPosition {
  x: number;
  y: number;
  rotation: number;
}

/**
 * Generate scatter positions — random screen positions around the viewport.
 */
function generateScatterPositions(count: number): CardPosition[] {
  const positions: CardPosition[] = [];
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const radius = Math.min(vw, vh) * (0.3 + Math.random() * 0.35);
    positions.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      rotation: (Math.random() - 0.5) * 720,
    });
  }
  return positions;
}

export const WinCelebration: React.FC<WinCelebrationProps> = ({
  onComplete,
  reducedMotion = false,
}) => {
  const [phase, setPhase] = useState<'scatter' | 'converge' | 'photo' | 'done'>('scatter');
  const [photoVisible, setPhotoVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const completedRef = useRef(false);

  const cardIds = useMemo(() => allCardIds(), []);
  const scatterPositions = useMemo(() => generateScatterPositions(52), []);
  const finalPhoto = useMemo(() => getRandomCardBack(), []);

  // Get per-card back images
  const cardImages = useMemo(() => {
    return cardIds.map((id) => {
      const img = getCardBackImage(id);
      return img || '/cards/backs/20210620_131500.jpg';
    });
  }, [cardIds]);

  const finish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    timerRef.current.forEach(clearTimeout);
    onComplete();
  };

  // Reduced motion: skip straight to completion
  useEffect(() => {
    if (reducedMotion) {
      finish();
      return;
    }

    // Phase 1 (0s): scatter — cards start at center, fly outward
    // Already in 'scatter' phase from initial state

    // Phase 2 (2s): converge — cards fly back to center
    const t1 = setTimeout(() => setPhase('converge'), 2000);

    // Phase 3 (4s): show final photo
    const t2 = setTimeout(() => {
      setPhase('photo');
      setPhotoVisible(true);
    }, 3800);

    // Phase 4 (5.5s): complete
    const t3 = setTimeout(finish, 5500);

    timerRef.current = [t1, t2, t3];

    return () => {
      timerRef.current.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (reducedMotion) return null;

  const getCardStyle = (index: number): React.CSSProperties => {
    if (phase === 'scatter') {
      const pos = scatterPositions[index];
      return {
        transform: `translate(${pos.x}px, ${pos.y}px) rotate(${pos.rotation}deg)`,
        opacity: 1,
      };
    }
    if (phase === 'converge' || phase === 'photo') {
      // Converge to center with slight spread for stacking effect
      const offset = (index - 26) * 0.3;
      const rot = (index - 26) * 0.5;
      return {
        transform: `translate(${offset}px, ${offset}px) rotate(${rot}deg)`,
        opacity: phase === 'photo' ? 0 : 1,
      };
    }
    return {};
  };

  const phaseClass =
    phase === 'scatter' ? styles.scatter :
    phase === 'converge' || phase === 'photo' ? styles.converge : '';

  return (
    <div className={styles.overlay} onClick={finish}>
      {/* 52 animated cards */}
      {cardIds.map((id, i) => (
        <div
          key={id}
          className={`${styles.card} ${phaseClass}`}
          style={{
            ...getCardStyle(i),
            zIndex: i,
          }}
        >
          <img src={cardImages[i]} alt="" loading="eager" />
        </div>
      ))}

      {/* Final converged photo */}
      <div
        className={`${styles.finalPhoto} ${photoVisible ? styles.finalPhotoVisible : ''}`}
      >
        <img src={finalPhoto} alt="Family photo" loading="eager" />
      </div>

      <div className={styles.skipHint}>Tap anywhere to skip</div>
    </div>
  );
};
