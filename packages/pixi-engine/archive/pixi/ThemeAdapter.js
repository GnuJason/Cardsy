function hexToNum(hex) {
    return parseInt(hex.replace('#', ''), 16);
}
function rgbaToNum(rgba) {
    const match = rgba.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (!match)
        return 0x000000;
    const r = parseInt(match[1], 10);
    const g = parseInt(match[2], 10);
    const b = parseInt(match[3], 10);
    return (r << 16) | (g << 8) | b;
}
function parseColor(value) {
    if (value.startsWith('#'))
        return hexToNum(value);
    if (value.startsWith('rgb'))
        return rgbaToNum(value);
    return 0x000000;
}
export function themeToPixiColors(theme) {
    return {
        feltColor: parseColor(theme.colors.felt),
        cardBackground: 0xffffff,
        cardBorder: 0x0d2233,
        redCardColor: 0xc21807,
        blackCardColor: 0x101010,
        placeholderStroke: 0xffffff,
        placeholderAlpha: 0.3,
    };
}
