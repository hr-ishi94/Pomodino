export const BAD_HABITS_KEY = 'focus-bad-habits';
const BANNER_DISMISS_KEY = 'focus-bad-habits-banner-dismissed';
export const TARGET_DAYS = 90;

export interface BadHabit {
  id: string;
  aim: string;
  motive: string;
  createdAt: string;
  lastBadHabitAt: string; // ISO; the clean streak counts from here
  checked: string[]; // cell ids
}

export interface Cell {
  id: string;
  value: string;
  unit: string;
  label: string;
  ms: number; // time since the last bad habit at which this cell is reached
  milestone: boolean; // gets a full green fill when checked
}

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const HOUR_CELLS: Cell[] = [
  { id: '20m', value: '20', unit: 'min', label: '20 minute', ms: 20 * MIN, milestone: true },
  ...[2, 4, 8, 12, 24, 48].map((h) => ({ id: `${h}h`, value: String(h), unit: 'hrs', label: `${h} hour`, ms: h * HOUR, milestone: true })),
];

const MILESTONE_DAYS = new Set([3, 5, 7, 10, 14, 21, 28, 30, 40, 50, 60, 75, 90]);

export const CELLS: Cell[] = [
  ...HOUR_CELLS,
  ...Array.from({ length: 88 }, (_, i) => {
    const day = i + 3;
    return { id: `d${day}`, value: String(day), unit: 'day', label: `${day} day`, ms: day * DAY, milestone: MILESTONE_DAYS.has(day) };
  }),
];

export function loadBadHabits(): BadHabit[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(BAD_HABITS_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.map((h: BadHabit) => ({ ...h, lastBadHabitAt: h.lastBadHabitAt || h.createdAt }));
  } catch {
    return [];
  }
}

export function targetDate(h: BadHabit): Date {
  const d = new Date(h.lastBadHabitAt);
  d.setDate(d.getDate() + TARGET_DAYS);
  return d;
}

/** "YYYY-MM-DDTHH:mm" in local time, for datetime-local inputs */
export function toLocalInput(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Cell ids the clock has already reached, counted from the last bad habit */
export function reachedIds(h: BadHabit, now: number): Set<string> {
  const elapsed = now - new Date(h.lastBadHabitAt).getTime();
  return new Set(CELLS.filter((c) => elapsed >= c.ms).map((c) => c.id));
}

/** Latest checked milestone for each habit that has one (manual ticks plus time reached) */
export function attainedMilestones(habits: BadHabit[], now = Date.now()): { aim: string; label: string }[] {
  return habits.flatMap((h) => {
    const reached = reachedIds(h, now);
    const last = [...CELLS].reverse().find((c) => c.milestone && (reached.has(c.id) || h.checked.includes(c.id)));
    return last ? [{ aim: h.aim, label: last.label }] : [];
  });
}

export function isBannerDismissedToday(today: string): boolean {
  try {
    return localStorage.getItem(BANNER_DISMISS_KEY) === today;
  } catch {
    return false;
  }
}

export function dismissBannerToday(today: string) {
  try {
    localStorage.setItem(BANNER_DISMISS_KEY, today);
  } catch {
    /* ignore */
  }
}
