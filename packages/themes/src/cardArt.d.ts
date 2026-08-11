/**
 * Card art configuration.
 * Swap paths here to change card back / suit photos.
 */
export declare const CARD_BACK_DEFAULT = "/cards/backs/default.svg";
export declare const SUIT_PHOTOS: Record<string, string | null>;
/**
 * Returns the card back image URL for the given filename.
 * Rejects filenames containing path traversal or unexpected characters.
 */
export declare function cardBackUrl(filename: string): string;
/** Replace the entire family deck overlay (called once at app startup). */
export declare function setFamilyDeckOverlay(entries: Map<string, string>): void;
/** Clear the family deck overlay and revoke all blob URLs. */
export declare function clearFamilyDeckOverlay(): void;
/**
 * Returns the per-card back image URL, or null if none is assigned.
 * Checks family deck overlay first, then falls back to built-in CARD_BACKS.
 * Handles Spider's counter-suffixed IDs (e.g. "spades-5-2" → "spades-5").
 */
export declare function getCardBackImage(cardId: string): string | null;
