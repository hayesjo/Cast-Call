import React, { useState } from 'react';
import { Mode, SavedLocation, SolunarData } from '../types';
import { DEFAULT_LOCATIONS } from '../data/defaultLocations';
import {
  Fish,
  Crosshair,
  MapPin,
  Search,
  ChevronDown,
  X,
  Check,
} from 'lucide-react';

interface HeaderProps {
  mode: Mode;
  onModeChange: (newMode: Mode) => void;
  currentLocation: SavedLocation;
  savedLocations: SavedLocation[];
  onSelectLocation: (loc: SavedLocation) => void;
  onOpenSearch: () => void;
  solunar: SolunarData;
  compositeScore: number;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  onModeChange,
  currentLocation,
  savedLocations,
  onSelectLocation,
  onOpenSearch,
  solunar,
  compositeScore,
}) => {
  const [isLocationSheetOpen, setIsLocationSheetOpen] = useState(false);
  // Sheet tab filter: 'auto' (sync with mode) or manual 'hunt' / 'fish'
  const [sheetFilter, setSheetFilter] = useState<'hunt' | 'fish'>('fish');

  // Sync sheet tab when drawer opens or mode changes
  const activeDrawerFilter = isLocationSheetOpen ? sheetFilter : mode === 'hunting' ? 'hunt' : 'fish';

  // 1. Core Michigan Hunting Units (Guaranteed: LeRoy, Rosebush, Tustin)
  const leroy = savedLocations.find((l) => l.name === 'LeRoy') || DEFAULT_LOCATIONS.find((l) => l.name === 'LeRoy');
  const rosebush = savedLocations.find((l) => l.name === 'Rosebush') || DEFAULT_LOCATIONS.find((l) => l.name === 'Rosebush');
  const tustin = savedLocations.find((l) => l.name === 'Tustin') || DEFAULT_LOCATIONS.find((l) => l.name === 'Tustin');

  const additionalMiHunt = savedLocations.filter(
    (l) => l.state === 'MI' && (l.type === 'hunting_unit' || l.type === 'both') && !['LeRoy', 'Rosebush', 'Tustin'].includes(l.name)
  );

  const michiganHuntingLocations: SavedLocation[] = [
    leroy,
    rosebush,
    tustin,
    ...additionalMiHunt,
  ].filter(Boolean) as SavedLocation[];

  // 2. Other Whitetail Units
  const otherHuntingLocations = savedLocations.filter(
    (loc) => loc.state !== 'MI' && (loc.type === 'hunting_unit' || loc.type === 'both')
  );

  // 3. Michigan Fishing Lakes (Lake Mitchell, Rose Lake, East Bay, Lake Skegemog)
  const michiganFishingLakes = savedLocations.filter(
    (loc) => loc.state === 'MI' && (loc.type === 'lake' || loc.type === 'both')
  );

  // 4. Other National Lakes
  const otherLakes = savedLocations.filter(
    (loc) => loc.state !== 'MI' && (loc.type === 'lake' || loc.type === 'both')
  );

  const openSheetForCurrentMode = () => {
    setSheetFilter(mode === 'hunting' ? 'hunt' : 'fish');
    setIsLocationSheetOpen(true);
  };

  const isHuntActive = mode === 'hunting';

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#0d1412]/95 backdrop-blur-md border-b border-[#1f332c] pt-[env(safe-area-inset-top,0px)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          {/* Main Top Bar */}
          <div className="flex items-center justify-between h-14 gap-2">
            {/* Left: Mode Switcher Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-[#131e1a] rounded-xl border border-[#243932]">
              <button
                onClick={() => {
                  onModeChange('fishing');
                  setSheetFilter('fish');
                }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  !isHuntActive
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Fish className="w-3.5 h-3.5" />
                <span>Fish</span>
              </button>
              <button
                onClick={() => {
                  onModeChange('hunting');
                  setSheetFilter('hunt');
                }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isHuntActive
                    ? 'bg-amber-600 text-amber-50 shadow-md'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Hunt</span>
              </button>
            </div>

            {/* Center: Tap Location Selector */}
            <button
              onClick={openSheetForCurrentMode}
              className="flex-1 max-w-[210px] sm:max-w-xs flex items-center justify-between gap-1.5 bg-[#14221d] hover:bg-[#1a2d26] border border-[#284238] rounded-xl px-2.5 py-1.5 text-left transition-colors"
            >
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className={`w-3.5 h-3.5 shrink-0 ${isHuntActive ? 'text-amber-400' : 'text-emerald-400'}`} />
                <div className="truncate">
                  <div className="text-xs font-bold text-stone-100 truncate leading-tight">
                    {currentLocation.name}, {currentLocation.state}
                  </div>
                  <div className="text-[9px] text-stone-400 font-mono truncate leading-none">
                    {currentLocation.acreage || currentLocation.waterBodyType || 'Active Spot'}
                  </div>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            </button>

            {/* Right: Score Pill & Search Trigger */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={openSheetForCurrentMode}
                className={`flex items-center gap-1 px-2 py-1 rounded-xl border text-xs font-mono font-black ${
                  compositeScore >= 80
                    ? isHuntActive
                      ? 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                      : 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                    : compositeScore >= 65
                    ? 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                    : 'bg-stone-900 text-stone-300 border-stone-700'
                }`}
              >
                <span className="text-[10px] text-stone-400 font-sans font-normal hidden sm:inline">
                  {isHuntActive ? 'Rut:' : 'Bite:'}
                </span>
                <span>{compositeScore}</span>
              </button>

              <button
                onClick={onOpenSearch}
                aria-label="Search any location"
                className="p-2 bg-[#14221d] hover:bg-[#1b2f27] border border-[#284238] rounded-xl text-stone-300 transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Sub-Banner: Solunar + Moon Phase Pill */}
          <div className="py-1.5 flex items-center justify-between text-[11px] border-t border-[#182822] text-stone-300 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm">{solunar.moon.icon}</span>
              <span className="text-stone-300 font-medium">
                {solunar.moon.illumination}% {solunar.moon.phaseName}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-mono text-stone-400">
              <span className="text-emerald-400 font-bold">Major 1:</span>
              <span>{solunar.majorPeriods[0]?.startTime || '7:15 AM'}</span>
              <span className="text-stone-600">•</span>
              <span className="text-amber-300 font-bold">Major 2:</span>
              <span>{solunar.majorPeriods[1]?.startTime || '7:40 PM'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Location Selector Bottom Sheet / Modal */}
      {isLocationSheetOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-0 sm:p-4"
          onClick={() => setIsLocationSheetOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-[#111c18] border border-[#2b443a] rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle for Mobile Drag */}
            <div className="w-12 h-1.5 bg-[#253d34] rounded-full mx-auto mt-3 sm:hidden" />

            <div className="p-4 border-b border-[#21352e] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl text-white ${activeDrawerFilter === 'hunt' ? 'bg-amber-900/60 text-amber-300' : 'bg-emerald-900/60 text-emerald-300'}`}>
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-100">Select Location</h3>
                    <p className="text-[11px] text-stone-400">
                      {activeDrawerFilter === 'hunt' ? 'Michigan Hunting Units & Whitetail Territory' : 'Michigan Premier Lakes & Bass Waters'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsLocationSheetOpen(false)}
                  className="p-1.5 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-[#1a2c26]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Segmented Filter Pills (Hunt Units vs Fishing Lakes) */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#15231e] rounded-xl border border-[#253d33]">
                <button
                  onClick={() => setSheetFilter('hunt')}
                  className={`py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    activeDrawerFilter === 'hunt'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>Hunting Units ({michiganHuntingLocations.length})</span>
                </button>
                <button
                  onClick={() => setSheetFilter('fish')}
                  className={`py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    activeDrawerFilter === 'fish'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Fish className="w-3.5 h-3.5" />
                  <span>Fishing Lakes ({michiganFishingLakes.length})</span>
                </button>
              </div>
            </div>

            {/* List with Section Headers - DYNAMICALLY ORDERED BASED ON MODE */}
            <div className="p-4 overflow-y-auto space-y-4">
              {/* === WHEN IN HUNTING MODE (OR HUNT FILTER SELECTED): HUNTING UNITS AT THE VERY TOP === */}
              {activeDrawerFilter === 'hunt' ? (
                <>
                  {/* Michigan Hunting Units: LeRoy MI, Rosebush MI, Tustin MI */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold mb-2">
                      <span>🌲 Michigan Saved Hunting Units</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                        LeRoy • Rosebush • Tustin
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {michiganHuntingLocations.map((loc) => {
                        const isSelected = loc.id === currentLocation.id;
                        return (
                          <button
                            key={loc.id}
                            onClick={() => {
                              onSelectLocation(loc);
                              onModeChange('hunting');
                              setIsLocationSheetOpen(false);
                            }}
                            className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all active:scale-[0.99] ${
                              isSelected
                                ? 'bg-amber-950/60 border-amber-500 ring-1 ring-amber-400/50 shadow-md'
                                : 'bg-[#15231e] border-[#263e34] hover:bg-[#1b2e27]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`p-2 rounded-xl text-xs font-mono font-bold ${
                                  isSelected ? 'bg-amber-500 text-stone-950' : 'bg-[#1f332b] text-amber-300'
                                }`}
                              >
                                MI
                              </div>
                              <div>
                                <div className="text-xs font-bold text-stone-100 flex items-center gap-1.5">
                                  <span>{loc.name}, {loc.state}</span>
                                  {isSelected && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-600 text-white font-mono font-semibold">
                                      ACTIVE
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-stone-400 mt-0.5 line-clamp-1">
                                  {loc.acreage} • {loc.terrain}
                                </div>
                              </div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Other National Whitetail Units */}
                  {otherHuntingLocations.length > 0 && (
                    <div>
                      <div className="text-[11px] font-mono uppercase tracking-wider text-stone-400 font-bold mb-2">
                        🏹 Other National Whitetail Units
                      </div>
                      <div className="space-y-1.5">
                        {otherHuntingLocations.map((loc) => {
                          const isSelected = loc.id === currentLocation.id;
                          return (
                            <button
                              key={loc.id}
                              onClick={() => {
                                onSelectLocation(loc);
                                onModeChange('hunting');
                                setIsLocationSheetOpen(false);
                              }}
                              className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all active:scale-[0.99] ${
                                isSelected
                                  ? 'bg-amber-950/60 border-amber-500 ring-1 ring-amber-400/50 shadow-md'
                                  : 'bg-[#15231e] border-[#263e34] hover:bg-[#1b2e27]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl text-xs font-mono font-bold bg-[#1f332b] text-stone-300">
                                  {loc.state}
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-stone-100">{loc.name}, {loc.state}</div>
                                  <div className="text-[10px] text-stone-400 mt-0.5 line-clamp-1">{loc.acreage}</div>
                                </div>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Michigan Fishing Lakes preview at bottom */}
                  <div className="pt-2 border-t border-[#1f332b]">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold mb-2">
                      🐟 Switch to Michigan Fishing Lakes
                    </div>
                    <div className="space-y-1.5">
                      {michiganFishingLakes.slice(0, 2).map((loc) => (
                        <button
                          key={loc.id}
                          onClick={() => {
                            onSelectLocation(loc);
                            onModeChange('fishing');
                            setIsLocationSheetOpen(false);
                          }}
                          className="w-full text-left p-2.5 rounded-xl border border-[#23382f] bg-[#14201c] hover:bg-[#192b25] flex items-center justify-between text-xs text-stone-300"
                        >
                          <span className="font-semibold text-emerald-300">{loc.name}</span>
                          <span className="text-[10px] text-stone-400 font-mono">Switch to Fishing</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                /* === WHEN IN FISHING MODE: FISHING LAKES AT THE VERY TOP === */
                <>
                  {/* Michigan Premier Fishing Lakes */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold mb-2">
                      <span>🐟 Michigan Premier Fishing Lakes</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                        Cadillac • LeRoy • TC • Williamsburg
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {michiganFishingLakes.map((loc) => {
                        const isSelected = loc.id === currentLocation.id;
                        return (
                          <button
                            key={loc.id}
                            onClick={() => {
                              onSelectLocation(loc);
                              onModeChange('fishing');
                              setIsLocationSheetOpen(false);
                            }}
                            className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all active:scale-[0.99] ${
                              isSelected
                                ? 'bg-emerald-950/60 border-emerald-500 ring-1 ring-emerald-400/50 shadow-md'
                                : 'bg-[#15231e] border-[#263e34] hover:bg-[#1b2e27]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`p-2 rounded-xl text-xs font-mono font-bold ${
                                  isSelected ? 'bg-emerald-500 text-stone-950' : 'bg-[#1f332b] text-emerald-300'
                                }`}
                              >
                                MI
                              </div>
                              <div>
                                <div className="text-xs font-bold text-stone-100 flex items-center gap-1.5">
                                  <span>{loc.name}</span>
                                  {isSelected && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-600 text-white font-mono font-semibold">
                                      ACTIVE
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-stone-400 mt-0.5 line-clamp-1">
                                  {loc.acreage} • {loc.waterBodyType}
                                </div>
                              </div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* National Trophy Bass Fisheries */}
                  {otherLakes.length > 0 && (
                    <div>
                      <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold mb-2">
                        🎣 National Trophy Bass Fisheries
                      </div>
                      <div className="space-y-1.5">
                        {otherLakes.map((loc) => {
                          const isSelected = loc.id === currentLocation.id;
                          return (
                            <button
                              key={loc.id}
                              onClick={() => {
                                onSelectLocation(loc);
                                onModeChange('fishing');
                                setIsLocationSheetOpen(false);
                              }}
                              className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all active:scale-[0.99] ${
                                isSelected
                                  ? 'bg-emerald-950/60 border-emerald-500 ring-1 ring-emerald-400/50 shadow-md'
                                  : 'bg-[#15231e] border-[#263e34] hover:bg-[#1b2e27]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl text-xs font-mono font-bold bg-[#1f332b] text-cyan-300">
                                  {loc.state}
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-stone-100 flex items-center gap-1.5">
                                    <span>{loc.name}, {loc.state}</span>
                                    {isSelected && (
                                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-600 text-white font-mono font-semibold">
                                        ACTIVE
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-stone-400 mt-0.5 line-clamp-1">
                                    {loc.acreage || 'Lake'} • {loc.waterBodyType || 'Water'}
                                  </div>
                                </div>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Michigan Hunting Units preview at bottom */}
                  <div className="pt-2 border-t border-[#1f332b]">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold mb-2">
                      🌲 Switch to Michigan Hunting Units
                    </div>
                    <div className="space-y-1.5">
                      {michiganHuntingLocations.slice(0, 2).map((loc) => (
                        <button
                          key={loc.id}
                          onClick={() => {
                            onSelectLocation(loc);
                            onModeChange('hunting');
                            setIsLocationSheetOpen(false);
                          }}
                          className="w-full text-left p-2.5 rounded-xl border border-[#23382f] bg-[#14201c] hover:bg-[#192b25] flex items-center justify-between text-xs text-stone-300"
                        >
                          <span className="font-semibold text-amber-300">{loc.name}, MI</span>
                          <span className="text-[10px] text-stone-400 font-mono">Switch to Hunting</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Bottom Button to Search / Add New */}
            <div className="p-4 border-t border-[#21352e] bg-[#14201c]">
              <button
                onClick={() => {
                  setIsLocationSheetOpen(false);
                  onOpenSearch();
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-colors"
              >
                <Search className="w-4 h-4" />
                <span>Search Any Lake, County or Coordinates</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
