import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback } from 'react';
import { Card, EmptyPile } from '../Card/Card';
import styles from './GolfBoard.module.css';
export const GolfBoard = ({ game, cardBackImage, onTapCard, onDraw, }) => {
    const wasteTop = game.waste.length > 0 ? game.waste[game.waste.length - 1] : null;
    // Stable callback — uses column index
    const handleTapColumn = useCallback((colIndex) => {
        if (game.tableau[colIndex].length > 0) {
            onTapCard(colIndex);
        }
    }, [onTapCard, game.tableau]);
    return (_jsxs("div", { className: styles.board, children: [_jsxs("div", { className: styles.remainingBadge, children: [_jsx("span", { className: styles.remainingCount, children: game.cardsRemaining }), ' ', "cards remaining"] }), _jsx("div", { className: styles.tableau, children: game.tableau.map((column, colIdx) => (_jsx("div", { className: styles.column, children: column.length === 0 ? (_jsx("div", { className: styles.emptyColumn })) : (column.map((card, cardIdx) => {
                        const isBottom = cardIdx === column.length - 1;
                        return (_jsx("div", { className: `${styles.columnCard} ${isBottom ? styles.exposed : ''}`, children: _jsx(Card, { card: card, cardIndex: colIdx, onTapCard: isBottom ? handleTapColumn : undefined, cardBackImage: cardBackImage }) }, card.id));
                    })) }, colIdx))) }), _jsxs("div", { className: styles.bottomRow, children: [_jsxs("div", { className: styles.stockPile, onClick: onDraw, children: [game.stock.length > 0 ? (_jsx(Card, { card: { ...game.stock[game.stock.length - 1], faceUp: false }, cardBackImage: cardBackImage })) : (_jsx(EmptyPile, {})), game.stock.length > 0 && (_jsx("span", { className: styles.stockCount, children: game.stock.length }))] }), _jsx("div", { className: styles.wastePile, children: wasteTop ? _jsx(Card, { card: wasteTop }) : _jsx(EmptyPile, {}) })] })] }));
};
