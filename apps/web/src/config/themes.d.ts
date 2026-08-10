/**
 * Predefined theme definitions.
 * Each theme overrides CSS custom properties on the document root.
 */
export interface ThemeDef {
    id: string;
    name: string;
    swatch: string;
    colors: {
        felt: string;
        feltDark: string;
        hudBg: string;
        hudText: string;
        buttonBg: string;
        buttonText: string;
        buttonHover: string;
        modalBg: string;
        modalOverlay: string;
        accent: string;
    };
}
export declare const THEMES: ThemeDef[];
export declare const DEFAULT_THEME_ID = "classic-green";
export declare function getThemeById(id: string): ThemeDef;
