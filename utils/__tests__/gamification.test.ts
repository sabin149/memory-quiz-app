import {
  computeStreak,
  dayKey,
  EMPTY_GAMIFICATION,
  levelFromXp,
  mergeGamification,
  recordQuizActivity,
  xpForQuiz,
} from '@/utils/gamification';

const NOW = new Date('2026-07-19T12:00:00Z');
const daysAgo = (n: number) => dayKey(new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000));

describe('xpForQuiz', () => {
  it('awards 10 XP per correct answer', () => {
    expect(xpForQuiz(3, 5)).toBe(30);
  });
  it('adds a 20 XP perfect bonus', () => {
    expect(xpForQuiz(5, 5)).toBe(70);
  });
  it('awards nothing for an empty quiz', () => {
    expect(xpForQuiz(0, 0)).toBe(0);
  });
});

describe('levelFromXp', () => {
  it('starts at level 1', () => {
    expect(levelFromXp(0).level).toBe(1);
  });
  it('reaches level 2 at 100 XP and level 4 at 900 XP', () => {
    expect(levelFromXp(100).level).toBe(2);
    expect(levelFromXp(900).level).toBe(4);
  });
  it('reports progress within the level', () => {
    const info = levelFromXp(150);
    expect(info.level).toBe(2);
    expect(info.xpIntoLevel).toBe(50);
    expect(info.xpForNextLevel).toBe(300);
  });
});

describe('recordQuizActivity', () => {
  it('accumulates XP, counters, and daily activity', () => {
    let state = EMPTY_GAMIFICATION;
    state = recordQuizActivity(state, 5, 5, NOW);
    state = recordQuizActivity(state, 3, 5, NOW);
    expect(state.totalXp).toBe(100);
    expect(state.quizzesCompleted).toBe(2);
    expect(state.perfectQuizzes).toBe(1);
    expect(state.activity[dayKey(NOW)]).toBe(2);
  });

  it('prunes activity older than the retention window', () => {
    const old = { ...EMPTY_GAMIFICATION, activity: { '2020-01-01': 3 } };
    const state = recordQuizActivity(old, 1, 1, NOW);
    expect(state.activity['2020-01-01']).toBeUndefined();
  });
});

describe('computeStreak', () => {
  it('counts consecutive days ending today', () => {
    const activity = { [daysAgo(0)]: 1, [daysAgo(1)]: 2, [daysAgo(2)]: 1 };
    expect(computeStreak(activity, NOW)).toBe(3);
  });
  it('survives when today has no quiz yet', () => {
    const activity = { [daysAgo(1)]: 1, [daysAgo(2)]: 1 };
    expect(computeStreak(activity, NOW)).toBe(2);
  });
  it('breaks after a missed day', () => {
    const activity = { [daysAgo(2)]: 1, [daysAgo(3)]: 1 };
    expect(computeStreak(activity, NOW)).toBe(0);
  });
  it('is 0 with no activity', () => {
    expect(computeStreak({}, NOW)).toBe(0);
  });
});

describe('mergeGamification', () => {
  it('takes field-wise max so replays never double-count', () => {
    const local = { totalXp: 100, quizzesCompleted: 5, perfectQuizzes: 1, activity: { [daysAgo(0)]: 2 } };
    const remote = { totalXp: 150, quizzesCompleted: 3, perfectQuizzes: 2, activity: { [daysAgo(0)]: 1, [daysAgo(1)]: 3 } };
    const merged = mergeGamification(local, remote);
    expect(merged.totalXp).toBe(150);
    expect(merged.quizzesCompleted).toBe(5);
    expect(merged.perfectQuizzes).toBe(2);
    expect(merged.activity[daysAgo(0)]).toBe(2);
    expect(merged.activity[daysAgo(1)]).toBe(3);
  });
});
