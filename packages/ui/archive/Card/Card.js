import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useCallback } from 'react';
import { suitColor, SUIT_SYMBOLS, RANK_LABELS } from '../../logic/types';
import { CARD_BACK_DEFAULT, getCardBackImage } from '../../config/cardArt';
import styles from './Card.module.css';
export const Card = React.memo(({ card, onClick, cardIndex, onTapCard, style, cardBackImage }) => {
    const handleClick = useCallback(() => {
        if (onClick) {
            onClick();
        }
        else if (onTapCard !== undefined && cardIndex !== undefined) {
            onTapCard(cardIndex);
        }
    }, [onClick, onTapCard, cardIndex]);
    const isClickable = !!(onClick || (onTapCard && cardIndex !== undefined));
    if (!card.faceUp) {
        // Per-card unique back image, with global setting as override
        const backImage = cardBackImage ?? getCardBackImage(card.id) ?? CARD_BACK_DEFAULT;
        return (_jsx("div", { className: styles.card, style: style, onClick: isClickable ? handleClick : undefined, role: "button", "aria-label": "Face-down card", tabIndex: 0, onKeyDown: (e) => e.key === 'Enter' && isClickable && handleClick(), children: _jsx("div", { className: styles.back, children: _jsx("img", { src: backImage, alt: "", className: styles.backImage, draggable: false }) }) }));
    }
    const color = suitColor(card.suit);
    const colorClass = color === 'red' ? styles.red : styles.black;
    const symbol = SUIT_SYMBOLS[card.suit];
    const rankLabel = RANK_LABELS[card.rank];
    return (_jsx("div", { className: styles.card, style: style, onClick: isClickable ? handleClick : undefined, role: "button", "aria-label": `${rankLabel} of ${card.suit}`, tabIndex: 0, onKeyDown: (e) => e.key === 'Enter' && isClickable && handleClick(), children: _jsxs("div", { className: styles.face, children: [_jsxs("div", { className: `${styles.topLabel} ${colorClass}`, children: [_jsx("span", { className: styles.rank, children: rankLabel }), _jsx("span", { className: styles.suit, children: symbol })] }), _jsx("div", { className: `${styles.centerPip} ${colorClass}`, children: symbol }), _jsxs("div", { className: `${styles.bottomLabel} ${colorClass}`, children: [_jsx("span", { className: styles.rank, children: rankLabel }), _jsx("span", { className: styles.suit, children: symbol })] })] }) }));
});
Card.displayName = 'Card';
export const EmptyPile = ({ onClick, suitSymbol }) => {
    if (suitSymbol) {
        return (_jsx("div", { className: styles.emptyFoundation, onClick: onClick, role: "button", "aria-label": `Empty foundation for ${suitSymbol}`, tabIndex: 0, children: suitSymbol }));
    }
    return (_jsx("div", { className: styles.empty, onClick: onClick, role: "button", "aria-label": "Empty pile", tabIndex: 0 }));
};
