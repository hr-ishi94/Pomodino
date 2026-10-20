import React from 'react';
import type { ScreenTab } from '../types';
import { House, FolderClosed, CalendarDays, UserRound } from 'lucide-react';

interface NavigationProps {
  currentTab: ScreenTab;
  onTabChange: (tab: ScreenTab) => void;
}

type Tab = { id: ScreenTab; label: string; icon: React.ComponentType<{ className?: string }> };

const LEFT_TABS: Tab[] = [
  { id: 'today', label: 'Home', icon: House },
  { id: 'projects', label: 'Projects', icon: FolderClosed },
];

const RIGHT_TABS: Tab[] = [
  { id: 'schedule', label: 'Calendar', icon: CalendarDays },
  { id: 'profile', label: 'Profile', icon: UserRound },
];

const TabButton: React.FC<{ tab: Tab; active: boolean; onSelect: (tab: ScreenTab) => void }> = ({ tab, active, onSelect }) => {
  const Icon = tab.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(tab.id)}
      aria-current={active ? 'page' : undefined}
      className={`w-[58px] h-[60px] flex flex-col items-center justify-center gap-1 rounded-[18px] transition-all ${
        active ? 'btn-brand !rounded-[18px] text-white' : 'text-ink hover:bg-warm-100'
      }`}
    >
      <Icon className="w-[21px] h-[21px] stroke-[1.8]" />
      <span className="text-[10.5px] font-medium leading-none">{tab.label}</span>
    </button>
  );
};

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onTabChange }) => {
  const focusActive = currentTab === 'pomodoro';
  return (
    <nav aria-label="Main Navigation" className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-3 safe-bottom pointer-events-none">
      <div className="pointer-events-auto relative max-w-md mx-auto h-[80px] px-2 bg-white rounded-[26px] shadow-lifted flex items-center justify-around">
        {LEFT_TABS.map((tab) => (
          <TabButton key={tab.id} tab={tab} active={currentTab === tab.id} onSelect={onTabChange} />
        ))}

        {/* Centre button: Pomodoro focus timer */}
        <div className="w-[72px] shrink-0 flex items-center justify-center">
          <button
            type="button"
            onClick={() => onTabChange('pomodoro')}
            aria-label="Focus timer"
            aria-current={focusActive ? 'page' : undefined}
            className={`p-1.5 btn-brand btn-glow w-[84px] h-[84px] shrink-0 border-[3px] border-white transition-all ${
              focusActive ? 'ring-4 ring-lime-300' : ''
            }`}
          >
            <img src="/pomo-dino.png" alt="" aria-hidden="true" className="w-[84px] h-[84px] object-contain select-none" draggable={false} />
          </button>
        </div>

        {RIGHT_TABS.map((tab) => (
          <TabButton key={tab.id} tab={tab} active={currentTab === tab.id} onSelect={onTabChange} />
        ))}
      </div>
    </nav>
  );
};
