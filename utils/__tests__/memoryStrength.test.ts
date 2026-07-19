import { memoryStrength } from '@/utils/memoryStrength';
import { initialMemory } from '@/utils/sm2';

const NOW = new Date('2026-07-19T12:00:00Z');
const DAY_MS = 24 * 60 * 60 * 1000;

describe('memoryStrength', () => {
  it('is 0 for never-quizzed conversations', () => {
    expect(memoryStrength(initialMemory(), NOW)).toBe(0);
  });

  it('is 100 immediately after a review', () => {
    const memory = {
      ...initialMemory(),
      intervalDays: 6,
      lastReviewedAt: NOW.toISOString(),
    };
    expect(memoryStrength(memory, NOW)).toBe(100);
  });

  it('decays to 50 after one half-life (the SM-2 interval)', () => {
    const memory = {
      ...initialMemory(),
      intervalDays: 6,
      lastReviewedAt: new Date(NOW.getTime() - 6 * DAY_MS).toISOString(),
    };
    expect(memoryStrength(memory, NOW)).toBe(50);
  });

  it('keeps decaying toward 0 long after the interval', () => {
    const memory = {
      ...initialMemory(),
      intervalDays: 1,
      lastReviewedAt: new Date(NOW.getTime() - 30 * DAY_MS).toISOString(),
    };
    expect(memoryStrength(memory, NOW)).toBe(0);
  });
});
