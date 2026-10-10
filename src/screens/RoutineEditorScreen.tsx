import React, { useState } from 'react';
import { Check, ChevronDown, Plus, Trash2, X } from 'lucide-react';
import type { Category, RoutineBlock } from '../types';
import { getBlockSubtasks } from '../lib/storage';
import { formatTimeRange, timeToMinutes } from '../lib/time';

interface RoutineEditorScreenProps {
  routineName: string;
  blocks: RoutineBlock[];
  onSave: (blocks: RoutineBlock[]) => void;
  onClose: () => void;
}

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'office', label: 'Work' },
  { id: 'project', label: 'Project' },
  { id: 'learning', label: 'Learning' },
  { id: 'gym', label: 'Gym' },
  { id: 'personal', label: 'Personal' },
  { id: 'review', label: 'Review' },
  { id: 'sleep', label: 'Sleep' },
];

const newId = () => `block-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="block mb-1.5 text-[12px] font-medium text-warm-600">{children}</span>
);

export const RoutineEditorScreen: React.FC<RoutineEditorScreenProps> = ({ routineName, blocks, onSave, onClose }) => {
  // Steps are always materialised so the editor shows the same list as the schedule
  const [draft, setDraft] = useState<RoutineBlock[]>(() => blocks.map((b) => ({ ...b, subtasks: [...getBlockSubtasks(b)] })));
  const [openId, setOpenId] = useState<string | null>(null);

  const invalid = draft.some((b) => !b.name.trim() || !b.startTime || !b.endTime);

  const patch = (id: string, p: Partial<RoutineBlock>) => setDraft((d) => d.map((b) => (b.id === id ? { ...b, ...p } : b)));

  const setStep = (id: string, i: number, text: string | null) =>
    setDraft((d) =>
      d.map((b) => {
        if (b.id !== id) return b;
        const steps = [...(b.subtasks ?? [])];
        if (text === null) steps.splice(i, 1);
        else steps[i] = text;
        return { ...b, subtasks: steps };
      })
    );

  const addBlock = () => {
    const last = [...draft].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)).pop();
    const block: RoutineBlock = {
      id: newId(),
      name: '',
      startTime: last?.endTime ?? '09:00',
      endTime: last ? last.endTime.replace(/^(\d\d)/, (h) => String(Math.min(23, +h + 1)).padStart(2, '0')) : '10:00',
      category: 'personal',
      subtasks: [],
    };
    setDraft((d) => [...d, block]);
    setOpenId(block.id);
  };

  const save = () => {
    if (invalid) return;
    onSave(
      draft
        .map((b) => ({
          ...b,
          name: b.name.trim(),
          firstStep: b.firstStep?.trim() || undefined,
          subtasks: (b.subtasks ?? []).map((s) => s.trim()).filter(Boolean),
        }))
        .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
    );
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Edit routine" className="fixed inset-0 z-50 overflow-y-auto app-bg">
      <form
        className="w-full max-w-md mx-auto px-5 pt-6 pb-10 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <header className="flex items-center justify-between gap-3">
          <button type="button" onClick={onClose} aria-label="Close" className="icon-btn text-ink">
            <X className="w-5 h-5" />
          </button>
          <h1 className="text-[15px] font-semibold text-ink">Edit Routine</h1>
          <button type="submit" disabled={invalid} aria-label="Save routine" className="icon-btn text-ink disabled:opacity-40">
            <Check className="w-5 h-5" />
          </button>
        </header>

        <div>
          <h2 className="text-[27px] leading-[1.2] tracking-tight text-ink">
            <span className="font-normal">{routineName}</span>
            <br />
            <span className="font-semibold">Routine</span>
          </h2>
          <p className="mt-1.5 text-[12px] text-warm-600">Changes apply to every day that uses this routine.</p>
        </div>

        <ol className="space-y-3">
          {draft.map((b) => {
            const isOpen = openId === b.id;
            const steps = b.subtasks ?? [];
            return (
              <li key={b.id} className="card p-4">
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : b.id)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-3 text-left"
                >
                  <span className="min-w-0">
                    <span className={`block text-[14px] font-semibold truncate ${b.name.trim() ? 'text-ink' : 'text-[#E5484D]'}`}>
                      {b.name.trim() || 'Untitled block'}
                    </span>
                    <span className="block mt-0.5 text-[11px] text-warm-600">
                      {b.startTime && b.endTime ? formatTimeRange(b.startTime, b.endTime) : 'Set a time'} · {steps.length} steps
                    </span>
                  </span>
                  <ChevronDown className={`w-4 h-4 shrink-0 text-warm-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                  <div className="mt-4 space-y-4 animate-expand">
                    <div>
                      <Label>Name</Label>
                      <input
                        className="field"
                        placeholder="e.g. Deep work"
                        value={b.name}
                        onChange={(e) => patch(b.id, { name: e.target.value })}
                        autoFocus={!b.name}
                      />
                    </div>

                    <div className="flex gap-3">
                      <label className="flex-1 min-w-0">
                        <Label>Start</Label>
                        <input type="time" className="field" value={b.startTime} onChange={(e) => patch(b.id, { startTime: e.target.value })} />
                      </label>
                      <label className="flex-1 min-w-0">
                        <Label>End</Label>
                        <input type="time" className="field" value={b.endTime} onChange={(e) => patch(b.id, { endTime: e.target.value })} />
                      </label>
                    </div>

                    <div>
                      <Label>Category</Label>
                      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Category">
                        {CATEGORIES.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            role="radio"
                            aria-checked={b.category === c.id}
                            onClick={() => patch(b.id, { category: c.id })}
                            className={`h-9 px-3.5 rounded-full text-[12px] font-medium transition-colors ${
                              b.category === c.id ? 'bg-ink text-white' : 'bg-white border border-warm-200 text-ink'
                            }`}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>First step (optional)</Label>
                      <input
                        className="field"
                        placeholder="The first 10 minutes"
                        value={b.firstStep ?? ''}
                        onChange={(e) => patch(b.id, { firstStep: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label>Steps</Label>
                      <ul className="space-y-2">
                        {steps.map((s, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <input
                              className="field !h-10 !text-[13px]"
                              value={s}
                              placeholder="Step"
                              onChange={(e) => setStep(b.id, i, e.target.value)}
                              aria-label={`Step ${i + 1}`}
                            />
                            <button
                              type="button"
                              onClick={() => setStep(b.id, i, null)}
                              aria-label={`Remove step ${i + 1}`}
                              className="w-10 h-10 shrink-0 rounded-full bg-white text-warm-600 flex items-center justify-center hover:text-[#E5484D]"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        onClick={() => patch(b.id, { subtasks: [...steps, ''] })}
                        className="mt-2 inline-flex items-center gap-1 h-9 px-3.5 rounded-full bg-white border border-warm-200 text-[12px] font-medium text-warm-600"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add step
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDraft((d) => d.filter((x) => x.id !== b.id))}
                      className="w-full h-10 inline-flex items-center justify-center gap-2 rounded-full text-[13px] font-semibold text-[#C0353A] hover:bg-[#FDECEE]"
                    >
                      <Trash2 className="w-4 h-4" /> Delete block
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        <button
          type="button"
          onClick={addBlock}
          className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-full border-[1.5px] border-dashed border-focus-300 text-[13px] font-semibold text-focus-600 bg-white/60"
        >
          <Plus className="w-4 h-4" /> Add block
        </button>

        <button type="submit" disabled={invalid} className="btn-brand btn-glow w-full h-[52px] text-[15px] font-semibold">
          Save Routine
        </button>
      </form>
    </div>
  );
};
