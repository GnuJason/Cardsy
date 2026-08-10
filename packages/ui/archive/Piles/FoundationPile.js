import { jsx as _jsx } from "react/jsx-runtime";
import { SUIT_SYMBOLS, SUITS } from '../../logic/types';
import { Card, EmptyPile } from '../Card/Card';
export const FoundationPile = ({ cards, suitIndex, onTap, }) => {
    const suitSymbol = SUIT_SYMBOLS[SUITS[suitIndex]];
    if (cards.length === 0) {
        return _jsx(EmptyPile, { suitSymbol: suitSymbol, onClick: onTap });
    }
    const topCard = cards[cards.length - 1];
    return _jsx(Card, { card: { ...topCard, faceUp: true }, onClick: onTap });
};
