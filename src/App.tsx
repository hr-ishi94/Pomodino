import { useState, useEffect, useCallback } from 'react';
import { SplashScreen } from './components/SplashScreen';
import type { 
  AppData, 
  ScreenTab, 
  RoutineBlock, 
  BlockStatus, 
  DailyLog, 
  BrainDumpItem, 
  Streak,
  TodoItem,
  TodoPriority,
  TodoStatus,
  HabitQuitTracker,
  DreamAssessment,
  BrainDumpTag,
  Reward,
  DayOfWeek
} from './types';
import { 
  loadAppData, 
  saveAppData, 
  getTodayDateString, 
  getOrCreateDailyLog, 
  updateStreakAfterBlockCompletion, 
  INITIAL_APP_DATA,
  getRoutineBlocksForDate,
  checkAndRunAutoWeeklyBackup,
  DEFAULT_HABIT_TRACKERS,
  DEFAULT_PROJECTS,
  getBlockSubtasks
} from './lib/storage';
import { PRIORITY_COINS, POMODORO_COINS, POMODORO_BONUS_COINS, POMODORO_BONUS_AT } from './lib/tasks';
import { autoResolveMissedBlocks } from './lib/autoResolve';
import { getCurrentAndNextBlock, getWeekKey } from './lib/time';
import { notifications } from './lib/notifications';
import { Navigation } from './components/Navigation';
import { BreakdownModal } from './components/BreakdownModal';
import { BannerNotification } from './components/BannerNotification';
import { ToastUndo } from './components/ToastUndo';
import { TodayScreen } from './screens/TodayScreen';
import { InboxScreen } from './screens/InboxScreen';
import { EveningReviewScreen } from './screens/EveningReviewScreen';
import { WeeklyRetroScreen } from './screens/WeeklyRetroScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { RoadmapScreen } from './screens/RoadmapScreen';
import { PomodoroScreen } from './screens/PomodoroScreen';
import { HabitBreakerScreen } from './screens/HabitBreakerScreen';
import { MoreHubScreen } from './screens/MoreHubScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { DayScheduleScreen } from './screens/DayScheduleScreen';
import { ProjectsScreen } from './screens/ProjectsScreen';
import { TaskFormScreen, type TaskDraft } from './screens/TaskFormScreen';
import { RoutineEditorScreen } from './screens/RoutineEditorScreen';
import { TaskCompletedModal } from './components/TaskCompletedModal';
import { Download, X } from 'lucide-react';

interface UndoState {
  blockId: string;
  blockName: string;
  action: BlockStatus;
  previousStreak: Streak;
  isTodo?: boolean;
  previousTodoStatus?: TodoStatus;
}

export function App() {
  const [appData, setAppData] = useState<AppData>(() => loadAppData());
  const [currentTab, setCurrentTab] = useState<ScreenTab>('today');
  const [showSplash, setShowSplash] = useState(true);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [taskForm, setTaskForm] = useState<{ task: TodoItem | null; dueDate: string } | null>(null);
  const [breakdownBlock, setBreakdownBlock] = useState<RoutineBlock | null>(null);
  const [routineEditDate, setRoutineEditDate] = useState<Date | null>(null);
  const [bannerBlock, setBannerBlock] = useState<RoutineBlock | null>(null);
  const [undoState, setUndoState] = useState<UndoState | null>(null);
  const [autoBackupNotice, setAutoBackupNotice] = useState(false);
  const [celebration, setCelebration] = useState<{ name: string; coins: number } | null>(null);

  const handleUpdateHabitTrackers = (updated: HabitQuitTracker[]) => {
    setAppData((prev) => ({
      ...prev,
      habitTrackers: updated,
      habitTracker: updated[0] || prev.habitTracker,
    }));
  };

  const handleUpdateDreamAssessment = (assessment: DreamAssessment | null) => {
    setAppData((prev) => ({
      ...prev,
      dreamAssessment: assessment,
    }));
  };

  const handlePomodoroSessionCompleted = () => {
    setAppData((prev) => {
      const today = getTodayDateString();
      const prevStats = prev.pomodoroStats || { todayCompleted: 0, lastDate: today, totalCompleted: 0 };
      const isSameDay = prevStats.lastDate === today;
      const todayCompleted = isSameDay ? prevStats.todayCompleted + 1 : 1;
      // The count only reaches the bonus mark once per day, so the bonus is paid once
      const earned = POMODORO_COINS + (todayCompleted === POMODORO_BONUS_AT ? POMODORO_BONUS_COINS : 0);
      return {
        ...prev,
        coins: (prev.coins ?? 0) + earned,
        pomodoroStats: {
          todayCompleted,
          lastDate: today,
          totalCompleted: prevStats.totalCompleted + 1,
        },
      };
    });
  };

  // Sync state to localStorage whenever appData updates
  useEffect(() => {
    saveAppData(appData);
  }, [appData]);

  // The redesigned screens are light-only
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  // P0 #1: Check and run automatic weekly backup export on app mount
  useEffect(() => {
    const { triggered, updatedData } = checkAndRunAutoWeeklyBackup(appData, new Date());
    if (triggered) {
      setAppData(updatedData);
      setAutoBackupNotice(true);
      const timer = setTimeout(() => setAutoBackupNotice(false), 8000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Keep current time updated every 15 seconds to detect block transitions
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Resolve today's routine blocks based on current day of week
  const todayBlocks = getRoutineBlocksForDate(appData, currentTime);
  const getBlocksForDate = useCallback((d: Date) => getRoutineBlocksForDate(appData, d), [appData]);

  // P0 #2: Auto-resolve missed blocks whose grace period (+30m) has passed
  useEffect(() => {
    setAppData((prev) => {
      const blocksForNow = getRoutineBlocksForDate(prev, currentTime);
      const res = autoResolveMissedBlocks(prev, blocksForNow, currentTime);
      return res.changed ? res.data : prev;
    });
  }, [currentTime]);

  // Compute current and next block
  const { currentBlock } = getCurrentAndNextBlock(todayBlocks, currentTime);

  // Today's log
  const todayStr = getTodayDateString(currentTime);
  const dailyLog = getOrCreateDailyLog(appData, todayStr);

  // Notification scheduling for block start times
  const handleBlockTrigger = useCallback((block: RoutineBlock) => {
    if (appData.settings.notificationsEnabled) {
      notifications.notifyBlockStart(block);
    }
    // Also show in-app banner with snooze
    setBannerBlock(block);
  }, [appData.settings.notificationsEnabled]);

  useEffect(() => {
    if (appData.settings.notificationsEnabled) {
      notifications.scheduleRoutineChecks(todayBlocks, handleBlockTrigger);
    } else {
      notifications.clearScheduled();
    }
    return () => notifications.clearScheduled();
  }, [todayBlocks, appData.settings.notificationsEnabled, handleBlockTrigger]);

  // Snooze handler
  const handleSnooze = (minutes: number) => {
    const targetBlock = bannerBlock;
    setBannerBlock(null);
    setTimeout(() => {
      if (targetBlock) {
        handleBlockTrigger(targetBlock);
      }
    }, minutes * 60 * 1000);
  };

  // State update helpers
  const handleUpdatePriority = (newPriority: string) => {
    setAppData((prev) => {
      const currentLog = getOrCreateDailyLog(prev, todayStr);
      return {
        ...prev,
        dailyLogs: {
          ...prev.dailyLogs,
          [todayStr]: {
            ...currentLog,
            priority: newPriority,
          },
        },
      };
    });
  };

  // P1 #6: Marking block status + Undo toast support
  const handleMarkBlockStatus = (blockId: string, status: BlockStatus) => {
    if (status === 'done' || status === 'skipped') {
      const targetBlock = todayBlocks.find((b) => b.id === blockId);
      setUndoState({
        blockId,
        blockName: targetBlock?.name || 'Routine Block',
        action: status,
        previousStreak: { ...appData.streak },
        isTodo: false,
      });
    }

    setAppData((prev) => {
      const currentLog = getOrCreateDailyLog(prev, todayStr);
      const updatedLog: DailyLog = {
        ...currentLog,
        blockStatus: {
          ...currentLog.blockStatus,
          [blockId]: status,
        },
        blockDetails: {
          ...(currentLog.blockDetails || {}),
          [blockId]: {
            status,
            autoResolved: false,
          },
        },
      };

      const updatedLogs = {
        ...prev.dailyLogs,
        [todayStr]: updatedLog,
      };

      const intermediateData: AppData = {
        ...prev,
        dailyLogs: updatedLogs,
      };

      const newStreak = updateStreakAfterBlockCompletion(intermediateData, todayStr, todayBlocks);

      return {
        ...intermediateData,
        streak: newStreak,
      };
    });
  };

  // Task handlers
  const handleAddTodo = (draft: Partial<TaskDraft> & Pick<TaskDraft, 'text' | 'priority'>): boolean => {
    const newTodo: TodoItem = {
      id: `todo-${Date.now()}`,
      status: 'todo',
      createdDate: todayStr,
      coins: PRIORITY_COINS[draft.priority],
      category: 'habit',
      colorTheme: 'blue',
      description: '',
      dueDate: null,
      dueTime: null,
      project: undefined,
      tags: [],
      ...draft,
      text: draft.text.trim(),
    };
    setAppData((prev) => ({
      ...prev,
      todos: [newTodo, ...prev.todos],
    }));
    return true;
  };

  /** Applies a patch to a task, granting or taking back coins when it crosses into/out of Done */
  const applyTodoPatch = (id: string, patch: Partial<TodoItem>, coinsOverride?: number) => {
    const targetTodo = appData.todos.find((t) => t.id === id);
    if (!targetTodo) return;

    const wasDone = targetTodo.status === 'done';
    const nextStatus = patch.status ?? targetTodo.status;
    const willBeDone = nextStatus === 'done';
    const amount = Math.abs(coinsOverride ?? targetTodo.coins ?? PRIORITY_COINS[targetTodo.priority]);

    if (!wasDone && willBeDone) {
      setCelebration({ name: patch.text ?? targetTodo.text, coins: amount });
      setUndoState({
        blockId: id,
        blockName: patch.text ?? targetTodo.text,
        action: 'done',
        previousStreak: { ...appData.streak },
        isTodo: true,
        previousTodoStatus: targetTodo.status,
      });
    }

    setAppData((prev) => {
      const currentCoins = prev.coins ?? 0;
      const coins =
        !wasDone && willBeDone
          ? currentCoins + amount
          : wasDone && !willBeDone
            ? Math.max(0, currentCoins - amount)
            : currentCoins;

      return {
        ...prev,
        coins,
        todos: prev.todos.map((t) =>
          t.id === id
            ? {
                ...t,
                ...patch,
                completedDate: willBeDone ? (wasDone ? t.completedDate : todayStr) : null,
              }
            : t
        ),
      };
    });
  };

  const handleToggleTodo = (id: string, coinsDelta?: number) => {
    const targetTodo = appData.todos.find((t) => t.id === id);
    if (!targetTodo) return;
    applyTodoPatch(id, { status: targetTodo.status === 'done' ? 'todo' : 'done' }, coinsDelta);
  };

  const handleUpdateTodo = (id: string, draft: TaskDraft) => {
    applyTodoPatch(id, { ...draft, coins: PRIORITY_COINS[draft.priority] });
  };

  const handleSaveTaskForm = (draft: TaskDraft) => {
    if (taskForm?.task) handleUpdateTodo(taskForm.task.id, draft);
    else handleAddTodo(draft);
    setTaskForm(null);
  };

  const handleAddProject = (name: string) => {
    setAppData((prev) => {
      const list = prev.projects ?? DEFAULT_PROJECTS;
      return list.includes(name) ? prev : { ...prev, projects: [...list, name] };
    });
  };

  const openNewTask = (dueDate: string = todayStr) => setTaskForm({ task: null, dueDate });
  const openTask = (task: TodoItem) => setTaskForm({ task, dueDate: task.dueDate ?? '' });

  const handleDeleteTodo = (id: string) => {
    setAppData((prev) => ({
      ...prev,
      todos: prev.todos.filter((t) => t.id !== id),
    }));
  };

  const handleAcknowledgeSittingTodo = (
    id: string,
    action: 'keep' | 'demote' | 'done' | 'delete'
  ) => {
    const currentWeekKey = getWeekKey(currentTime);
    if (action === 'delete') {
      handleDeleteTodo(id);
      return;
    }

    setAppData((prev) => ({
      ...prev,
      todos: prev.todos.map((t) => {
        if (t.id !== id) return t;
        if (action === 'keep') {
          return { ...t, lastNudgeWeekKey: currentWeekKey };
        }
        if (action === 'demote') {
          return { ...t, priority: 'low', lastNudgeWeekKey: currentWeekKey };
        }
        if (action === 'done') {
          return { ...t, status: 'done', completedDate: todayStr, lastNudgeWeekKey: currentWeekKey };
        }
        return t;
      }),
    }));
  };

  // Undo completion of block or to-do
  const handleUndo = () => {
    if (!undoState) return;

    if (undoState.isTodo) {
      setAppData((prev) => {
        const targetTodo = prev.todos.find((t) => t.id === undoState.blockId);
        const reward = targetTodo?.coins || 30;
        return {
          ...prev,
          coins: Math.max(0, (prev.coins ?? 0) - reward),
          todos: prev.todos.map((t) =>
            t.id === undoState.blockId
              ? { ...t, status: undoState.previousTodoStatus ?? 'todo', completedDate: null }
              : t
          ),
        };
      });
      setUndoState(null);
      return;
    }

    const { blockId, previousStreak } = undoState;

    setAppData((prev) => {
      const currentLog = getOrCreateDailyLog(prev, todayStr);
      const updatedStatus = { ...currentLog.blockStatus };
      delete updatedStatus[blockId];

      const updatedDetails = { ...(currentLog.blockDetails || {}) };
      delete updatedDetails[blockId];

      const updatedLog: DailyLog = {
        ...currentLog,
        blockStatus: updatedStatus,
        blockDetails: updatedDetails,
      };

      return {
        ...prev,
        streak: previousStreak,
        dailyLogs: {
          ...prev.dailyLogs,
          [todayStr]: updatedLog,
        },
      };
    });

    setUndoState(null);
  };

  const handleSaveFirstStep = (blockId: string, firstStep: string) => {
    setAppData((prev) => ({
      ...prev,
      routineBlocks: prev.routineBlocks.map((b) =>
        b.id === blockId ? { ...b, firstStep } : b
      ),
      routineSets: prev.routineSets.map((s) => ({
        ...s,
        blocks: s.blocks.map((b) => (b.id === blockId ? { ...b, firstStep } : b)),
      })),
    }));
  };

  // Day schedule checklist
  const handleToggleSubtask = (blockId: string, index: number) => {
    setAppData((prev) => {
      const currentLog = getOrCreateDailyLog(prev, todayStr);
      const key = `${blockId}:${index}`;
      const subtaskDone = { ...(currentLog.subtaskDone || {}) };
      subtaskDone[key] = !subtaskDone[key];
      return {
        ...prev,
        dailyLogs: { ...prev.dailyLogs, [todayStr]: { ...currentLog, subtaskDone } },
      };
    });
  };

  const handleAddSubtask = (blockId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const addTo = (b: RoutineBlock): RoutineBlock =>
      b.id === blockId ? { ...b, subtasks: [...getBlockSubtasks(b), trimmed] } : b;
    setAppData((prev) => ({
      ...prev,
      routineBlocks: prev.routineBlocks.map(addTo),
      routineSets: prev.routineSets.map((set) => ({ ...set, blocks: set.blocks.map(addTo) })),
    }));
  };

  // Routine editor (Calendar): replaces the blocks of the routine set used on that weekday
  const routineSetIdFor = (d: Date) => appData.routineSchedule?.[d.getDay() as DayOfWeek] || 'set-weekday';

  const handleSaveRoutine = (d: Date, blocks: RoutineBlock[]) => {
    const setId = routineSetIdFor(d);
    setAppData((prev) => ({
      ...prev,
      routineBlocks: setId === 'set-weekday' ? blocks : prev.routineBlocks,
      routineSets: prev.routineSets.some((s) => s.id === setId)
        ? prev.routineSets.map((s) => (s.id === setId ? { ...s, blocks } : s))
        : [...prev.routineSets, { id: setId, name: 'Routine', blocks }],
    }));
    setRoutineEditDate(null);
  };

  // Rewards Store
  const handleRedeemReward = (reward: Reward): boolean => {
    const balance = appData.coins ?? 0;
    if (balance < reward.cost) return false;
    setAppData((prev) => ({
      ...prev,
      coins: Math.max(0, (prev.coins ?? 0) - reward.cost),
      redemptions: [
        { id: `redeem-${Date.now()}`, rewardId: reward.id, cost: reward.cost, redeemedAt: new Date().toISOString() },
        ...(prev.redemptions || []),
      ],
    }));
    return true;
  };

  // Brain Dump Actions
  const handleSaveBrainDump = (text: string, tag?: BrainDumpTag) => {
    const newItem: BrainDumpItem = {
      id: `dump-${Date.now()}`,
      text,
      createdAt: new Date().toISOString(),
      convertedToTask: false,
      tag,
    };
    setAppData((prev) => ({
      ...prev,
      brainDump: [newItem, ...prev.brainDump],
    }));
  };

  const handleTagBrainDump = (id: string, tag: BrainDumpTag) => {
    setAppData((prev) => ({
      ...prev,
      brainDump: prev.brainDump.map((i) => (i.id === id ? { ...i, tag } : i)),
    }));
  };

  const handleDeleteBrainDump = (id: string) => {
    setAppData((prev) => ({
      ...prev,
      brainDump: prev.brainDump.filter((i) => i.id !== id),
    }));
  };

  const handleConvertDumpToTask = (item: BrainDumpItem) => {
    // Set as Today's One Thing
    handleUpdatePriority(item.text);
    setAppData((prev) => ({
      ...prev,
      brainDump: prev.brainDump.map((i) =>
        i.id === item.id ? { ...i, convertedToTask: true } : i
      ),
    }));
    setCurrentTab('today');
  };

  const handleConvertToTodo = (item: BrainDumpItem, priority: TodoPriority): boolean => {
    const added = handleAddTodo({ text: item.text, priority });
    if (added) {
      setAppData((prev) => ({
        ...prev,
        brainDump: prev.brainDump.map((i) =>
          i.id === item.id ? { ...i, convertedToTask: true } : i
        ),
      }));
      setCurrentTab('today');
      return true;
    }
    return false;
  };

  const handleClearAllDoneDumps = () => {
    setAppData((prev) => ({
      ...prev,
      brainDump: prev.brainDump.filter((i) => !i.convertedToTask),
    }));
  };

  // Review Actions
  const handleSaveReview = (reviewFields: Partial<DailyLog>) => {
    setAppData((prev) => {
      const currentLog = getOrCreateDailyLog(prev, todayStr);
      return {
        ...prev,
        dailyLogs: {
          ...prev.dailyLogs,
          [todayStr]: {
            ...currentLog,
            ...reviewFields,
          },
        },
      };
    });
  };

  // Retro Actions
  const handleSaveRetroNote = (weekKey: string, note: string) => {
    setAppData((prev) => ({
      ...prev,
      weeklyRetroNotes: {
        ...prev.weeklyRetroNotes,
        [weekKey]: note,
      },
    }));
  };

  const handleResetAllData = () => {
    setAppData(INITIAL_APP_DATA);
  };

  const unreadDumpsCount = appData.brainDump.filter((i) => !i.convertedToTask).length;

  return (
    <div className="min-h-full flex flex-col text-ink transition-colors relative selection:bg-focus-200 selection:text-warm-900">
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
      {/* Auto Backup Notification Banner */}
      {autoBackupNotice && (
        <div className="fixed top-3 left-3 right-3 z-50 max-w-sm mx-auto bg-warm-900 text-white dark:bg-warm-100 dark:text-warm-900 px-3.5 py-2.5 rounded-xl shadow-lifted border border-focus-500/50 flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-focus-400 dark:text-focus-600 shrink-0" />
            <span><strong>Weekly backup saved!</strong> A copy of your tracker data was downloaded.</span>
          </div>
          <button
            onClick={() => setAutoBackupNotice(false)}
            className="p-1 hover:bg-white/10 dark:hover:bg-black/10 rounded ml-2 shrink-0"
            aria-label="Dismiss backup notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* In-app reminder banner if a block fires or during test */}
      <BannerNotification
        block={bannerBlock}
        onDismiss={() => setBannerBlock(null)}
        onSnooze={handleSnooze}
        onGoToToday={() => setCurrentTab('today')}
      />

      {/* Screen Routing */}
      <main className="flex-1 flex flex-col w-full">
        {currentTab === 'today' && (
          <TodayScreen
            todos={appData.todos}
            userName={appData.userName ?? 'Kendrick'}
            profileImage={appData.profileImage}
            currentTime={currentTime}
            onAddTask={() => openNewTask()}
            onOpenTask={openTask}
            onToggleDone={(id) => handleToggleTodo(id)}
            onOpenSchedule={() => setCurrentTab('schedule')}
            onViewAll={() => setCurrentTab('projects')}
            onOpenProfile={() => setCurrentTab('profile')}
          />
        )}

        {currentTab === 'projects' && (
          <ProjectsScreen
            todos={appData.todos}
            projects={appData.projects ?? DEFAULT_PROJECTS}
            onAddTask={() => openNewTask()}
            onOpenTask={openTask}
            onToggleDone={(id) => handleToggleTodo(id)}
            onBack={() => setCurrentTab('today')}
          />
        )}

        {currentTab === 'schedule' && (
          <DayScheduleScreen
            todos={appData.todos}
            dailyLogs={appData.dailyLogs}
            getBlocksForDate={getBlocksForDate}
            currentBlock={currentBlock}
            currentTime={currentTime}
            onToggleSubtask={handleToggleSubtask}
            onAddSubtask={handleAddSubtask}
            onMarkBlockStatus={handleMarkBlockStatus}
            onOpenBreakdown={(block) => setBreakdownBlock(block)}
            onEditRoutine={setRoutineEditDate}
            onOpenTask={openTask}
            onAddTask={openNewTask}
            onBack={() => setCurrentTab('today')}
          />
        )}

        {currentTab === 'profile' && (
          <ProfileScreen
            userName={appData.userName ?? 'Kendrick'}
            profileImage={appData.profileImage}
            coins={appData.coins ?? 0}
            streak={appData.streak}
            habitTrackers={appData.habitTrackers || DEFAULT_HABIT_TRACKERS}
            redemptions={appData.redemptions || []}
            onRedeem={handleRedeemReward}
            onUpdateProfile={({ userName, profileImage }) => setAppData((prev) => ({ ...prev, userName, profileImage }))}
            onBack={() => setCurrentTab('today')}
          />
        )}

        {currentTab === 'pomodoro' && (
          <PomodoroScreen
            pomodoroStats={appData.pomodoroStats}
            onSessionCompleted={handlePomodoroSessionCompleted}
            onBack={() => setCurrentTab('today')}
          />
        )}

        {(currentTab === 'learning' || currentTab === 'roadmap') && (
          <RoadmapScreen
            dreamAssessment={appData.dreamAssessment}
            onUpdateDreamAssessment={handleUpdateDreamAssessment}
            onStartPomodoro={() => setCurrentTab('pomodoro')}
          />
        )}

        {currentTab === 'habits' && (
          <HabitBreakerScreen
            trackers={appData.habitTrackers && appData.habitTrackers.length > 0
              ? appData.habitTrackers 
              : (appData.habitTracker ? [appData.habitTracker] : DEFAULT_HABIT_TRACKERS)}
            onUpdateTrackers={handleUpdateHabitTrackers}
            onOpenProfile={() => setCurrentTab('profile')}
          />
        )}

        {currentTab === 'more' && (
          <MoreHubScreen
            onNavigate={setCurrentTab}
            inboxCount={unreadDumpsCount}
          />
        )}

        {currentTab === 'inbox' && (
          <InboxScreen
            items={appData.brainDump}
            todos={appData.todos}
            onDeleteItem={handleDeleteBrainDump}
            onSaveItem={handleSaveBrainDump}
            onSetTag={handleTagBrainDump}
            onConvertToTodo={handleConvertToTodo}
            onSetAsPrimaryFocus={handleConvertDumpToTask}
            onClearAllDone={handleClearAllDoneDumps}
          />
        )}

        {currentTab === 'review' && (
          <EveningReviewScreen
            appData={appData}
            dailyLog={dailyLog}
            onSaveReview={handleSaveReview}
          />
        )}

        {currentTab === 'retro' && (
          <WeeklyRetroScreen
            routineBlocks={todayBlocks}
            dailyLogs={appData.dailyLogs}
            streak={appData.streak}
            weeklyRetroNotes={appData.weeklyRetroNotes}
            todos={appData.todos}
            pomodoroStats={appData.pomodoroStats}
            onSaveRetroNote={handleSaveRetroNote}
            onAcknowledgeSittingTodo={handleAcknowledgeSittingTodo}
            onOpenRoadmap={() => setCurrentTab('learning')}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsScreen
            appData={appData}
            onUpdateAppData={(patch) => setAppData((prev) => ({ ...prev, ...patch }))}
            onOpenRoadmap={() => setCurrentTab('learning')}
            onResetAllData={handleResetAllData}
            onTriggerTestNotification={(block) => handleBlockTrigger(block)}
          />
        )}
      </main>

      {/* Undo Toast on Done/Skip */}
      {undoState && (
        <ToastUndo
          blockName={undoState.blockName}
          action={undoState.action}
          onUndo={handleUndo}
          onDismiss={() => setUndoState(null)}
        />
      )}

      <TaskCompletedModal
        isOpen={Boolean(celebration)}
        taskName={celebration?.name ?? ''}
        coins={celebration?.coins ?? 0}
        onClose={() => setCelebration(null)}
      />

      {/* Add / Edit Task */}
      {routineEditDate && (
        <RoutineEditorScreen
          routineName={appData.routineSets.find((s) => s.id === routineSetIdFor(routineEditDate))?.name ?? 'Daily'}
          blocks={getBlocksForDate(routineEditDate)}
          onSave={(blocks) => handleSaveRoutine(routineEditDate, blocks)}
          onClose={() => setRoutineEditDate(null)}
        />
      )}

      {taskForm && (
        <TaskFormScreen
          key={taskForm.task?.id ?? 'new'}
          task={taskForm.task}
          defaultDueDate={taskForm.dueDate}
          projects={appData.projects ?? DEFAULT_PROJECTS}
          onSave={handleSaveTaskForm}
          onDelete={(id) => {
            handleDeleteTodo(id);
            setTaskForm(null);
          }}
          onAddProject={handleAddProject}
          onClose={() => setTaskForm(null)}
        />
      )}

      {/* Task Breakdown Modal */}
      <BreakdownModal
        isOpen={Boolean(breakdownBlock)}
        block={breakdownBlock}
        onClose={() => setBreakdownBlock(null)}
        onSaveFirstStep={handleSaveFirstStep}
      />

      {/* Bottom Navigation */}
      <Navigation currentTab={currentTab} onTabChange={setCurrentTab} />
    </div>
  );
}

export default App;
