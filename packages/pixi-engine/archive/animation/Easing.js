export function linear(t) {
    return t;
}
export function easeOut(t) {
    return 1 - (1 - t) ** 3;
}
export function easeInOut(t) {
    return t < 0.5
        ? 4 * t * t * t
        : 1 - (-2 * t + 2) ** 3 / 2;
}
export function getEasing(name) {
    if (name === 'easeOut')
        return easeOut;
    if (name === 'easeInOut')
        return easeInOut;
    return linear;
}
