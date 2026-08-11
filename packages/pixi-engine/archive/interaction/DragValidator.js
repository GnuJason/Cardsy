import { moveColumnToColumn, moveColumnToFoundation, moveFreeCellToColumn, moveFreeCellToFoundation, } from '../../logic/freecell/moves';
import { canPlaceOnFoundation, canPlaceOnTableau, isValidTableauRun } from '../../logic/rules';
import { moveCards } from '../../logic/spider/moves';
import { SUIT_INDEX } from '../../logic/types';
function canDropKlondike(gameState, source, target) {
    if (source.pileType === 'waste') {
        if (source.pileIndex !== 0 || gameState.waste.length === 0)
            return false;
        if (source.cardIndex !== gameState.waste.length - 1)
            return false;
        const card = gameState.waste[source.cardIndex];
        if (!card)
            return false;
        if (target.pileType === 'tableau') {
            return canPlaceOnTableau(card, gameState.tableau[target.pileIndex] ?? []);
        }
        if (target.pileType === 'foundation') {
            return (target.pileIndex === SUIT_INDEX[card.suit] &&
                canPlaceOnFoundation(card, gameState.foundations[target.pileIndex] ?? []));
        }
        return false;
    }
    if (source.pileType === 'tableau') {
        const sourcePile = gameState.tableau[source.pileIndex];
        if (!sourcePile || source.cardIndex < 0 || source.cardIndex >= sourcePile.length) {
            return false;
        }
        const movingCard = sourcePile[source.cardIndex];
        if (!movingCard.faceUp)
            return false;
        if (!isValidTableauRun(sourcePile.slice(source.cardIndex)))
            return false;
        if (target.pileType === 'tableau') {
            if (target.pileIndex === source.pileIndex)
                return false;
            return canPlaceOnTableau(movingCard, gameState.tableau[target.pileIndex] ?? []);
        }
        if (target.pileType === 'foundation') {
            if (source.cardIndex !== sourcePile.length - 1)
                return false;
            return (target.pileIndex === SUIT_INDEX[movingCard.suit] &&
                canPlaceOnFoundation(movingCard, gameState.foundations[target.pileIndex] ?? []));
        }
    }
    return false;
}
function canDropFreeCell(gameState, source, target) {
    if (source.pileType === 'column') {
        if (target.pileType === 'column') {
            return moveColumnToColumn(gameState, source.pileIndex, source.cardIndex, target.pileIndex) !== null;
        }
        if (target.pileType === 'freecell') {
            const sourceCol = gameState.columns[source.pileIndex];
            if (!sourceCol || source.cardIndex !== sourceCol.length - 1)
                return false;
            return gameState.freeCells[target.pileIndex] === null;
        }
        if (target.pileType === 'foundation') {
            const sourceCol = gameState.columns[source.pileIndex];
            if (!sourceCol || source.cardIndex !== sourceCol.length - 1)
                return false;
            const card = sourceCol[source.cardIndex];
            if (!card)
                return false;
            if (target.pileIndex !== SUIT_INDEX[card.suit])
                return false;
            return moveColumnToFoundation(gameState, source.pileIndex) !== null;
        }
    }
    if (source.pileType === 'freecell') {
        if (target.pileType === 'column') {
            return moveFreeCellToColumn(gameState, source.pileIndex, target.pileIndex) !== null;
        }
        if (target.pileType === 'foundation') {
            const card = gameState.freeCells[source.pileIndex];
            if (!card)
                return false;
            if (target.pileIndex !== SUIT_INDEX[card.suit])
                return false;
            return moveFreeCellToFoundation(gameState, source.pileIndex) !== null;
        }
    }
    return false;
}
function canDropSpider(gameState, source, target) {
    if (source.pileType !== 'column' || target.pileType !== 'column')
        return false;
    return moveCards(gameState, source.pileIndex, source.cardIndex, target.pileIndex) !== null;
}
export function canDrop(mode, gameState, source, target) {
    if (mode === 'klondike') {
        return canDropKlondike(gameState, source, target);
    }
    if (mode === 'freecell') {
        return canDropFreeCell(gameState, source, target);
    }
    if (mode === 'spider') {
        return canDropSpider(gameState, source, target);
    }
    return false;
}
