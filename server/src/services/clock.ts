/** Clinic-local calendar date and database timestamp helpers. */
const CLINIC_TIME_ZONE = process.env.CLINIC_TIME_ZONE || 'Asia/Dhaka';

/** Today's date (YYYY-MM-DD) in the clinic's time zone, which is how appointment dates are stored. */
export function clinicToday(now: Date = new Date()): string {
  // en-CA formats dates as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CLINIC_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/**
 * UTC timestamp in the same "YYYY-MM-DD HH:MM:SS" shape as SQL CURRENT_TIMESTAMP, so rows written
 * by code and by column defaults sort and compare correctly as text on SQLite.
 */
export function dbTimestamp(now: Date = new Date()): string {
  return now.toISOString().replace('T', ' ').substring(0, 19);
}
