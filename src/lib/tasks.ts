import type { Category, TodoItem, TodoPriority, TodoStatus } from '../types';

export const STATUS_ORDER: TodoStatus[] = ['todo', 'in_progress', 'in_review', 'done'];

export const STATUS_LABEL: Record<TodoStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
};

export const PRIORITY_LABEL: Record<TodoPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const PRIORITY_COINS: Record<TodoPriority, number> = { high: 50, medium: 40, low: 30 };

/** Coins per completed focus session, plus a one-off daily bonus for the 4th session */
export const POMODORO_COINS = 50;
export const POMODORO_BONUS_COINS = 100;
export const POMODORO_BONUS_AT = 4;

const PERSONAL_PROJECTS = ['personal', 'health'];
const PERSONAL_CATEGORIES: Category[] = ['gym', 'personal', 'sleep', 'review'];

/** "Work" vs "Personal" bucket used by the schedule filter chips */
export function taskArea(t: TodoItem): 'work' | 'personal' {
  return PERSONAL_PROJECTS.includes((t.project || '').toLowerCase()) ? 'personal' : 'work';
}

export function blockArea(category: Category): 'work' | 'personal' {
  return PERSONAL_CATEGORIES.includes(category) ? 'personal' : 'work';
}

/**
 * Tasks that belong to a given day: due that day, or undated tasks that are
 * still open (or were finished that day) when the day is today.
 */
export function isTaskForDay(t: TodoItem, dateStr: string, todayStr: string): boolean {
  if (t.dueDate) return t.dueDate === dateStr;
  if (dateStr !== todayStr) return false;
  return t.status !== 'done' || t.completedDate === todayStr;
}

/** Sort by due time (untimed last), then priority */
export function compareTasks(a: TodoItem, b: TodoItem): number {
  const at = a.dueTime || '99:99';
  const bt = b.dueTime || '99:99';
  if (at !== bt) return at.localeCompare(bt);
  const rank: Record<TodoPriority, number> = { high: 0, medium: 1, low: 2 };
  return rank[a.priority] - rank[b.priority];
}

export function formatDueDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function greeting(d: Date): string {
  const h = d.getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}
