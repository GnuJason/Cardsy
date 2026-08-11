export type CardBackType = 'default' | 'custom';
export interface CardBack {
    id: string;
    label: string;
    url: string;
    type: CardBackType;
}
export declare const DEFAULT_BACKS: CardBack[];
export declare const CUSTOM_BACKS: CardBack[];
export declare const CARD_BACKS: {
    readonly default: CardBack[];
    readonly custom: CardBack[];
};
