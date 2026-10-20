import React, { useEffect, useState } from 'react';
import { Check, ChevronDown, Plus, Star, Trash2, X } from 'lucide-react';
import { BAD_HABITS_KEY, CELLS, TARGET_DAYS, loadBadHabits, targetDate, toLocalInput } from '../lib/badHabits';
import type { BadHabit } from '../lib/badHabits';

const fmt = (d: Date, dateOnly = false) =>
  d.toLocaleString('en-US', dateOnly
    ? { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }
    : { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

export const BadHabitBreaker: React.FC = () => {
  const [habits, setHabits] = useState<BadHabit[]>(loadBadHabits);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [creating, setCreating] = useState(false);
  const [aim, setAim] = useState('');
  const [motive, setMotive] = useState('');
  const [lastAt, setLastAt] = useState(() => toLocalInput(new Date()));

  useEffect(() => {
    try {
      localStorage.setItem(BAD_HABITS_KEY, JSON.stringify(habits));
    } catch (err) {
      console.error('Failed to save bad habits to localStorage:', err);
    }
  }, [habits]);

  const toggleOpen = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aim.trim()) return;
    const habit: BadHabit = {
      id: `bh-${Date.now()}`,
      aim: aim.trim(),
      motive: motive.trim(),
      createdAt: new Date().toISOString(),
      lastBadHabitAt: (lastAt ? new Date(lastAt) : new Date()).toISOString(),
      checked: [],
    };
    setHabits((prev) => [habit, ...prev]);
    setExpanded((prev) => new Set(prev).add(habit.id));
    setAim('');
    setMotive('');
    setLastAt(toLocalInput(new Date()));
    setCreating(false);
  };

  const toggleCell = (habitId: string, cellId: string) =>
    setHabits((prev) =>
      prev.map((h) =>
        h.id !== habitId
          ? h
          : {
              ...h,
              checked: h.checked.includes(cellId) ? h.checked.filter((c) => c !== cellId) : [...h.checked, cellId],
            }
      )
    );

  const remove = (habit: BadHabit) => {
    if (!window.confirm(`Delete "${habit.aim}"? Its progress will be lost.`)) return;
    setHabits((prev) => prev.filter((h) => h.id !== habit.id));
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-ink">Break a bad habit</h2>
        <button
          type="button"
          onClick={() => setCreating((c) => !c)}
          aria-label={creating ? 'Cancel' : 'New breakdown'}
          className="h-9 pl-1.5 pr-3.5 rounded-full bg-white shadow-soft inline-flex items-center gap-1.5 text-[13px] font-medium text-ink"
        >
          <span className="w-6 h-6 rounded-full bg-focus-100 text-focus-600 flex items-center justify-center">
            {creating ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          </span>
          {creating ? 'Cancel' : 'New'}
        </button>
      </div>

      {creating && (
        <form onSubmit={create} className="card p-4 space-y-3 animate-expand">
          <label className="block">
            <span className="block mb-1.5 text-[12px] font-medium text-warm-600">Aim</span>
            <input
              type="text"
              value={aim}
              onChange={(e) => setAim(e.target.value)}
              placeholder="e.g. Quit doom-scrolling"
              className="field !h-10 !px-4 !bg-warm-50 !border-warm-200 !text-[13px]"
              autoFocus
            />
          </label>
          <label className="block">
            <span className="block mb-1.5 text-[12px] font-medium text-warm-600">Motive</span>
            <textarea
              value={motive}
              onChange={(e) => setMotive(e.target.value)}
              placeholder="Why does this matter to you?"
              rows={3}
              className="field !px-4 !py-2.5 !bg-warm-50 !border-warm-200 !text-[13px]"
            />
          </label>
          <label className="block">
            <span className="block mb-1.5 text-[12px] font-medium text-warm-600">Last bad habit (date &amp; time)</span>
            <input
              type="datetime-local"
              value={lastAt}
              max={toLocalInput(new Date())}
              onChange={(e) => setLastAt(e.target.value)}
              className="field !h-10 !px-4 !bg-warm-50 !border-warm-200 !text-[13px]"
            />
          </label>
          <button type="submit" className="btn-pill w-full" disabled={!aim.trim()}>
            Create breakdown
          </button>
        </form>
      )}

      {habits.length === 0 && !creating && (
        <div className="card p-5 text-center text-[13px] text-warm-600">No habits being broken yet. Tap New to start one.</div>
      )}

      {habits.map((habit) => {
        const isOpen = expanded.has(habit.id);
        const doneCount = habit.checked.length;
        return (
          <div key={habit.id} className="card p-4">
            <button
              type="button"
              onClick={() => toggleOpen(habit.id)}
              aria-expanded={isOpen}
              className="w-full flex items-start justify-between gap-3 text-left"
            >
              <span className="min-w-0">
                <span className="block text-[14px] font-semibold text-ink leading-snug">{habit.aim}</span>
                <span className="block mt-1 text-[11px] text-warm-600 tabular-nums">
                  {doneCount}/{CELLS.length} checked
                </span>
              </span>
              <ChevronDown className={`w-4 h-4 mt-0.5 shrink-0 text-warm-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
              <div className="mt-3 animate-expand space-y-3">
                <div className="grid grid-cols-2 gap-2 text-[12px]">
                  <div className="rounded-2xl bg-warm-50 px-3 py-2.5">
                    <span className="block text-warm-600">Last bad habit</span>
                    <span className="block font-semibold text-ink">{fmt(new Date(habit.lastBadHabitAt))}</span>
                  </div>
                  <div className="rounded-2xl bg-lime-100 px-3 py-2.5">
                    <span className="block text-warm-600">{TARGET_DAYS}-day target</span>
                    <span className="block font-semibold text-ink">{fmt(targetDate(habit), true)}</span>
                  </div>
                </div>

                {habit.motive && (
                  <p className="text-[12px] text-warm-700 bg-warm-50 rounded-2xl px-3 py-2.5 whitespace-pre-wrap">
                    <span className="font-semibold text-ink">Motive: </span>
                    {habit.motive}
                  </p>
                )}

                <div className="grid grid-cols-5 gap-2">
                  {CELLS.map((cell) => {
                    const checked = habit.checked.includes(cell.id);
                    const tone = checked ? (cell.milestone ? 'habit-cell-win' : 'habit-cell-done') : '';
                    return (
                      <button
                        key={cell.id}
                        type="button"
                        role="checkbox"
                        aria-checked={checked}
                        aria-label={`${cell.value} ${cell.unit}${cell.milestone ? ' milestone' : ''}`}
                        onClick={() => toggleCell(habit.id, cell.id)}
                        className={`habit-cell ${tone}`}
                      >
                        {cell.milestone && (
                          <Star
                            className={`absolute top-1 right-1 w-2.5 h-2.5 ${checked ? 'text-white' : 'text-lime-500'}`}
                            fill="currentColor"
                          />
                        )}
                        <span className="text-[15px] font-bold leading-none tabular-nums">{cell.value}</span>
                        <span className="text-[9px] font-medium uppercase tracking-wider opacity-70 leading-none">{cell.unit}</span>
                        <span className="habit-tick">{checked && <Check className="w-2.5 h-2.5 stroke-[3.5] animate-check-pop" />}</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => remove(habit)}
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-warm-600 px-2 py-1 rounded-full hover:bg-warm-100"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
};
