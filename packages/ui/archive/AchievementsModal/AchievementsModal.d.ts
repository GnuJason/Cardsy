import React from 'react';
import type { UnlockedAchievement } from '../../logic/types';
interface AchievementsModalProps {
    unlocked: UnlockedAchievement[];
    onClose: () => void;
}
export declare const AchievementsModal: React.FC<AchievementsModalProps>;
export {};
