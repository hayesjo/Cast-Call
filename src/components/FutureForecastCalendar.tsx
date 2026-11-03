import React, { useState, useMemo } from 'react';
import { Mode, SavedLocation, WeatherData } from '../types';
import { calculateSolunar } from '../utils/solunar';
import { calculateRutForecast } from '../utils/rutCalculator';
import { calculateBassForecast } from '../utils/bassTactics';
import { calculateSolarTimes } from '../utils/solarAstronomical';
import {
  Calendar as CalendarIcon,
  Sunrise,
  Sunset,
  Crosshair,
  Fish,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldAlert,
  Wind,
  Compass,
  CheckCircle2,
  Clock,
  Layers,
  Flame,
  ArrowRight,
} from 'lucide-react';

interface FutureForecastCalendarProps {
  mode: Mode;
  location: SavedLocation;
  currentWeather: WeatherData;
  activeAppDate: Date;
  onSelectDate: (date: Date) => void;
  onApplyDateToApp: (date: Date) => void;
}

export const FutureForecastCalendar: React.FC<FutureForecastCalendarProps> = ({
  mode,
  location,
  currentWeather,
  activeAppDate,
  onSelectDate,
  onApplyDateToApp,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date(activeAppDate));
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date(activeAppDate));

  // Determine if selected date is today
  const isSelectedToday = useMemo(() => {
    const today = new Date();
    return (
      selectedDate.getFullYear() === today.getFullYear() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getDate() === today.getDate()
    );
  }, [selectedDate]);

  // Determine if activeAppDate matches selectedDate
  const isCurrentlyApplied = useMemo(() => {
    return (
      selectedDate.getFullYear() === activeAppDate.getFullYear() &&
      selectedDate.getMonth() === activeAppDate.getMonth() &&
      selectedDate.getDate() === activeAppDate.getDate()
    );
  }, [selectedDate, activeAppDate]);

  // Solar Times for the selected date
  const solar = useMemo(() => {
    return calculateSolarTimes(selectedDate, location.lat, location.lon);
  }, [selectedDate, location.lat, location.lon]);

  // Solunar for selected date
  const solunar = useMemo(() => {
    return calculateSolunar(selectedDate, solar.sunrise, solar.sunset);
  }, [selectedDate, solar.sunrise, solar.sunset]);

  // Rut forecast for selected date
  const rut = useMemo(() => {
    return calculateRutForecast(selectedDate, location.lat);
  }, [selectedDate, location.lat]);

  // Seasonal estimated water temp & weather for fishing
  const targetMonth = selectedDate.getMonth();
  const estimatedWaterTemp = useMemo(() => {
    // Water temperature curve for Michigan / northern tier
    const seasonalTemps = [
      36, // Jan
      35, // Feb
      39, // Mar
      48, // Apr
      59, // May
      68, // Jun
      75, // Jul
      74, // Aug
      67, // Sep
      56, // Oct
      45, // Nov
      38, // Dec
    ];
    return seasonalTemps[targetMonth] || 60;
  }, [targetMonth]);

  // Bass forecast for selected date
  const bassForecast = useMemo(() => {
    return calculateBassForecast({
      waterTemp: estimatedWaterTemp,
      pressureTrend: 'falling',
      pressureValue: 29.95,
      waterClarity: location.waterClarityDefault || 'stained',
      lightCondition: 'partly_cloudy',
      forageActive: 'threadfin_shad',
      windSpeed: 10,
      windCardinal: 'NW',
      seasonMonth: targetMonth,
    });
  }, [estimatedWaterTemp, location.waterClarityDefault, targetMonth]);

  // Composite Hunting Rating for selected date
  const huntingScore = useMemo(() => {
    let score = rut.rutActivityScore * 0.5 + solunar.overallSolunarScore * 0.4 + 10;
    return Math.max(45, Math.min(99, Math.round(score)));
  }, [rut, solunar]);

  // Quick preset dates for Michigan outdoorsmen
  const quickPresets = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();

    const presets = [
      {
        label: 'Today',
        date: new Date(),
        badge: 'Current',
      },
      {
        label: 'Tomorrow',
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
        badge: '+1 Day',
      },
      {
        label: 'This Weekend',
        date: (() => {
          const d = new Date();
          const day = d.getDay();
          const diff = (6 - day + 7) % 7 || 7;
          d.setDate(d.getDate() + diff);
          return d;
        })(),
        badge: 'Sat',
      },
      {
        label: 'Peak Rut (MI)',
        date: new Date(currentYear, 10, 8), // Nov 8
        badge: 'Nov 8',
      },
      {
        label: 'Firearms Opener',
        date: new Date(currentYear, 10, 15), // Nov 15
        badge: 'Nov 15',
      },
      {
        label: 'Late Muzzleloader',
        date: new Date(currentYear, 11, 6), // Dec 6
        badge: 'Dec 6',
      },
      {
        label: 'Spring Prespawn Bass',
        date: new Date(currentYear, 4, 15), // May 15
        badge: 'May 15',
      },
      {
        label: 'Early Summer Topwater',
        date: new Date(currentYear, 5, 20), // June 20
        badge: 'Jun 20',
      },
    ];

    return presets;
  }, []);

  // Calendar month days calculation
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days = [];
    const startingDayOfWeek = firstDay.getDay(); // 0 is Sunday

    // Pad previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push({
        date: new Date(year, month, d),
        isCurrentMonth: true,
      });
    }

    // Pad remaining grid to 35 or 42
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [calendarMonth]);

  const changeMonth = (offset: number) => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const handleDayClick = (d: Date) => {
    setSelectedDate(d);
    onSelectDate(d);
  };

  // Format date helper
  const formatDateHeading = (d: Date) => {
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="bg-[#101b17] border border-[#233b31] rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider uppercase text-emerald-400">
              <CalendarIcon className="w-4 h-4 text-emerald-400" />
              <span>Trip Planning & Future Forecast Calendar</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-stone-100 mt-1">
              Select Future Date for {location.name}, {location.state}
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Forecast solunar periods, daylight shooting windows, rut phase progression, and bite patterns for upcoming dates.
            </p>
          </div>

          {/* Action to Apply or Reset */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {!isSelectedToday && (
              <button
                onClick={() => {
                  const today = new Date();
                  setSelectedDate(today);
                  setCalendarMonth(today);
                  onSelectDate(today);
                  onApplyDateToApp(today);
                }}
                className="px-3 py-2 bg-[#172721] hover:bg-[#1f352c] border border-[#2b473b] text-stone-300 rounded-xl text-xs font-semibold transition-colors"
              >
                Reset to Today
              </button>
            )}

            <button
              onClick={() => onApplyDateToApp(selectedDate)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all ${
                isCurrentlyApplied
                  ? 'bg-emerald-900/60 border border-emerald-500 text-emerald-300 cursor-default'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isCurrentlyApplied ? 'Forecast Applied to App' : 'Apply Date to Entire App'}</span>
            </button>
          </div>
        </div>

        {/* Quick Date Shortcuts Horizontal Scroll */}
        <div className="mt-4 pt-3 border-t border-[#1c3027] overflow-x-auto no-scrollbar flex items-center gap-2">
          <span className="text-[11px] font-mono text-stone-400 uppercase tracking-wider shrink-0 mr-1">
            Quick Dates:
          </span>
          {quickPresets.map((preset, idx) => {
            const isMatch =
              selectedDate.getFullYear() === preset.date.getFullYear() &&
              selectedDate.getMonth() === preset.date.getMonth() &&
              selectedDate.getDate() === preset.date.getDate();

            return (
              <button
                key={idx}
                onClick={() => {
                  setSelectedDate(preset.date);
                  setCalendarMonth(preset.date);
                  onSelectDate(preset.date);
                }}
                className={`shrink-0 px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isMatch
                    ? 'bg-emerald-600 border-emerald-400 text-white shadow-md'
                    : 'bg-[#15231e] border-[#253d33] text-stone-300 hover:bg-[#1b2e27]'
                }`}
              >
                <span>{preset.label}</span>
                <span
                  className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                    isMatch ? 'bg-emerald-800 text-emerald-100' : 'bg-[#101b16] text-stone-400'
                  }`}
                >
                  {preset.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Calendar Grid & Details Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Interactive Month Picker Grid (5 Cols on large) */}
        <div className="lg:col-span-5 bg-[#101b17] border border-[#233b31] rounded-2xl p-4 shadow-xl">
          {/* Month Header Navigation */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-stone-100 flex items-center gap-1.5">
              <CalendarIcon className="w-4 h-4 text-emerald-400" />
              <span>
                {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            </h3>

            <div className="flex items-center gap-1">
              <button
                onClick={() => changeMonth(-1)}
                className="p-1.5 rounded-lg bg-[#162520] hover:bg-[#1e342c] text-stone-300 border border-[#274036] transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => changeMonth(1)}
                className="p-1.5 rounded-lg bg-[#162520] hover:bg-[#1e342c] text-stone-300 border border-[#274036] transition-colors"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono uppercase text-stone-400 font-bold mb-1">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((item, idx) => {
              const isSelected =
                item.date.getFullYear() === selectedDate.getFullYear() &&
                item.date.getMonth() === selectedDate.getMonth() &&
                item.date.getDate() === selectedDate.getDate();

              const today = new Date();
              const isToday =
                item.date.getFullYear() === today.getFullYear() &&
                item.date.getMonth() === today.getMonth() &&
                item.date.getDate() === today.getDate();

              // Quick score indicator for dots
              const rutEval = calculateRutForecast(item.date, location.lat);
              const solunarEval = calculateSolunar(item.date);
              const dayScore =
                mode === 'hunting'
                  ? Math.round(rutEval.rutActivityScore * 0.5 + solunarEval.overallSolunarScore * 0.4 + 10)
                  : solunarEval.overallSolunarScore;

              const isHigh = dayScore >= 80;
              const isMedium = dayScore >= 65 && dayScore < 80;

              return (
                <button
                  key={idx}
                  onClick={() => handleDayClick(item.date)}
                  className={`h-11 sm:h-12 rounded-xl flex flex-col items-center justify-center p-1 text-xs transition-all relative ${
                    isSelected
                      ? 'bg-emerald-600 text-white font-bold ring-2 ring-emerald-300 shadow-lg scale-105 z-10'
                      : isToday
                      ? 'bg-[#1b3127] text-emerald-300 font-bold border border-emerald-500/60'
                      : item.isCurrentMonth
                      ? 'bg-[#14221d] hover:bg-[#1c3028] text-stone-200'
                      : 'bg-[#0f1714] text-stone-600 hover:text-stone-400'
                  }`}
                >
                  <span className="leading-tight">{item.date.getDate()}</span>
                  <div className="flex items-center gap-0.5 mt-0.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected
                          ? 'bg-white'
                          : isHigh
                          ? 'bg-amber-400 shadow-sm shadow-amber-400/50'
                          : isMedium
                          ? 'bg-emerald-400'
                          : 'bg-stone-600'
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Activity Dot Legend */}
          <div className="mt-3 pt-2.5 border-t border-[#1d332a] flex items-center justify-between text-[10px] text-stone-400 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Prime (80+)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Good (65-79)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-stone-600" />
              <span>Normal</span>
            </span>
          </div>
        </div>

        {/* Right Column: Full Day Tactical Breakdown for the Selected Date (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Selected Date Header Banner */}
          <div className="bg-[#121e1a] border border-[#274036] rounded-2xl p-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1f342c] pb-3">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>Target Date Forecast</span>
                  {isSelectedToday && (
                    <span className="bg-emerald-950 text-emerald-300 border border-emerald-700 text-[9px] px-1.5 py-0.2 rounded font-sans font-bold">
                      TODAY
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-stone-100 mt-0.5">
                  {formatDateHeading(selectedDate)}
                </h3>
              </div>

              {/* Day Score Badge */}
              <div className="flex items-center gap-2">
                <div
                  className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-mono ${
                    (mode === 'hunting' ? huntingScore : bassForecast.compositeBiteScore) >= 80
                      ? 'bg-amber-950/80 border-amber-600 text-amber-300'
                      : 'bg-emerald-950/80 border-emerald-600 text-emerald-300'
                  }`}
                >
                  <span className="text-[10px] uppercase font-sans text-stone-400">
                    {mode === 'hunting' ? 'Rut & Hunt:' : 'Bass Bite:'}
                  </span>
                  <span className="text-sm font-black">
                    {mode === 'hunting' ? huntingScore : bassForecast.compositeBiteScore} / 100
                  </span>
                </div>
              </div>
            </div>

            {/* Prominent Sunrise, Sunset & Legal Shooting Light Times */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3">
              <div className="p-2.5 rounded-xl bg-[#162520] border border-[#253e34]">
                <div className="flex items-center gap-1.5 text-stone-400 text-[10px] font-mono uppercase">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>Legal Dawn</span>
                </div>
                <div className="text-xs font-bold text-stone-100 mt-1 font-mono">{solar.dawn}</div>
                <div className="text-[9px] text-stone-400 mt-0.5">Shooting light starts</div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#162520] border border-[#253e34]">
                <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-mono uppercase font-bold">
                  <Sunrise className="w-3.5 h-3.5" />
                  <span>Sunrise</span>
                </div>
                <div className="text-xs font-bold text-amber-200 mt-1 font-mono">{solar.sunrise}</div>
                <div className="text-[9px] text-stone-400 mt-0.5">Sun breaks horizon</div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#162520] border border-[#253e34]">
                <div className="flex items-center gap-1.5 text-orange-400 text-[10px] font-mono uppercase font-bold">
                  <Sunset className="w-3.5 h-3.5" />
                  <span>Sunset</span>
                </div>
                <div className="text-xs font-bold text-orange-200 mt-1 font-mono">{solar.sunset}</div>
                <div className="text-[9px] text-stone-400 mt-0.5">Sun dips below tree line</div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#162520] border border-[#253e34]">
                <div className="flex items-center gap-1.5 text-stone-400 text-[10px] font-mono uppercase">
                  <Clock className="w-3 h-3 text-orange-400" />
                  <span>Legal Dusk</span>
                </div>
                <div className="text-xs font-bold text-stone-100 mt-1 font-mono">{solar.dusk}</div>
                <div className="text-[9px] text-stone-400 mt-0.5">Shooting light ends</div>
              </div>
            </div>
          </div>

          {/* Solunar Major & Minor Feeding Periods for this Date */}
          <div className="bg-[#121e1a] border border-[#274036] rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{solunar.moon.icon}</span>
                <div>
                  <h4 className="text-xs font-bold text-stone-100">
                    Solunar Astronomy • {solunar.moon.illumination}% {solunar.moon.phaseName}
                  </h4>
                  <div className="text-[10px] text-stone-400 font-mono">
                    Moonrise: {solunar.moonRise} • Moonset: {solunar.moonSet}
                  </div>
                </div>
              </div>

              <div className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-lg">
                Score: {solunar.overallSolunarScore}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-[#172721] border border-[#263e34]">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-300">⭐ Major Window 1</span>
                  <span className="font-mono text-[11px] text-stone-300">{solunar.majorPeriods[0]?.startTime} - {solunar.majorPeriods[0]?.endTime}</span>
                </div>
                <p className="text-[10px] text-stone-400 mt-1 leading-snug">
                  Peak lunar gravitational pull. Maximum buck cruising & bass aggressive ambush.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-[#172721] border border-[#263e34]">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-300">⭐ Major Window 2</span>
                  <span className="font-mono text-[11px] text-stone-300">{solunar.majorPeriods[1]?.startTime} - {solunar.majorPeriods[1]?.endTime}</span>
                </div>
                <p className="text-[10px] text-stone-400 mt-1 leading-snug">
                  Underfoot alignment. Secondary heavy movement window along food source staging.
                </p>
              </div>
            </div>
          </div>

          {/* Mode-Specific Forecast Details for Selected Date */}
          {mode === 'hunting' ? (
            /* HUNTING RUT & STAND TACTICS CARD */
            <div className="bg-[#121e1a] border border-[#274036] rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-950/80 text-amber-400 border border-amber-800/60">
                    <Crosshair className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-100">{rut.stage}</h4>
                    <p className="text-[10px] text-amber-300 font-mono">{rut.stageSubtitle}</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-mono text-stone-400">Daylight Movement</div>
                  <div className="text-xs font-mono font-bold text-amber-400">
                    {rut.buckDaylightMovementScore} / 100
                  </div>
                </div>
              </div>

              <p className="text-xs text-stone-300 leading-relaxed bg-[#162520] p-3 rounded-xl border border-[#253e34]">
                {rut.behaviorSummary}
              </p>

              {/* Best Stand Setups for this Date */}
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400 font-bold mb-1.5">
                  Optimal Stand Locations for {formatDateHeading(selectedDate)}:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {rut.bestStandSetups.map((setup, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-[#172721] border border-[#263e34] text-xs text-stone-200"
                    >
                      <div className="flex items-center gap-1.5 text-amber-400 font-bold mb-1">
                        <Flame className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Setup #{idx + 1}</span>
                      </div>
                      <p className="text-[11px] text-stone-300 leading-snug">{setup}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scent & Calling Strategy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-[#172721] border border-[#263e34]">
                  <span className="font-bold text-amber-300 text-[11px] block mb-0.5">
                    Recommended Scent Protocol:
                  </span>
                  <p className="text-[11px] text-stone-300">{rut.scentStrategy}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-[#172721] border border-[#263e34]">
                  <span className="font-bold text-emerald-300 text-[11px] block mb-0.5">
                    Calling Tactics:
                  </span>
                  <div className="text-[11px] text-stone-300">
                    {rut.callingTactics.map((c, i) => (
                      <div key={i} className="flex items-center justify-between text-[10px] mt-0.5">
                        <span className="font-medium text-stone-200">{c.tactic}</span>
                        <span className={`font-mono font-bold ${c.effectiveness === 'High' ? 'text-emerald-400' : 'text-stone-400'}`}>
                          {c.effectiveness}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* FISHING BASS PATTERN & LURE TACTICS CARD */
            <div className="bg-[#121e1a] border border-[#274036] rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                    <Fish className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-100">{bassForecast.seasonalBehavior}</h4>
                    <p className="text-[10px] text-emerald-300 font-mono">
                      Projected Water Temp: {estimatedWaterTemp}°F
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-mono text-stone-400">Peak Window</div>
                  <div className="text-xs font-mono font-bold text-emerald-400">
                    {bassForecast.peakBiteWindows[0] || 'Morning & Afternoon'}
                  </div>
                </div>
              </div>

              {/* Recommended Lures for that Date */}
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400 font-bold mb-1.5">
                  Top Recommended Lures for this Season & Date:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {bassForecast.lures.slice(0, 2).map((lure, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-[#172721] border border-[#263e34] text-xs text-stone-200 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-300">{lure.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded">
                          {lure.confidenceScore}% Confidence
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-300">
                        <span className="text-stone-400 font-mono">Color: </span>
                        {lure.recommendedColor} ({lure.recommendedSizeWeight})
                      </div>
                      <div className="text-[10px] text-stone-400 italic">
                        {lure.retrieveCadence}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Best Zones & Depths */}
              <div className="p-2.5 rounded-xl bg-[#172721] border border-[#263e34] text-xs space-y-1">
                <span className="font-bold text-cyan-300 text-[11px] block">
                  Target Depth & Structure:
                </span>
                <p className="text-[11px] text-stone-300">
                  Target depths of <span className="font-bold text-emerald-300">{bassForecast.depthFocus}</span>. {bassForecast.lures[0]?.whyItWorks}.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
