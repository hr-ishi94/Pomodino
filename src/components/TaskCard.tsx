import React from 'react';
import { ArrowUpRight, Check, Clock3, Folder } from 'lucide-react';
import type { TodoItem, TodoPriority, TodoStatus } from '../types';
import { PRIORITY_LABEL, STATUS_LABEL, STATUS_ORDER, formatDueDate } from '../lib/tasks';
import { formatTimeFriendly } from '../lib/time';

const PRIORITY_DOT: Record<TodoPriority, string> = {
  high: 'bg-[#E5484D]',
  medium: 'bg-[#F2A23A]',
  low: 'bg-[#45A86B]',
};

// Chip tint per priority: fill / border / text
const PRIORITY_CHIP: Record<TodoPriority, string> = {
  high: 'bg-[#FDECEE] border-[#F5C2C7] text-[#C0353A]',
  medium: 'bg-[#FEF1E2] border-[#F7D3A6] text-[#B86E12]',
  low: 'bg-[#EAF7EE] border-[#BFE3CB] text-[#2F7D4B]',
};

export const PriorityBadge: React.FC<{ priority: TodoPriority }> = ({ priority }) => (
  <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full border text-[10px] font-semibold ${PRIORITY_CHIP[priority]}`}>
    <span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[priority]}`} />
    {PRIORITY_LABEL[priority]} Priority
  </span>
);

interface StatusPillsProps {
  counts: Record<TodoStatus, number>;
  value: TodoStatus;
  onChange: (status: TodoStatus) => void;
}

/** Horizontally scrolling "4 To Do / 2 In Progress / …" filter pills */
export const StatusPills: React.FC<StatusPillsProps> = ({ counts, value, onChange }) => (
  <div role="tablist" className="no-scrollbar -mx-5 px-5 flex gap-2.5 overflow-x-auto pb-1">
    {STATUS_ORDER.map((s) => {
      const active = value === s;
      return (
        <button
          key={s}
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => onChange(s)}
          className={`shrink-0 flex items-center gap-2 h-[44px] pl-1.5 pr-4 rounded-full transition-colors ${
            active ? 'bg-lime-300 border-[1.5px] border-lime-300' : 'pill-surface'
          }`}
        >
          <span
            className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold text-ink ${
              active ? 'bg-white' : 'bg-warm-100'
            }`}
          >
            {counts[s]}
          </span>
          <span className="text-[13px] font-medium text-ink whitespace-nowrap">{STATUS_LABEL[s]}</span>
        </button>
      );
    })}
  </div>
);

interface TaskCardProps {
  task: TodoItem;
  onOpen: (task: TodoItem) => void;
  onToggleDone: (id: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onOpen, onToggleDone }) => {
  const isDone = task.status === 'done';
  const when = task.dueTime
    ? formatTimeFriendly(task.dueTime)
    : task.dueDate
      ? formatDueDate(task.dueDate)
      : 'Anytime';

  return (
    <article className={`card p-4 ${isDone ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <PriorityBadge priority={task.priority} />
        <button
          type="button"
          onClick={() => onOpen(task)}
          aria-label={`Open ${task.text}`}
          className="w-9 h-9 shrink-0 rounded-full bg-warm-100 text-ink flex items-center justify-center hover:bg-warm-200 transition-colors"
        >
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      <h3 className={`mt-2 text-[16px] leading-snug font-semibold text-ink ${isDone ? 'line-through' : ''}`}>
        {task.text}
      </h3>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          {task.project && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-focus-700">
              <Folder className="w-3.5 h-3.5" /> {task.project}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-[12px] text-ink">
            <Clock3 className="w-4 h-4 shrink-0" />
            <span className="truncate">{when}</span>
          </span>
        </div>
        <button
          type="button"
          onClick={() => onToggleDone(task.id)}
          aria-label={isDone ? `Mark ${task.text} as not done` : `Mark ${task.text} as done`}
          aria-pressed={isDone}
          className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center border-[3px] border-white shadow-lifted transition-colors ${
            isDone ? 'bg-lime-300 text-ink' : 'bg-ink text-white'
          }`}
        >
          <Check className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </article>
  );
};

/** Little status chip used on schedule cards */
export const StatusChip: React.FC<{ status: TodoStatus }> = ({ status }) => (
  <span
    className={`inline-flex items-center gap-1 h-7 px-3 rounded-full border text-[11px] font-medium ${
      status === 'done'
        ? 'bg-lime-200 border-lime-300 text-ink'
        : status === 'todo'
          ? 'bg-warm-100 border-warm-200 text-warm-700'
          : 'bg-focus-50 border-focus-400 text-focus-600'
    }`}
  >
    {(status === 'in_progress' || status === 'in_review') && <Clock3 className="w-3.5 h-3.5" />}
    {STATUS_LABEL[status]}
  </span>
);
