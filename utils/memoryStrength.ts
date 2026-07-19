import type { MemoryState } from '@/utils/sm2';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Memory strength 0-100: how well a conversation is likely remembered right
 * now. Decays exponentially since the last review — the SM-2 interval acts as
 * the half-life — and is restored by completing quizzes (which push the
 * interval out). 0 for never-quizzed conversations.
 */
export function memoryStrength(memory: MemoryState, now: Date = new Date()): number {
  if (!memory.lastReviewedAt) return 0;

  const halfLifeDays = Math.max(memory.intervalDays, 1);
  const elapsedDays = (now.getTime() - new Date(memory.lastReviewedAt).getTime()) / DAY_MS;
  if (elapsedDays <= 0) return 100;

  const retention = Math.pow(2, -elapsedDays / halfLifeDays);
  return Math.round(Math.max(0, Math.min(1, retention)) * 100);
}

export function strengthColorClass(strength: number): string {
  if (strength >= 70) return 'bg-green-500';
  if (strength >= 40) return 'bg-yellow-500';
  if (strength > 0) return 'bg-red-500';
  return 'bg-gray-300 dark:bg-gray-600';
}
