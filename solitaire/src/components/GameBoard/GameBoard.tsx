import React from 'react';
import type { GameState } from '../../logic/types';
import { StockPile } from '../Piles/StockPile';
import { WastePile } from '../Piles/WastePile';
import { FoundationPile } from '../Piles/FoundationPile';
import { TableauPile } from '../Piles/TableauPile';
import styles from './GameBoard.module.css';

interface GameBoardProps {
  game: GameState;
  cardBackImage?: string | null;
  onDraw: () => void;
  onTapWaste: () => void;
  onTapTableau: (pileIndex: number, cardIndex: number) => void;
  onTapFoundation: (pileIndex: number) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  game,
  cardBackImage,
  onDraw,
  onTapWaste,
  onTapTableau,
  onTapFoundation,
}) => {
  return (
    <div className={styles.board}>
      {/* Top row: Stock + Waste on left, Foundations on right */}
      <div className={styles.topRow}>
        <div className={styles.stockWaste}>
          <StockPile
            stock={game.stock}
            onDraw={onDraw}
            cardBackImage={cardBackImage}
          />
          <WastePile waste={game.waste} onTap={onTapWaste} />
        </div>

        <div className={styles.foundations}>
          {game.foundations.map((pile, idx) => (
            <FoundationPile
              key={idx}
              cards={pile}
              suitIndex={idx}
              onTap={() => onTapFoundation(idx)}
            />
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div className={styles.tableauArea}>
        <div className={styles.tableau}>
          {game.tableau.map((pile, idx) => (
            <div key={idx} className={styles.tableauColumn}>
              <TableauPile
                cards={pile}
                pileIndex={idx}
                onCardTap={onTapTableau}
                cardBackImage={cardBackImage}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
