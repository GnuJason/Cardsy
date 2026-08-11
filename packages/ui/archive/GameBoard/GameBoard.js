import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { StockPile } from '../Piles/StockPile';
import { WastePile } from '../Piles/WastePile';
import { FoundationPile } from '../Piles/FoundationPile';
import { TableauPile } from '../Piles/TableauPile';
import styles from './GameBoard.module.css';
export const GameBoard = ({ game, cardBackImage, drawCount = 1, onDraw, onTapWaste, onTapTableau, onTapFoundation, }) => {
    return (_jsxs("div", { className: styles.board, children: [_jsxs("div", { className: styles.topRow, children: [_jsxs("div", { className: styles.stockWaste, children: [_jsx(StockPile, { stock: game.stock, onDraw: onDraw, cardBackImage: cardBackImage }), _jsx(WastePile, { waste: game.waste, onTap: onTapWaste, drawCount: drawCount })] }), _jsx("div", { className: styles.foundations, children: game.foundations.map((pile, idx) => (_jsx(FoundationPile, { cards: pile, suitIndex: idx, onTap: () => onTapFoundation(idx) }, idx))) })] }), _jsx("div", { className: styles.tableauArea, children: _jsx("div", { className: styles.tableau, children: game.tableau.map((pile, idx) => (_jsx("div", { className: styles.tableauColumn, children: _jsx(TableauPile, { cards: pile, pileIndex: idx, onCardTap: onTapTableau, cardBackImage: cardBackImage }) }, idx))) }) })] }));
};
