/**
 * IndexedDB storage for user-uploaded custom card backs.
 * All data stays on-device — no network calls are made.
 */
export interface CustomCardBack {
    id: string;
    blob: Blob;
    name: string;
    createdAt: number;
}
export declare function getAllCustomBacks(): Promise<CustomCardBack[]>;
export declare function getCustomBack(id: string): Promise<CustomCardBack | undefined>;
export declare function saveCustomBack(back: CustomCardBack): Promise<void>;
export declare function deleteCustomBack(id: string): Promise<void>;
export declare function deleteAllCustomBacks(): Promise<void>;
/**
 * Create a blob URL from a CustomCardBack.
 * Caller is responsible for revoking via URL.revokeObjectURL().
 */
export declare function createBackBlobUrl(back: CustomCardBack): string;
