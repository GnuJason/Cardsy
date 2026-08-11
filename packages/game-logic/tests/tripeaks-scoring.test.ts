import { describe, it, expect } from 'vitest';
import {
  scoreCardPlay,
  peakClearBonus,
  boardClearBonus,
  undoPenalty,
} from '../src/logic/tripeaks/scoring';
import { timerBonus } from '../src/logic/scoring';

describe('TriPeaks scoring', () => {
  describe('scoreCardPlay', () => {
    it('base score is 10 at streak 0', () => {
      expect(scoreCardPlay(0)).toBe(10);
    });

    it('adds 5 per streak level', () => {
      expect(scoreCardPlay(1)).toBe(15);
      expect(scoreCardPlay(2)).toBe(20);
      expect(scoreCardPlay(5)).toBe(35);
    });

    it('handles high streaks', () => {
      expect(scoreCardPlay(10)).toBe(60);
    });
  });

  describe('peakClearBonus', () => {
    it('returns 15', () => {
      expect(peakClearBonus()).toBe(15);
    });
  });

  describe('boardClearBonus', () => {
    it('returns 30', () => {
      expect(boardClearBonus()).toBe(30);
    });
  });

  describe('undoPenalty', () => {
    it('returns -5', () => {
      expect(undoPenalty()).toBe(-5);
    });
  });

  describe('timerBonus (shared)', () => {
    it('returns 0 for elapsed <= 0', () => {
      expect(timerBonus(0)).toBe(0);
      expect(timerBonus(-1)).toBe(0);
    });

    it('returns a positive bonus for reasonable times', () => {
      expect(timerBonus(100)).toBe(7000);
      expect(timerBonus(300)).toBe(2333);
    });

    it('returns a small bonus for very long games', () => {
      expect(timerBonus(10000)).toBe(70);
    });
  });
});
