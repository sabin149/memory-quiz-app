export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidIntervalDays(value: string): boolean {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 365;
}
