import React, { useMemo } from 'react';
import { WeatherData, SolunarData, RutForecast, SavedLocation } from '../types';
import { Clock, Sparkles, Sunrise, Sunset, Compass } from 'lucide-react';

interface DaylightMovementCurveProps {
  location: SavedLocation;
  weather: WeatherData;
  solunar: SolunarData;
  rut: RutForecast;
  huntingScore: number;
  onOpenStandPlanner?: () => void;
}

// Helper to parse time strings like "7:08 AM" or "6:35 PM" into minutes from midnight
function parseTimeToMinutes(timeStr?: string, defaultHour = 7, defaultMin = 0): number {
  if (!timeStr) return defaultHour * 60 + defaultMin;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return defaultHour * 60 + defaultMin;

  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const period = match[3]?.toUpperCase();

  if (period === 'PM' && h < 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;

  return h * 60 + m;
}

// Helper to format minutes from midnight into 12-hour AM/PM string
function formatMinutesToTime(minutes: number): string {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const h24 = Math.floor(normalized / 60);
  const m = normalized % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
  return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
}

export const DaylightMovementCurve: React.FC<DaylightMovementCurveProps> = ({
  location,
  weather,
  solunar,
  rut,
  huntingScore,
  onOpenStandPlanner,
}) => {
  // Astronomical Sunrise & Sunset times in minutes from midnight
  const sunriseMinutes = useMemo(
    () => parseTimeToMinutes(weather.sunrise, 7, 8),
    [weather.sunrise]
  );
  const sunsetMinutes = useMemo(
    () => parseTimeToMinutes(weather.sunset, 18, 35),
    [weather.sunset]
  );

  // Parse Solunar major/minor periods into minutes ranges to detect daylight overlaps
  const solunarWindows = useMemo(() => {
    const list: { name: string; start: number; end: number; type: 'major' | 'minor' }[] = [];

    solunar.majorPeriods.forEach((p) => {
      const s = parseTimeToMinutes(p.startTime, 6, 0);
      const e = parseTimeToMinutes(p.endTime, 8, 0);
      list.push({ name: p.name, start: s, end: e, type: 'major' });
    });

    solunar.minorPeriods.forEach((p) => {
      const s = parseTimeToMinutes(p.startTime, 12, 0);
      const e = parseTimeToMinutes(p.endTime, 13, 0);
      list.push({ name: p.name, start: s, end: e, type: 'minor' });
    });

    return list;
  }, [solunar.majorPeriods, solunar.minorPeriods]);

  // Check if a given time interval [startMin, endMin] overlaps with any Solunar period
  const getSolunarOverlap = (startMin: number, endMin: number) => {
    return solunarWindows.find((sw) => {
      return Math.max(startMin, sw.start) <= Math.min(endMin, sw.end);
    });
  };

  // Rut multiplier for midday movement
  const isRutPeak =
    rut.stage.includes('Chase') ||
    rut.stage.includes('Seeking') ||
    rut.stage.includes('Lockdown') ||
    rut.stage.includes('Secondary');

  // Overlap checks for key daylight intervals
  const morningOverlap = getSolunarOverlap(sunriseMinutes - 45, sunriseMinutes + 120);
  const middayOverlap = getSolunarOverlap(11 * 60 + 15, 14 * 60);
  const eveningOverlap = getSolunarOverlap(sunsetMinutes - 120, sunsetMinutes + 30);

  // Current local hour to highlight current slot if viewing today
  const now = new Date();
  const currentHour = now.getHours();
  const isViewingToday = !weather.isCustomDateForecast;

  // Generate hourly daylight movement curve points (from 5 AM to 8 PM)
  const daylightMovementCurve = useMemo(() => {
    const points = [];
    const baseMorningScore = Math.min(
      99,
      84 +
        (weather.pressureTrend === 'falling' || weather.pressureTrend === 'rapidly_falling' ? 7 : 0) +
        (weather.temp <= 45 ? 5 : 0) +
        (morningOverlap ? 10 : 0)
    );

    const baseMiddayScore = Math.min(
      96,
      (isRutPeak ? 82 : 64) +
        (middayOverlap ? 14 : 0) +
        (weather.pressureTrend === 'falling' || weather.pressureTrend === 'rapidly_falling' ? 6 : 0)
    );

    const baseEveningScore = Math.min(
      99,
      88 +
        (weather.pressureTrend === 'falling' || weather.pressureTrend === 'rapidly_falling' ? 7 : 0) +
        (weather.windSpeed <= 12 ? 5 : 0) +
        (eveningOverlap ? 9 : 0)
    );

    for (let h = 5; h <= 20; h++) {
      const label = h === 12 ? '12 PM' : h < 12 ? `${h} AM` : `${h - 12} PM`;
      const minVal = h * 60;

      // Base activity baseline
      let activity = 42;

      // Morning peak around sunrise (dawn through mid-morning)
      const morningDist = Math.abs(minVal - (sunriseMinutes + 15));
      if (morningDist <= 120) {
        activity = Math.max(activity, Math.round(baseMorningScore - (morningDist / 120) * 16));
      }

      // Midday cruiser peak around 12:30 PM (750 min)
      const middayDist = Math.abs(minVal - 750);
      if (middayDist <= 100) {
        activity = Math.max(activity, Math.round(baseMiddayScore - (middayDist / 100) * 18));
      }

      // Evening peak around 45 min before sunset
      const eveningDist = Math.abs(minVal - (sunsetMinutes - 45));
      if (eveningDist <= 120) {
        activity = Math.max(activity, Math.round(baseEveningScore - (eveningDist / 120) * 14));
      }

      // Color tier
      const color =
        activity >= 85
          ? 'bg-gradient-to-t from-emerald-600 to-emerald-400'
          : activity >= 75
          ? 'bg-gradient-to-t from-amber-500 to-amber-300'
          : activity >= 60
          ? 'bg-gradient-to-t from-yellow-700 to-yellow-500'
          : 'bg-stone-700';

      const isCurrent = isViewingToday && h === currentHour;

      points.push({
        hour: h,
        label,
        activity,
        color,
        isCurrent,
        isPeak: activity >= 88,
      });
    }
    return points;
  }, [
    sunriseMinutes,
    sunsetMinutes,
    weather.pressureTrend,
    weather.temp,
    weather.windSpeed,
    isRutPeak,
    morningOverlap,
    middayOverlap,
    eveningOverlap,
    isViewingToday,
    currentHour,
  ]);

  return (
    <div className="bg-[#111a17] border border-[#233830] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl relative overflow-hidden space-y-4">
      {/* Top Header & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#233830] pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-lg bg-emerald-950 border border-emerald-700/80 p-0.5 flex items-center justify-center shadow-inner">
              <img
                src="./assets/aistudio/prbuck_6f2dde9d.png"
                alt="Buck icon"
                className="w-full h-full object-contain"
              />
            </span>
            <h3 className="text-sm sm:text-base font-bold text-stone-100 flex items-center gap-1.5">
              <span>Daylight Movement Curve & Hunting Probability</span>
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
              Hourly Solunar & Rut Forecast
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-0.5">
            Hourly whitetail movement intensity from dawn to dusk ({weather.sunrise} &ndash; {weather.sunset}) synchronized with rut activity and solunar gravitational pull.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px] font-mono text-stone-300 bg-[#14221d] px-3 py-1.5 rounded-xl border border-[#263e34]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 shadow-sm" />
            <span className="font-semibold text-emerald-300">Prime (85%+)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 shadow-sm" />
            <span className="font-semibold text-amber-300">Favorable (75-84%)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-yellow-500 shadow-sm" />
            <span className="text-stone-400">Moderate (&lt;75%)</span>
          </span>
        </div>
      </div>

      {/* Visual Movement Curve Bar Strip */}
      <div className="pt-2">
        <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5 sm:gap-2">
          {daylightMovementCurve.map((pt) => (
            <div
              key={pt.hour}
              className={`flex flex-col items-center gap-1 p-1 sm:p-1.5 rounded-xl transition-all ${
                pt.isCurrent
                  ? 'bg-emerald-950/70 border border-emerald-500 ring-1 ring-emerald-400/50 shadow-lg'
                  : 'bg-[#14201c] border border-[#21352e]'
              }`}
            >
              {/* Activity Percentage */}
              <span
                className={`text-[10px] sm:text-[11px] font-mono font-bold leading-none ${
                  pt.activity >= 85
                    ? 'text-emerald-400'
                    : pt.activity >= 75
                    ? 'text-amber-300'
                    : 'text-stone-300'
                }`}
              >
                {pt.activity}%
              </span>

              {/* Bar */}
              <div className="w-full h-16 sm:h-20 bg-[#1a2a24] rounded-lg p-0.5 flex flex-col justify-end overflow-hidden">
                <div
                  className={`w-full rounded-md shadow-sm transition-all duration-500 ${pt.color}`}
                  style={{ height: `${Math.max(16, (pt.activity / 100) * 100)}%` }}
                  title={`${pt.label}: ${pt.activity}% whitetail movement probability`}
                />
              </div>

              {/* Hour Label */}
              <span
                className={`text-[9px] sm:text-[10px] font-mono whitespace-nowrap leading-tight ${
                  pt.isCurrent ? 'text-emerald-300 font-bold' : 'text-stone-400'
                }`}
              >
                {pt.isCurrent ? 'Now' : pt.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Summary Callout of Peak Daylight Windows */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 text-xs border-t border-[#233830]">
        <div className="bg-[#14221d] p-2.5 rounded-xl border border-[#253c32] flex items-center gap-2.5">
          <Sunrise className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-mono text-stone-400 block">Dawn Prime Peak</span>
            <span className="font-mono font-bold text-stone-200 truncate block">
              {formatMinutesToTime(sunriseMinutes - 15)} &ndash; {formatMinutesToTime(sunriseMinutes + 90)}
            </span>
          </div>
        </div>

        <div className="bg-[#14221d] p-2.5 rounded-xl border border-[#253c32] flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-mono text-stone-400 block">Midday Cruiser Spike</span>
            <span className="font-mono font-bold text-stone-200 truncate block">
              11:45 AM &ndash; 1:15 PM {isRutPeak ? '(Rut Active)' : ''}
            </span>
          </div>
        </div>

        <div className="bg-[#14221d] p-2.5 rounded-xl border border-[#253c32] flex items-center gap-2.5">
          <Sunset className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-mono text-stone-400 block">Dusk Golden Staging</span>
            <span className="font-mono font-bold text-stone-200 truncate block">
              {formatMinutesToTime(sunsetMinutes - 90)} &ndash; {formatMinutesToTime(sunsetMinutes)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
