import React, { useRef } from 'react';
import {
  RANK_LABELS,
  SUIT_SYMBOLS,
  canPlaceOnFoundation,
  suitColor,
  type Card,
} from '@grandmagame/card-engine';
import type { PixiGameCanvasProps } from './types';

const FACE_RANKS = new Set([11, 12, 13]);
const FOUNDATION_SUITS = ['hearts', 'diamonds', 'clubs', 'spades'] as const;

function CardFace({ card }: { card: Card }) {
  const tone = suitColor(card.suit) === 'red' ? 'kl-red' : 'kl-black';
  const rank = RANK_LABELS[card.rank];
  const suit = SUIT_SYMBOLS[card.suit];

  return (
    <span className={`kl-face ${tone}`}>
      <span className="kl-corner">{rank}<em>{suit}</em></span>
      <span className="kl-corner kl-corner--b">{rank}<em>{suit}</em></span>
      {FACE_RANKS.has(card.rank) ? (
        <span className="kl-medallion"><span>{rank}</span></span>
      ) : (
        <span className={card.rank === 1 ? 'kl-pip kl-pip--ace' : 'kl-pip'}>{suit}</span>
      )}
    </span>
  );
}

function CardBack({ variant, url }: { variant: string; url: string | null }) {
  return (
    <span
      className={`kl-face kl-back--${variant}${url ? ' kl-back--photo' : ''}`}
      style={url ? { animation: 'none', backgroundImage: `url("${url}")` } : { animation: 'none' }}
    >
      <span className="kl-back-inner" />
    </span>
  );
}

export function PixiGameCanvas({
  gameState,
  reducedMotion,
  drawCount = 1,
  backVariant = 'damask',
  cardBackUrl = null,
  cardBackMode = 'single',
  customBackList = [],
  onGameEvent,
}: PixiGameCanvasProps) {
  const randomBacks = useRef(new Map<string, string>());
  const previousMode = useRef(cardBackMode);

  if (previousMode.current !== cardBackMode) {
    randomBacks.current.clear();
    previousMode.current = cardBackMode;
  }

  const cardBackFor = (cardId: string): string | null => {
    if (cardBackMode !== 'random' || customBackList.length === 0) return cardBackUrl;

    const assigned = randomBacks.current.get(cardId);
    if (assigned) return assigned;

    const usedUrls = new Set(randomBacks.current.values());
    const availableUrls = customBackList.filter((url) => !usedUrls.has(url));
    const choices = availableUrls.length > 0 ? availableUrls : customBackList;
    const randomUrl = choices[Math.floor(Math.random() * choices.length)];
    randomBacks.current.set(cardId, randomUrl);
    return randomUrl;
  };

  const faceDownCardIds = new Set<string>();
  if (gameState.stock.length > 0) faceDownCardIds.add('stock');
  gameState.tableau.forEach((pile) => {
    pile.forEach((card) => {
      if (!card.faceUp) faceDownCardIds.add(card.id);
    });
  });
  randomBacks.current.forEach((_, cardId) => {
    if (!faceDownCardIds.has(cardId)) randomBacks.current.delete(cardId);
  });

  const wasteTop = gameState.waste.at(-1);
  const dealClass = reducedMotion ? '' : ' kl-deal';
  let dealIndex = 0;

  const wasteStart = Math.max(0, gameState.waste.length - drawCount);
  const wasteFan = gameState.waste.slice(wasteStart);

  return (
    <main aria-label="Klondike game board" className="kl-board">
      <div className="kl-row-top">
        {gameState.stock.length > 0 ? (
          <button
            type="button"
            aria-label="Draw from stock"
            className="kl-card kl-card--back"
            onClick={() => onGameEvent({ type: 'DRAW' })}
          >
            <CardBack variant={backVariant} url={cardBackFor('stock')} />
          </button>
        ) : (
          <button
            type="button"
            aria-label="Recycle waste into stock"
            className="kl-slot"
            onClick={() => onGameEvent({ type: 'DRAW' })}
          >
            <span className="kl-recycle">⟳</span>
          </button>
        )}

        <div className="kl-waste">
          {wasteFan.length === 0 && <span className="kl-slot" aria-hidden="true" />}
          {wasteFan.map((card, i) => (
            <button
              type="button"
              key={card.id}
              aria-label={`Waste card ${RANK_LABELS[card.rank]} of ${card.suit}`}
              className="kl-card"
              style={{ left: `calc(${i} * var(--waste-fan-offset))`, zIndex: i + 1 }}
              onClick={() => onGameEvent({ type: 'TAP_WASTE' })}
            >
              <CardFace card={card} />
            </button>
          ))}
        </div>

        <div aria-hidden="true" />

        {gameState.foundations.map((pile, pileIndex) => {
          const top = pile.at(-1);
          const hint = !!wasteTop && canPlaceOnFoundation(wasteTop, pile);
          return top ? (
            <button
              type="button"
              key={pileIndex}
              aria-label={`Foundation ${pileIndex + 1}`}
              className="kl-card"
              onClick={() => onGameEvent({ type: 'TAP_FOUNDATION', pileIndex })}
            >
              <CardFace card={top} />
            </button>
          ) : (
            <button
              type="button"
              key={pileIndex}
              aria-label={`Empty foundation ${pileIndex + 1}`}
              className={`kl-slot kl-slot--foundation${hint ? ' kl-glow' : ''}`}
              onClick={() => onGameEvent({ type: 'TAP_FOUNDATION', pileIndex })}
            >
              <span aria-hidden="true">{SUIT_SYMBOLS[FOUNDATION_SUITS[pileIndex]]}</span>
            </button>
          );
        })}
      </div>

      <div className="kl-tableau" key={gameState.shuffleSeed ?? 0}>
        {gameState.tableau.map((pile, pileIndex) => (
          <div key={pileIndex} className="kl-tableau-col">
            {pile.length === 0 && (
              <button
                type="button"
                aria-label={`Empty tableau column ${pileIndex + 1}`}
                className="kl-slot"
                onClick={() => onGameEvent({ type: 'TAP_TABLEAU', pileIndex, cardIndex: 0 })}
              />
            )}
            {pile.map((card, cardIndex) => (
              <button
                type="button"
                key={card.id}
                aria-label={card.faceUp ? `${RANK_LABELS[card.rank]} of ${card.suit}` : 'Face-down card'}
                className={`kl-card kl-tcard${dealClass}`}
                style={{
                  ['--fan-i' as string]: cardIndex,
                  ['--deal-i' as string]: dealIndex++,
                  zIndex: cardIndex + 1,
                }}
                onClick={() => onGameEvent({ type: 'TAP_TABLEAU', pileIndex, cardIndex })}
              >
                {card.faceUp ? <CardFace card={card} /> : <CardBack variant={backVariant} url={cardBackFor(card.id)} />}
              </button>
            ))}
          </div>
        ))}
      </div>
    </main>
  );
}