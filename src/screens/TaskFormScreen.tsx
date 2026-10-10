import React, { useRef, useState } from 'react';
import { CalendarDays, Check, ChevronDown, Clock3, Folder, Plus, Trash2, X } from 'lucide-react';
import type { TodoItem, TodoPriority, TodoStatus } from '../types';
import { PRIORITY_LABEL, STATUS_LABEL, STATUS_ORDER, formatDueDate } from '../lib/tasks';
import { formatTimeFriendly } from '../lib/time';

export type TaskDraft = Pick<TodoItem, 'text' | 'priority' | 'status'> &
  Required<Pick<TodoItem, 'description' | 'dueDate' | 'dueTime' | 'project' | 'tags'>>;

interface TaskFormScreenProps {
  task: TodoItem | null; // null = create
  defaultDueDate: string;
  projects: string[];
  onSave: (draft: TaskDraft) => void;
  onDelete: (id: string) => void;
  onAddProject: (name: string) => void;
  onClose: () => void;
}

// Outlined tinted pills; the selected one gets a stronger border + ring
const PRIORITY_STYLE: Record<TodoPriority, { idle: string; active: string }> = {
  low: { idle: 'bg-[#EAF7EE] border-[#BFE3CB] text-[#2F9E5B]', active: 'bg-[#EAF7EE] border-[#2F9E5B] text-[#2F9E5B] ring-2 ring-[#2F9E5B]/20' },
  medium: { idle: 'bg-[#FEF1E2] border-[#F7D3A6] text-[#E08A1E]', active: 'bg-[#FEF1E2] border-[#E08A1E] text-[#E08A1E] ring-2 ring-[#E08A1E]/20' },
  high: { idle: 'bg-[#FDECEE] border-[#F5C2C7] text-[#E5484D]', active: 'bg-[#FDECEE] border-[#E5484D] text-[#E5484D] ring-2 ring-[#E5484D]/20' },
};

const NEW_PROJECT = '__new__';

const Label: React.FC<{ htmlFor?: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
  <label htmlFor={htmlFor} className="block mb-2 text-[13px] font-medium text-ink">
    {children}
  </label>
);

/** Pill that shows a formatted value and opens the native picker underneath */
const PickerPill: React.FC<{
  icon: React.ReactNode;
  display: string;
  type: 'date' | 'time';
  value: string;
  onChange: (v: string) => void;
  label: string;
}> = ({ icon, display, type, value, onChange, label }) => {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="relative flex-1 min-w-0">
      <button
        type="button"
        onClick={() => {
          try {
            ref.current?.showPicker();
          } catch {
            ref.current?.focus();
          }
        }}
        className="field flex items-center gap-2 text-left !px-4"
      >
        {icon}
        <span className={`truncate ${value ? 'text-ink' : 'text-[#8E89A0]'}`}>{display}</span>
      </button>
      <input
        ref={ref}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="absolute inset-0 opacity-0 pointer-events-none"
        tabIndex={-1}
      />
    </div>
  );
};

export const TaskFormScreen: React.FC<TaskFormScreenProps> = ({
  task,
  defaultDueDate,
  projects,
  onSave,
  onDelete,
  onAddProject,
  onClose,
}) => {
  const [text, setText] = useState(task?.text ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [dueDate, setDueDate] = useState(task ? (task.dueDate ?? '') : defaultDueDate);
  const [dueTime, setDueTime] = useState(task?.dueTime ?? '');
  const [priority, setPriority] = useState<TodoPriority>(task?.priority ?? 'medium');
  const [status, setStatus] = useState<TodoStatus>(task?.status ?? 'todo');
  const [project, setProject] = useState(task?.project ?? projects[0] ?? '');
  const [tags, setTags] = useState<string[]>(task?.tags ?? []);
  const [tagDraft, setTagDraft] = useState<string | null>(null);
  const [projectDraft, setProjectDraft] = useState<string | null>(null);

  const canSave = text.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    onSave({
      text: text.trim(),
      description: description.trim(),
      dueDate: dueDate || null,
      dueTime: dueTime || null,
      priority,
      status,
      project,
      tags,
    });
  };

  const commitTag = () => {
    const t = (tagDraft ?? '').trim();
    if (t && !tags.some((x) => x.toLowerCase() === t.toLowerCase())) setTags([...tags, t]);
    setTagDraft(null);
  };

  const commitProject = () => {
    const p = (projectDraft ?? '').trim();
    if (p) {
      if (!projects.some((x) => x.toLowerCase() === p.toLowerCase())) onAddProject(p);
      setProject(projects.find((x) => x.toLowerCase() === p.toLowerCase()) ?? p);
    }
    setProjectDraft(null);
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={task ? 'Edit task' : 'Add new task'} className="fixed inset-0 z-50 overflow-y-auto app-bg">
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
          <h1 className="text-[15px] font-semibold text-ink">{task ? 'Edit Task' : 'Add New Task'}</h1>
          <button type="submit" disabled={!canSave} aria-label="Save task" className="icon-btn text-ink disabled:opacity-40">
            <Check className="w-5 h-5" />
          </button>
        </header>

        <div>
          <Label htmlFor="task-title">Task Title</Label>
          <input
            id="task-title"
            className="field"
            placeholder="Enter task title"
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus={!task}
          />
        </div>

        <div>
          <Label htmlFor="task-desc">Description</Label>
          <textarea
            id="task-desc"
            className="field !rounded-[20px] min-h-[84px] resize-none"
            placeholder="Add a description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <Label>Due Date &amp; time</Label>
          <div className="flex gap-3">
            <PickerPill
              type="date"
              label="Due date"
              value={dueDate}
              onChange={setDueDate}
              display={dueDate ? formatDueDate(dueDate) : 'No date'}
              icon={<CalendarDays className="w-4 h-4 shrink-0 text-ink" />}
            />
            <PickerPill
              type="time"
              label="Due time"
              value={dueTime}
              onChange={setDueTime}
              display={dueTime ? formatTimeFriendly(dueTime) : 'Any time'}
              icon={<Clock3 className="w-4 h-4 shrink-0 text-ink" />}
            />
          </div>
        </div>

        <div>
          <Label>Priority</Label>
          <div className="flex gap-3" role="radiogroup" aria-label="Priority">
            {(['low', 'medium', 'high'] as TodoPriority[]).map((p) => (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={priority === p}
                onClick={() => setPriority(p)}
                className={`flex-1 h-11 rounded-full border-[1.5px] text-[13px] font-medium transition-all ${
                  priority === p ? PRIORITY_STYLE[p].active : PRIORITY_STYLE[p].idle
                }`}
              >
                {PRIORITY_LABEL[p]}
              </button>
            ))}
          </div>
        </div>

        {task && (
          <div>
            <Label>Status</Label>
            <div className="no-scrollbar -mx-5 px-5 flex gap-2.5 overflow-x-auto" role="radiogroup" aria-label="Status">
              {STATUS_ORDER.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={status === s}
                  onClick={() => setStatus(s)}
                  className={`shrink-0 h-10 px-4 rounded-full text-[13px] font-medium transition-colors ${
                    status === s ? 'bg-lime-300 text-ink' : 'pill-surface text-ink'
                  }`}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="task-project">Project</Label>
          {projectDraft !== null ? (
            <div className="flex gap-2">
              <input
                className="field"
                placeholder="New project name"
                value={projectDraft}
                onChange={(e) => setProjectDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    commitProject();
                  }
                }}
                autoFocus
              />
              <button type="button" onClick={commitProject} aria-label="Add project" className="btn-brand w-12 h-12 shrink-0">
                <Check className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Folder className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-focus-500 fill-focus-100 pointer-events-none" />
              <select
                id="task-project"
                className="field appearance-none !pl-11 !pr-11 text-ink"
                value={project}
                onChange={(e) => (e.target.value === NEW_PROJECT ? setProjectDraft('') : setProject(e.target.value))}
              >
                {project && !projects.includes(project) && <option value={project}>{project}</option>}
                {projects.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
                <option value={NEW_PROJECT}>+ New project…</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink pointer-events-none" />
            </div>
          )}
        </div>

        <div>
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5 h-9 pl-3.5 pr-2 rounded-full bg-focus-50 border border-focus-300 text-[12px] font-medium text-focus-600">
                {t}
                <button
                  type="button"
                  onClick={() => setTags(tags.filter((x) => x !== t))}
                  aria-label={`Remove tag ${t}`}
                  className="w-5 h-5 rounded-full text-focus-600 hover:bg-focus-100 flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
            {tagDraft !== null ? (
              <input
                className="field !w-36 !h-9 !px-3.5 !text-[12px]"
                placeholder="Tag name"
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onBlur={commitTag}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    commitTag();
                  } else if (e.key === 'Escape') setTagDraft(null);
                }}
                autoFocus
              />
            ) : (
              <button
                type="button"
                onClick={() => setTagDraft('')}
                className="inline-flex items-center gap-1 h-9 px-3.5 rounded-full bg-white border border-warm-200 text-[12px] font-medium text-warm-600"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            )}
          </div>
        </div>

        <div className="pt-2 space-y-3">
          <button type="submit" disabled={!canSave} className="btn-brand btn-glow w-full h-[52px] text-[15px] font-semibold">
            {task ? 'Save Changes' : 'Create Task'}
          </button>
          {task && (
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-full text-[13px] font-semibold text-[#C0353A] hover:bg-white/60"
            >
              <Trash2 className="w-4 h-4" /> Delete Task
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
