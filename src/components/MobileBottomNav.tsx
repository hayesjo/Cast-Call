import React from 'react';
import { Mode } from '../types';
import { Compass, MapPin, CloudSun, Calendar } from 'lucide-react';

interface MobileBottomNavProps {
  mode: Mode;
  activeTab: 'forecast' | 'hotspots' | 'weather' | 'calendar';
  onTabChange: (tab: 'forecast' | 'hotspots' | 'weather' | 'calendar') => void;
  isFutureDateActive?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  mode,
  activeTab,
  onTabChange,
  isFutureDateActive = false,
}) => {
  const tabs = [
    {
      id: 'forecast' as const,
      label: 'Forecast',
      sublabel: mode === 'fishing' ? 'Bite Index' : 'Rut & Moon',
      icon: Compass,
    },
    {
      id: 'hotspots' as const,
      label: mode === 'fishing' ? 'Lake Map' : 'Stand Wind',
      sublabel: mode === 'fishing' ? 'Zones & Depth' : 'Scent Cone',
      icon: MapPin,
    },
    {
      id: 'weather' as const,
      label: 'Weather',
      sublabel: 'Radar & Wind',
      icon: CloudSun,
      highlight: true,
    },
    {
      id: 'calendar' as const,
      label: 'Calendar',
      sublabel: 'Future Dates',
      icon: Calendar,
      badge: isFutureDateActive ? 'DATE' : undefined,
    },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#0d1512]/95 backdrop-blur-lg border-t border-[#1e342b] pb-[env(safe-area-inset-bottom,0px)] shadow-2xl">
      <div className="grid grid-cols-4 max-w-md mx-auto h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center relative py-1 transition-all active:scale-95 ${
                isActive
                  ? mode === 'hunting'
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              {isActive && (
                <span
                  className={`absolute top-0 w-8 h-1 rounded-full ${
                    mode === 'hunting' ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                />
              )}

              <div className="relative mt-0.5">
                <div
                  className={`p-1 rounded-xl transition-all ${
                    isActive
                      ? mode === 'hunting'
                        ? 'bg-amber-950/60 ring-1 ring-amber-500/40'
                        : 'bg-emerald-950/60 ring-1 ring-emerald-500/40'
                      : tab.highlight
                      ? 'bg-[#15231e]'
                      : ''
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      tab.highlight && !isActive ? 'text-emerald-400 animate-pulse' : ''
                    }`}
                  />
                </div>

                {tab.badge && (
                  <span className="absolute -top-1 -right-2 bg-emerald-600 text-white text-[8px] font-black rounded-full h-3.5 px-1 flex items-center justify-center font-mono">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span className="text-[11px] font-bold tracking-tight mt-0.5 leading-none">
                {tab.label}
              </span>
              <span className="text-[9px] text-stone-400 font-mono scale-95 mt-0.5">
                {tab.sublabel}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
