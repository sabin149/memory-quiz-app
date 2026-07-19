import {
  answerQuality,
  initialMemory,
  isDue,
  reviewMemory,
  reviewMemoryQuality,
} from '@/utils/sm2';

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

describe('answerQuality (confidence rating)', () => {
  it('grades confident correct answers highest', () => {
    expect(answerQuality(true, 'knew')).toBe(5);
    expect(answerQuality(true, 'hesitant')).toBe(4);
    expect(answerQuality(true, null)).toBe(4);
  });

  it('treats a lucky guess as below the pass threshold', () => {
    expect(answerQuality(true, 'guessed')).toBeLessThan(3);
  });

  it('grades wrong answers lowest', () => {
    expect(answerQuality(false, 'knew')).toBe(1);
    expect(answerQuality(false, 'hesitant')).toBe(1);
    expect(answerQuality(false, 'guessed')).toBe(0);
    expect(answerQuality(false, null)).toBe(1);
  });
});

describe('reviewMemoryQuality', () => {
  it('a quiz of lucky guesses does not extend the schedule', () => {
    let memory = reviewMemory(initialMemory(), 100, NOW);
    memory = reviewMemory(memory, 100, NOW); // interval now 6
    const afterGuesses = reviewMemoryQuality(memory, answerQuality(true, 'guessed'), 100, NOW);
    expect(afterGuesses.repetitions).toBe(0); // lapse despite 100% score
    expect(afterGuesses.intervalDays).toBe(1);
  });

  it('confident perfect recall progresses the schedule', () => {
    const memory = reviewMemoryQuality(initialMemory(), 5, 100, NOW);
    expect(memory.repetitions).toBe(1);
    expect(memory.intervalDays).toBe(1);
  });

  it('clamps out-of-range quality', () => {
    const memory = reviewMemoryQuality(initialMemory(), 99, 100, NOW);
    expect(memory.repetitions).toBe(1);
  });
});
