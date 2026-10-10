import React, { useMemo, useState } from 'react';
import { Bell, Plus, ClipboardList, ClipboardCheck, Clipboard } from 'lucide-react';
import type { TodoItem, TodoStatus } from '../types';
import { STATUS_ORDER, compareTasks, greeting, isTaskForDay } from '../lib/tasks';
import { getTodayDateString } from '../lib/storage';
import { StatusPills, TaskCard } from '../components/TaskCard';

interface TodayScreenProps {
  todos: TodoItem[];
  userName: string;
  profileImage?: string;
  currentTime: Date;
  onAddTask: () => void;
  onOpenTask: (task: TodoItem) => void;
  onToggleDone: (id: string) => void;
  onOpenSchedule: () => void;
  onViewAll: () => void;
  onOpenProfile: () => void;
}

/** Profile photo when set, otherwise a gradient circle with the user's initial */
export const InitialAvatar: React.FC<{ name: string; image?: string; size?: number }> = ({ name, image, size = 64 }) =>
  image ? (
    <img
      src={image}
      alt=""
      aria-hidden
      className="rounded-full object-cover border-[3px] border-white shadow-soft"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      className="rounded-full flex items-center justify-center text-white font-bold bg-gradient-to-br from-[#F7B267] via-[#E77FB3] to-[#7C5CF8] border-[3px] border-white shadow-soft"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden
    >
      {(name.trim()[0] || '?').toUpperCase()}
    </span>
  );

/** Lime progress arc on a translucent white track around a violet disc, white knob at the arc's end */
const ProgressRing: React.FC<{ percent: number }> = ({ percent }) => {
  const size = 124;
  const stroke = 13;
  const c = size / 2;
  const r = c - stroke / 2;
  const len = 2 * Math.PI * r;
  const angle = (percent / 100) * 2 * Math.PI - Math.PI / 2;
  const knobX = c + r * Math.cos(angle);
  const knobY = c + r * Math.sin(angle);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="block overflow-visible">
        <defs>
          <linearGradient id="progress-disc" x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor="#9A66F0" />
            <stop offset="55%" stopColor="#AE8AF5" />
            <stop offset="100%" stopColor="#CDB8FA" />
          </linearGradient>
          <linearGradient id="progress-arc" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E6EEA6" />
            <stop offset="100%" stopColor="#C4D35E" />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={stroke} />
        {/* Disc with a soft light rim */}
        <circle cx={c} cy={c} r={r - stroke / 2 - 4} fill="url(#progress-disc)" stroke="rgba(255,255,255,0.55)" strokeWidth={2} />
        {/* Progress arc */}
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke="url(#progress-arc)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={len}
          strokeDashoffset={len * (1 - percent / 100)}
          transform={`rotate(-90 ${c} ${c})`}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        {percent > 0 && <circle cx={knobX} cy={knobY} r={6.5} fill="#FFFFFF" stroke="#C4D35E" strokeWidth={2.5} />}
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-white font-medium tracking-tight">
        <span className="text-[26px] leading-none">{percent}</span>
        <span className="text-[15px] leading-none mt-1.5">%</span>
      </span>
    </div>
  );
};

const Stat: React.FC<{ icon: React.ReactNode; label: string; value: number }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-2.5">
    <span className="w-9 h-9 shrink-0 rounded-full bg-[#D9CCF5]/70 flex items-center justify-center text-[#8C7BB8]">{icon}</span>
    <div className="leading-tight">
      <p className="text-[16px] font-semibold text-ink">{value}</p>
      <p className="text-[11px] text-warm-600">{label}</p>
    </div>
  </div>
);

export const TodayScreen: React.FC<TodayScreenProps> = ({
  todos,
  userName,
  profileImage,
  currentTime,
  onAddTask,
  onOpenTask,
  onToggleDone,
  onOpenSchedule,
  onViewAll,
  onOpenProfile,
}) => {
  const [statusFilter, setStatusFilter] = useState<TodoStatus>('todo');
  const todayStr = getTodayDateString(currentTime);

  const todaysTasks = useMemo(
    () => todos.filter((t) => isTaskForDay(t, todayStr, todayStr)).sort(compareTasks),
    [todos, todayStr]
  );

  const counts = useMemo(() => {
    const c = Object.fromEntries(STATUS_ORDER.map((s) => [s, 0])) as Record<TodoStatus, number>;
    todaysTasks.forEach((t) => (c[t.status] += 1));
    return c;
  }, [todaysTasks]);

  const total = todaysTasks.length;
  const completed = counts.done;
  const pending = total - completed;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  const visible = todaysTasks.filter((t) => t.status === statusFilter);

  return (
    <div className="w-full max-w-md mx-auto px-5 pt-6 pb-32 space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between gap-3">
        <button type="button" onClick={onOpenProfile} className="flex items-center gap-3 min-w-0 text-left">
          <InitialAvatar name={userName} image={profileImage} size={44} />
          <span className="min-w-0">
            <span className="block text-[15px] font-semibold text-ink">{greeting(currentTime)}</span>
            <span className="block text-[12px] text-warm-600 truncate">{userName}</span>
          </span>
        </button>
        <div className="flex items-center gap-2.5 shrink-0">
          <button type="button" onClick={onAddTask} aria-label="Add new task" className="btn-brand w-11 h-11">
            <Plus className="w-5 h-5" />
          </button>
          <button type="button" onClick={onOpenSchedule} aria-label="Open schedule" className="icon-btn relative text-ink">
            <Bell className="w-5 h-5" />
            {pending > 0 && <span className="absolute top-2.5 right-3 w-2 h-2 rounded-full bg-[#E5484D] border-2 border-white" />}
          </button>
        </div>
      </header>

      <h1 className="text-[27px] leading-[1.2] tracking-tight text-ink">
        <span className="font-normal">Let's Make</span>
        <br />
        <span className="font-semibold">Today Productive</span>
      </h1>

      {/* Today's Progress */}
      <section className="glass-panel p-5" aria-label="Today's progress">
        <h2 className="relative text-[18px] font-semibold tracking-tight text-ink mb-4">Today's Progress</h2>
        <div className="relative flex items-center">
          <div className="flex-1 flex justify-center">
            <ProgressRing percent={percent} />
          </div>
          <span className="self-stretch w-px mx-3 bg-gradient-to-b from-white/0 via-white to-white/0" aria-hidden />
          <div className="flex-1 space-y-3.5 pl-2">
            <Stat icon={<ClipboardList className="w-4 h-4" />} label="Total Task" value={total} />
            <Stat icon={<ClipboardCheck className="w-4 h-4" />} label="Completed Task" value={completed} />
            <Stat icon={<Clipboard className="w-4 h-4" />} label="Pending Task" value={pending} />
          </div>
        </div>
      </section>

      {/* Today's Tasks */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-semibold text-ink">Today's Tasks</h2>
          <button type="button" onClick={onViewAll} className="text-[13px] font-medium text-ink hover:text-focus-600">
            View All
          </button>
        </div>

        <StatusPills counts={counts} value={statusFilter} onChange={setStatusFilter} />

        <div className="space-y-3">
          {visible.length === 0 ? (
            <div className="card p-6 text-center">
              <p className="text-[13px] text-warm-600">Nothing here yet.</p>
              {statusFilter === 'todo' && (
                <button type="button" onClick={onAddTask} className="btn-brand mt-3 h-10 px-5 text-[13px] font-semibold">
                  Add a task
                </button>
              )}
            </div>
          ) : (
            visible.map((t) => <TaskCard key={t.id} task={t} onOpen={onOpenTask} onToggleDone={onToggleDone} />)
          )}
        </div>
      </section>
    </div>
  );
};
