const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const ZONELESS_DATETIME = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;

/**
 * Parses a date from the API. Calendar dates ("2026-10-26") stay on that local day; timestamps
 * without a zone ("2026-10-26 14:05:00", how the database returns them) are UTC.
 */
export function parseServerDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const trimmed = String(value).trim();
  const dateOnly = DATE_ONLY.exec(trimmed);
  const parsed = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(ZONELESS_DATETIME.test(trimmed) ? `${trimmed.replace(' ', 'T')}Z` : trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Locale date for display, or the fallback when the value is missing or unreadable. */
export function formatServerDate(
  value: string | null | undefined,
  options?: Intl.DateTimeFormatOptions,
  fallback = '-'
): string {
  const date = parseServerDate(value);
  return date ? date.toLocaleDateString(undefined, options) : fallback;
}

export function formatServerDateTime(value: string | null | undefined, fallback = '-'): string {
  const date = parseServerDate(value);
  return date ? date.toLocaleString() : fallback;
}

/** Whole years since the date of birth, counting the birthday only once it has passed. */
export function ageFromDob(dob: string | null | undefined, today: Date = new Date()): number | null {
  const birth = parseServerDate(dob);
  if (!birth) return null;
  let age = today.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 ? age : null;
}
