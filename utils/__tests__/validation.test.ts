import { EMAIL_PATTERN, isValidIntervalDays, TIME_PATTERN } from '@/utils/validation';

describe('EMAIL_PATTERN', () => {
  it('accepts normal addresses', () => {
    expect(EMAIL_PATTERN.test('user@example.com')).toBe(true);
    expect(EMAIL_PATTERN.test('a.b+tag@sub.domain.io')).toBe(true);
  });
  it('rejects malformed addresses', () => {
    expect(EMAIL_PATTERN.test('nope')).toBe(false);
    expect(EMAIL_PATTERN.test('a@b')).toBe(false);
    expect(EMAIL_PATTERN.test('a b@c.com')).toBe(false);
  });
});

describe('TIME_PATTERN', () => {
  it('accepts 24h HH:MM', () => {
    expect(TIME_PATTERN.test('08:00')).toBe(true);
    expect(TIME_PATTERN.test('23:59')).toBe(true);
  });
  it('rejects invalid times', () => {
    expect(TIME_PATTERN.test('24:00')).toBe(false);
    expect(TIME_PATTERN.test('8:00')).toBe(false);
    expect(TIME_PATTERN.test('banana')).toBe(false);
  });
});

describe('isValidIntervalDays', () => {
  it('accepts whole numbers 1-365', () => {
    expect(isValidIntervalDays('1')).toBe(true);
    expect(isValidIntervalDays('365')).toBe(true);
  });
  it('rejects out-of-range, fractional, and non-numeric input', () => {
    expect(isValidIntervalDays('0')).toBe(false);
    expect(isValidIntervalDays('366')).toBe(false);
    expect(isValidIntervalDays('1.5')).toBe(false);
    expect(isValidIntervalDays('banana')).toBe(false);
  });
});
