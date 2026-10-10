import React, { useState, useEffect } from 'react';
import type { PomodoroStats } from '../types';
import { Play, Pause, RotateCcw, FastForward, CheckCircle2, ArrowLeft, Flame, Trophy, Timer, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundPlayer } from '../lib/audio';
import { getTodayDateString } from '../lib/storage';
import { POMODORO_COINS, POMODORO_BONUS_COINS, POMODORO_BONUS_AT } from '../lib/tasks';
import { CoinIcon } from '../components/ui';

interface PomodoroScreenProps {
  pomodoroStats?: PomodoroStats;
  onSessionCompleted: () => void;
  onBack: () => void;
}

type TimerMode = 'focus' | 'rest' | 'long';

const FOCUS_SECONDS = 25 * 60;
const REST_SECONDS = 5 * 60;
const LONG_SECONDS = 15 * 60;

const MODE_SECONDS: Record<TimerMode, number> = {
  focus: FOCUS_SECONDS,
  rest: REST_SECONDS,
  long: LONG_SECONDS,
};

const MODE_LABEL: Record<TimerMode, string> = {
  focus: 'Focus',
  rest: 'Short Break',
  long: 'Long Break',
};

/** Running timers store their end time, paused ones the seconds left, so the timer survives tab switches and reloads */
type TimerState = { mode: TimerMode; endsAt: number | null; remaining: number };

const TIMER_KEY = 'focus-pomodoro-timer';

function loadTimer(): TimerState {
  try {
    const saved = JSON.parse(localStorage.getItem(TIMER_KEY) || 'null') as TimerState | null;
    if (saved && saved.mode in MODE_SECONDS && typeof saved.remaining === 'number') return saved;
  } catch {
    // ignore corrupt or unavailable storage
  }
  return { mode: 'focus', endsAt: null, remaining: FOCUS_SECONDS };
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

/** Lime arc on a white track around a violet disc, matching the Home progress ring */
const TimerRing: React.FC<{ ratio: number; time: string; label: string }> = ({ ratio, time, label }) => {
  const size = 228;
  const stroke = 16;
  const c = size / 2;
  const r = c - stroke / 2;
  const len = 2 * Math.PI * r;
  const angle = ratio * 2 * Math.PI - Math.PI / 2;

  return (
    <div className="relative shrink-0 select-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="block overflow-visible">
        <defs>
          <linearGradient id="timer-disc" x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor="#9A66F0" />
            <stop offset="55%" stopColor="#AE8AF5" />
            <stop offset="100%" stopColor="#CDB8FA" />
          </linearGradient>
          <linearGradient id="timer-arc" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E6EEA6" />
            <stop offset="100%" stopColor="#C4D35E" />
          </linearGradient>
        </defs>
        <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={stroke} />
        <circle cx={c} cy={c} r={r - stroke / 2 - 6} fill="url(#timer-disc)" stroke="rgba(255,255,255,0.55)" strokeWidth={2} />
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke="url(#timer-arc)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={len}
          strokeDashoffset={len * (1 - ratio)}
          transform={`rotate(-90 ${c} ${c})`}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
        {ratio > 0 && (
          <circle cx={c + r * Math.cos(angle)} cy={c + r * Math.sin(angle)} r={8} fill="#FFFFFF" stroke="#C4D35E" strokeWidth={3} />
        )}
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <span className="text-[44px] leading-none font-semibold tabular-nums tracking-tight">{time}</span>
        <span className="mt-2 text-[13px] font-medium text-white/85">{label}</span>
      </span>
    </div>
  );
};

export const PomodoroScreen: React.FC<PomodoroScreenProps> = ({ pomodoroStats, onSessionCompleted, onBack }) => {
  const [timer, setTimer] = useState<TimerState>(loadTimer);
  const [now, setNow] = useState(() => Date.now());
  const [celebration, setCelebration] = useState<{ coins: number; bonus: number } | null>(null);

  const { mode } = timer;
  const isRunning = timer.endsAt !== null;
  const timeLeft = timer.endsAt !== null ? Math.max(0, Math.ceil((timer.endsAt - now) / 1000)) : timer.remaining;
  const totalDuration = MODE_SECONDS[mode];

  // Stats from a previous day don't count towards today
  const completedToday = pomodoroStats?.lastDate === getTodayDateString() ? pomodoroStats.todayCompleted : 0;

  // Persist every change so the timer keeps going across tabs and reloads
  useEffect(() => {
    try {
      localStorage.setItem(TIMER_KEY, JSON.stringify(timer));
    } catch {
      // storage unavailable
    }
  }, [timer]);

  useEffect(() => {
    if (timer.endsAt === null) return;
    const endsAt = timer.endsAt;
    const finishedMode = timer.mode;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t < endsAt) return;
      clearInterval(id);
      if (finishedMode === 'focus') {
        soundPlayer.playFocusDoneChime();
        try {
          confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 }, colors: ['#7C5CF8', '#B9A3FF', '#D5E08A', '#FFFFFF'] });
        } catch {
          // fallback
        }
        // Mirrors the award in App: bonus only on the day's 4th session
        setCelebration({ coins: POMODORO_COINS, bonus: completedToday + 1 === POMODORO_BONUS_AT ? POMODORO_BONUS_COINS : 0 });
        onSessionCompleted();
        setTimer({ mode: 'rest', endsAt: null, remaining: REST_SECONDS });
      } else {
        soundPlayer.playRestDoneChime();
        setTimer({ mode: 'focus', endsAt: null, remaining: FOCUS_SECONDS });
      }
    }, 1000);
    return () => clearInterval(id);
  }, [timer.endsAt, timer.mode, completedToday, onSessionCompleted]);

  const handleTogglePlay = () => {
    const t = Date.now();
    setNow(t);
    setTimer((prev) =>
      prev.endsAt !== null
        ? { ...prev, endsAt: null, remaining: Math.max(0, Math.ceil((prev.endsAt - t) / 1000)) }
        : { ...prev, endsAt: t + prev.remaining * 1000 }
    );
  };

  const handleReset = () => setTimer({ mode, endsAt: null, remaining: MODE_SECONDS[mode] });

  const handleSwitchMode = (newMode: TimerMode) => setTimer({ mode: newMode, endsAt: null, remaining: MODE_SECONDS[newMode] });

  const progressRatio = Math.max(0, Math.min(1, (totalDuration - timeLeft) / totalDuration));
  const isPaused = !isRunning && timeLeft < totalDuration && timeLeft > 0;

  const totalFocusMinutes = completedToday * (FOCUS_SECONDS / 60);

  const modeCards: { key: TimerMode; label: string; mins: number }[] = [
    { key: 'focus', label: 'Focus', mins: FOCUS_SECONDS / 60 },
    { key: 'rest', label: 'Short Break', mins: REST_SECONDS / 60 },
    { key: 'long', label: 'Long Break', mins: LONG_SECONDS / 60 },
  ];

  return (
    <div className="w-full max-w-md mx-auto px-5 pt-6 pb-36 space-y-5">
      <header className="flex items-center justify-between gap-3">
        <button type="button" onClick={onBack} aria-label="Back" className="icon-btn text-ink">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[15px] font-semibold text-ink">Focus Timer</h1>
        <span className="w-11 h-11 rounded-full bg-white shadow-soft flex items-center justify-center overflow-hidden" aria-hidden>
          <img src="/pomo-dino.png" alt="" className="w-9 h-9 object-contain" />
        </span>
      </header>

      <h2 className="text-[27px] leading-[1.2] tracking-tight text-ink">
        <span className="font-normal">{mode === 'focus' ? "Let's Stay" : 'Time To'}</span>
        <br />
        <span className="font-semibold">{mode === 'focus' ? 'Focused' : 'Recharge'}</span>
      </h2>

      {/* Mode pills */}
      <div className="no-scrollbar -mx-5 px-5 flex gap-2.5 overflow-x-auto" role="radiogroup" aria-label="Timer mode">
        {modeCards.map(({ key, label, mins }) => {
          const active = mode === key;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => handleSwitchMode(key)}
              className={`shrink-0 h-11 pl-1.5 pr-4 rounded-full inline-flex items-center gap-2 text-[13px] font-medium text-ink transition-colors ${
                active ? 'bg-lime-300' : 'pill-surface'
              }`}
            >
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold ${active ? 'bg-white' : 'bg-warm-100'}`}>
                {mins}m
              </span>
              {label}
            </button>
          );
        })}
      </div>

      {/* Timer */}
      <section className="glass-panel p-6 flex flex-col items-center">
        <TimerRing ratio={progressRatio} time={formatTime(timeLeft)} label={MODE_LABEL[mode]} />

        <div className="mt-6 w-full flex items-center gap-3">
          <button type="button" onClick={handleReset} className="icon-btn text-ink shrink-0" aria-label="Reset timer" title="Reset timer">
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleTogglePlay}
            className="btn-brand btn-glow flex-1 h-[52px] text-[15px] font-semibold gap-2"
            aria-label={isRunning ? 'Pause Timer' : 'Start Timer'}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 fill-current" /> Pause
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" /> {isPaused ? 'Resume' : 'Start'}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode(mode === 'focus' ? 'rest' : 'focus')}
            className="icon-btn text-ink shrink-0"
            aria-label="Skip to next session"
            title="Skip to next session"
          >
            <FastForward className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Celebration */}
      {celebration && (
        <div role="status" className="card p-4 flex items-center gap-3 animate-expand">
          <span className="w-10 h-10 shrink-0 rounded-full bg-lime-300 text-ink flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[14px] font-semibold text-ink">
              {celebration.bonus ? `${POMODORO_BONUS_AT} sessions done today!` : 'Focus session complete!'}
            </span>
            <span className="mt-0.5 flex items-center gap-1 text-[12px] font-semibold text-focus-600">
              <CoinIcon className="w-4 h-4" /> +{celebration.coins} coins
              {celebration.bonus > 0 && <> · +{celebration.bonus} bonus</>}
            </span>
            <span className="block text-[12px] text-warm-600">Enjoy your 5-minute rest.</span>
          </span>
          <button type="button" onClick={() => setCelebration(null)} aria-label="Dismiss" className="w-9 h-9 rounded-full bg-warm-100 text-ink flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Today's stats */}
      <section className="card p-4 flex items-center">
        <div className="flex-1 flex items-center gap-3">
          <span className="w-10 h-10 shrink-0 rounded-[12px] bg-focus-100 text-focus-600 flex items-center justify-center">
            <Timer className="w-5 h-5" />
          </span>
          <span>
            <span className="block text-[16px] font-semibold tabular-nums text-ink">{formatTime(totalDuration - timeLeft)}</span>
            <span className="block text-[11px] text-warm-600">of {formatTime(totalDuration)}</span>
          </span>
        </div>
        <span className="w-px self-stretch mx-3 bg-warm-200" aria-hidden />
        <div className="flex-1 flex items-center gap-3">
          <span className="w-10 h-10 shrink-0 rounded-[12px] bg-lime-300/60 text-ink flex items-center justify-center">
            <Flame className="w-5 h-5" />
          </span>
          <span>
            <span className="block text-[16px] font-semibold tabular-nums text-ink">{totalFocusMinutes}m</span>
            <span className="block text-[11px] text-warm-600">
              {completedToday} {completedToday === 1 ? 'session' : 'sessions'} today
            </span>
          </span>
        </div>
      </section>

      {/* Daily milestones */}
      <section className="card p-4 flex items-center justify-between">
        <span className="flex items-center gap-2.5">
          <span className="w-10 h-10 rounded-[12px] bg-focus-100 text-focus-600 flex items-center justify-center">
            <Trophy className="w-5 h-5" />
          </span>
          <span>
            <span className="block text-[14px] font-semibold text-ink">Daily Milestones</span>
            <span className="block text-[11px] text-warm-600">
              +{POMODORO_COINS} per session · +{POMODORO_BONUS_COINS} at {POMODORO_BONUS_AT}
            </span>
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          {[1, 2, 3, 4].map((n) => {
            const unlocked = completedToday >= n;
            return (
              <span
                key={n}
                aria-label={`Session ${n} ${unlocked ? 'done' : 'pending'}`}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  unlocked ? 'btn-brand' : 'bg-warm-100 text-warm-400'
                }`}
              >
                <Flame className={`w-4 h-4 ${unlocked ? 'fill-current' : ''}`} />
              </span>
            );
          })}
        </span>
      </section>
    </div>
  );
};
