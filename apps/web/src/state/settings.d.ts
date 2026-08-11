type BackVariant = 'damask' | 'leather' | 'fabric' | 'floral';
export interface CardBackSettings {
    useCustomBacks: boolean;
    cardBackMode: 'single' | 'random';
    selectedCustomBack: string | null;
    selectedDefaultBack: BackVariant;
}
export declare function updateCardBackSettings(update: Partial<CardBackSettings>): void;
export declare function useCardBackSettings(): CardBackSettings;
export {};
