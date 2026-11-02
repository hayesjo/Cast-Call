import React from 'react';
import { BassForecast, BassLure, SavedLocation, SolunarData, WeatherData } from '../types';
import {
  Fish,
  Droplets,
  Sun,
  Eye,
  Wind,
  Layers,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Minus,
  CheckCircle2,
  Compass,
  Sliders,
  Anchor,
  HelpCircle,
  Clock,
} from 'lucide-react';

interface FishingForecastViewProps {
  location: SavedLocation;
  weather: WeatherData;
  solunar: SolunarData;
  bassForecast: BassForecast;
  onUpdateConditions: (updates: {
    waterTemp?: number;
    waterClarity?: 'crystal_clear' | 'stained' | 'muddy';
    lightCondition?: 'bright_sun' | 'partly_cloudy' | 'overcast' | 'low_light';
    forageActive?: 'threadfin_shad' | 'bluegill' | 'crawfish' | 'perch';
  }) => void;
  onOpenLakeMap: () => void;
}

export const FishingForecastView: React.FC<FishingForecastViewProps> = ({
  location,
  weather,
  solunar,
  bassForecast,
  onUpdateConditions,
  onOpenLakeMap,
}) => {
  const [selectedLureCategory, setSelectedLureCategory] = React.useState<string>('all');

  const filteredLures =
    selectedLureCategory === 'all'
      ? bassForecast.lures
      : bassForecast.lures.filter((l) => l.category === selectedLureCategory);

  const getPressureStatus = () => {
    if (weather.pressureTrend === 'falling' || weather.pressureTrend === 'rapidly_falling') {
      return {
        text: 'Rapidly Falling (Pre-Front Feeding Frenzy!)',
        color: 'text-emerald-400',
        bg: 'bg-emerald-950/80 border-emerald-700',
        icon: <TrendingDown className="w-4 h-4 text-emerald-400" />,
        impact: 'Bass feeding aggressively in water column before incoming cold front. Throw fast moving baits!',
      };
    }
    if (weather.pressureTrend === 'rising' || weather.pressureTrend === 'rapidly_rising') {
      return {
        text: 'Rising / High Pressure (Post-Front Bluebird)',
        color: 'text-amber-400',
        bg: 'bg-amber-950/80 border-amber-700',
        icon: <TrendingUp className="w-4 h-4 text-amber-400" />,
        impact: 'Bass suck tight to dense cover (docks, root mats, brush). Downsize to finesse and dead-stick slow baits.',
      };
    }
    return {
      text: 'Steady Barometer (Stable Patterns)',
      color: 'text-cyan-400',
      bg: 'bg-cyan-950/80 border-cyan-700',
      icon: <Minus className="w-4 h-4 text-cyan-400" />,
      impact: 'Fish holding to regular seasonal structures and ambush points.',
    };
  };

  const pressureInfo = getPressureStatus();

  return (
    <div className="space-y-6">
      {/* Top Banner: Composite Bass Bite Rating & Quick Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Overall Bite Score Card (5 cols) */}
        <div className="md:col-span-5 bg-gradient-to-br from-[#122822] via-[#0f201b] to-[#0a1613] border border-[#234237] rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -top-10 -right-10 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1.5">
                <Fish className="w-4 h-4" />
                <span>Bass Predatory Feeding Index</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-mono">
                {location.name}
              </span>
            </div>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-5xl font-black text-emerald-400 tracking-tight font-mono">
                {bassForecast.compositeBiteScore}
              </span>
              <span className="text-stone-400 text-sm font-semibold">/ 100</span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                  bassForecast.compositeBiteScore >= 85
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                    : bassForecast.compositeBiteScore >= 70
                    ? 'bg-teal-950 text-teal-300 border border-teal-700'
                    : 'bg-amber-950 text-amber-300 border border-amber-700'
                }`}
              >
                {bassForecast.compositeBiteScore >= 85
                  ? 'AGGRESSIVE BITE'
                  : bassForecast.compositeBiteScore >= 70
                  ? 'CONSISTENT ACTION'
                  : 'FINESSE / SLOW'}
              </span>
            </div>

            <p className="text-xs text-stone-300 mt-2 leading-relaxed">
              {bassForecast.seasonalBehavior}
            </p>
          </div>

          <div className="space-y-2 pt-4 mt-4 border-t border-[#1f3a31]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-400">Seasonal Target Depth:</span>
              <span className="font-mono font-bold text-emerald-300">{bassForecast.depthFocus}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-400">Thermocline / Oxygen:</span>
              <span className="text-stone-300 text-[11px] truncate max-w-[200px]" title={bassForecast.thermoclineInsight}>
                {bassForecast.thermoclineInsight}
              </span>
            </div>
          </div>
        </div>

        {/* Live Barometric Pressure & Weather Analysis (7 cols) */}
        <div className="md:col-span-7 bg-[#111a17] border border-[#233830] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[#233830] pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Atmospheric Barometer</span>
              <h4 className="text-sm font-bold text-stone-100 flex items-center gap-1.5 mt-0.5">
                {pressureInfo.icon}
                <span className={pressureInfo.color}>{pressureInfo.text}</span>
              </h4>
            </div>

            <div className="text-right">
              <span className="text-base font-mono font-black text-stone-100">{weather.pressure.toFixed(2)} inHg</span>
              <span className="text-[10px] text-stone-400 block font-mono">{weather.pressureTrendText}</span>
            </div>
          </div>

          <div className="my-3 bg-[#15231e] p-3 rounded-xl border border-[#263e34] text-xs text-stone-200 leading-relaxed">
            <span className="text-emerald-400 font-semibold font-mono text-[10px] uppercase block mb-0.5">
              Barometric Bite Impact:
            </span>
            {pressureInfo.impact}
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-[#14201c] p-2.5 rounded-xl border border-[#233830]">
              <span className="text-[10px] text-stone-400 block">Air Temp & Sky</span>
              <span className="font-bold text-stone-200">{weather.temp}°F • {weather.conditionName}</span>
            </div>

            <div className="bg-[#14201c] p-2.5 rounded-xl border border-[#233830]">
              <span className="text-[10px] text-stone-400 block">Wind Current</span>
              <span className="font-bold text-emerald-300">{weather.windSpeed} mph {weather.windCardinal}</span>
            </div>

            <div className="bg-[#14201c] p-2.5 rounded-xl border border-[#233830]">
              <span className="text-[10px] text-stone-400 block">Solunar Rating</span>
              <span className="font-bold text-cyan-300">{solunar.overallSolunarScore}/100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Michigan Lake Regional Intelligence Banner (Lake Mitchell, Rose Lake, East Bay, Skegemog) */}
      {location.state === 'MI' && (
        <div className="bg-gradient-to-r from-emerald-950/70 via-[#13241e] to-[#0f1b16] border border-emerald-600/50 rounded-2xl p-4 sm:p-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#243f34] pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🐟</span>
              <div>
                <h4 className="text-sm font-bold text-emerald-200">
                  {location.name} Tactical Guide & Local Patterns
                </h4>
                <p className="text-[10px] text-stone-400 font-mono">
                  Northern Michigan Glacial Waters & Chain of Lakes Intelligence
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-600/40">
              Michigan Verified
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-[#101e18] p-3 rounded-xl border border-[#1f372c]">
              <strong className="text-emerald-300 font-mono text-[11px] block mb-1">
                Primary Habitat Structure
              </strong>
              <p className="text-stone-300 text-[11px] leading-relaxed">
                {location.name.includes('Mitchell')
                  ? 'Expansive cabbage weedbeds and Clam River canal current. Work the clean outer cabbage transitions and Blind Island bulrushes.'
                  : location.name.includes('Rose')
                  ? 'Natural spring-fed Osceola lake. Focus on the steep weedline shelf where 6ft flats drop into 20+ ft cold basin.'
                  : location.name.includes('East Bay')
                  ? 'Gin-clear Grand Traverse Bay waters. Target deep glacial limestone reefs, 18-35 ft drop-offs, and Old Mission point.'
                  : 'Extensive old-growth submerged stump fields and Torch River channel inflow. Wood-contact presentations dominate.'}
              </p>
            </div>

            <div className="bg-[#101e18] p-3 rounded-xl border border-[#1f372c]">
              <strong className="text-cyan-400 font-mono text-[11px] block mb-1">
                Water Clarity & Tackle Match
              </strong>
              <p className="text-stone-300 text-[11px] leading-relaxed">
                {location.name.includes('East Bay') || location.name.includes('Skegemog')
                  ? 'Crystal clear visibility requires 6-8 lb fluorocarbon leaders, natural translucent gobies/shad imitations, and long casts.'
                  : 'Stained to clear cabbage water: Green pumpkin, white/chartreuse swim jigs, and 14-17 lb fluorocarbon.'}
              </p>
            </div>

            <div className="bg-[#101e18] p-3 rounded-xl border border-[#1f372c]">
              <strong className="text-amber-400 font-mono text-[11px] block mb-1">
                Current & Wind Ambush
              </strong>
              <p className="text-stone-300 text-[11px] leading-relaxed">
                {weather.windSpeed} mph {weather.windCardinal} wind creates baitfish mudlines against windward shores and sharp current seams. Position boat off the deep side and cast shallow.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Lake Conditions Calibration & Tuning Matrix */}
      <div className="bg-[#111a17] border border-[#233830] rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#233830] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm text-stone-100">Live Lake Parameters & Water Calibration</h3>
              <p className="text-[11px] text-stone-400">
                Adjust water clarity, temp, or light to immediately recalibrate lure recommendations and tactical depths.
              </p>
            </div>
          </div>

          <span className="text-[10px] font-mono uppercase bg-[#182823] px-2.5 py-1 rounded-lg text-emerald-300 border border-emerald-700/50">
            Real-Time Tactical Sync
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Water Temperature Calibration */}
          <div className="bg-[#15231e] p-3.5 rounded-xl border border-[#273d34] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-200 flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                <span>Water Temp (°F)</span>
              </span>
              <span className="font-mono font-black text-cyan-300 text-sm">{bassForecast.waterTemp}°F</span>
            </div>

            <input
              type="range"
              min="42"
              max="88"
              value={bassForecast.waterTemp}
              onChange={(e) => onUpdateConditions({ waterTemp: parseInt(e.target.value, 10) })}
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-[#0f1916] rounded-lg"
            />

            <div className="flex justify-between text-[10px] text-stone-400 font-mono">
              <span>42°F (Winter)</span>
              <span>65°F (Ideal)</span>
              <span>88°F (Summer)</span>
            </div>
          </div>

          {/* Water Clarity Selector */}
          <div className="bg-[#15231e] p-3.5 rounded-xl border border-[#273d34] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-200 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>Water Clarity</span>
              </span>
              <span className="text-[10px] font-mono text-stone-400 uppercase">
                {bassForecast.waterClarity.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1">
              {[
                { id: 'crystal_clear', label: 'Clear (>5ft)' },
                { id: 'stained', label: 'Stained (2-4ft)' },
                { id: 'muddy', label: 'Muddy (<1ft)' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => onUpdateConditions({ waterClarity: c.id as any })}
                  className={`py-1.5 px-1 rounded-lg text-[10px] font-semibold border transition-all text-center ${
                    bassForecast.waterClarity === c.id
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                      : 'bg-[#182722] text-stone-400 border-[#2b443a] hover:text-stone-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-stone-400 leading-tight">
              {bassForecast.waterClarity === 'muddy'
                ? 'High vibration & dark silhouettes (Black/Blue, Chartreuse) required.'
                : bassForecast.waterClarity === 'crystal_clear'
                ? 'Natural translucent colors and long fluorocarbon leaders essential.'
                : 'Balanced presentation: Green pumpkin and white/chartreuse.'}
            </p>
          </div>

          {/* Light Penetration Selector */}
          <div className="bg-[#15231e] p-3.5 rounded-xl border border-[#273d34] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-200 flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Light Conditions</span>
              </span>
              <span className="text-[10px] font-mono text-stone-400 uppercase">
                {bassForecast.lightCondition.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1">
              {[
                { id: 'bright_sun', label: '☀️ High Sun' },
                { id: 'partly_cloudy', label: '⛅ Partly Sun' },
                { id: 'overcast', label: '☁️ Overcast' },
                { id: 'low_light', label: '🌅 Dawn/Dusk' },
              ].map((l) => (
                <button
                  key={l.id}
                  onClick={() => onUpdateConditions({ lightCondition: l.id as any })}
                  className={`py-1 px-1 rounded-lg text-[10px] font-semibold border transition-all text-center ${
                    bassForecast.lightCondition === l.id
                      ? 'bg-amber-600 text-white border-amber-400 shadow-sm'
                      : 'bg-[#182722] text-stone-400 border-[#2b443a] hover:text-stone-200'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-stone-400 leading-tight">
              {bassForecast.lightCondition === 'bright_sun'
                ? 'High sun drives bass directly into shadow pockets and thick weed roots.'
                : 'Overcast skies spark roaming wolfpacks chasing baitfish in open water.'}
            </p>
          </div>

          {/* Primary Forage Match */}
          <div className="bg-[#15231e] p-3.5 rounded-xl border border-[#273d34] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-rose-400" />
                <span>Primary Forage</span>
              </span>
              <span className="text-[10px] font-mono text-stone-400 uppercase">
                {bassForecast.forageActive.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1">
              {[
                { id: 'threadfin_shad', label: '🐟 Shad' },
                { id: 'bluegill', label: '🐠 Bluegill' },
                { id: 'crawfish', label: '🦞 Crawfish' },
                { id: 'perch', label: '🟡 Perch' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => onUpdateConditions({ forageActive: f.id as any })}
                  className={`py-1 px-1 rounded-lg text-[10px] font-semibold border transition-all text-center ${
                    bassForecast.forageActive === f.id
                      ? 'bg-rose-700 text-white border-rose-500 shadow-sm'
                      : 'bg-[#182722] text-stone-400 border-[#2b443a] hover:text-stone-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-stone-400 leading-tight">
              Lure profiles tuned to mimic length, flash, and darting movements of selected forage.
            </p>
          </div>
        </div>
      </div>

      {/* Hourly Bite Windows */}
      <div className="bg-[#111a17] border border-[#233830] rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold text-stone-100">Optimal Hourly Feeding Windows Today:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {bassForecast.peakBiteWindows.map((win, i) => (
            <span
              key={i}
              className="text-xs bg-[#162520] border border-emerald-900/50 text-emerald-200 px-3 py-1 rounded-xl font-medium"
            >
              {win}
            </span>
          ))}
        </div>
      </div>

      {/* Premier Bass Lures & Tackle Arsenal */}
      <div className="bg-[#111a17] border border-[#233830] rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#233830] pb-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-base text-stone-100">
                Recommended Bass Lures & Tackle Arsenal
              </h3>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Strictly selected for {bassForecast.waterTemp}°F water, {bassForecast.waterClarity} clarity, and current barometric trends.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'All Lures' },
              { id: 'reaction', label: 'Reaction' },
              { id: 'bottom_contact', label: 'Jigs / Bottom' },
              { id: 'finesse', label: 'Finesse' },
              { id: 'topwater', label: 'Topwater' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedLureCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  selectedLureCategory === cat.id
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                    : 'bg-[#162420] text-stone-400 border-[#284137] hover:text-stone-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lure Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLures.map((lure) => (
            <div
              key={lure.id}
              className="bg-gradient-to-b from-[#14221d] to-[#101c18] border border-[#263e35] hover:border-emerald-500/50 rounded-2xl p-4 shadow-lg flex flex-col justify-between transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                      {lure.category.replace('_', ' ')}
                    </span>
                    <h4 className="text-sm font-bold text-stone-100">{lure.name}</h4>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                      {lure.confidenceScore}% Confidence
                    </span>
                  </div>
                </div>

                {/* Color & Size Specs */}
                <div className="grid grid-cols-2 gap-2 bg-[#0e1814] p-2.5 rounded-xl border border-[#1e322b] text-xs">
                  <div>
                    <span className="text-[10px] text-stone-400 block font-mono">Recommended Color:</span>
                    <span className="font-semibold text-emerald-300">{lure.recommendedColor}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block font-mono">Weight & Size:</span>
                    <span className="font-semibold text-stone-200">{lure.recommendedSizeWeight}</span>
                  </div>
                  {lure.trailerMatch && (
                    <div className="col-span-2 pt-1 border-t border-[#1a2d26]">
                      <span className="text-[10px] text-stone-400 block font-mono">Trailer Match:</span>
                      <span className="text-stone-300 font-medium">{lure.trailerMatch}</span>
                    </div>
                  )}
                </div>

                {/* Depth & Retrieve Cadence */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-stone-300">
                    <strong className="text-stone-400 font-mono text-[11px]">Depth:</strong>
                    <span className="font-mono text-cyan-300">{lure.depthRange}</span>
                  </div>
                  <div className="text-stone-300 leading-relaxed bg-[#15231e] p-2.5 rounded-lg border border-[#233930]">
                    <strong className="text-emerald-400 font-mono text-[10px] uppercase block mb-0.5">
                      Retrieve Cadence & Action:
                    </strong>
                    {lure.retrieveCadence}
                  </div>
                </div>

                {/* Tackle Setup Match */}
                <div className="bg-[#121d19] p-2.5 rounded-xl border border-[#21352e] text-[11px] space-y-1">
                  <span className="text-[10px] font-mono uppercase text-stone-400 font-bold block">
                    Recommended Tackle Match
                  </span>
                  <div className="grid grid-cols-3 gap-1 text-stone-300 font-mono text-[10px]">
                    <div>
                      <span className="text-stone-500 block">Rod</span>
                      <span className="truncate block" title={lure.gearRecommendation.rod}>{lure.gearRecommendation.rod}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block">Reel</span>
                      <span className="truncate block" title={lure.gearRecommendation.reel}>{lure.gearRecommendation.reel}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block">Line</span>
                      <span className="truncate block" title={lure.gearRecommendation.line}>{lure.gearRecommendation.line}</span>
                    </div>
                  </div>
                </div>

                {/* Why it works */}
                <p className="text-[11px] text-stone-400 leading-relaxed italic">
                  "{lure.whyItWorks}"
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lake Zones Preview Banner */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-[#13221d] to-[#101b17] border border-emerald-800/50 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
            Interactive Hotspot Explorer
          </span>
          <h4 className="text-base font-bold text-stone-100 mt-0.5">
            What Parts of {location.name} Are Best Right Now?
          </h4>
          <p className="text-xs text-stone-300 mt-1 max-w-xl">
            Windward points, outside creek channel bends, riprap heat banks, and shaded dock lines mapped with bathymetric depth contours and boat positioning angles.
          </p>
        </div>

        <button
          onClick={onOpenLakeMap}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all hover:scale-105"
        >
          <Compass className="w-4 h-4" />
          <span>Open Full Interactive Lake Map</span>
        </button>
      </div>
    </div>
  );
};
