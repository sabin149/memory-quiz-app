import { computeDashboardStats, computeUserSummaries } from '@/utils/adminStats';

const NOW = new Date('2026-07-19T12:00:00Z');
const hoursAgo = (n: number) => new Date(NOW.getTime() - n * 3600_000).toISOString();

const EVENTS = [
  { name: 'app_opened', ownerId: 'u1', createdAt: hoursAgo(2) },
  { name: 'quiz_completed', ownerId: 'u1', createdAt: hoursAgo(3) },
  { name: 'register', ownerId: 'u2', createdAt: hoursAgo(50) },
  { name: 'conversation_created', ownerId: 'u2', createdAt: hoursAgo(49) },
  { name: 'app_opened', ownerId: 'u3', createdAt: hoursAgo(24 * 10) },
];

const ATTEMPTS = [
  { ownerId: 'u1', scorePct: 80, completedAt: hoursAgo(3) },
  { ownerId: 'u2', scorePct: 40, completedAt: hoursAgo(49) },
  { ownerId: 'u3', scorePct: 100, completedAt: hoursAgo(24 * 10) },
];

describe('computeDashboardStats', () => {
  const stats = computeDashboardStats(EVENTS, ATTEMPTS, NOW);

  it('computes DAU and WAU windows', () => {
    expect(stats.dau).toBe(1);
    expect(stats.wau).toBe(2);
  });

  it('counts signups, quizzes, and content in the 7-day window', () => {
    expect(stats.signups7d).toBe(1);
    expect(stats.quizzes7d).toBe(2);
    expect(stats.conversationsCreated7d).toBe(1);
  });

  it('averages accuracy over the window only', () => {
    expect(stats.avgAccuracy7d).toBe(60);
  });

  it('buckets activity into 7 calendar days', () => {
    expect(stats.activityByDay).toHaveLength(7);
    expect(stats.activityByDay[6].events).toBe(2); // today
  });

  it('returns null accuracy with no attempts', () => {
    expect(computeDashboardStats([], [], NOW).avgAccuracy7d).toBeNull();
  });
});

describe('computeUserSummaries', () => {
  it('aggregates per user, most recently active first', () => {
    const summaries = computeUserSummaries(EVENTS, ATTEMPTS);
    expect(summaries).toHaveLength(3);
    expect(summaries[0].ownerId).toBe('u1');
    const u1 = summaries[0];
    expect(u1.eventCount).toBe(2);
    expect(u1.quizzes).toBe(1);
    expect(u1.avgScorePct).toBe(80);
  });
});
