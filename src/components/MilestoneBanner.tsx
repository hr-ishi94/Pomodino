import React, { useMemo, useState } from 'react';
import { PartyPopper, X } from 'lucide-react';
import { attainedMilestones, dismissBannerToday, isBannerDismissedToday, loadBadHabits } from '../lib/badHabits';
import { getTodayDateString } from '../lib/storage';

/** Daily congratulation for the highest bad-habit milestone reached; hidden for the day once closed */
export const MilestoneBanner: React.FC = () => {
  const today = getTodayDateString(new Date());
  const [hidden, setHidden] = useState(() => isBannerDismissedToday(today));
  const milestones = useMemo(() => attainedMilestones(loadBadHabits()), []);

  if (hidden || milestones.length === 0) return null;

  return (
    <div role="status" className="relative rounded-3xl p-4 pr-12 text-white bg-gradient-to-br from-forest-400 to-forest-600 shadow-soft animate-expand">
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 shrink-0 rounded-full bg-white/20 flex items-center justify-center">
          <PartyPopper className="w-5 h-5" />
        </span>
        <div className="min-w-0 space-y-0.5">
          {milestones.map((m) => (
            <p key={m.aim} className="text-[13px] leading-snug">
              Congrats on the <span className="font-bold">{m.label}</span> milestone for{' '}
              <span className="font-semibold">{m.aim}</span>!
            </p>
          ))}
        </div>
      </div>
      <button
        type="button"
        aria-label="Hide for today"
        onClick={() => {
          dismissBannerToday(today);
          setHidden(true);
        }}
        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
