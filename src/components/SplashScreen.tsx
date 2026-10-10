import React, { useCallback, useEffect, useRef, useState } from 'react';
import introVideo from '../assets/intro_video.mp4';

interface SplashScreenProps {
  onDone: () => void;
}

const EXIT_MS = 650;
const MAX_MS = 12000; // safety net if the video never ends

export const SplashScreen: React.FC<SplashScreenProps> = ({ onDone }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [leaving, setLeaving] = useState(false);

  const finish = useCallback(() => setLeaving(true), []);

  useEffect(() => {
    const fallback = setTimeout(finish, MAX_MS);
    videoRef.current?.play().catch(finish);
    return () => clearTimeout(fallback);
  }, [finish]);

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
        onError={finish}
        className="w-full h-full object-cover"
      />
      <button
        type="button"
        onClick={finish}
        className="absolute top-5 right-5 safe-top h-9 px-4 rounded-full bg-white/20 backdrop-blur text-white text-[12px] font-semibold border border-white/30"
      >
        Skip
      </button>
    </div>
  );
};
