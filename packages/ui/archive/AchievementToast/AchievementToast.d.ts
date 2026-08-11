import React from 'react';
import type { AchievementToastData } from '../../hooks/useAchievements';
interface AchievementToastProps {
    toast: AchievementToastData;
    onDismiss: () => void;
}
export declare const AchievementToast: React.FC<AchievementToastProps>;
export {};
