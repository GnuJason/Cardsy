import { jsx as _jsx } from "react/jsx-runtime";
import { useCallback } from 'react';
import { Card, EmptyPile } from '../Card/Card';
import styles from './Piles.module.css';
export const TableauPile = ({ cards, pileIndex, onCardTap, cardBackImage, }) => {
    // Stable callback: bind pileIndex once, Card passes cardIndex via onTapCard
    const handleTap = useCallback((cardIndex) => onCardTap(pileIndex, cardIndex), [onCardTap, pileIndex]);
    if (cards.length === 0) {
        return _jsx(EmptyPile, {});
    }
    return (_jsx("div", { className: styles.tableauPile, children: cards.map((card, idx) => (_jsx("div", { className: styles.tableauCard, style: {
                marginTop: idx === 0 ? 0 : card.faceUp ? `calc(-1 * var(--card-height) + var(--fan-offset-down))` : `calc(-1 * var(--card-height) + var(--fan-offset-up, 14px))`,
                zIndex: idx,
            }, children: _jsx(Card, { card: card, cardIndex: idx, onTapCard: handleTap, cardBackImage: cardBackImage }) }, card.id))) }));
};
