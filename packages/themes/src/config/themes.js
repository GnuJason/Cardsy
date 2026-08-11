/**
 * Predefined theme definitions.
 * Each theme overrides CSS custom properties on the document root.
 */
export const THEMES = [
    {
        id: 'classic-green',
        name: 'Classic Green',
        swatch: '#1a6b3c',
        colors: {
            felt: '#1a6b3c',
            feltDark: '#145530',
            hudBg: 'rgba(0, 0, 0, 0.6)',
            hudText: '#ffffff',
            buttonBg: '#2c7a4b',
            buttonText: '#ffffff',
            buttonHover: '#35915a',
            modalBg: '#ffffff',
            modalOverlay: 'rgba(0, 0, 0, 0.7)',
            accent: '#ffd700',
        },
    },
    {
        id: 'midnight-blue',
        name: 'Midnight Blue',
        swatch: '#0f1b3d',
        colors: {
            felt: '#0f1b3d',
            feltDark: '#0a1229',
            hudBg: 'rgba(10, 15, 40, 0.75)',
            hudText: '#c8d6e5',
            buttonBg: '#1e3a5f',
            buttonText: '#c8d6e5',
            buttonHover: '#2a5080',
            modalBg: '#1a2744',
            modalOverlay: 'rgba(0, 0, 20, 0.8)',
            accent: '#7ec8e3',
        },
    },
    {
        id: 'wood-table',
        name: 'Wood Table',
        swatch: '#5c3a1e',
        colors: {
            felt: '#5c3a1e',
            feltDark: '#472c16',
            hudBg: 'rgba(40, 25, 10, 0.7)',
            hudText: '#f5e6d3',
            buttonBg: '#7a5233',
            buttonText: '#f5e6d3',
            buttonHover: '#8e6340',
            modalBg: '#f5e6d3',
            modalOverlay: 'rgba(30, 15, 5, 0.75)',
            accent: '#d4a574',
        },
    },
    {
        id: 'holiday',
        name: 'Holiday',
        swatch: '#8b1a1a',
        colors: {
            felt: '#8b1a1a',
            feltDark: '#6a1414',
            hudBg: 'rgba(60, 10, 10, 0.7)',
            hudText: '#fff5e6',
            buttonBg: '#a83232',
            buttonText: '#fff5e6',
            buttonHover: '#c24040',
            modalBg: '#fff5e6',
            modalOverlay: 'rgba(40, 5, 5, 0.75)',
            accent: '#ffd700',
        },
    },
];
export const DEFAULT_THEME_ID = 'classic-green';
export function getThemeById(id) {
    return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
