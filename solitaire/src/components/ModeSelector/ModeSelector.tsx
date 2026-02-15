import React, { useState } from 'react';
import type { GameMode, SavedKlondikeGame, SavedTriPeaksGame, SavedGolfGame, SavedPyramidGame, SavedFreeCellGame, SavedSpiderGame, SpiderDifficulty } from '../../logic/types';
import { setSpiderDifficulty } from '../../services/storage';
import styles from './ModeSelector.module.css';

interface ModeSelectorProps {
  onSelect: (mode: GameMode) => void;
  savedKlondike: SavedKlondikeGame | null;
  savedTriPeaks: SavedTriPeaksGame | null;
  savedGolf: SavedGolfGame | null;
  savedPyramid: SavedPyramidGame | null;
  savedFreeCell: SavedFreeCellGame | null;
  savedSpider: SavedSpiderGame | null;
  onContinue: (mode: GameMode) => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  onSelect,
  savedKlondike,
  savedTriPeaks,
  savedGolf,
  savedPyramid,
  savedFreeCell,
  savedSpider,
  onContinue,
}) => {
  const [showSpiderDifficulty, setShowSpiderDifficulty] = useState(false);

  const pickSpiderDifficulty = (d: SpiderDifficulty) => {
    setSpiderDifficulty(d);
    onSelect('spider');
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <h1 className={styles.title}>Choose Your Game</h1>
        <div className={styles.modes}>
          <button
            className={styles.modeBtn}
            onClick={() =>
              savedKlondike ? onContinue('klondike') : onSelect('klondike')
            }
          >
            <span className={styles.modeIcon}>🃏</span>
            <span className={styles.modeName}>Klondike</span>
            <span className={styles.modeDesc}>
              {savedKlondike
                ? `Continue — Score ${savedKlondike.state.score}`
                : 'Classic Solitaire'}
            </span>
          </button>
          <button
            className={styles.modeBtn}
            onClick={() =>
              savedTriPeaks ? onContinue('tripeaks') : onSelect('tripeaks')
            }
          >
            <span className={styles.modeIcon}>⛰️</span>
            <span className={styles.modeName}>TriPeaks</span>
            <span className={styles.modeDesc}>
              {savedTriPeaks
                ? `Continue — ${savedTriPeaks.state.peaksCleared.filter(Boolean).length}/3 peaks cleared`
                : 'Clear the Peaks'}
            </span>
          </button>
          <button
            className={styles.modeBtn}
            onClick={() =>
              savedGolf ? onContinue('golf') : onSelect('golf')
            }
          >
            <span className={styles.modeIcon}>⛳</span>
            <span className={styles.modeName}>Golf</span>
            <span className={styles.modeDesc}>
              {savedGolf
                ? `Continue — ${savedGolf.state.cardsRemaining} cards left`
                : 'Clear the Course'}
            </span>
          </button>
          <button
            className={styles.modeBtn}
            onClick={() =>
              savedPyramid ? onContinue('pyramid') : onSelect('pyramid')
            }
          >
            <span className={styles.modeIcon}>🏛️</span>
            <span className={styles.modeName}>Pyramid</span>
            <span className={styles.modeDesc}>
              {savedPyramid
                ? `Continue — ${savedPyramid.state.cardsRemaining} cards left`
                : 'Match & Clear'}
            </span>
          </button>
          <button
            className={styles.modeBtn}
            onClick={() =>
              savedFreeCell ? onContinue('freecell') : onSelect('freecell')
            }
          >
            <span className={styles.modeIcon}>🏗️</span>
            <span className={styles.modeName}>FreeCell</span>
            <span className={styles.modeDesc}>
              {savedFreeCell
                ? `Continue — ${savedFreeCell.state.moves} moves`
                : 'Strategic Stacking'}
            </span>
          </button>

          {/* Spider with difficulty picker */}
          {showSpiderDifficulty ? (
            <div className={styles.modeBtn}>
              <span className={styles.modeIcon}>🕷️</span>
              <span className={styles.modeName}>Spider</span>
              <div className={styles.difficultyPicker}>
                <button
                  className={styles.difficultyBtn}
                  onClick={() => pickSpiderDifficulty(1)}
                >
                  1 Suit — Easy
                </button>
                <button
                  className={styles.difficultyBtn}
                  onClick={() => pickSpiderDifficulty(2)}
                >
                  2 Suits — Medium
                </button>
                <button
                  className={styles.difficultyBtn}
                  onClick={() => pickSpiderDifficulty(4)}
                >
                  4 Suits — Hard
                </button>
              </div>
            </div>
          ) : (
            <button
              className={styles.modeBtn}
              onClick={() =>
                savedSpider
                  ? onContinue('spider')
                  : setShowSpiderDifficulty(true)
              }
            >
              <span className={styles.modeIcon}>🕷️</span>
              <span className={styles.modeName}>Spider</span>
              <span className={styles.modeDesc}>
                {savedSpider
                  ? `Continue — ${savedSpider.state.completedRuns}/8 runs`
                  : 'Build 8 suited runs'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
