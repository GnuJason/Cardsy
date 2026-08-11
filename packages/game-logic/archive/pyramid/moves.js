import { canPair, isKing, isUncovered, isWon, hasAnyMoves } from './rules';
// ── Helpers ─────────────────────────────────────────────────
export function cloneState(state) {
    return {
        pyramid: state.pyramid.map((c) => ({ ...c })),
        stock: state.stock.map((c) => ({ ...c })),
        waste: state.waste.map((c) => ({ ...c })),
        cardsRemaining: state.cardsRemaining,
        moves: state.moves,
        elapsedSeconds: state.elapsedSeconds,
        status: state.status,
        selectedIndex: state.selectedIndex,
    };
}
function checkEndConditions(state) {
    if (isWon(state)) {
        state.status = 'won';
    }
    else if (!hasAnyMoves(state)) {
        state.status = 'no-moves';
    }
    return state;
}
// ── Draw from stock ─────────────────────────────────────────
/**
 * Draw one card from stock to waste. No recycling.
 * Returns null if stock is empty.
 */
export function drawFromStock(state) {
    if (state.stock.length === 0)
        return null;
    const next = cloneState(state);
    const card = next.stock.pop();
    next.waste.push({ ...card, faceUp: true });
    next.moves += 1;
    next.selectedIndex = null;
    return checkEndConditions(next);
}
// ── Remove a single King ────────────────────────────────────
/**
 * Remove a King from the pyramid (auto-remove, no pair needed).
 * Returns null if the card at index is not an uncovered King.
 */
export function removeKing(state, pyramidIndex) {
    if (pyramidIndex < 0 || pyramidIndex >= state.pyramid.length)
        return null;
    const card = state.pyramid[pyramidIndex];
    if (card.removed)
        return null;
    if (!isKing(card))
        return null;
    if (!isUncovered(pyramidIndex, state.pyramid))
        return null;
    const next = cloneState(state);
    next.pyramid[pyramidIndex] = { ...next.pyramid[pyramidIndex], removed: true };
    next.cardsRemaining -= 1;
    next.moves += 1;
    next.selectedIndex = null;
    return checkEndConditions(next);
}
/**
 * Remove the waste-top King.
 * Returns null if waste top is not a King.
 */
export function removeWasteKing(state) {
    if (state.waste.length === 0)
        return null;
    const wasteTop = state.waste[state.waste.length - 1];
    if (!isKing(wasteTop))
        return null;
    const next = cloneState(state);
    next.waste.pop();
    next.moves += 1;
    next.selectedIndex = null;
    return checkEndConditions(next);
}
// ── Remove a pair that sums to 13 ──────────────────────────
/**
 * Remove two uncovered pyramid cards that sum to 13.
 * Returns null if the pair is invalid.
 */
export function removePyramidPair(state, indexA, indexB) {
    if (indexA === indexB)
        return null;
    if (indexA < 0 || indexA >= state.pyramid.length)
        return null;
    if (indexB < 0 || indexB >= state.pyramid.length)
        return null;
    const cardA = state.pyramid[indexA];
    const cardB = state.pyramid[indexB];
    if (cardA.removed || cardB.removed)
        return null;
    if (!isUncovered(indexA, state.pyramid))
        return null;
    if (!isUncovered(indexB, state.pyramid))
        return null;
    if (!canPair(cardA, cardB))
        return null;
    const next = cloneState(state);
    next.pyramid[indexA] = { ...next.pyramid[indexA], removed: true };
    next.pyramid[indexB] = { ...next.pyramid[indexB], removed: true };
    next.cardsRemaining -= 2;
    next.moves += 1;
    next.selectedIndex = null;
    return checkEndConditions(next);
}
/**
 * Remove an uncovered pyramid card paired with the waste top.
 * Both must sum to 13.
 * Returns null if the pair is invalid.
 */
export function removePyramidWastePair(state, pyramidIndex) {
    if (pyramidIndex < 0 || pyramidIndex >= state.pyramid.length)
        return null;
    if (state.waste.length === 0)
        return null;
    const pCard = state.pyramid[pyramidIndex];
    const wasteTop = state.waste[state.waste.length - 1];
    if (pCard.removed)
        return null;
    if (!isUncovered(pyramidIndex, state.pyramid))
        return null;
    if (!canPair(pCard, wasteTop))
        return null;
    const next = cloneState(state);
    next.pyramid[pyramidIndex] = { ...next.pyramid[pyramidIndex], removed: true };
    next.waste.pop();
    next.cardsRemaining -= 1;
    next.moves += 1;
    next.selectedIndex = null;
    return checkEndConditions(next);
}
