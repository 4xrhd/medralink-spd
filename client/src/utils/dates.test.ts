import { describe, expect, it } from 'vitest';
import { ageFromDob, formatServerDate, parseServerDate } from './dates';

describe('parseServerDate', () => {
  it('treats zone-less database timestamps as UTC', () => {
    expect(parseServerDate('2026-10-26 20:30:00')?.toISOString()).toBe('2026-10-26T20:30:00.000Z');
    expect(parseServerDate('2026-10-26T20:30:00')?.toISOString()).toBe('2026-10-26T20:30:00.000Z');
  });

  it('keeps explicit zones as given', () => {
    expect(parseServerDate('2026-10-26T20:30:00.000Z')?.toISOString()).toBe('2026-10-26T20:30:00.000Z');
  });

  it('keeps calendar dates on the same local day', () => {
    const d = parseServerDate('2026-12-31');
    expect([d?.getFullYear(), d?.getMonth(), d?.getDate()]).toEqual([2026, 11, 31]);
  });

  it('returns null for empty or unreadable values', () => {
    expect(parseServerDate(null)).toBeNull();
    expect(parseServerDate('not a date')).toBeNull();
    expect(formatServerDate('nope')).toBe('-');
  });
});

describe('ageFromDob', () => {
  const today = new Date(2026, 9, 26); // 26 Oct 2026

  it('does not count a birthday that has not happened yet this year', () => {
    expect(ageFromDob('2000-12-31', today)).toBe(25);
    expect(ageFromDob('2000-10-26', today)).toBe(26);
    expect(ageFromDob('2000-01-01', today)).toBe(26);
  });

  it('returns null for a missing or future date', () => {
    expect(ageFromDob(undefined, today)).toBeNull();
    expect(ageFromDob('2030-01-01', today)).toBeNull();
  });
});
