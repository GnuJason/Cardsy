import { describe, it, expect } from 'vitest';
import { spiderScore, isBetterScore } from '../src/logic/spider/scoring';

describe('spiderScore', () => {
  it('returns the score as-is', () => {
    expect(spiderScore(500)).toBe(500);
    expect(spiderScore(0)).toBe(0);
    expect(spiderScore(-10)).toBe(-10);
  });
});

describe('isBetterScore', () => {
  it('returns true when current is null', () => {
    expect(isBetterScore(300, null)).toBe(true);
  });

  it('returns true when candidate is higher (better)', () => {
    expect(isBetterScore(450, 400)).toBe(true);
  });

  it('returns false when candidate is lower (worse)', () => {
    expect(isBetterScore(350, 400)).toBe(false);
  });

  it('returns false when scores are equal', () => {
    expect(isBetterScore(400, 400)).toBe(false);
  });
});
