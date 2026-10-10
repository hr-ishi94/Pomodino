import React, { useMemo, useState } from 'react';
import { ArrowLeft, Folder, Plus } from 'lucide-react';
import type { TodoItem, TodoStatus } from '../types';
import { STATUS_ORDER, compareTasks } from '../lib/tasks';
import { StatusPills, TaskCard } from '../components/TaskCard';

interface ProjectsScreenProps {
  todos: TodoItem[];
  projects: string[];
  onAddTask: () => void;
  onOpenTask: (task: TodoItem) => void;
  onToggleDone: (id: string) => void;
  onBack: () => void;
}

const ALL = '__all__';
const CARD_TINTS = ['from-[#EDE6FF] to-[#FFFFFF]', 'from-[#F1F5D2] to-[#FFFFFF]', 'from-[#FBE3EC] to-[#FFFFFF]', 'from-[#FDEBD3] to-[#FFFFFF]'];

export const ProjectsScreen: React.FC<ProjectsScreenProps> = ({ todos, projects, onAddTask, onOpenTask, onToggleDone, onBack }) => {
  const [project, setProject] = useState<string>(ALL);
  const [statusFilter, setStatusFilter] = useState<TodoStatus>('todo');

  // Include any project names that only exist on tasks
  const allProjects = useMemo(() => {
    const names = [...projects];
    todos.forEach((t) => {
      if (t.project && !names.includes(t.project)) names.push(t.project);
    });
    return names;
  }, [projects, todos]);

  const stats = useMemo(
    () =>
      allProjects.map((name) => {
        const list = todos.filter((t) => t.project === name);
        const done = list.filter((t) => t.status === 'done').length;
        return { name, total: list.length, done, percent: list.length ? Math.round((done / list.length) * 100) : 0 };
      }),
    [allProjects, todos]
  );

  const scoped = useMemo(
    () => (project === ALL ? todos : todos.filter((t) => t.project === project)),
    [project, todos]
  );

  const counts = useMemo(() => {
    const c = Object.fromEntries(STATUS_ORDER.map((s) => [s, 0])) as Record<TodoStatus, number>;
    scoped.forEach((t) => (c[t.status] += 1));
    return c;
  }, [scoped]);

  const visible = scoped
    .filter((t) => t.status === statusFilter)
    .sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999') || compareTasks(a, b));

  return (
    <div className="w-full max-w-md mx-auto px-5 pt-6 pb-32 space-y-5">
      <header className="flex items-center justify-between gap-3">
        <button type="button" onClick={onBack} aria-label="Back" className="icon-btn text-ink">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[15px] font-semibold text-ink">Projects</h1>
        <button type="button" onClick={onAddTask} aria-label="Add new task" className="btn-brand w-11 h-11">
          <Plus className="w-5 h-5" />
        </button>
      </header>

      <h2 className="text-[27px] leading-[1.2] tracking-tight text-ink">
        <span className="font-normal">Your</span>
        <br />
        <span className="font-semibold">Projects</span>
      </h2>

      {/* Project cards */}
      <div className="no-scrollbar -mx-5 px-5 flex gap-3 overflow-x-auto pb-1">
        {stats.map((p, i) => {
          const active = project === p.name;
          return (
            <button
              key={p.name}
              type="button"
              onClick={() => setProject(active ? ALL : p.name)}
              aria-pressed={active}
              className={`shrink-0 w-[156px] p-4 rounded-[22px] text-left bg-gradient-to-br ${CARD_TINTS[i % CARD_TINTS.length]} border-2 transition-colors shadow-soft ${
                active ? 'border-ink' : 'border-white'
              }`}
            >
              <span className="w-9 h-9 rounded-[10px] bg-focus-100 text-focus-600 flex items-center justify-center text-ink">
                <Folder className="w-4 h-4" />
              </span>
              <span className="block mt-3 text-[14px] font-semibold text-ink truncate">{p.name}</span>
              <span className="block text-[11px] text-warm-600">
                {p.done}/{p.total} tasks
              </span>
              <span className="mt-3 block h-1.5 rounded-full bg-white overflow-hidden">
                <span className="block h-full rounded-full bg-ink" style={{ width: `${p.percent}%` }} />
              </span>
              <span className="block mt-1.5 text-[11px] font-semibold text-ink">{p.percent}%</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-[17px] font-semibold text-ink">{project === ALL ? 'All Tasks' : project}</h2>
        {project !== ALL && (
          <button type="button" onClick={() => setProject(ALL)} className="text-[13px] font-medium text-ink hover:text-focus-600">
            Show all
          </button>
        )}
      </div>

      <StatusPills counts={counts} value={statusFilter} onChange={setStatusFilter} />

      <div className="space-y-3">
        {visible.length === 0 ? (
          <div className="card p-6 text-center text-[13px] text-warm-600">No tasks here.</div>
        ) : (
          visible.map((t) => <TaskCard key={t.id} task={t} onOpen={onOpenTask} onToggleDone={onToggleDone} />)
        )}
      </div>
    </div>
  );
};
