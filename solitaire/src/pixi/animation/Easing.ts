export function linear(t: number): number {
  return t;
}

export function easeOut(t: number): number {
  return 1 - (1 - t) ** 3;
}

export function easeInOut(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - (-2 * t + 2) ** 3 / 2;
}

export function getEasing(name: 'linear' | 'easeOut' | 'easeInOut'): (t: number) => number {
  if (name === 'easeOut') return easeOut;
  if (name === 'easeInOut') return easeInOut;
  return linear;
}
