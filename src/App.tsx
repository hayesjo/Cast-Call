import React, { useState, useEffect, useMemo } from 'react';
import {
  Mode,
  SavedLocation,
  WeatherData,
  CatchReport,
  BassForecast,
} from './types';
import { DEFAULT_LOCATIONS } from './data/defaultLocations';
import { INITIAL_CATCH_REPORTS } from './data/sampleCatches';
import { calculateSolunar } from './utils/solunar';
import { calculateRutForecast } from './utils/rutCalculator';
import { calculateBassForecast } from './utils/bassTactics';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { FishingForecastView } from './components/FishingForecastView';
import { HuntingForecastView } from './components/HuntingForecastView';
import { InteractiveLakeMap } from './components/InteractiveLakeMap';
import { WindScentCompass } from './components/WindScentCompass';
import { AITacticalAdvisor } from './components/AITacticalAdvisor';
import { FutureForecastCalendar } from './components/FutureForecastCalendar';
import { LocationSearchModal } from './components/LocationSearchModal';
import { calculateSolarTimes } from './utils/solarAstronomical';
import { Loader2, AlertCircle, Calendar } from 'lucide-react';

export default function App() {
  // Mode: Hunting is now the default
  const [mode, setMode] = useState<Mode>('hunting');

  // Active Forecast Date (defaults to today, can be changed via the Calendar tab)
  const [activeAppDate, setActiveAppDate] = useState<Date>(new Date());

  // Locations state: ensure default locations (including LeRoy MI, Rosebush MI, Tustin MI) are always loaded and prioritized
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>(() => {
    try {
      const stored = localStorage.getItem('apexcast_saved_locations');
      if (stored) {
        const parsed: SavedLocation[] = JSON.parse(stored);
        // Retain any user-created custom locations, while ensuring all canonical DEFAULT_LOCATIONS are fresh
        const userCustomLocations = parsed.filter(
          (p) => p.isCustom && !DEFAULT_LOCATIONS.some((def) => def.name.toLowerCase() === p.name.toLowerCase())
        );
        return [...DEFAULT_LOCATIONS, ...userCustomLocations];
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_LOCATIONS;
  });

  const [currentLocation, setCurrentLocation] = useState<SavedLocation>(() => {
    // Default to LeRoy MI, Rosebush MI, or Tustin MI for hunting
    const defaultHunt =
      DEFAULT_LOCATIONS.find((l) => l.name === 'LeRoy') ||
      DEFAULT_LOCATIONS.find((l) => l.name === 'Rosebush') ||
      DEFAULT_LOCATIONS.find((l) => l.name === 'Tustin') ||
      DEFAULT_LOCATIONS.find((l) => l.type === 'hunting_unit');
    return defaultHunt || DEFAULT_LOCATIONS[0] || savedLocations[0];
  });

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'forecast' | 'hotspots' | 'advisor' | 'calendar'>('forecast');

  // Catch & Harvest Reports
  const [catchReports, setCatchReports] = useState<CatchReport[]>(() => {
    try {
      const stored = localStorage.getItem('apexcast_catches');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_CATCH_REPORTS;
  });

  // User-calibrated Bass parameters
  const [bassTuning, setBassTuning] = useState<{
    waterTemp: number;
    waterClarity: 'crystal_clear' | 'stained' | 'muddy';
    lightCondition: 'bright_sun' | 'partly_cloudy' | 'overcast' | 'low_light';
    forageActive: 'threadfin_shad' | 'bluegill' | 'crawfish' | 'perch';
  }>({
    waterTemp: 66,
    waterClarity: currentLocation.waterClarityDefault || 'stained',
    lightCondition: 'partly_cloudy',
    forageActive: 'threadfin_shad',
  });

  // Weather state
  const [weather, setWeather] = useState<WeatherData>({
    temp: 64,
    feelsLike: 63,
    humidity: 58,
    pressure: 29.88,
    pressureTrend: 'falling',
    pressureTrendText: 'Falling - Pre-Front Trigger',
    windSpeed: 11,
    windGusts: 16,
    windDirection: 315,
    windCardinal: 'NW',
    cloudCover: 65,
    weatherCode: 3,
    conditionName: 'Overcast / Wind Chop',
    sunrise: '7:08 AM',
    sunset: '6:35 PM',
    hourlyTemps: [],
  });

  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  // Sync saved locations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('apexcast_saved_locations', JSON.stringify(savedLocations));
    } catch (e) {
      console.error(e);
    }
  }, [savedLocations]);

  // Sync catch reports to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('apexcast_catches', JSON.stringify(catchReports));
    } catch (e) {
      console.error(e);
    }
  }, [catchReports]);

  // Fetch live weather whenever current location changes
  useEffect(() => {
    let isCancelled = false;

    async function fetchWeather() {
      setIsLoadingWeather(true);
      try {
        let data: any = null;

        // Try backend proxy first
        try {
          const res = await fetch(`/api/weather?lat=${currentLocation.lat}&lon=${currentLocation.lon}`);
          if (res.ok) {
            const contentType = res.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              data = await res.json();
            }
          }
        } catch {
          // Backend proxy unavailable (e.g. static export on GitHub Pages)
        }

        // Direct client fallback to Open-Meteo for GitHub Pages static deployments
        if (!data || !data.current) {
          try {
            const directUrl = `https://api.open-meteo.com/v1/forecast?latitude=${currentLocation.lat}&longitude=${currentLocation.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,cloud_cover&hourly=surface_pressure&daily=sunrise,sunset&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto`;
            const directRes = await fetch(directUrl);
            if (directRes.ok) {
              data = await directRes.json();
            }
          } catch (directErr) {
            console.warn('Direct Open-Meteo fetch fallback error:', directErr);
          }
        }

        if (!data || !data.current) {
          throw new Error('Unable to retrieve weather data from proxy or direct source.');
        }

        if (isCancelled) return;

        const current = data.current || {};
        const hourly = data.hourly || {};
        const daily = data.daily || {};

        // Convert hPa to inHg: 1 hPa = 0.02953 inHg
        const rawPressureHpa = current.surface_pressure || 1012;
        const currentPressureInHg = rawPressureHpa * 0.02953;

        // Calculate pressure trend from hourly data (compare current with 4 hours ago)
        let trend: 'rapidly_falling' | 'falling' | 'steady' | 'rising' | 'rapidly_rising' = 'steady';
        let trendText = 'Steady Barometer';

        if (hourly.surface_pressure && hourly.surface_pressure.length > 4) {
          const pastHpa = hourly.surface_pressure[0];
          const diffInHg = (rawPressureHpa - pastHpa) * 0.02953;
          if (diffInHg < -0.06) {
            trend = 'rapidly_falling';
            trendText = 'Rapidly Falling (Cold Front)';
          } else if (diffInHg < -0.02) {
            trend = 'falling';
            trendText = 'Falling (Active Feed)';
          } else if (diffInHg > 0.06) {
            trend = 'rapidly_rising';
            trendText = 'Rapidly Rising (Post-Front)';
          } else if (diffInHg > 0.02) {
            trend = 'rising';
            trendText = 'Rising (Stabilizing)';
          }
        }

        // Convert degrees to cardinal
        const deg = current.wind_direction_10m || 0;
        const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const cardinal = cardinals[Math.round(deg / 45) % 8];

        // Format sunrise / sunset times
        const formatTime = (iso?: string) => {
          if (!iso) return '6:45 AM';
          const d = new Date(iso);
          return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        };

        const sunrise = daily.sunrise?.[0] ? formatTime(daily.sunrise[0]) : '7:04 AM';
        const sunset = daily.sunset?.[0] ? formatTime(daily.sunset[0]) : '6:30 PM';

        // Weather condition name mapping
        const code = current.weather_code || 0;
        let condName = 'Clear Skies';
        if (code >= 1 && code <= 3) condName = code === 3 ? 'Overcast' : 'Partly Cloudy';
        else if (code >= 45 && code <= 48) condName = 'Foggy / Low Visibility';
        else if (code >= 51 && code <= 67) condName = 'Rain / Drizzle';
        else if (code >= 71 && code <= 77) condName = 'Snow Flurries';
        else if (code >= 80 && code <= 82) condName = 'Rain Showers';
        else if (code >= 95) condName = 'Thunderstorms';

        const updatedWeather: WeatherData = {
          temp: Math.round(current.temperature_2m ?? 65),
          feelsLike: Math.round(current.apparent_temperature ?? 63),
          humidity: Math.round(current.relative_humidity_2m ?? 60),
          pressure: parseFloat(currentPressureInHg.toFixed(2)),
          pressureTrend: trend,
          pressureTrendText: trendText,
          windSpeed: Math.round(current.wind_speed_10m ?? 8),
          windGusts: Math.round(current.wind_gusts_10m ?? 12),
          windDirection: deg,
          windCardinal: cardinal,
          cloudCover: Math.round(current.cloud_cover ?? 50),
          weatherCode: code,
          conditionName: condName,
          sunrise,
          sunset,
          hourlyTemps: [],
        };

        setWeather(updatedWeather);

        // Adjust estimated water temp based on air temp and month if user hasn't explicitly customized
        const month = new Date().getMonth();
        let estimatedWater = Math.max(45, Math.min(84, Math.round(updatedWeather.temp * 0.85 + 8)));
        if (month >= 5 && month <= 8) estimatedWater = Math.max(72, estimatedWater); // Summer
        if (month === 11 || month === 0 || month === 1) estimatedWater = Math.min(54, estimatedWater); // Winter

        setBassTuning((prev) => ({
          ...prev,
          waterTemp: estimatedWater,
          waterClarity: currentLocation.waterClarityDefault || prev.waterClarity,
        }));
      } catch (err) {
        console.warn('Weather fetch failed, utilizing cached atmospheric snapshot:', err);
      } finally {
        if (!isCancelled) setIsLoadingWeather(false);
      }
    }

    fetchWeather();
    return () => {
      isCancelled = true;
    };
  }, [currentLocation]);

  // Solar calculation for active date (handles future dates astronomically or live weather for today)
  const effectiveSolar = useMemo(() => {
    const today = new Date();
    const isToday =
      activeAppDate.getDate() === today.getDate() &&
      activeAppDate.getMonth() === today.getMonth() &&
      activeAppDate.getFullYear() === today.getFullYear();

    if (isToday && weather.sunrise && weather.sunset) {
      return {
        sunrise: weather.sunrise,
        sunset: weather.sunset,
      };
    }

    const calc = calculateSolarTimes(activeAppDate, currentLocation.lat, currentLocation.lon);
    return {
      sunrise: calc.sunrise,
      sunset: calc.sunset,
    };
  }, [activeAppDate, weather.sunrise, weather.sunset, currentLocation.lat, currentLocation.lon]);

  // Solunar calculations for active date
  const solunar = useMemo(() => {
    return calculateSolunar(activeAppDate, effectiveSolar.sunrise, effectiveSolar.sunset);
  }, [activeAppDate, effectiveSolar.sunrise, effectiveSolar.sunset]);

  // Rut calculations for hunting
  const rut = useMemo(() => {
    return calculateRutForecast(activeAppDate, currentLocation.lat);
  }, [activeAppDate, currentLocation.lat]);

  // Bass forecast calculations
  const bassForecast = useMemo<BassForecast>(() => {
    return calculateBassForecast({
      waterTemp: bassTuning.waterTemp,
      pressureTrend: weather.pressureTrend,
      pressureValue: weather.pressure,
      waterClarity: bassTuning.waterClarity,
      lightCondition: bassTuning.lightCondition,
      forageActive: bassTuning.forageActive,
      windSpeed: weather.windSpeed,
      windCardinal: weather.windCardinal,
      windDirection: weather.windDirection,
      seasonMonth: activeAppDate.getMonth(),
    });
  }, [bassTuning, weather, activeAppDate]);

  // Composite hunting score
  const huntingCompositeScore = useMemo(() => {
    let score = rut.rutActivityScore * 0.45 + solunar.overallSolunarScore * 0.35;
    if (weather.pressureTrend === 'falling' || weather.pressureTrend === 'rapidly_falling') {
      score += 15;
    } else if (weather.pressureTrend === 'rising') {
      score += 5;
    }
    if (weather.temp >= 30 && weather.temp <= 50) score += 5;
    return Math.max(40, Math.min(99, Math.round(score)));
  }, [rut, solunar, weather]);

  // Active composite score based on current mode
  const activeScore = mode === 'fishing' ? bassForecast.compositeBiteScore : huntingCompositeScore;

  // Check if viewing a future date
  const isFutureDate = useMemo(() => {
    const today = new Date();
    return (
      activeAppDate.getDate() !== today.getDate() ||
      activeAppDate.getMonth() !== today.getMonth() ||
      activeAppDate.getFullYear() !== today.getFullYear()
    );
  }, [activeAppDate]);

  // Handle adding new location from search or manual form
  const handleAddLocation = (newLoc: SavedLocation) => {
    setSavedLocations((prev) => [newLoc, ...prev.filter((l) => l.name !== newLoc.name)]);
    setCurrentLocation(newLoc);
    if (newLoc.type === 'hunting_unit') setMode('hunting');
    if (newLoc.type === 'lake') setMode('fishing');
  };

  // Handle adding new catch report
  const handleAddReport = (newRep: CatchReport) => {
    setCatchReports((prev) => [newRep, ...prev]);
  };

  return (
    <div className="min-h-screen bg-[#0b120f] text-stone-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Header */}
      <Header
        mode={mode}
        onModeChange={(newMode) => {
          setMode(newMode);
          // If switching to hunting and current location is a lake, switch to LeRoy, Rosebush, or Tustin
          if (newMode === 'hunting' && currentLocation.type === 'lake') {
            const huntingUnit = savedLocations.find(
              (l) => l.name === 'LeRoy' || l.name === 'Rosebush' || l.name === 'Tustin'
            ) || savedLocations.find((l) => l.type === 'hunting_unit');
            if (huntingUnit) setCurrentLocation(huntingUnit);
          }
          // If switching to fishing and current location is hunting unit, switch to Lake Mitchell (Cadillac)
          if (newMode === 'fishing' && currentLocation.type === 'hunting_unit') {
            const lakeUnit = savedLocations.find(
              (l) => l.name.includes('Mitchell') || l.type === 'lake' || l.type === 'both'
            );
            if (lakeUnit) setCurrentLocation(lakeUnit);
          }
        }}
        currentLocation={currentLocation}
        savedLocations={savedLocations}
        onSelectLocation={(loc) => setCurrentLocation(loc)}
        onOpenSearch={() => setIsSearchOpen(true)}
        solunar={solunar}
        compositeScore={activeScore}
        sunrise={effectiveSolar.sunrise}
        sunset={effectiveSolar.sunset}
        activeAppDate={activeAppDate}
        onResetDate={() => setActiveAppDate(new Date())}
      />

      {/* Main Content Area with Mobile Bottom Padding */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28 sm:pb-12">
        {/* Future Date Indicator Alert */}
        {isFutureDate && (
          <div className="mb-4 bg-amber-950/80 border border-amber-600/70 text-amber-200 px-3.5 py-2.5 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs shadow-lg">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Evaluating Trip Forecast for:{' '}
                <strong className="text-white">
                  {activeAppDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <button
                onClick={() => setActiveTab('calendar')}
                className="underline text-amber-300 hover:text-white font-medium"
              >
                Change Date in Calendar
              </button>
              <span>•</span>
              <button
                onClick={() => setActiveAppDate(new Date())}
                className="px-2 py-0.5 rounded-lg bg-amber-800 hover:bg-amber-700 text-white font-bold"
              >
                Reset to Today
              </button>
            </div>
          </div>
        )}

        {/* Loading Indicator for weather change */}
        {isLoadingWeather && (
          <div className="mb-4 bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs px-3 py-2 rounded-xl flex items-center gap-2 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Syncing atmospheric barometrics & weather gradients for {currentLocation.name}...</span>
          </div>
        )}

        {/* Tab 1: Primary Forecast View (Fishing or Hunting) */}
        {activeTab === 'forecast' && (
          <>
            {mode === 'fishing' ? (
              <FishingForecastView
                location={currentLocation}
                weather={weather}
                solunar={solunar}
                bassForecast={bassForecast}
                onUpdateConditions={(updates) => setBassTuning((prev) => ({ ...prev, ...updates }))}
                onOpenLakeMap={() => setActiveTab('hotspots')}
              />
            ) : (
              <HuntingForecastView
                location={currentLocation}
                weather={weather}
                solunar={solunar}
                rut={rut}
                huntingScore={huntingCompositeScore}
                onOpenStandPlanner={() => setActiveTab('hotspots')}
              />
            )}
          </>
        )}

        {/* Tab 2: Map & Hotspots View */}
        {activeTab === 'hotspots' && (
          <div className="space-y-6">
            {mode === 'fishing' ? (
              <InteractiveLakeMap
                location={currentLocation}
                weather={weather}
                hotspots={currentLocation.hotspots || bassForecast.bestZones}
              />
            ) : (
              <WindScentCompass
                location={currentLocation}
                weather={weather}
                standSpots={
                  currentLocation.standSpots || [
                    {
                      id: 'default_stand_1',
                      name: 'Primary Ridge Saddle Stand',
                      type: 'ridge_funnel',
                      x: 45,
                      y: 35,
                      rating: 95,
                      windSafety: 'ideal',
                      windDirectionPreferred: ['NW', 'N', 'W'],
                      description: 'High traffic deer crossing between bedding ridge and ag bottom.',
                      bestTime: 'morning',
                    },
                    {
                      id: 'default_stand_2',
                      name: 'Creek Crossing Staging Stand',
                      type: 'creek_crossing',
                      x: 65,
                      y: 55,
                      rating: 92,
                      windSafety: 'marginal',
                      windDirectionPreferred: ['S', 'SE'],
                      description: 'Hard creek crossing with dense brush cover.',
                      bestTime: 'all_day',
                    },
                  ]
                }
              />
            )}
          </div>
        )}

        {/* Tab 3: AI Tactical Advisor */}
        {activeTab === 'advisor' && (
          <AITacticalAdvisor
            mode={mode}
            location={currentLocation}
            weather={weather}
            solunar={solunar}
            bassForecast={bassForecast}
            rut={rut}
          />
        )}

        {/* Tab 4: Future Forecast Calendar */}
        {activeTab === 'calendar' && (
          <FutureForecastCalendar
            mode={mode}
            location={currentLocation}
            currentWeather={weather}
            activeAppDate={activeAppDate}
            onSelectDate={(newDate) => {
              // Date selected in calendar
            }}
            onApplyDateToApp={(newDate) => {
              setActiveAppDate(newDate);
              setActiveTab('forecast');
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1a2924] bg-[#090f0c] py-6 text-stone-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-200">ApexCast & RutTrack</span>
            <span>•</span>
            <span>Predictive Intelligence for Anglers & Outfitters</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-stone-500 font-mono">
            <span>Solunar Astronomical Sync</span>
            <span>•</span>
            <span>NOAA Solar Engine</span>
            <span>•</span>
            <span>Photoperiod Rut Progression</span>
          </div>
        </div>
      </footer>

      {/* Location Search & Coordinate Modal */}
      <LocationSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onAddLocation={handleAddLocation}
      />

      {/* Mobile Fixed Bottom Navigation */}
      <MobileBottomNav
        mode={mode}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isFutureDateActive={isFutureDate}
      />
    </div>
  );
}
