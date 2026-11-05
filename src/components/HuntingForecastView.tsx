import React from 'react';
import { HuntingForecast, RutForecast, SavedLocation, SolunarData, WeatherData } from '../types';
import { DaylightMovementCurve } from './DaylightMovementCurve';
import {
  Crosshair,
  Calendar,
  Moon,
  Clock,
  Compass,
  Wind,
  Gauge,
  Sparkles,
  Volume2,
  Shield,
  Layers,
  Thermometer,
  CloudSun,
  TrendingDown,
  TrendingUp,
  Minus,
  CheckCircle,
} from 'lucide-react';

interface HuntingForecastViewProps {
  location: SavedLocation;
  weather: WeatherData;
  solunar: SolunarData;
  rut: RutForecast;
  huntingScore: number;
  onOpenStandPlanner: () => void;
}

export const HuntingForecastView: React.FC<HuntingForecastViewProps> = ({
  location,
  weather,
  solunar,
  rut,
  huntingScore,
  onOpenStandPlanner,
}) => {
  // Pressure trend icon
  const getPressureIcon = () => {
    if (weather.pressureTrend === 'falling' || weather.pressureTrend === 'rapidly_falling') {
      return <TrendingDown className="w-4 h-4 text-emerald-400" />;
    }
    if (weather.pressureTrend === 'rising' || weather.pressureTrend === 'rapidly_rising') {
      return <TrendingUp className="w-4 h-4 text-amber-400" />;
    }
    return <Minus className="w-4 h-4 text-stone-400" />;
  };

  const rutPhases = [
    { name: 'Pre-Rut', range: 'Sept - Oct 20', active: rut.stage.includes('Pre-Rut') },
    { name: 'Seeking & Scraping', range: 'Oct 21 - Oct 31', active: rut.stage.includes('Seeking') },
    { name: 'The Chase', range: 'Nov 1 - Nov 10', active: rut.stage.includes('Chase') },
    { name: 'Peak Lockdown', range: 'Nov 11 - Nov 20', active: rut.stage.includes('Lockdown') },
    { name: 'Post-Rut', range: 'Nov 21 - Nov 30', active: rut.stage.includes('Post-Rut') },
    { name: 'Secondary Rut', range: 'Dec 1 - Dec 20', active: rut.stage.includes('Secondary') },
    { name: 'Late Season', range: 'Late Dec - Jan', active: rut.stage.includes('Late Season') },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Deer Movement & Rut Index Card */}
      <div className="bg-gradient-to-br from-[#17251e] via-[#121c18] to-[#0c1411] border border-[#263e34] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center relative z-10">
          {/* Main Score & Summary (8 cols) */}
          <div className="lg:col-span-8 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-bold flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5" />
                <span>Deer Movement & Rut Index</span>
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-700/60 font-mono">
                {location.state} Outfitter Rating • Active Phase: {rut.stage}
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-5xl sm:text-6xl font-black text-amber-400 tracking-tight font-mono">
                {huntingScore}
              </span>
              <span className="text-stone-400 text-sm font-semibold">/ 100</span>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                  huntingScore >= 85
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                    : huntingScore >= 70
                    ? 'bg-amber-950 text-amber-300 border border-amber-700'
                    : 'bg-stone-800 text-stone-300'
                }`}
              >
                {huntingScore >= 85
                  ? 'PRIME HUNTING WINDOW'
                  : huntingScore >= 70
                  ? 'FAVORABLE ACTIVITY'
                  : 'MODERATE FEEDING'}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-3xl">
              {huntingScore >= 85
                ? 'High daylight buck movement expected! Rut testosterone peak combined with favorable barometric pressure triggers widespread cruiser activity.'
                : 'Steady movement along primary bedding transitions. Midday and late afternoon sits highly recommended along security cover.'}
            </p>
          </div>

          {/* Sub-score Breakdown Tiles (4 cols) */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-2.5">
            <div className="bg-[#14201c] p-3 rounded-xl text-center border border-[#21352e]">
              <div className="text-[9px] uppercase font-mono text-stone-400">Rut Phase</div>
              <div className="text-sm font-bold text-amber-300 mt-0.5">{rut.rutActivityScore}%</div>
              <span className="text-[9px] text-stone-400 font-mono block mt-0.5 truncate">{rut.stage}</span>
            </div>
            <div className="bg-[#14201c] p-3 rounded-xl text-center border border-[#21352e]">
              <div className="text-[9px] uppercase font-mono text-stone-400">Solunar Peak</div>
              <div className="text-sm font-bold text-emerald-300 mt-0.5">{solunar.overallSolunarScore}%</div>
              <span className="text-[9px] text-stone-400 font-mono block mt-0.5 truncate">{solunar.moon.phaseName}</span>
            </div>
            <div className="bg-[#14201c] p-3 rounded-xl text-center border border-[#21352e]">
              <div className="text-[9px] uppercase font-mono text-stone-400">Barometer Shift</div>
              <div className="text-sm font-bold text-cyan-300 mt-0.5">
                {weather.pressureTrend === 'falling' || weather.pressureTrend === 'rapidly_falling'
                  ? '+15 Pts'
                  : weather.pressureTrend === 'rising'
                  ? '+5 Pts'
                  : 'Steady'}
              </div>
              <span className="text-[9px] text-stone-400 font-mono block mt-0.5 truncate">{weather.pressure.toFixed(2)} inHg</span>
            </div>
            <div className="bg-[#14201c] p-3 rounded-xl text-center border border-[#21352e]">
              <div className="text-[9px] uppercase font-mono text-stone-400">Thermal Wind</div>
              <div className="text-sm font-bold text-amber-400 mt-0.5">{weather.windSpeed} mph</div>
              <span className="text-[9px] text-stone-400 font-mono block mt-0.5">{weather.windCardinal} Flow</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Daylight Movement Curve & Hunting Probability - Right under Deer Movement & Rut Index */}
      <DaylightMovementCurve
        location={location}
        weather={weather}
        solunar={solunar}
        rut={rut}
        huntingScore={huntingScore}
        onOpenStandPlanner={onOpenStandPlanner}
      />

      {/* 3. Atmospheric Data (Weather & Barometric Trend) */}
      <div className="bg-[#111a17] border border-[#233830] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between space-y-4">
        <div className="flex flex-wrap items-center justify-between border-b border-[#233830] pb-3 gap-2">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Atmospheric Data</span>
            <h4 className="text-sm sm:text-base font-bold text-stone-100 flex items-center gap-1.5 mt-0.5">
              <CloudSun className="w-4 h-4 text-emerald-400" />
              <span>{location.name} Weather & Barometric Trend</span>
            </h4>
          </div>

          <div className="flex items-center gap-1.5 bg-[#172520] px-3 py-1.5 rounded-xl border border-[#294238] text-xs">
            {getPressureIcon()}
            <span className="font-mono font-semibold text-stone-200">
              {weather.pressure.toFixed(2)} inHg ({weather.pressureTrendText})
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-2">
          <div className="bg-[#15231e] p-3 rounded-xl border border-[#263e34]">
            <span className="text-[10px] text-stone-400 block font-mono uppercase">Temperature</span>
            <span className="text-xl font-bold text-stone-100">{weather.temp}°F</span>
            <span className="text-[10px] text-stone-400 block mt-0.5">Feels: {weather.feelsLike}°F</span>
          </div>

          <div className="bg-[#15231e] p-3 rounded-xl border border-[#263e34]">
            <span className="text-[10px] text-stone-400 block font-mono uppercase">Wind Velocity</span>
            <span className="text-xl font-bold text-amber-300">{weather.windSpeed} mph</span>
            <span className="text-[10px] text-stone-400 block mt-0.5">Gusts: {weather.windGusts} mph</span>
          </div>

          <div className="bg-[#15231e] p-3 rounded-xl border border-[#263e34]">
            <span className="text-[10px] text-stone-400 block font-mono uppercase">Wind Direction</span>
            <span className="text-xl font-bold text-stone-100">{weather.windCardinal}</span>
            <span className="text-[10px] text-stone-400 block mt-0.5">{weather.windDirection}° Bearing</span>
          </div>

          <div className="bg-[#15231e] p-3 rounded-xl border border-[#263e34]">
            <span className="text-[10px] text-stone-400 block font-mono uppercase">Humidity & Sky</span>
            <span className="text-xl font-bold text-stone-100">{weather.humidity}%</span>
            <span className="text-[10px] text-stone-400 block mt-0.5 truncate">{weather.conditionName}</span>
          </div>
        </div>

        <div className="bg-[#16231e] p-3 rounded-xl border border-[#263e34] flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-stone-300 flex items-center gap-2">
            <span>🌅 Sunrise: <strong className="text-amber-200">{weather.sunrise}</strong></span>
            <span>•</span>
            <span>🌇 Sunset: <strong className="text-amber-200">{weather.sunset}</strong></span>
          </span>
          <button
            onClick={onOpenStandPlanner}
            className="px-3 py-1.5 bg-amber-700 hover:bg-amber-600 active:bg-amber-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Check Stand Wind Cone</span>
          </button>
        </div>
      </div>

      {/* Michigan Specific Outfitter Card (for LeRoy MI, Rosebush MI, Tustin MI) */}
      {location.state === 'MI' && (
        <div className="bg-gradient-to-r from-amber-950/70 via-[#182620] to-[#111e19] border border-amber-600/50 rounded-2xl p-4 sm:p-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#2d4439] pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🌲</span>
              <div>
                <h4 className="text-sm font-bold text-amber-200">
                  {location.name}, MI Whitetail Tactical Intelligence
                </h4>
                <p className="text-[10px] text-stone-400 font-mono">
                  Osceola & Central Lower Peninsula Michigan Habitat Guide
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-900/60 text-amber-300 border border-amber-600/40">
              Nov 15 Opener Grounded
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-[#121f1a] p-3 rounded-xl border border-[#23382f]">
              <strong className="text-amber-300 font-mono text-[11px] block mb-1">
                {location.name === 'LeRoy'
                  ? 'Cedar Swamp Sanctuaries'
                  : location.name === 'Rosebush'
                  ? 'Ag Field Corners & Drainage Ditches'
                  : 'Tag Alder & Red Pine Chokes'}
              </strong>
              <p className="text-stone-300 text-[11px] leading-relaxed">
                {location.name === 'LeRoy'
                  ? 'Mature Osceola County bucks bed deep in wet cedar swamps. Catch them on dry knolls and hardwood edges 45 minutes before dark.'
                  : location.name === 'Rosebush'
                  ? 'Central MI agricultural deer thrive on picked corn/soybean stubble. Set up 75 yards back in timber along ditch crossings.'
                  : 'Glacial ridges and tag alder bogs funnel cruiser bucks between high moraines and low thermal cover.'}
              </p>
            </div>

            <div className="bg-[#121f1a] p-3 rounded-xl border border-[#23382f]">
              <strong className="text-emerald-400 font-mono text-[11px] block mb-1">
                Michigan Season Timing
              </strong>
              <p className="text-stone-300 text-[11px] leading-relaxed">
                Nov 1 - Nov 14 is the archery golden hour (all-day chasing). When the Nov 15 firearms opener arrives, shift stands to escape routes leading into the thickest swamp sanctuaries.
              </p>
            </div>

            <div className="bg-[#121f1a] p-3 rounded-xl border border-[#23382f]">
              <strong className="text-cyan-400 font-mono text-[11px] block mb-1">
                Thermal Wind Strategy
              </strong>
              <p className="text-stone-300 text-[11px] leading-relaxed">
                Prevailing {weather.windCardinal} {weather.windSpeed} mph wind: Keep downwind of low swamp bedding. Thermals fall into low creek bottoms around sunset.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Whitetail Rut Phase Progression Tracker */}
      <div className="bg-[#111a17] border border-[#233830] rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#233830] pb-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-sm text-stone-100">Whitetail Rut Progression & Timing</h3>
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Regionally adjusted for latitude {location.lat.toFixed(1)}°N. Photoperiod and testosterone behavior curves.
            </p>
          </div>

          <div className="bg-amber-950/70 border border-amber-700/60 px-3 py-1 rounded-xl text-xs font-bold text-amber-300">
            Active Phase: {rut.stage}
          </div>
        </div>

        {/* Horizontal Timeline of Rut Phases */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {rutPhases.map((phase, idx) => (
            <div
              key={phase.name}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                phase.active
                  ? 'bg-amber-900/40 border-amber-500 shadow-md ring-1 ring-amber-400/40'
                  : 'bg-[#14201c] border-[#22352e] opacity-75'
              }`}
            >
              <span className="text-[10px] font-mono text-stone-400 block">Stage {idx + 1}</span>
              <div className={`text-xs font-bold mt-0.5 ${phase.active ? 'text-amber-300' : 'text-stone-300'}`}>
                {phase.name}
              </div>
              <span className="text-[9px] text-stone-400 block mt-0.5">{phase.range}</span>
              {phase.active && (
                <span className="inline-block mt-1.5 text-[8px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500 text-stone-950 font-black">
                  CURRENT
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Tactical Breakdown of the Current Rut Phase */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-[#233830]">
          <div className="bg-[#15231e] p-3.5 rounded-xl border border-[#273d34] space-y-1.5">
            <span className="text-[10px] font-mono uppercase text-amber-400 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Behavioral Dynamics</span>
            </span>
            <p className="text-xs text-stone-300 leading-relaxed">{rut.behaviorSummary}</p>
          </div>

          <div className="bg-[#15231e] p-3.5 rounded-xl border border-[#273d34] space-y-1.5">
            <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              <span>Scent & Mock Scrapes</span>
            </span>
            <p className="text-xs text-stone-300 leading-relaxed">{rut.scentStrategy}</p>
          </div>

          <div className="bg-[#15231e] p-3.5 rounded-xl border border-[#273d34] space-y-1.5">
            <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              <span>Premier Terrain Funnels</span>
            </span>
            <ul className="text-xs text-stone-300 space-y-1">
              {rut.bestStandSetups.map((setup, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span>{setup}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Calling & Vocalization Tactics */}
        <div className="mt-4 pt-4 border-t border-[#233830]">
          <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5 mb-2.5">
            <Volume2 className="w-4 h-4" />
            <span>Recommended Calling & Vocalization Tactics for Right Now</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {rut.callingTactics.map((call, i) => (
              <div key={i} className="bg-[#14201c] p-3 rounded-xl border border-[#243932] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-stone-100">{call.tactic}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                      call.effectiveness === 'High'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                        : call.effectiveness === 'Medium'
                        ? 'bg-amber-950 text-amber-300 border border-amber-700'
                        : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    {call.effectiveness} Impact
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 leading-relaxed">{call.notes}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Moon Phase & Solunar Feeding Periods */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Moon Phase Details (4 cols) */}
        <div className="lg:col-span-4 bg-[#111a17] border border-[#233830] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#233830] pb-2.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Lunar Almanac</span>
              <span className="text-[10px] font-mono text-emerald-400">{solunar.moon.isWaxing ? 'Waxing' : 'Waning'}</span>
            </div>

            <div className="text-center my-4">
              <span className="text-5xl block select-none drop-shadow-md">{solunar.moon.icon}</span>
              <h4 className="font-bold text-sm text-stone-100 mt-2">{solunar.moon.phaseName}</h4>
              <p className="text-xs text-stone-400 font-mono mt-0.5">
                {solunar.moon.illumination}% Illumination • {solunar.moon.phaseAngle}° Angle
              </p>
            </div>
          </div>

          <div className="space-y-1.5 bg-[#14201c] p-3 rounded-xl border border-[#233830] text-xs">
            <div className="flex justify-between text-stone-300">
              <span className="text-stone-400">Moon Overhead:</span>
              <span className="font-mono font-bold text-emerald-400">{solunar.moonOverhead}</span>
            </div>
            <div className="flex justify-between text-stone-300">
              <span className="text-stone-400">Moon Underfoot:</span>
              <span className="font-mono font-bold text-emerald-400">{solunar.moonUnderfoot}</span>
            </div>
            <div className="flex justify-between text-stone-300">
              <span className="text-stone-400">Moonrise:</span>
              <span className="font-mono text-stone-200">{solunar.moonRise}</span>
            </div>
            <div className="flex justify-between text-stone-300">
              <span className="text-stone-400">Moonset:</span>
              <span className="font-mono text-stone-200">{solunar.moonSet}</span>
            </div>
          </div>
        </div>

        {/* Solunar Major & Minor Action Windows (8 cols) */}
        <div className="lg:col-span-8 bg-[#111a17] border border-[#233830] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[#233830] pb-2.5 mb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">John Alden Knight Tables</span>
              <h4 className="font-bold text-sm text-stone-100 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Peak Solunar Feeding & Movement Windows</span>
              </h4>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-emerald-400">{solunar.overallSolunarScore}/100</span>
              <span className="text-[9px] block text-stone-400">Gravitational Pull</span>
            </div>
          </div>

          <div className="space-y-3">
            {/* Major Periods */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                ⭐ Major Periods (Highest Movement Intensity ~2 hrs)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {solunar.majorPeriods.map((period, idx) => (
                  <div key={idx} className="bg-[#15231e] p-3 rounded-xl border border-emerald-900/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-stone-100">{period.name}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-900/60 text-emerald-300 font-mono">
                        {period.intensity.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs font-mono font-bold text-emerald-300">
                      {period.startTime} - {period.endTime}
                    </div>
                    <p className="text-[10px] text-stone-400 leading-tight">{period.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Minor Periods */}
            <div className="space-y-2 pt-2 border-t border-[#233830]">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold block">
                ⚡ Minor Periods (Spikes Around Moonrise & Moonset ~1 hr)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {solunar.minorPeriods.map((period, idx) => (
                  <div key={idx} className="bg-[#14201c] p-2.5 rounded-xl border border-[#22352e] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-stone-200">{period.name}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 font-mono">
                        MODERATE
                      </span>
                    </div>
                    <div className="text-xs font-mono font-bold text-amber-300">
                      {period.startTime} - {period.endTime}
                    </div>
                    <p className="text-[10px] text-stone-400 leading-tight">{period.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
