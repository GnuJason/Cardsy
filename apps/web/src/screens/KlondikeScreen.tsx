import React, { useEffect, useMemo } from 'react';
import { isWon } from '@grandmagame/card-engine';
import { PixiGameCanvas } from '../pixi/PixiGameCanvas';
import type { PixiGameEvent } from '../pixi/types';
import { useGameState } from '../hooks/useGameState';
import type { CardBackSettings } from '../state/settings';

const themeColors = {
  feltColor: 0x1a6b3c,
  cardBackground: 0xffffff,
  cardBorder: 0x0d2233,
  redCardColor: 0xc21807,
  blackCardColor: 0x101010,
  placeholderStroke: 0xffffff,
  placeholderAlpha: 0.3,
};

interface KlondikeScreenProps {
  backVariant: CardBackSettings['selectedDefaultBack'];
  cardBackUrl: string | null;
  cardBackMode: CardBackSettings['cardBackMode'];
  customBackList: string[];
  onSettings: () => void;
}

const CONFETTI_COLORS = ['#e8cd8d', '#f6e5b8', '#a8263a', '#2a4066', '#96566a', '#fffdf6'];

function WinConfetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        px: `${(i * 137.5) % 100}%`,
        pw: i % 4 === 0 ? '14px' : '9px',
        ph: i % 4 === 0 ? '20px' : '9px',
        pr: i % 3 === 0 ? '50%' : '2px',
        pc: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        pd: `${2.6 + (i % 5) * 0.55}s`,
        pdelay: `${(i % 10) * 0.24}s`,
        pdrift: `${((i % 7) - 3) * 34}px`,
        prot: `${180 + (i % 4) * 160}deg`,
      })),
    [],
  );

  return (
    <>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="kl-piece"
          style={{
            ['--px' as string]: p.px,
            ['--pw' as string]: p.pw,
            ['--ph' as string]: p.ph,
            ['--pr' as string]: p.pr,
            ['--pc' as string]: p.pc,
            ['--pd' as string]: p.pd,
            ['--pdelay' as string]: p.pdelay,
            ['--pdrift' as string]: p.pdrift,
            ['--prot' as string]: p.prot,
          }}
        />
      ))}
    </>
  );
}

function formatTime(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function KlondikeScreen({ backVariant, cardBackUrl, cardBackMode, customBackList, onSettings }: KlondikeScreenProps) {
  const { game, canUndo, drawCount, actions } = useGameState();

  const won = game.status === 'won' || isWon(game);

  useEffect(() => {
    if (won) return;
    const timer = window.setInterval(() => actions.setElapsed(game.elapsedSeconds + 1), 1000);
    return () => window.clearInterval(timer);
  }, [actions, game.elapsedSeconds, won]);

  const onGameEvent = (event: PixiGameEvent) => {
    switch (event.type) {
      case 'DRAW': actions.draw(); break;
      case 'TAP_WASTE': actions.tapWaste(); break;
      case 'TAP_TABLEAU': actions.tapTableau(event.pileIndex, event.cardIndex); break;
      case 'TAP_FOUNDATION': actions.tapFoundation(event.pileIndex); break;
    }
  };

  return (
    <div className="kl-root">
      <header className="kl-hud">
        <span className="kl-title">Grandma’s Solitaire</span>

        <div className="kl-stats" role="status" aria-label="Game statistics">
          <div className="kl-stat">
            <span className="kl-stat-value" key={`s${game.score}`}>{game.score}</span>
            <span className="kl-stat-label">Score</span>
          </div>
          <div className="kl-stat">
            <span className="kl-stat-value" key={`m${game.moves}`}>{game.moves}</span>
            <span className="kl-stat-label">Moves</span>
          </div>
          <div className="kl-stat">
            <span className="kl-stat-value">{formatTime(game.elapsedSeconds)}</span>
            <span className="kl-stat-label">Time</span>
          </div>
        </div>

        <div className="kl-spacer" />

        <button type="button" className="kl-btn" onClick={onSettings} aria-label="Card back settings">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.03 2.03-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56v.09h-2.87v-.09a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-2.03-2.03.06-.06A1.7 1.7 0 0 0 7.3 15a1.7 1.7 0 0 0-1.56-1.03h-.09v-2.87h.09A1.7 1.7 0 0 0 7.3 10.07a1.7 1.7 0 0 0-.34-1.88l-.06-.06L8.93 6.1l.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1.03-1.56v-.09h2.87v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.03 2.03-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.03h.09v2.87h-.09A1.7 1.7 0 0 0 19.4 15Z" />
          </svg>
          Card backs
        </button>

        <button type="button" className="kl-btn" onClick={actions.undo} disabled={!canUndo}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 14 4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-3" />
          </svg>
          Undo
        </button>
        <button type="button" className="kl-btn kl-btn--gold" onClick={actions.newGame}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v6h-6" />
          </svg>
          New game
        </button>
      </header>

      <PixiGameCanvas
        mode="klondike"
        gameState={game}
        cardBackImage={null}
        reducedMotion={false}
        themeColors={themeColors}
        highContrast={false}
        cardScale="medium"
        drawCount={drawCount}
        backVariant={backVariant}
        cardBackUrl={cardBackUrl}
        cardBackMode={cardBackMode}
        customBackList={customBackList}
        onGameEvent={onGameEvent}
      />

      {won && (
        <div className="kl-win" role="dialog" aria-label="You won">
          <WinConfetti />
          <div className="kl-win-panel">
            <div className="kl-win-title">You did it!</div>
            <div className="kl-win-sub">Every card found its home. Beautifully played.</div>
            <div className="kl-win-stats">
              <div className="kl-stat">
                <span className="kl-stat-value">{game.score}</span>
                <span className="kl-stat-label">Score</span>
              </div>
              <div className="kl-stat">
                <span className="kl-stat-value">{game.moves}</span>
                <span className="kl-stat-label">Moves</span>
              </div>
              <div className="kl-stat">
                <span className="kl-stat-value">{formatTime(game.elapsedSeconds)}</span>
                <span className="kl-stat-label">Time</span>
              </div>
            </div>
            <button type="button" className="kl-btn kl-btn--gold" onClick={actions.newGame}>
              Play again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}