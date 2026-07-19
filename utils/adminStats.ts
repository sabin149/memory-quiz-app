/**
 * Pure aggregation helpers for the admin dashboard. Inputs are privacy-safe
 * event/attempt records (ids, names, timestamps, scores — never content).
 */

export interface EventRecord {
  name: string;
  ownerId: string;
  createdAt: string;
}

export interface AttemptRecord {
  ownerId: string;
  scorePct: number;
  completedAt: string;
}

export interface DayActivity {
  day: string;
  events: number;
  quizzes: number;
  /** Average quiz score that day, null when no quizzes were taken. */
  accuracyPct: number | null;
}

export interface DashboardStats {
  dau: number;
  wau: number;
  signups7d: number;
  quizzes7d: number;
  avgAccuracy7d: number | null;
  conversationsCreated7d: number;
  activityByDay: DayActivity[];
}

export interface UserSummary {
  ownerId: string;
  lastActiveAt: string;
  eventCount: number;
  quizzes: number;
  avgScorePct: number | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function withinDays(iso: string, days: number, now: Date): boolean {
  return now.getTime() - new Date(iso).getTime() <= days * DAY_MS;
}

function dayKey(iso: string): string {
  return iso.slice(0, 10); // YYYY-MM-DD
}

export function computeDashboardStats(
  events: EventRecord[],
  attempts: AttemptRecord[],
  now: Date = new Date(),
  chartDays: number = 7
): DashboardStats {
  const activeToday = new Set<string>();
  const activeWeek = new Set<string>();
  let signups7d = 0;
  let conversationsCreated7d = 0;

  for (const event of events) {
    if (withinDays(event.createdAt, 1, now)) activeToday.add(event.ownerId);
    if (withinDays(event.createdAt, 7, now)) {
      activeWeek.add(event.ownerId);
      if (event.name === 'register') signups7d++;
      if (event.name === 'conversation_created') conversationsCreated7d++;
    }
  }

  const recentAttempts = attempts.filter((a) => withinDays(a.completedAt, 7, now));
  const avgAccuracy7d =
    recentAttempts.length > 0
      ? Math.round(
          recentAttempts.reduce((sum, a) => sum + a.scorePct, 0) / recentAttempts.length
        )
      : null;

  // Last N calendar days, oldest first.
  const activityByDay: DashboardStats['activityByDay'] = [];
  for (let i = chartDays - 1; i >= 0; i--) {
    const day = dayKey(new Date(now.getTime() - i * DAY_MS).toISOString());
    const dayAttempts = attempts.filter((a) => dayKey(a.completedAt) === day);
    activityByDay.push({
      day,
      events: events.filter((e) => dayKey(e.createdAt) === day).length,
      quizzes: dayAttempts.length,
      accuracyPct:
        dayAttempts.length > 0
          ? Math.round(dayAttempts.reduce((s, a) => s + a.scorePct, 0) / dayAttempts.length)
          : null,
    });
  }

  return {
    dau: activeToday.size,
    wau: activeWeek.size,
    signups7d,
    quizzes7d: recentAttempts.length,
    avgAccuracy7d,
    conversationsCreated7d,
    activityByDay,
  };
}

/** Event counts by type, most frequent first. */
export function computeEventBreakdown(
  events: EventRecord[]
): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const event of events) {
    counts.set(event.name, (counts.get(event.name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function computeUserSummaries(
  events: EventRecord[],
  attempts: AttemptRecord[]
): UserSummary[] {
  const byUser = new Map<string, { lastActiveAt: string; eventCount: number; scores: number[] }>();

  for (const event of events) {
    const entry = byUser.get(event.ownerId) ?? { lastActiveAt: event.createdAt, eventCount: 0, scores: [] };
    entry.eventCount++;
    if (event.createdAt > entry.lastActiveAt) entry.lastActiveAt = event.createdAt;
    byUser.set(event.ownerId, entry);
  }

  for (const attempt of attempts) {
    const entry = byUser.get(attempt.ownerId) ?? { lastActiveAt: attempt.completedAt, eventCount: 0, scores: [] };
    entry.scores.push(attempt.scorePct);
    if (attempt.completedAt > entry.lastActiveAt) entry.lastActiveAt = attempt.completedAt;
    byUser.set(attempt.ownerId, entry);
  }

  return [...byUser.entries()]
    .map(([ownerId, entry]) => ({
      ownerId,
      lastActiveAt: entry.lastActiveAt,
      eventCount: entry.eventCount,
      quizzes: entry.scores.length,
      avgScorePct:
        entry.scores.length > 0
          ? Math.round(entry.scores.reduce((s, v) => s + v, 0) / entry.scores.length)
          : null,
    }))
    .sort((a, b) => b.lastActiveAt.localeCompare(a.lastActiveAt));
}
