import { SUIT_INDEX } from '../types';
import { canPlaceOnColumn, canPlaceOnFoundation, isValidSequence, moveCapacity, canSafeAutoMove, isWon, hasAnyMoves, } from './rules';
// ── Clone Helper ────────────────────────────────────────────
export function cloneState(state) {
    return {
        columns: state.columns.map((col) => col.map((c) => ({ ...c }))),
        freeCells: state.freeCells.map((c) => (c ? { ...c } : null)),
        foundations: state.foundations.map((pile) => pile.map((c) => ({ ...c }))),
        moves: state.moves,
        elapsedSeconds: state.elapsedSeconds,
        status: state.status,
        selectedSource: state.selectedSource ? { ...state.selectedSource } : null,
    };
}
// ── Check End Conditions ────────────────────────────────────
function checkEndConditions(state) {
    if (isWon(state)) {
        state.status = 'won';
    }
    else if (!hasAnyMoves(state)) {
        state.status = 'no-moves';
    }
    return state;
}
// ── Move to Free Cell ───────────────────────────────────────
/**
 * Move the bottom card of a column to a free cell.
 */
export function moveColumnToFreeCell(state, colIndex) {
    if (colIndex < 0 || colIndex >= state.columns.length)
        return null;
    if (state.columns[colIndex].length === 0)
        return null;
    const emptyCell = state.freeCells.findIndex((c) => c === null);
    if (emptyCell === -1)
        return null;
    const next = cloneState(state);
    const card = next.columns[colIndex].pop();
    next.freeCells[emptyCell] = card;
    next.moves += 1;
    next.selectedSource = null;
    return checkEndConditions(next);
}
// ── Move from Free Cell to Column ───────────────────────────
/**
 * Move a card from a free cell to a tableau column.
 */
export function moveFreeCellToColumn(state, cellIndex, colIndex) {
    if (cellIndex < 0 || cellIndex >= state.freeCells.length)
        return null;
    const card = state.freeCells[cellIndex];
    if (!card)
        return null;
    if (colIndex < 0 || colIndex >= state.columns.length)
        return null;
    if (!canPlaceOnColumn(card, state.columns[colIndex]))
        return null;
    const next = cloneState(state);
    next.columns[colIndex].push(next.freeCells[cellIndex]);
    next.freeCells[cellIndex] = null;
    next.moves += 1;
    next.selectedSource = null;
    return checkEndConditions(next);
}
// ── Move from Free Cell to Foundation ───────────────────────
/**
 * Move a card from a free cell to its foundation.
 */
export function moveFreeCellToFoundation(state, cellIndex) {
    if (cellIndex < 0 || cellIndex >= state.freeCells.length)
        return null;
    const card = state.freeCells[cellIndex];
    if (!card)
        return null;
    const fIdx = SUIT_INDEX[card.suit];
    if (!canPlaceOnFoundation(card, fIdx, state.foundations))
        return null;
    const next = cloneState(state);
    next.foundations[fIdx].push(next.freeCells[cellIndex]);
    next.freeCells[cellIndex] = null;
    next.moves += 1;
    next.selectedSource = null;
    return checkEndConditions(next);
}
// ── Move Column to Column (Supermove) ───────────────────────
/**
 * Move a sequence of cards from one column to another (supermove).
 * `cardIndex` is the index of the top card in the sequence being moved.
 */
export function moveColumnToColumn(state, fromCol, cardIndex, toCol) {
    if (fromCol < 0 || fromCol >= state.columns.length)
        return null;
    if (toCol < 0 || toCol >= state.columns.length)
        return null;
    if (fromCol === toCol)
        return null;
    const sourceColumn = state.columns[fromCol];
    if (cardIndex < 0 || cardIndex >= sourceColumn.length)
        return null;
    // Must be a valid alternating-color descending sequence
    if (!isValidSequence(sourceColumn, cardIndex))
        return null;
    const seqLength = sourceColumn.length - cardIndex;
    const targetColumn = state.columns[toCol];
    // Check placement legality
    const movingCard = sourceColumn[cardIndex];
    if (!canPlaceOnColumn(movingCard, targetColumn))
        return null;
    // Check supermove capacity
    const isEmptyTarget = targetColumn.length === 0;
    if (seqLength > moveCapacity(state, isEmptyTarget))
        return null;
    const next = cloneState(state);
    const cards = next.columns[fromCol].splice(cardIndex);
    next.columns[toCol].push(...cards);
    next.moves += 1;
    next.selectedSource = null;
    return checkEndConditions(next);
}
// ── Move Column Bottom to Foundation ────────────────────────
/**
 * Move the bottom card of a column to its foundation.
 */
export function moveColumnToFoundation(state, colIndex) {
    if (colIndex < 0 || colIndex >= state.columns.length)
        return null;
    const column = state.columns[colIndex];
    if (column.length === 0)
        return null;
    const card = column[column.length - 1];
    const fIdx = SUIT_INDEX[card.suit];
    if (!canPlaceOnFoundation(card, fIdx, state.foundations))
        return null;
    const next = cloneState(state);
    const moved = next.columns[colIndex].pop();
    next.foundations[fIdx].push(moved);
    next.moves += 1;
    next.selectedSource = null;
    return checkEndConditions(next);
}
// ── Auto-Move to Foundations ────────────────────────────────
/**
 * Repeatedly move safe cards to foundations until no more safe moves.
 * Does NOT increment the move counter (auto-moves are "free").
 */
export function autoMoveToFoundations(state) {
    let next = cloneState(state);
    let changed = true;
    while (changed) {
        changed = false;
        // Check column bottoms
        for (let col = 0; col < next.columns.length; col++) {
            const column = next.columns[col];
            if (column.length === 0)
                continue;
            const card = column[column.length - 1];
            if (canSafeAutoMove(card, next.foundations)) {
                const fIdx = SUIT_INDEX[card.suit];
                next.foundations[fIdx].push(next.columns[col].pop());
                changed = true;
            }
        }
        // Check free cells
        for (let i = 0; i < next.freeCells.length; i++) {
            const card = next.freeCells[i];
            if (!card)
                continue;
            if (canSafeAutoMove(card, next.foundations)) {
                const fIdx = SUIT_INDEX[card.suit];
                next.foundations[fIdx].push(card);
                next.freeCells[i] = null;
                changed = true;
            }
        }
    }
    if (isWon(next)) {
        next.status = 'won';
    }
    return next;
}
// ── Auto-Finish (Trivial Win Sweep) ─────────────────────────
/**
 * Sweep all remaining cards to foundations when the game is trivially won.
 * Returns the new state with all cards on foundations.
 */
export function autoFinish(state) {
    const next = cloneState(state);
    // Move all column cards to foundations in order
    let moved = true;
    while (moved) {
        moved = false;
        for (let col = 0; col < next.columns.length; col++) {
            const column = next.columns[col];
            if (column.length === 0)
                continue;
            const card = column[column.length - 1];
            const fIdx = SUIT_INDEX[card.suit];
            if (canPlaceOnFoundation(card, fIdx, next.foundations)) {
                next.foundations[fIdx].push(next.columns[col].pop());
                moved = true;
            }
        }
    }
    next.status = 'won';
    next.selectedSource = null;
    return next;
}
