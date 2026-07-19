/**
 * SM-2 spaced-repetition scheduling (SuperMemo 2 algorithm), driving when a
 * conversation is due for its next quiz.
 */

export interface MemoryState {
  /** SM-2 easiness factor, >= 1.3. Higher = remembered more easily. */
  easeFactor: number;
  /** Current review interval in days. */
  intervalDays: number;
  /** Consecutive successful reviews. */
  repetitions: number;
  /** ISO datetime of the next scheduled review, null before the first quiz. */
  nextReviewAt: string | null;
  /** ISO datetime of the last completed quiz, null before the first quiz. */
  lastReviewedAt: string | null;
  /** Score of the last quiz, 0-100. */
  lastScorePct: number | null;
}

// Bounds match the attribute constraints provisioned in scripts/setup-appwrite.mjs.
const MIN_EASE = 1.3;
const MAX_EASE = 5;
const MAX_INTERVAL_DAYS = 3650;
const DAY_MS = 24 * 60 * 60 * 1000;

export function initialMemory(): MemoryState {
  return {
    easeFactor: 2.5,
    intervalDays: 0,
    repetitions: 0,
    nextReviewAt: null,
    lastReviewedAt: null,
    lastScorePct: null,
  };
}

/**
 * Applies a quiz result to the memory state. Score (0-100) maps to the SM-2
 * quality grade (0-5); below 60% counts as a lapse and restarts the interval.
 */
export function reviewMemory(prev: MemoryState, scorePct: number, now: Date = new Date()): MemoryState {
  const clamped = Math.max(0, Math.min(100, scorePct));
  const quality = Math.round(clamped / 20); // 0-5

  let { easeFactor, intervalDays, repetitions } = prev;

  if (quality < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) {
      intervalDays = 1;
    } else if (repetitions === 2) {
      intervalDays = 6;
    } else {
      intervalDays = Math.min(MAX_INTERVAL_DAYS, Math.round(intervalDays * easeFactor));
    }
  }

  easeFactor = Math.min(
    MAX_EASE,
    Math.max(MIN_EASE, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))
  );

  return {
    easeFactor,
    intervalDays,
    repetitions,
    nextReviewAt: new Date(now.getTime() + intervalDays * DAY_MS).toISOString(),
    lastReviewedAt: now.toISOString(),
    lastScorePct: clamped,
  };
}

/** A conversation is due if it was never quizzed or its review date passed. */
export function isDue(memory: MemoryState, now: Date = new Date()): boolean {
  if (!memory.nextReviewAt) return true;
  return new Date(memory.nextReviewAt).getTime() <= now.getTime();
}
