import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SkipForward } from 'lucide-react';
import introVideo from '../assets/intro_video.mp4';

interface SplashScreenProps {
  onDone: () => void;
}

const EXIT_MS = 650;
const MAX_MS = 12000; // safety net if the video never ends
const FALLBACK_MS = 3000; // hold the logo this long when the video can't autoplay (e.g. installed PWA)

export const SplashScreen: React.FC<SplashScreenProps> = ({ onDone }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [leaving, setLeaving] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  const finish = useCallback(() => setLeaving(true), []);

  useEffect(() => {
    const fallback = setTimeout(finish, MAX_MS);
    videoRef.current?.play().catch(() => setVideoFailed(true));
    return () => clearTimeout(fallback);
  }, [finish]);

  // No video (autoplay blocked or load error): keep the splash up for a moment instead of vanishing
  useEffect(() => {
    if (!videoFailed) return;
    const t = setTimeout(finish, FALLBACK_MS);
    return () => clearTimeout(t);
  }, [videoFailed, finish]);

  // Keep the latest callback without restarting the exit timer on parent re-renders
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (!leaving) return;
    const t = setTimeout(() => onDoneRef.current(), EXIT_MS);
    return () => clearTimeout(t);
  }, [leaving]);

  return (
    <div
      role="presentation"
      className={`splash fixed inset-0 z-[100] bg-[#17161D] overflow-hidden ${leaving ? 'splash-leave' : 'splash-enter'}`}
    >
      <video
        ref={videoRef}
        src={introVideo}
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={finish}
        onError={() => setVideoFailed(true)}
        className={`w-full h-full object-cover ${videoFailed ? 'invisible' : ''}`}
      />
      {videoFailed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 animate-expand">
          <img src="/pomo-dino.png" alt="" aria-hidden="true" className="w-44 h-44 rounded-full select-none" draggable={false} />
          <p className="text-white text-[18px] font-semibold tracking-tight">Pomodino</p>
          <p className="text-white/70 text-[13px] -mt-3">Make time for what matters</p>
        </div>
      )}
      <button
        type="button"
        onClick={finish}
        aria-label="Skip intro"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 1.25rem)', right: '1.25rem' }}
        className="absolute w-12 h-12 p-0 rounded-full flex items-center justify-center bg-white/90 text-ink shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur transition-transform hover:scale-105 active:scale-95"
      >
        <SkipForward className="w-5 h-5 block" fill="currentColor" />
      </button>
    </div>
  );
};
