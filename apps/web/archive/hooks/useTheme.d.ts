import { type ThemeDef } from '../config/themes';
export declare function useTheme(themeId: string, isTriPeaks: boolean): {
    theme: ThemeDef;
    updateTheme: (id: string) => void;
};
