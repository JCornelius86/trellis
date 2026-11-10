/** Date helpers. Every function takes `now` so output is predictable in tests and in the demo. */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function parts(iso: string, timeZone?: string) {
  const d = new Date(iso);
  const f = new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(d);
  const get = (t: string) => f.find((p) => p.type === t)?.value ?? '';
  return {
    month: MONTHS[Number(get('month')) - 1] ?? '',
    day: get('day'),
    year: get('year'),
    time: `${get('hour')}:${get('minute')} ${get('dayPeriod')}`,
  };
}

/** A YYYY-MM-DD date has no time zone, so it's read as that calendar day everywhere. */
function isDateOnly(iso: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso);
}

/** "Nov 9" */
export function shortDate(iso: string, timeZone?: string): string {
  if (isDateOnly(iso)) {
    const [, m, d] = iso.split('-');
    return `${MONTHS[Number(m) - 1]} ${Number(d)}`;
  }
  const p = parts(iso, timeZone);
  return `${p.month} ${p.day}`;
}

/** "Nov 9, 4:12 PM" */
export function dateTime(iso: string, timeZone?: string): string {
  const p = parts(iso, timeZone);
  return `${p.month} ${p.day}, ${p.time}`;
}

/** "2026-11-09": the calendar day of a moment, in the given time zone (or the local one). */
export function isoDay(iso: string, timeZone?: string): string {
  if (isDateOnly(iso)) return iso;
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));
}

/** "5m", "3h", "2d": compact age for activity lists. */
export function ago(iso: string, now: Date): string {
  const ms = Math.max(0, now.getTime() - new Date(iso).getTime());
  if (ms < HOUR) return `${Math.max(1, Math.round(ms / MINUTE))}m`;
  if (ms < DAY) return `${Math.round(ms / HOUR)}h`;
  return `${Math.round(ms / DAY)}d`;
}

/** "4 min ago", "2 hours ago", "3 days ago", "just now" */
export function agoLong(iso: string, now: Date): string {
  const ms = Math.max(0, now.getTime() - new Date(iso).getTime());
  if (ms < MINUTE) return 'just now';
  if (ms < HOUR) return `${Math.round(ms / MINUTE)} min ago`;
  if (ms < DAY) return plural(Math.round(ms / HOUR), 'hour') + ' ago';
  return plural(Math.round(ms / DAY), 'day') + ' ago';
}

/** Whole days between two moments, rounded down. */
export function daysBetween(fromIso: string, to: Date): number {
  return Math.floor((to.getTime() - new Date(fromIso).getTime()) / DAY);
}

export function plural(n: number, word: string, many = `${word}s`): string {
  return `${n} ${n === 1 ? word : many}`;
}

const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

/** "Five", "Two", … and digits past ten. For short summary sentences. */
export function numberWord(n: number): string {
  return WORDS[n] ?? String(n);
}
