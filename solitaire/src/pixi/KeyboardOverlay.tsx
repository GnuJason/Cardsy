import React from 'react';
import type { GameMode } from '../logic/types';
import type { LayoutResult, PixiGameEvent } from './types';
import { mapTapToEvent } from './interaction/EventMapping';

interface KeyboardOverlayProps {
  layout: LayoutResult;
  mode: GameMode;
  onGameEvent: (event: PixiGameEvent) => void;
}

export const KeyboardOverlay: React.FC<KeyboardOverlayProps> = ({
  layout,
  mode,
  onGameEvent,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
      role="application"
      aria-label="Solitaire game board — use Tab to navigate piles"
    >
      {layout.piles.map((pile) => {
        const event = mapTapToEvent(mode, pile.pileType, pile.pileIndex, 0);
        if (!event) return null;

        return (
          <button
            key={`${pile.pileType}-${pile.pileIndex}`}
            role="button"
            tabIndex={0}
            aria-label={`${pile.pileType} pile ${pile.pileIndex + 1}`}
            style={{
              position: 'absolute',
              left: pile.x,
              top: pile.y,
              width: pile.dropWidth,
              height: pile.dropHeight,
              background: 'transparent',
              border: 'none',
              padding: 0,
              pointerEvents: 'auto',
              outline: 'none',
            }}
            onFocus={(focusEvent) => {
              focusEvent.currentTarget.style.outline = '3px solid #ffd700';
            }}
            onBlur={(focusEvent) => {
              focusEvent.currentTarget.style.outline = 'none';
            }}
            onKeyDown={(keyboardEvent) => {
              if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
                keyboardEvent.preventDefault();
                onGameEvent(event);
              }
            }}
            onClick={() => onGameEvent(event)}
          />
        );
      })}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'absolute',
          left: -9999,
          width: 1,
          height: 1,
          overflow: 'hidden',
        }}
      />
    </div>
  );
};
