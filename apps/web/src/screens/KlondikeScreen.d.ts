import React from 'react';
import type { CardBackSettings } from '../state/settings';
interface KlondikeScreenProps {
    backVariant: CardBackSettings['selectedDefaultBack'];
    cardBackUrl: string | null;
    cardBackMode: CardBackSettings['cardBackMode'];
    customBackList: string[];
    onSettings: () => void;
}
export declare function KlondikeScreen({ backVariant, cardBackUrl, cardBackMode, customBackList, onSettings }: KlondikeScreenProps): React.JSX.Element;
export {};
