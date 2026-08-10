import { isExposed, canPlayCard, isPeakCleared, isWon, hasAnyMoves } from './rules';
import { scoreCardPlay, peakClearBonus, boardClearBonus } from './scoring';
import { BLOCKED_BY } from './layout';
// ── Helpers ─────────────────────────────────────────────────
function cloneState(state) {
    return {
        pyramid: state.pyramid.map((c) => ({ ...c })),
        stock: state.stock.map((c) => ({ ...c })),
        waste: state.waste.map((c) => ({ ...c })),
        score: state.score,
        moves: state.moves,
        streak: state.streak,
        elapsedSeconds: state.elapsedSeconds,
        status: state.status,
        peaksCleared: [...state.peaksCleared],
    };
}
/**
 * After a card is removed, flip any newly exposed cards face-up.
 */
function revealExposed(pyramid) {
    for (let i = 0; i < pyramid.length; i++) {
        if (!pyramid[i].removed && !pyramid[i].faceUp) {
            if (BLOCKED_BY[i].every((j) => pyramid[j].removed)) {
                pyramid[i] = { ...pyramid[i], faceUp: true };
            }
        }
    }
}
// ── Draw from stock ─────────────────────────────────────────
export function drawFromStock(state) {
    if (state.stock.length === 0)
        return null;
    const next = cloneState(state);
    const card = next.stock.pop();
    next.waste.push({ ...card, faceUp: true });
    next.streak = 0; // drawing breaks the streak
    next.moves += 1;
    return next;
}
// ── Play a pyramid card ─────────────────────────────────────
export function playCard(state, pyramidIndex) {
    if (pyramidIndex < 0 || pyramidIndex >= state.pyramid.length)
        return null;
    if (!isExposed(pyramidIndex, state.pyramid))
        return null;
    if (state.waste.length === 0)
        return null;
    const wasteTop = state.waste[state.waste.length - 1];
    if (!canPlayCard(state.pyramid[pyramidIndex], wasteTop))
        return null;
    const next = cloneState(state);
    const card = next.pyramid[pyramidIndex];
    // Remove from pyramid, add to waste
    next.pyramid[pyramidIndex] = { ...card, removed: true, faceUp: true };
    next.waste.push({
        suit: card.suit,
        rank: card.rank,
        faceUp: true,
        id: card.id,
    });
    // Score: streak bonus
    next.score += scoreCardPlay(next.streak);
    next.streak += 1;
    next.moves += 1;
    // Reveal newly exposed cards
    revealExposed(next.pyramid);
    // Check peak clears
    for (let p = 0; p < 3; p++) {
        if (!next.peaksCleared[p] && isPeakCleared(p, next.pyramid)) {
            next.peaksCleared[p] = true;
            next.score += peakClearBonus();
        }
    }
    // Check win
    if (isWon(next)) {
        next.score += boardClearBonus();
        next.status = 'won';
        return next;
    }
    // Check if no moves remain
    if (!hasAnyMoves(next)) {
        next.status = 'no-moves';
    }
    return next;
}
