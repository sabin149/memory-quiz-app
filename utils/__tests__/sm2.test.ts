import { initialMemory, isDue, reviewMemory } from '@/utils/sm2';

const NOW = new Date('2026-07-19T12:00:00Z');

describe('sm2', () => {
  it('starts due, with no review history', () => {
    const memory = initialMemory();
    expect(memory.nextReviewAt).toBeNull();
    expect(isDue(memory, NOW)).toBe(true);
  });

  it('progresses intervals 1 -> 6 -> ~15 days on perfect scores', () => {
    let memory = initialMemory();
    memory = reviewMemory(memory, 100, NOW);
    expect(memory.intervalDays).toBe(1);
    memory = reviewMemory(memory, 100, NOW);
    expect(memory.intervalDays).toBe(6);
    memory = reviewMemory(memory, 100, NOW);
    expect(memory.intervalDays).toBeGreaterThanOrEqual(15);
    expect(memory.repetitions).toBe(3);
  });

  it('resets repetitions and interval on a failing score', () => {
    let memory = initialMemory();
    memory = reviewMemory(memory, 100, NOW);
    memory = reviewMemory(memory, 100, NOW);
    memory = reviewMemory(memory, 20, NOW);
    expect(memory.repetitions).toBe(0);
    expect(memory.intervalDays).toBe(1);
  });

  it('never lets ease factor drop below 1.3', () => {
    let memory = initialMemory();
    for (let i = 0; i < 10; i++) {
      memory = reviewMemory(memory, 0, NOW);
    }
    expect(memory.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it('schedules the next review after the interval', () => {
    const memory = reviewMemory(initialMemory(), 100, NOW);
    expect(memory.nextReviewAt).toBe(
      new Date(NOW.getTime() + 24 * 60 * 60 * 1000).toISOString()
    );
    expect(isDue(memory, NOW)).toBe(false);
    expect(isDue(memory, new Date(NOW.getTime() + 2 * 24 * 60 * 60 * 1000))).toBe(true);
  });

  it('clamps score input to 0-100', () => {
    const memory = reviewMemory(initialMemory(), 250, NOW);
    expect(memory.lastScorePct).toBe(100);
  });
});
