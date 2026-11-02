import React, { useState } from 'react';
import { Mode, SavedLocation, WeatherData, SolunarData, BassForecast, RutForecast } from '../types';
import {
  Sparkles,
  Send,
  Loader2,
  Copy,
  Check,
  Compass,
  MessageSquare,
  BookmarkPlus,
  RefreshCw,
  Zap,
} from 'lucide-react';

interface AITacticalAdvisorProps {
  mode: Mode;
  location: SavedLocation;
  weather: WeatherData;
  solunar: SolunarData;
  bassForecast?: BassForecast;
  rut?: RutForecast;
}

export const AITacticalAdvisor: React.FC<AITacticalAdvisorProps> = ({
  mode,
  location,
  weather,
  solunar,
  bassForecast,
  rut,
}) => {
  const [query, setQuery] = useState('');
  const [advice, setAdvice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const presets =
    mode === 'fishing'
      ? [
          `Tournament Game Plan: Breakdown an hour-by-hour morning to evening plan for ${location.name} in current conditions.`,
          `High Sun Post-Front Strategy: How should I adjust my boat positioning and lure cadence if pressure spikes?`,
          `Windward vs Leeward: Exactly how will today's ${weather.windSpeed} mph ${weather.windCardinal} wind position baitfish and bass?`,
          `Trophy Bass Kicker: What specific lure and structure should I target for one monster double-digit bite today?`,
        ]
      : [
          `Cold Front Rut Surge: How will the incoming pressure trend affect buck daylight movement in ${location.name}?`,
          `All-Day Sit Strategy: Where should I position my stand between 10:00 AM and 2:00 PM during this rut phase?`,
          `Rattling & Calling Sequence: Give me the exact antler rattling and grunt call cadence to use right now.`,
          `Scent Cone Audit: How should I navigate ingress with the ${weather.windSpeed} mph ${weather.windCardinal} wind to avoid alerting bedding deer?`,
        ];

  const handleFetchAdvice = async (customText?: string) => {
    const questionToAsk = customText || query;
    setIsLoading(true);
    setError(null);

    const conditionsPayload = {
      location: location.name,
      state: location.state,
      weather: {
        temp: weather.temp,
        pressure: weather.pressure,
        pressureTrend: weather.pressureTrend,
        pressureTrendText: weather.pressureTrendText,
        windSpeed: weather.windSpeed,
        windDirection: weather.windDirection,
        windCardinal: weather.windCardinal,
        cloudCover: weather.cloudCover,
      },
      solunar: {
        moonPhase: solunar.moon.phaseName,
        illumination: solunar.moon.illumination,
        solunarScore: solunar.overallSolunarScore,
        majorPeriods: solunar.majorPeriods.map((p) => `${p.name} (${p.startTime}-${p.endTime})`),
        minorPeriods: solunar.minorPeriods.map((p) => `${p.name} (${p.startTime}-${p.endTime})`),
      },
      fishingDetails:
        mode === 'fishing' && bassForecast
          ? {
              waterTemp: bassForecast.waterTemp,
              waterClarity: bassForecast.waterClarity,
              lightCondition: bassForecast.lightCondition,
              forage: bassForecast.forageActive,
              seasonalBehavior: bassForecast.seasonalBehavior,
              targetDepth: bassForecast.depthFocus,
            }
          : undefined,
      huntingDetails:
        mode === 'hunting' && rut
          ? {
              rutStage: rut.stage,
              rutScore: rut.rutActivityScore,
              buckDaylightScore: rut.buckDaylightMovementScore,
              scentStrategy: rut.scentStrategy,
            }
          : undefined,
    };

    try {
      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          locationName: location.name,
          coordinates: { lat: location.lat, lon: location.lon },
          conditions: conditionsPayload,
          customQuery: questionToAsk,
        }),
      });

      const data = await res.json();
      if (data.success && data.advice) {
        setAdvice(data.advice);
      } else {
        throw new Error(data.error || 'Failed to generate advisory response');
      }
    } catch (err: any) {
      console.error('Advisor error:', err);
      setError(err.message || 'Unable to connect to AI Tactical Advisor.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!advice) return;
    navigator.clipboard.writeText(advice);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Intro Card */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-[#13221d] to-[#0d1613] border border-emerald-700/50 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-900/50">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-stone-100">
                  AI Tactical Advisor (Powered by Gemini 3.8 Flash)
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-900/80 text-emerald-300 border border-emerald-600/40">
                  Real-Time Atmospheric Grounding
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-0.5">
                Master guide & tournament outfitter intelligence synthesizing {location.name}'s live barometer,
                wind currents, water temperature, solunar gravitational windows, and seasonal rut phase.
              </p>
            </div>
          </div>
        </div>

        {/* Preset Prompt Buttons */}
        <div className="mt-4 pt-4 border-t border-[#20372e]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block mb-2">
            One-Click Pro Briefings:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {presets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(p);
                  handleFetchAdvice(p);
                }}
                disabled={isLoading}
                className="text-left p-2.5 rounded-xl bg-[#14231e] hover:bg-[#1a2d27] border border-[#263e35] hover:border-emerald-500/50 text-stone-200 text-xs transition-all flex items-start gap-2 group"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <span className="line-clamp-2">{p}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Query Input Box */}
      <div className="bg-[#111a17] border border-[#233830] rounded-2xl p-4 shadow-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (query.trim()) handleFetchAdvice(query);
          }}
          className="space-y-3"
        >
          <div className="relative">
            <textarea
              rows={3}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Ask the Tactical Advisor anything about ${location.name} (e.g. "What should I throw on a 58°F afternoon?", "How should I hunt the evening food plot with a ${weather.windCardinal} wind?")...`}
              className="w-full bg-[#15231e] border border-[#2a4338] rounded-xl p-3 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-stone-400">
              Synced with: <strong>{weather.temp}°F</strong>, <strong>{weather.windCardinal} {weather.windSpeed}mph</strong>, <strong>{weather.pressureTrendText}</strong>
            </span>

            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing Game Plan...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Generate Tactical Briefing</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Advisory Output Display */}
      {error && (
        <div className="p-4 bg-rose-950/40 border border-rose-800/60 rounded-2xl text-xs text-rose-300">
          <strong>Error:</strong> {error}
        </div>
      )}

      {isLoading && (
        <div className="bg-[#111a17] border border-[#233830] rounded-2xl p-8 text-center space-y-3 shadow-xl">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <h4 className="text-sm font-bold text-stone-200">
            Analyzing Atmospheric Gradients & Predator Patterns...
          </h4>
          <p className="text-xs text-stone-400 max-w-md mx-auto">
            Cross-referencing {location.name} with tournament bathymetry, forage migrations, barometric trigger curves, and peak solunar transit tables.
          </p>
        </div>
      )}

      {advice && !isLoading && (
        <div className="bg-[#111a17] border border-[#263e35] rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#233830] pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h4 className="font-bold text-sm text-stone-100">
                Custom Tactical Advisory Briefing
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyToClipboard}
                className="px-2.5 py-1 bg-[#162520] hover:bg-[#1f332c] text-stone-300 border border-[#2a4338] rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={() => handleFetchAdvice()}
                className="p-1.5 bg-[#162520] hover:bg-[#1f332c] text-stone-300 border border-[#2a4338] rounded-lg transition-colors"
                title="Regenerate with fresh insights"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Formatted Markdown Content */}
          <div className="text-xs text-stone-200 leading-relaxed whitespace-pre-wrap font-sans space-y-2 bg-[#14201c] p-4 rounded-xl border border-[#20332c]">
            {advice}
          </div>
        </div>
      )}
    </div>
  );
};
