import React, { useMemo, useRef, useState } from 'react';
import { ChevronLeft, Flame, Medal, Lock, CheckCircle2, X, PencilLine, Camera, Trash2 } from 'lucide-react';
import type { Streak, HabitQuitTracker, RewardRedemption, Reward } from '../types';
import { REWARDS_CATALOG, HABIT_MILESTONES } from '../lib/storage';
import { CoinIcon, SegmentedTabs } from '../components/ui';
import { InitialAvatar } from './TodayScreen';

interface ProfileScreenProps {
  userName: string;
  profileImage?: string;
  coins: number;
  streak: Streak;
  habitTrackers: HabitQuitTracker[];
  redemptions: RewardRedemption[];
  onRedeem: (reward: Reward) => boolean;
  onUpdateProfile: (profile: { userName: string; profileImage?: string }) => void;
  onBack: () => void;
}

type ProfileTab = 'store' | 'achievements';

// Achievements are hidden for now; flip to bring the tab and badge count back
const SHOW_ACHIEVEMENTS = false;

const AVATAR_PX = 256;

/** Centre-crops an image file to a square and returns a small JPEG data URL (fits comfortably in localStorage) */
function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const canvas = document.createElement('canvas');
      canvas.width = AVATAR_PX;
      canvas.height = AVATAR_PX;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Canvas unavailable'));
        return;
      }
      ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, AVATAR_PX, AVATAR_PX);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image'));
    };
    img.src = url;
  });
}

interface Badge {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  unlocked: boolean;
}

const STREAK_BADGES = [
  { days: 3, icon: '🔥', title: '3-Day Spark', description: 'Keep a 3 day streak' },
  { days: 7, icon: '⭐', title: 'One Week Strong', description: 'Keep a 7 day streak' },
  { days: 14, icon: '🏅', title: 'Two Week Flow', description: 'Keep a 14 day streak' },
  { days: 30, icon: '🏆', title: 'Monthly Master', description: 'Keep a 30 day streak' },
];

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  userName,
  profileImage,
  coins,
  streak,
  habitTrackers,
  redemptions,
  onRedeem,
  onUpdateProfile,
  onBack,
}) => {
  const [tab, setTab] = useState<ProfileTab>('store');
  const [pending, setPending] = useState<Reward | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(userName);
  const [imageDraft, setImageDraft] = useState<string | undefined>(profileImage);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setNameDraft(userName);
    setImageDraft(profileImage);
    setImageError(null);
    setEditing(true);
  };

  const pickImage = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setImageError('Please choose an image file.');
      return;
    }
    try {
      setImageDraft(await resizeImage(file));
      setImageError(null);
    } catch {
      setImageError('Could not read that image.');
    }
  };

  const saveProfile = () => {
    if (!nameDraft.trim()) return;
    onUpdateProfile({ userName: nameDraft.trim(), profileImage: imageDraft });
    setEditing(false);
  };

  const badges = useMemo<Badge[]>(() => {
    const best = Math.max(streak.best || 0, streak.current || 0);
    const list: Badge[] = STREAK_BADGES.map((b) => ({
      id: `streak-${b.days}`,
      icon: b.icon,
      title: b.title,
      description: b.description,
      unlocked: best >= b.days,
    }));
    habitTrackers.forEach((t) => {
      HABIT_MILESTONES.forEach((m) => {
        list.push({
          id: `${t.id}-${m.id}`,
          icon: m.badge,
          title: m.title,
          description: `${t.habitName} · ${m.rewardDescription}`,
          unlocked: t.unlockedMilestones.includes(m.id),
        });
      });
    });
    return list;
  }, [streak, habitTrackers]);

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const sortedBadges = useMemo(
    () => [...badges].sort((a, b) => Number(b.unlocked) - Number(a.unlocked)),
    [badges]
  );

  const recent = useMemo(
    () => [...redemptions].sort((a, b) => b.redeemedAt.localeCompare(a.redeemedAt)).slice(0, 5),
    [redemptions]
  );

  const confirmRedeem = () => {
    if (!pending) return;
    const ok = onRedeem(pending);
    setToast(ok ? `Enjoy your ${pending.title}! 🎉` : 'Not enough coins yet — keep going!');
    setPending(null);
    window.setTimeout(() => setToast(null), 2600);
  };

  return (
    <div className="w-full max-w-md mx-auto px-5 pt-6 pb-36">
      <header className="flex items-center justify-between gap-3 mb-6">
        <button type="button" onClick={onBack} aria-label="Back" className="icon-btn text-ink">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-[20px] font-semibold text-ink">Profile</h1>
        <span className="w-14" aria-hidden />
      </header>

      <div className="space-y-5">
        {/* Profile card */}
        <section className="glass-panel p-6 flex flex-col items-center text-center">
          {editing ? (
            <form
              className="w-full flex flex-col items-center"
              onSubmit={(e) => {
                e.preventDefault();
                saveProfile();
              }}
            >
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                aria-label="Upload profile photo"
                className="relative rounded-full"
              >
                <InitialAvatar name={nameDraft || userName} image={imageDraft} size={88} />
                <span className="absolute -bottom-0.5 -right-0.5 w-8 h-8 rounded-full btn-brand border-2 border-white">
                  <Camera className="w-4 h-4" />
                </span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  pickImage(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-focus-50 border border-focus-300 text-[12px] font-medium text-focus-600"
                >
                  <Camera className="w-3.5 h-3.5" /> {imageDraft ? 'Change photo' : 'Upload photo'}
                </button>
                {imageDraft && (
                  <button
                    type="button"
                    onClick={() => setImageDraft(undefined)}
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-white border border-warm-200 text-[12px] font-medium text-[#C0353A]"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                )}
              </div>
              {imageError && <p className="mt-2 text-[12px] text-[#C0353A]">{imageError}</p>}

              <label className="mt-4 w-full text-left">
                <span className="block mb-1.5 text-[13px] font-medium text-ink">Name</span>
                <input
                  className="field"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  placeholder="Your name"
                  maxLength={40}
                />
              </label>

              <div className="mt-4 w-full flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="flex-1 h-11 rounded-full bg-white border border-warm-200 text-[13px] font-semibold text-ink"
                >
                  Cancel
                </button>
                <button type="submit" disabled={!nameDraft.trim()} className="btn-brand flex-1 h-11 text-[13px] font-semibold">
                  Save
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="relative">
                <InitialAvatar name={userName} image={profileImage} size={88} />
                <button
                  type="button"
                  onClick={startEdit}
                  aria-label="Edit profile"
                  className="absolute -bottom-0.5 -right-0.5 w-8 h-8 rounded-full btn-brand border-2 border-white"
                >
                  <PencilLine className="w-4 h-4" />
                </button>
              </div>
              <h2 className="relative mt-3 text-[24px] font-semibold text-ink truncate max-w-full">{userName}</h2>
              <p className="relative text-[14px] text-warm-600">Consistent progress creates a better you.</p>
              <button
                type="button"
                onClick={startEdit}
                className="mt-3 inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-white border border-warm-200 text-[12px] font-medium text-ink"
              >
                <PencilLine className="w-3.5 h-3.5" /> Edit profile
              </button>
            </>
          )}

          <div className={`relative mt-5 w-full grid gap-2.5 ${SHOW_ACHIEVEMENTS ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {[
              { icon: <CoinIcon className="w-6 h-6" />, value: coins.toLocaleString(), label: 'Coins' },
              { icon: <Flame className="w-6 h-6 text-focus-600" />, value: streak.current, label: 'Day streak' },
              ...(SHOW_ACHIEVEMENTS
                ? [{ icon: <Medal className="w-6 h-6 text-focus-600" />, value: unlockedCount, label: 'Badges' }]
                : []),
            ].map((s) => (
              <div key={s.label} className="rounded-[22px] bg-white/80 p-3 flex flex-col items-center">
                {s.icon}
                <span className="mt-1.5 text-[18px] font-semibold text-ink">{s.value}</span>
                <span className="text-[12px] text-warm-600">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {SHOW_ACHIEVEMENTS ? (
          <SegmentedTabs<ProfileTab>
            options={[
              { id: 'store', label: 'Rewards Store' },
              { id: 'achievements', label: 'Achievements' },
            ]}
            value={tab}
            onChange={setTab}
          />
        ) : (
          <h3 className="text-[17px] font-semibold text-ink px-1">Rewards Store</h3>
        )}

        {toast && (
          <div role="status" className="rounded-full bg-lime-200 px-4 py-2.5 text-sm font-bold text-ink text-center">
            {toast}
          </div>
        )}

        {!SHOW_ACHIEVEMENTS || tab === 'store' ? (
          <>
            {pending && (
              <div className="card p-4 space-y-3 border-2 border-focus-300 dark:border-focus-700">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-warm-800 dark:text-warm-50">
                    Redeem {pending.title} for {pending.cost.toLocaleString()} coins?
                  </p>
                  <button type="button" onClick={() => setPending(null)} aria-label="Cancel" className="text-warm-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={confirmRedeem} className="btn-brand flex-1 h-11 text-sm font-semibold">
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setPending(null)}
                    className="flex-1 rounded-full border border-warm-200 dark:border-warm-700 text-sm font-bold text-warm-700 dark:text-warm-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {REWARDS_CATALOG.map((r) => (
                <div key={r.id} className="card p-3 flex flex-col items-center text-center">
                  {r.image ? (
                    <img src={r.image} alt="" aria-hidden="true" className="w-16 h-12 object-contain select-none" />
                  ) : (
                    <span aria-hidden="true" className="w-12 h-12 rounded-full bg-focus-50 flex items-center justify-center text-[26px] select-none">
                      {r.emoji}
                    </span>
                  )}
                  <span className="mt-2 text-[13px] font-bold text-warm-800 dark:text-warm-50">{r.title}</span>
                  <span className="text-[11px] font-semibold text-focus-600">{r.cost.toLocaleString()} coins</span>
                  <button
                    type="button"
                    className="btn-pill mt-2"
                    disabled={coins < r.cost}
                    onClick={() => setPending(r)}
                  >
                    Redeem
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-warm-500 px-1">Recent redemptions</h3>
              {recent.length === 0 ? (
                <p className="text-xs text-warm-500 px-1">No rewards redeemed yet. You've earned a treat soon!</p>
              ) : (
                <div className="card divide-y divide-warm-200/70 dark:divide-warm-800">
                  {recent.map((red) => {
                    const reward = REWARDS_CATALOG.find((r) => r.id === red.rewardId);
                    return (
                      <div key={red.id} className="flex items-center gap-3 px-3.5 py-2.5">
                        {reward?.image ? (
                          <img src={reward.image} alt="" aria-hidden="true" className="w-9 h-6 object-contain" />
                        ) : (
                          reward?.emoji && <span aria-hidden="true" className="w-9 text-center text-[18px]">{reward.emoji}</span>
                        )}
                        <span className="flex-1 text-[13px] font-semibold text-warm-800 dark:text-warm-100">
                          {reward?.title ?? 'Reward'}
                        </span>
                        <span className="text-[11px] text-warm-500">{formatDate(red.redeemedAt)}</span>
                        <span className="text-[11px] font-bold text-focus-600">-{red.cost.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-2">
            {sortedBadges.map((b) => (
              <div
                key={b.id}
                className={`flex items-center gap-3 p-3 rounded-2xl ${
                  b.unlocked ? 'card' : 'card opacity-60 grayscale'
                }`}
              >
                <div
                  className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-xl ${
                    b.unlocked ? 'bg-lime-200' : 'bg-warm-200 dark:bg-warm-800'
                  }`}
                >
                  {b.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-warm-800 dark:text-warm-50 truncate">{b.title}</p>
                  <p className="text-[11px] text-warm-500 dark:text-warm-400 truncate">{b.description}</p>
                </div>
                {b.unlocked ? (
                  <CheckCircle2 className="w-4 h-4 text-focus-600 shrink-0" />
                ) : (
                  <Lock className="w-4 h-4 text-warm-400 shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
