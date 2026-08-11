import React from 'react';
import type { UserSettings } from '../../logic/types';
interface SettingsModalProps {
    settings: UserSettings;
    onUpdate: (settings: UserSettings) => void;
    onClose: () => void;
    onFamilyDeckChange?: () => void;
}
export declare const SettingsModal: React.FC<SettingsModalProps>;
export {};
