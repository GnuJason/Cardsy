import { COLUMN_COUNT } from './layout';
import { isInSuitRun, canPlaceOnColumn, hasCompletedRun, canDealRow, isWon, } from './rules';
// ── Clone Helper ────────────────────────────────────────────
function cloneState(state) {
    return {
        columns: state.columns.map((col) => col.map((c) => ({ ...c }))),
        stock: state.stock.map((c) => ({ ...c })),
        completedRuns: state.completedRuns,
        score: state.score,
        moves: state.moves,
        elapsedSeconds: state.elapsedSeconds,
        status: state.status,
        difficulty: state.difficulty,
        selectedSource: state.selectedSource ? { ...state.selectedSource } : null,
        foundations: state.foundations.map((pile) => pile.map((c) => ({ ...c }))),
    };
}
// ── Flip top card ───────────────────────────────────────────
/**
 * If the top card of a column is face-down, flip it face-up.
 */
function flipTopCard(state, colIndex) {
    const col = state.columns[colIndex];
    if (col.length > 0 && !col[col.length - 1].faceUp) {
        col[col.length - 1] = { ...col[col.length - 1], faceUp: true };
    }
}
// ── Remove completed run ────────────────────────────────────
/**
 * Check for and remove a completed K→A run from a column.
 * Returns the new state if a run was removed, otherwise null.
 */
function removeCompletedRun(state, colIndex) {
    if (!hasCompletedRun(state.columns[colIndex]))
        return null;
    const col = state.columns[colIndex];
    const removed = col.splice(col.length - 13, 13);
    // Move removed cards to the next open foundation slot
    const nextFoundation = state.completedRuns;
    if (nextFoundation < state.foundations.length) {
        state.foundations[nextFoundation] = removed;
    }
    state.completedRuns++;
    // Flip new top card if needed
    flipTopCard(state, colIndex);
    return state;
}
// ── Move Cards ──────────────────────────────────────────────
/**
 * Move an in-suit sequence from one column to another.
 * `cardIndex` is the first card in the sequence to move.
 */
export function moveCards(state, fromCol, cardIndex, toCol) {
    if (fromCol < 0 || fromCol >= state.columns.length)
        return null;
    if (toCol < 0 || toCol >= state.columns.length)
        return null;
    if (fromCol === toCol)
        return null;
    const sourceColumn = state.columns[fromCol];
    if (cardIndex < 0 || cardIndex >= sourceColumn.length)
        return null;
    // Must be a valid in-suit descending sequence from cardIndex to bottom
    if (!isInSuitRun(sourceColumn, cardIndex))
        return null;
    // Check placement legality
    const movingCard = sourceColumn[cardIndex];
    if (!canPlaceOnColumn(movingCard, state.columns[toCol]))
        return null;
    const next = cloneState(state);
    const cards = next.columns[fromCol].splice(cardIndex);
    next.columns[toCol].push(...cards);
    next.moves++;
    next.score--;
    next.selectedSource = null;
    // Flip the new top card of the source column
    flipTopCard(next, fromCol);
    // Check for completed run on target column
    removeCompletedRun(next, toCol);
    if (isWon(next)) {
        next.status = 'won';
    }
    return next;
}
// ── Deal Row ────────────────────────────────────────────────
/**
 * Deal one card from stock to each of the 10 columns, face-up.
 */
export function dealRow(state) {
    if (!canDealRow(state))
        return null;
    const next = cloneState(state);
    for (let col = 0; col < COLUMN_COUNT; col++) {
        const card = next.stock.pop();
        next.columns[col].push({ ...card, faceUp: true });
    }
    next.moves++;
    next.score--;
    next.selectedSource = null;
    // Check all columns for completed runs after dealing
    for (let col = 0; col < COLUMN_COUNT; col++) {
        removeCompletedRun(next, col);
    }
    if (isWon(next)) {
        next.status = 'won';
    }
    return next;
}
