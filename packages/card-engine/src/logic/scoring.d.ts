declare const SCORES: {
    readonly 'waste-to-foundation': 10;
    readonly 'tableau-to-foundation': 10;
    readonly 'waste-to-tableau': 5;
    readonly undo: -15;
};
export type ScorableMove = keyof typeof SCORES;
export declare function scoreMove(move: ScorableMove): number;
/**
 * Timer bonus: award extra points for fast completion.
 * Formula based on classic Windows Solitaire:
 *   bonus = max(0, 700000 / elapsedSeconds)
 * Capped so very fast games don't produce absurd scores.
 */
export declare function timerBonus(elapsedSeconds: number): number;
export {};
