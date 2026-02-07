import { describe, it, expect } from 'vitest';
import { scoreMove, timerBonus } from '../src/logic/scoring';

describe('scoreMove', () => {
  it('awards +10 for waste-to-foundation', () => {
    expect(scoreMove('waste-to-foundation')).toBe(10);
  });

  it('awards +10 for tableau-to-foundation', () => {
    expect(scoreMove('tableau-to-foundation')).toBe(10);
  });

  it('awards +5 for waste-to-tableau', () => {
    expect(scoreMove('waste-to-tableau')).toBe(5);
  });

  it('penalizes -15 for undo', () => {
    expect(scoreMove('undo')).toBe(-15);
  });
});

describe('timerBonus', () => {
  it('returns 0 for elapsed 0', () => {
    expect(timerBonus(0)).toBe(0);
  });

  it('returns high bonus for fast games', () => {
    expect(timerBonus(100)).toBe(7000);
  });

  it('returns lower bonus for slow games', () => {
    expect(timerBonus(700)).toBe(1000);
  });

  it('returns 0 for negative elapsed', () => {
    expect(timerBonus(-5)).toBe(0);
  });
});
