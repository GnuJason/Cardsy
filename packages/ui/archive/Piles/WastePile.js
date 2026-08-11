import { jsx as _jsx } from "react/jsx-runtime";
import { Card, EmptyPile } from '../Card/Card';
import styles from './Piles.module.css';
export const WastePile = ({ waste, onTap, drawCount = 1 }) => {
    if (waste.length === 0) {
        return _jsx(EmptyPile, {});
    }
    // Draw-1: show only the top card
    if (drawCount === 1) {
        const topCard = waste[waste.length - 1];
        return _jsx(Card, { card: { ...topCard, faceUp: true }, onClick: onTap });
    }
    // Draw-3: show up to 3 fanned cards, only top is clickable
    const fanCards = waste.slice(-3);
    return (_jsx("div", { className: styles.wasteFan, children: fanCards.map((card, i) => {
            const isTop = i === fanCards.length - 1;
            return (_jsx("div", { className: styles.wasteFanCard, style: { '--fan-index': i }, children: _jsx(Card, { card: { ...card, faceUp: true }, onClick: isTop ? onTap : undefined }) }, card.id));
        }) }));
};
