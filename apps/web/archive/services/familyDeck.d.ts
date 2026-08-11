/**
 * IndexedDB storage for the per-card "family deck" — up to 52 custom card-back images.
 * Each card slot (e.g. "hearts-1") can hold one user-uploaded photo.
 * All data stays on-device — no network calls are made.
 */
export interface FamilyDeckCard {
    /** Card slot id, e.g. "hearts-1" */
    id: string;
    blob: Blob;
    name: string;
    updatedAt: number;
}
/** Load the entire family deck from IndexedDB. */
export declare function loadFamilyDeck(): Promise<FamilyDeckCard[]>;
/** Get a single card's family deck entry. */
export declare function getFamilyDeckCard(id: string): Promise<FamilyDeckCard | undefined>;
/** Save (upsert) a single card's family deck image. */
export declare function saveFamilyDeckCard(card: FamilyDeckCard): Promise<void>;
/** Remove a single card's family deck image. */
export declare function deleteFamilyDeckCard(id: string): Promise<void>;
/** Clear the entire family deck. */
export declare function clearFamilyDeck(): Promise<void>;
/** Check how many cards have been assigned in the family deck. */
export declare function getFamilyDeckCount(): Promise<number>;
/** Create a blob URL from a FamilyDeckCard. Caller must revoke via URL.revokeObjectURL(). */
export declare function createFamilyDeckBlobUrl(card: FamilyDeckCard): string;
