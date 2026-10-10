import React, { useMemo, useRef, useState } from 'react';
import {
  CalendarDays,
  Check,
  ChevronDown,
  ArrowLeft,
  BriefcaseBusiness,
  Clock3,
  MoreHorizontal,
  PencilLine,
  Moon,
  Plus,
  Sparkles,
  Star,
  Sun,
  Sunset,
  UserRound,
} from 'lucide-react';
import type { BlockStatus, DailyLog, RoutineBlock, TodoItem } from '../types';
import { getBlockSubtasks, getTodayDateString } from '../lib/storage';
import { formatTimeFriendly, formatTimeRange, timeToMinutes } from '../lib/time';
import { blockArea, compareTasks, isTaskForDay, taskArea } from '../lib/tasks';
import { Checkbox } from '../components/ui';
import { PriorityBadge, StatusChip } from '../components/TaskCard';

interface DayScheduleScreenProps {
  todos: TodoItem[];
  dailyLogs: Record<string, DailyLog>;
  getBlocksForDate: (d: Date) => RoutineBlock[];
  currentBlock: RoutineBlock | null;
  currentTime: Date;
  onToggleSubtask: (blockId: string, index: number) => void;
  onAddSubtask: (blockId: string, text: string) => void;
  onMarkBlockStatus: (blockId: string, status: BlockStatus) => void;
  onOpenBreakdown: (block: RoutineBlock) => void;
  onEditRoutine: (date: Date) => void;
  onOpenTask: (task: TodoItem) => void;
  onAddTask: (dueDate: string) => void;
  onBack: () => void;
}

type Filter = 'all' | 'work' | 'personal' | 'starred';
type Period = 'morning' | 'afternoon' | 'evening' | 'anytime';

type Entry =
  | { kind: 'block'; id: string; minutes: number; block: RoutineBlock }
  | { kind: 'task'; id: string; minutes: number; task: TodoItem };

const PERIODS: { id: Period; label: string; icon: React.ElementType }[] = [
  { id: 'morning', label: 'Morning', icon: Sun },
  { id: 'afternoon', label: 'Afternoon', icon: Sunset },
  { id: 'evening', label: 'Evening', icon: Moon },
  { id: 'anytime', label: 'Anytime', icon: Clock3 },
];

const FILTERS: { id: Filter; label: string; icon?: React.ComponentType<{ className?: string }> }[] = [
  { id: 'all', label: 'All' },
  { id: 'work', label: 'Work', icon: BriefcaseBusiness },
  { id: 'personal', label: 'Personal', icon: UserRound },
];

/** "9:00 / AM" with a thin guide line ending in an arrow tick, inside each card */
const TimeCol: React.FC<{ time: string }> = ({ time }) => {
  const [clock, suffix] = time.split(' ');
  return (
    <span className="w-11 shrink-0 flex flex-col items-center self-stretch">
      <span className="text-[16px] font-semibold text-ink leading-none">{clock}</span>
      {suffix && <span className="text-[10px] text-warm-500 mt-1">{suffix}</span>}
      <span className="flex-1 min-h-[12px] w-px mt-2 bg-warm-300" />
      <ChevronDown className="w-3 h-3 -mt-1.5 text-warm-400" />
    </span>
  );
};

function periodOf(minutes: number): Period {
  if (minutes < 0) return 'anytime';
  if (minutes < 12 * 60) return 'morning';
  if (minutes < 17 * 60) return 'afternoon';
  return 'evening';
}

function startOfWeek(d: Date): Date {
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const offset = (s.getDay() + 6) % 7; // Monday first
  s.setDate(s.getDate() - offset);
  return s;
}

export const DayScheduleScreen: React.FC<DayScheduleScreenProps> = ({
  todos,
  dailyLogs,
  getBlocksForDate,
  currentBlock,
  currentTime,
  onToggleSubtask,
  onAddSubtask,
  onMarkBlockStatus,
  onOpenBreakdown,
  onEditRoutine,
  onOpenTask,
  onAddTask,
  onBack,
}) => {
  const todayStr = getTodayDateString(currentTime);
  const [selected, setSelected] = useState<Date>(() => new Date(currentTime));
  const [filter, setFilter] = useState<Filter>('all');
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(currentBlock ? [currentBlock.id] : []));
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const dateInputRef = useRef<HTMLInputElement>(null);

  const selectedStr = getTodayDateString(selected);
  const isToday = selectedStr === todayStr;
  const log = dailyLogs[selectedStr];

  const week = useMemo(() => {
    const start = startOfWeek(selected);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [selected]);

  const grouped = useMemo(() => {
    const keep = (area: 'work' | 'personal', starred: boolean) =>
      filter === 'all' || (filter === 'starred' ? starred : filter === area);

    const entries: Entry[] = [];
    getBlocksForDate(selected).forEach((block) => {
      if (keep(blockArea(block.category), false)) {
        entries.push({ kind: 'block', id: block.id, minutes: timeToMinutes(block.startTime), block });
      }
    });
    todos
      .filter((t) => isTaskForDay(t, selectedStr, todayStr))
      .sort(compareTasks)
      .forEach((task) => {
        if (keep(taskArea(task), task.priority === 'high')) {
          entries.push({ kind: 'task', id: task.id, minutes: task.dueTime ? timeToMinutes(task.dueTime) : -1, task });
        }
      });

    const sorted = entries.sort((a, b) => a.minutes - b.minutes);
    return PERIODS.map((p) => ({ ...p, entries: sorted.filter((e) => periodOf(e.minutes) === p.id) })).filter(
      (g) => g.entries.length > 0
    );
  }, [filter, getBlocksForDate, selected, selectedStr, todayStr, todos]);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const submitDraft = (blockId: string) => {
    const text = (drafts[blockId] || '').trim();
    if (!text) return;
    onAddSubtask(blockId, text);
    setDrafts((d) => ({ ...d, [blockId]: '' }));
  };

  const openPicker = () => {
    const input = dateInputRef.current;
    if (!input) return;
    try {
      input.showPicker();
    } catch {
      input.focus();
    }
  };

  const dateLabel = selected.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' });
  const dayHeading = isToday ? 'Today' : selected.toLocaleDateString('en-US', { weekday: 'long' });

  const renderBlock = (block: RoutineBlock, time: string) => {
    const subtasks = getBlockSubtasks(block);
    const done = (i: number) => !!log?.subtaskDone?.[`${block.id}:${i}`];
    const doneCount = subtasks.filter((_, i) => done(i)).length;
    const status = log?.blockStatus?.[block.id];
    const isOpen = expanded.has(block.id);
    const isCurrent = isToday && currentBlock?.id === block.id;

    return (
      <div className={`card p-4 flex gap-3 ${isCurrent ? 'ring-2 ring-focus-400' : ''} ${status === 'skipped' ? 'opacity-70' : ''}`}>
        <TimeCol time={time} />
        <div className="flex-1 min-w-0">
        <button
          type="button"
          onClick={() => toggle(block.id)}
          aria-expanded={isOpen}
          className="w-full flex items-start justify-between gap-3 text-left"
        >
          <span className="min-w-0">
            <span className="block text-[14px] font-semibold text-ink leading-snug">{block.name}</span>
            {block.firstStep && <span className="block mt-1 text-[11px] text-warm-600 line-clamp-3">{block.firstStep}</span>}
          </span>
          <ChevronDown className={`w-4 h-4 mt-0.5 shrink-0 text-warm-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-warm-100 text-[11px] font-medium text-ink">
            <Clock3 className="w-3.5 h-3.5" /> {formatTimeRange(block.startTime, block.endTime)}
          </span>
          {subtasks.length > 0 && (
            <span className="inline-flex items-center h-7 px-2.5 rounded-full bg-warm-100 text-[11px] font-medium text-ink tabular-nums">
              {doneCount}/{subtasks.length} steps
            </span>
          )}
          {status === 'done' && (
            <span className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-lime-200 text-[11px] font-medium text-ink">
              <Check className="w-3.5 h-3.5 stroke-[3]" /> Done
            </span>
          )}
          {status === 'skipped' && (
            <span className="inline-flex items-center h-7 px-2.5 rounded-full bg-warm-200 text-[11px] font-medium text-warm-700">
              Skipped
            </span>
          )}
          {isCurrent && (
            <span className="inline-flex items-center h-7 px-2.5 rounded-full btn-brand text-[11px] font-medium">Now</span>
          )}
        </div>

        {isOpen && (
          <div className="mt-3 animate-expand">
            <ul className="border-t border-warm-200">
              {subtasks.map((text, i) => (
                <li
                  key={`${block.id}-${i}`}
                  className={`flex items-center gap-3 py-2.5 border-b border-warm-200/70 ${isToday ? 'cursor-pointer' : ''}`}
                  onClick={() => isToday && onToggleSubtask(block.id, i)}
                >
                  {isToday ? (
                    <Checkbox checked={done(i)} onChange={() => onToggleSubtask(block.id, i)} label={text} />
                  ) : (
                    <span className={`w-2 h-2 rounded-full ${done(i) ? 'bg-lime-400' : 'bg-warm-300'}`} />
                  )}
                  <span className={`text-[13px] ${done(i) ? 'line-through text-warm-400' : 'text-warm-700'}`}>{text}</span>
                </li>
              ))}
            </ul>

            {isToday && (
              <>
                <form
                  className="flex items-center gap-2 mt-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitDraft(block.id);
                  }}
                >
                  <input
                    type="text"
                    value={drafts[block.id] || ''}
                    onChange={(e) => setDrafts((d) => ({ ...d, [block.id]: e.target.value }))}
                    placeholder="+ Add step"
                    className="field !h-10 !px-4 !bg-warm-50 !border-warm-200 !text-[13px]"
                  />
                  <button
                    type="submit"
                    aria-label="Add step"
                    disabled={!(drafts[block.id] || '').trim()}
                    className="btn-brand w-10 h-10 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </form>

                <div className="flex items-center gap-2 mt-3">
                  {status !== 'done' ? (
                    <button type="button" className="btn-pill" onClick={() => onMarkBlockStatus(block.id, 'done')}>
                      Mark done
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="text-[13px] font-semibold text-warm-600 px-2 py-1"
                      onClick={() => onMarkBlockStatus(block.id, 'pending')}
                    >
                      Undo
                    </button>
                  )}
                  {status !== 'skipped' && status !== 'done' && (
                    <button
                      type="button"
                      className="text-[13px] font-semibold text-warm-600 px-3 py-1.5 rounded-full hover:bg-warm-100"
                      onClick={() => onMarkBlockStatus(block.id, 'skipped')}
                    >
                      Skip
                    </button>
                  )}
                  <button
                    type="button"
                    className="ml-auto inline-flex items-center gap-1 text-[13px] font-semibold text-focus-600 px-3 py-1.5 rounded-full hover:bg-focus-50"
                    onClick={() => onOpenBreakdown(block)}
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Break down
                  </button>
                </div>
              </>
            )}
          </div>
        )}
        </div>
      </div>
    );
  };

  const renderTask = (task: TodoItem, time: string) => (
    <button type="button" onClick={() => onOpenTask(task)} className="card p-4 w-full text-left flex gap-3">
      <TimeCol time={time} />
      <span className="flex-1 min-w-0">
      <span className={`block text-[14px] font-semibold text-ink leading-snug ${task.status === 'done' ? 'line-through' : ''}`}>
        {task.text}
      </span>
      {task.description && <span className="block mt-1 text-[11px] text-warm-600 line-clamp-3">{task.description}</span>}
      <span className="mt-3 flex flex-wrap items-center gap-1.5">
        <PriorityBadge priority={task.priority} />
        <StatusChip status={task.status} />
        {task.project && (
          <span className="inline-flex items-center h-7 px-2.5 rounded-full bg-warm-100 text-[11px] font-medium text-ink">
            {task.project}
          </span>
        )}
      </span>
      </span>
    </button>
  );

  return (
    <div className="w-full max-w-md mx-auto px-5 pt-6 pb-32 space-y-5">
      {/* Top bar */}
      <header className="flex items-center gap-3">
        <button type="button" onClick={onBack} aria-label="Back" className="icon-btn text-ink shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="flex-1 text-[14px] font-medium text-ink truncate">{dateLabel}</span>
        <div className="flex items-center gap-2.5 shrink-0">
          <button type="button" onClick={() => onAddTask(selectedStr)} aria-label="Add task" className="btn-brand w-11 h-11">
            <Plus className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Date(currentTime))}
            aria-label="Jump to today"
            title="Jump to today"
            className="icon-btn text-ink"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex items-end justify-between gap-3">
        <h1 className="text-[27px] leading-[1.2] tracking-tight text-ink">
          <span className="font-normal">Task</span>
          <br />
          <span className="font-semibold">Schedule</span>
        </h1>
        <div className="relative">
          <button
            type="button"
            onClick={openPicker}
            className="bg-white h-11 pl-1.5 pr-4 rounded-full inline-flex items-center gap-2 text-[13px] font-medium text-ink shadow-soft"
          >
            <span className="w-8 h-8 rounded-full bg-warm-100 flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </span>
            Calendar
          </button>
          <input
            ref={dateInputRef}
            type="date"
            value={selectedStr}
            onChange={(e) => e.target.value && setSelected(new Date(`${e.target.value}T00:00:00`))}
            className="absolute inset-0 opacity-0 pointer-events-none"
            tabIndex={-1}
            aria-hidden
          />
        </div>
      </div>

      {/* Week strip */}
      <div className="no-scrollbar -mx-5 px-5 flex gap-2 overflow-x-auto">
        {week.map((d) => {
          const ds = getTodayDateString(d);
          const active = ds === selectedStr;
          return (
            <button
              key={ds}
              type="button"
              onClick={() => setSelected(d)}
              aria-pressed={active}
              className="shrink-0 w-[48px] h-[78px] rounded-full bg-white shadow-soft flex flex-col items-center justify-between pt-2.5 pb-1.5 text-ink"
            >
              <span className={`text-[11px] ${ds === todayStr ? 'text-focus-600 font-semibold' : 'text-warm-500'}`}>
                {d.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <span
                className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-semibold transition-colors ${
                  active ? 'bg-ink text-white' : 'bg-warm-100 text-ink'
                }`}
              >
                {d.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="no-scrollbar -mx-5 px-5 flex items-center gap-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            aria-pressed={filter === f.id}
            className={`shrink-0 h-10 px-4 rounded-full inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors ${
              filter === f.id ? 'bg-ink text-white' : 'bg-white shadow-soft text-ink'
            }`}
          >
            {f.icon && <f.icon className="w-4 h-4" />}
            {f.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setFilter('starred')}
          aria-pressed={filter === 'starred'}
          aria-label="High priority only"
          className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            filter === 'starred' ? 'bg-ink text-lime-300' : 'bg-white shadow-soft text-ink'
          }`}
        >
          <Star className="w-4 h-4" fill={filter === 'starred' ? 'currentColor' : 'none'} />
        </button>
        <button
          type="button"
          onClick={() => onEditRoutine(selected)}
          className="shrink-0 ml-auto h-10 pl-1.5 pr-4 rounded-full bg-white shadow-soft inline-flex items-center gap-2 text-[13px] font-medium text-ink"
        >
          <span className="w-7 h-7 rounded-full bg-focus-100 text-focus-600 flex items-center justify-center">
            <PencilLine className="w-3.5 h-3.5" />
          </span>
          Edit routine
        </button>
      </div>

      {/* Timeline */}
      {grouped.length === 0 ? (
        <div className="card p-6 text-center text-[13px] text-warm-600">Nothing scheduled for this day.</div>
      ) : (
        grouped.map((g, gi) => {
          const Icon = g.icon;
          return (
            <section key={g.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-[16px] font-semibold text-ink">
                  <Icon className="w-4 h-4" /> {g.label}
                </h2>
                {gi === 0 && <span className="text-[13px] text-warm-500">{dayHeading}</span>}
              </div>
              <ol className="space-y-3">
                {g.entries.map((e) => {
                  const time =
                    e.kind === 'block'
                      ? formatTimeFriendly(e.block.startTime)
                      : e.task.dueTime
                        ? formatTimeFriendly(e.task.dueTime)
                        : '—';
                  return (
                    <li key={`${e.kind}-${e.id}`}>{e.kind === 'block' ? renderBlock(e.block, time) : renderTask(e.task, time)}</li>
                  );
                })}
              </ol>
            </section>
          );
        })
      )}
    </div>
  );
};
