/**
 * XP, levels, daily streaks, and achievements — all derived from a small,
 * privacy-safe activity record (day -> quiz count, plus counters).
 */

export interface GamificationState {
  totalXp: number;
  quizzesCompleted: number;
  perfectQuizzes: number;
  /** ISO day (YYYY-MM-DD) -> quizzes completed that day. */
  activity: Record<string, number>;
}

export const EMPTY_GAMIFICATION: GamificationState = {
  totalXp: 0,
  quizzesCompleted: 0,
  perfectQuizzes: 0,
  activity: {},
};

export const XP_PER_CORRECT = 10;
export const XP_PERFECT_BONUS = 20;

const DAY_MS = 24 * 60 * 60 * 1000;
const ACTIVITY_RETENTION_DAYS = 180;

export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** XP gained for a quiz: per correct answer, with a perfect-score bonus. */
export function xpForQuiz(correct: number, total: number): number {
  return correct * XP_PER_CORRECT + (total > 0 && correct === total ? XP_PERFECT_BONUS : 0);
}

export interface LevelInfo {
  level: number;
  /** XP accumulated within the current level. */
  xpIntoLevel: number;
  /** XP needed to go from the current level to the next. */
  xpForNextLevel: number;
  progressPct: number;
}

/** Quadratic level curve: reaching level n costs 100·n² total XP. */
export function levelFromXp(totalXp: number): LevelInfo {
  const level = Math.floor(Math.sqrt(Math.max(0, totalXp) / 100)) + 1;
  const currentThreshold = 100 * (level - 1) ** 2;
  const nextThreshold = 100 * level ** 2;
  const xpIntoLevel = totalXp - currentThreshold;
  const xpForNextLevel = nextThreshold - currentThreshold;
  return {
    level,
    xpIntoLevel,
    xpForNextLevel,
    progressPct: Math.round((xpIntoLevel / xpForNextLevel) * 100),
  };
}

/** Records a completed quiz and prunes activity older than the retention window. */
export function recordQuizActivity(
  state: GamificationState,
  correct: number,
  total: number,
  now: Date = new Date()
): GamificationState {
  const key = dayKey(now);
  const cutoff = dayKey(new Date(now.getTime() - ACTIVITY_RETENTION_DAYS * DAY_MS));
  const activity: Record<string, number> = {};
  for (const [day, count] of Object.entries(state.activity)) {
    if (day >= cutoff) activity[day] = count;
  }
  activity[key] = (activity[key] ?? 0) + 1;

  return {
    totalXp: state.totalXp + xpForQuiz(correct, total),
    quizzesCompleted: state.quizzesCompleted + 1,
    perfectQuizzes: state.perfectQuizzes + (total > 0 && correct === total ? 1 : 0),
    activity,
  };
}

/**
 * Consecutive days with at least one quiz, ending today or yesterday (a
 * streak survives until a full day is missed).
 */
export function computeStreak(activity: Record<string, number>, now: Date = new Date()): number {
  let cursor = new Date(now);
  if (!activity[dayKey(cursor)]) {
    cursor = new Date(cursor.getTime() - DAY_MS);
    if (!activity[dayKey(cursor)]) return 0;
  }
  let streak = 0;
  while (activity[dayKey(cursor)]) {
    streak++;
    cursor = new Date(cursor.getTime() - DAY_MS);
  }
  return streak;
}

/**
 * Cross-device merge (local cache vs. Appwrite account prefs): counters take
 * the max, activity takes the per-day max. Safe against replays and loss.
 */
export function mergeGamification(
  a: GamificationState,
  b: GamificationState
): GamificationState {
  const activity: Record<string, number> = { ...a.activity };
  for (const [day, count] of Object.entries(b.activity)) {
    activity[day] = Math.max(activity[day] ?? 0, count);
  }
  return {
    totalXp: Math.max(a.totalXp, b.totalXp),
    quizzesCompleted: Math.max(a.quizzesCompleted, b.quizzesCompleted),
    perfectQuizzes: Math.max(a.perfectQuizzes, b.perfectQuizzes),
    activity,
  };
}

export interface AchievementContext {
  gamification: GamificationState;
  streak: number;
  conversationCount: number;
  masteredCount: number; // conversations with >= 3 successful reviews
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: (ctx: AchievementContext) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_quiz',
    title: 'First steps',
    description: 'Complete your first quiz',
    unlocked: (c) => c.gamification.quizzesCompleted >= 1,
  },
  {
    id: 'perfect_quiz',
    title: 'Flawless',
    description: 'Finish a quiz with a perfect score',
    unlocked: (c) => c.gamification.perfectQuizzes >= 1,
  },
  {
    id: 'streak_7',
    title: 'On fire',
    description: 'Keep a 7-day review streak',
    unlocked: (c) => c.streak >= 7,
  },
  {
    id: 'streak_30',
    title: 'Unstoppable',
    description: 'Keep a 30-day review streak',
    unlocked: (c) => c.streak >= 30,
  },
  {
    id: 'collector_10',
    title: 'Collector',
    description: 'Save 10 conversations',
    unlocked: (c) => c.conversationCount >= 10,
  },
  {
    id: 'mastered_10',
    title: 'Memory master',
    description: 'Master 10 conversations (3+ successful reviews each)',
    unlocked: (c) => c.masteredCount >= 10,
  },
  {
    id: 'xp_1000',
    title: 'Scholar',
    description: 'Earn 1,000 XP',
    unlocked: (c) => c.gamification.totalXp >= 1000,
  },
  {
    id: 'quizzes_50',
    title: 'Habit formed',
    description: 'Complete 50 quizzes',
    unlocked: (c) => c.gamification.quizzesCompleted >= 50,
  },
];
