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
import { WeatherRadarView } from './components/WeatherRadarView';
import { FutureForecastCalendar } from './components/FutureForecastCalendar';
import { LocationSearchModal } from './components/LocationSearchModal';
import { calculateSolarTimes } from './utils/solarAstronomical';
import { deriveWeatherForDate } from './utils/weatherForecastDeriver';
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
  const [activeTab, setActiveTab] = useState<'forecast' | 'hotspots' | 'weather' | 'calendar'>('forecast');

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

  // Fetch live weather function
  const fetchWeather = async () => {
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
          const directUrl = `https://api.open-meteo.com/v1/forecast?latitude=${currentLocation.lat}&longitude=${currentLocation.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,cloud_cover,dew_point_2m&hourly=temperature_2m,apparent_temperature,surface_pressure,wind_speed_10m,wind_direction_10m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto&forecast_days=16`;
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

      // Weather condition name mapping helper
      const getCodeName = (c: number) => {
        if (c === 0) return 'Clear Skies';
        if (c >= 1 && c <= 3) return c === 3 ? 'Overcast' : 'Partly Cloudy';
        if (c >= 45 && c <= 48) return 'Foggy / Low Visibility';
        if (c >= 51 && c <= 67) return 'Rain / Drizzle';
        if (c >= 71 && c <= 77) return 'Snow Flurries';
        if (c >= 80 && c <= 82) return 'Rain Showers';
        if (c >= 95) return 'Thunderstorms';
        return 'Clear Skies';
      };

      const code = current.weather_code || 0;
      const condName = getCodeName(code);

      // Parse all hourly forecast points (up to 16 days / 384 hours)
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const currentDate = now.getDate();
      const currentHour = now.getHours();

      const allHourlyForecast = [];
      let currentHourIndexInAll = -1;

      if (hourly.time && hourly.time.length > 0) {
        for (let i = 0; i < hourly.time.length; i++) {
          const tIso = hourly.time[i];
          const hDate = new Date(tIso);
          const h = hDate.getHours();
          const isCurrentHour =
            hDate.getFullYear() === currentYear &&
            hDate.getMonth() === currentMonth &&
            hDate.getDate() === currentDate &&
            h === currentHour;

          if (isCurrentHour && currentHourIndexInAll === -1) {
            currentHourIndexInAll = i;
          }

          const standardHourLabel =
            h === 0
              ? '12 AM'
              : h < 12
              ? `${h} AM`
              : h === 12
              ? '12 PM'
              : `${h - 12} PM`;

          const hourLabel = isCurrentHour ? 'Now' : standardHourLabel;
          const hCode = hourly.weather_code?.[i] ?? 0;
          const hDeg = hourly.wind_direction_10m?.[i] ?? deg;
          const hCard = cardinals[Math.round(hDeg / 45) % 8];
          const hPressure = (hourly.surface_pressure?.[i] ?? rawPressureHpa) * 0.02953;

          allHourlyForecast.push({
            time: tIso,
            hourLabel,
            temp: isCurrentHour
              ? Math.round(current.temperature_2m ?? hourly.temperature_2m?.[i] ?? 65)
              : Math.round(hourly.temperature_2m?.[i] ?? current.temperature_2m ?? 65),
            feelsLike: isCurrentHour
              ? Math.round(current.apparent_temperature ?? hourly.apparent_temperature?.[i] ?? 63)
              : Math.round(hourly.apparent_temperature?.[i] ?? current.apparent_temperature ?? 63),
            pressure: parseFloat(hPressure.toFixed(2)),
            rainProb: Math.round(hourly.precipitation_probability?.[i] ?? 0),
            windSpeed: isCurrentHour
              ? Math.round(current.wind_speed_10m ?? hourly.wind_speed_10m?.[i] ?? 8)
              : Math.round(hourly.wind_speed_10m?.[i] ?? current.wind_speed_10m ?? 8),
            windDirection: isCurrentHour ? deg : hDeg,
            windCardinal: isCurrentHour ? cardinal : hCard,
            weatherCode: isCurrentHour ? code : hCode,
            conditionName: isCurrentHour ? condName : getCodeName(hCode),
          });
        }
      }

      // If exact hour wasn't matched, find the first slot at or after current time
      if (currentHourIndexInAll === -1 && allHourlyForecast.length > 0) {
        currentHourIndexInAll = allHourlyForecast.findIndex(
          (h) => new Date(h.time).getTime() >= now.getTime() - 1800000
        );
        if (currentHourIndexInAll === -1) currentHourIndexInAll = 0;
      }

      // Today's hourlyForecast displays 24 consecutive hours starting at current time ("Now")
      const hourlyForecast = allHourlyForecast.slice(
        Math.max(0, currentHourIndexInAll),
        Math.max(0, currentHourIndexInAll) + 24
      );

      // Ensure the first card reflects live telemetry and is labeled 'Now'
      if (hourlyForecast.length > 0) {
        hourlyForecast[0] = {
          ...hourlyForecast[0],
          hourLabel: 'Now',
          temp: Math.round(current.temperature_2m ?? hourlyForecast[0].temp),
          feelsLike: Math.round(current.apparent_temperature ?? hourlyForecast[0].feelsLike),
          windSpeed: Math.round(current.wind_speed_10m ?? hourlyForecast[0].windSpeed),
          windDirection: deg,
          windCardinal: cardinal,
          pressure: parseFloat(currentPressureInHg.toFixed(2)),
          weatherCode: code,
          conditionName: condName,
        };
      }

      // Parse all daily points (up to 16 days)
      const dailyForecast = [];
      if (daily.time && daily.time.length > 0) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        for (let i = 0; i < daily.time.length; i++) {
          const dIso = daily.time[i];
          const dDate = new Date(dIso + 'T12:00:00');
          const dayLabel = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dayNames[dDate.getDay()];
          const dCode = daily.weather_code?.[i] ?? code;
          const dDeg = daily.wind_direction_10m_dominant?.[i] ?? deg;
          const dCard = cardinals[Math.round(dDeg / 45) % 8];

          dailyForecast.push({
            date: dIso,
            dayLabel,
            tempMax: Math.round(daily.temperature_2m_max?.[i] ?? 68),
            tempMin: Math.round(daily.temperature_2m_min?.[i] ?? 48),
            weatherCode: dCode,
            conditionName: getCodeName(dCode),
            rainProbMax: Math.round(daily.precipitation_probability_max?.[i] ?? 10),
            windSpeedMax: Math.round(daily.wind_speed_10m_max?.[i] ?? 12),
            windDirection: dDeg,
            windCardinal: dCard,
            sunrise: daily.sunrise?.[i] ? formatTime(daily.sunrise[i]) : undefined,
            sunset: daily.sunset?.[i] ? formatTime(daily.sunset[i]) : undefined,
          });
        }
      }

      const updatedWeather: WeatherData = {
        temp: Math.round(current.temperature_2m ?? 65),
        feelsLike: Math.round(current.apparent_temperature ?? 63),
        humidity: Math.round(current.relative_humidity_2m ?? 60),
        dewPoint: current.dew_point_2m ? Math.round(current.dew_point_2m) : undefined,
        tempMax: daily.temperature_2m_max?.[0] ? Math.round(daily.temperature_2m_max[0]) : undefined,
        tempMin: daily.temperature_2m_min?.[0] ? Math.round(daily.temperature_2m_min[0]) : undefined,
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
        hourlyForecast,
        allHourlyForecast,
        dailyForecast,
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
      setIsLoadingWeather(false);
    }
  };

  // Fetch live weather whenever current location changes
  useEffect(() => {
    fetchWeather();
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

  // Dynamically derive meteorological conditions for activeAppDate
  // (Live telemetry for today; 16-day numerical hour-by-hour forecast; astronomical climatology beyond)
  const effectiveWeather = useMemo(() => {
    return deriveWeatherForDate(
      activeAppDate,
      weather,
      weather.allHourlyForecast || weather.hourlyForecast,
      weather.dailyForecast,
      currentLocation.lat,
      currentLocation.lon
    );
  }, [activeAppDate, weather, currentLocation.lat, currentLocation.lon]);

  // Rut calculations for hunting
  const rut = useMemo(() => {
    return calculateRutForecast(activeAppDate, currentLocation.lat);
  }, [activeAppDate, currentLocation.lat]);

  // Bass forecast calculations based on effective weather for selected date
  const bassForecast = useMemo<BassForecast>(() => {
    return calculateBassForecast({
      waterTemp: bassTuning.waterTemp,
      pressureTrend: effectiveWeather.pressureTrend,
      pressureValue: effectiveWeather.pressure,
      waterClarity: bassTuning.waterClarity,
      lightCondition: bassTuning.lightCondition,
      forageActive: bassTuning.forageActive,
      windSpeed: effectiveWeather.windSpeed,
      windCardinal: effectiveWeather.windCardinal,
      windDirection: effectiveWeather.windDirection,
      seasonMonth: activeAppDate.getMonth(),
    });
  }, [bassTuning, effectiveWeather, activeAppDate]);

  // Composite hunting score based on effective weather for selected date
  const huntingCompositeScore = useMemo(() => {
    let score = rut.rutActivityScore * 0.45 + solunar.overallSolunarScore * 0.35;
    if (effectiveWeather.pressureTrend === 'falling' || effectiveWeather.pressureTrend === 'rapidly_falling') {
      score += 15;
    } else if (effectiveWeather.pressureTrend === 'rising') {
      score += 5;
    }
    if (effectiveWeather.temp >= 30 && effectiveWeather.temp <= 50) score += 5;
    return Math.max(40, Math.min(99, Math.round(score)));
  }, [rut, solunar, effectiveWeather]);

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
                weather={effectiveWeather}
                solunar={solunar}
                bassForecast={bassForecast}
                onUpdateConditions={(updates) => setBassTuning((prev) => ({ ...prev, ...updates }))}
                onOpenLakeMap={() => setActiveTab('hotspots')}
              />
            ) : (
              <HuntingForecastView
                location={currentLocation}
                weather={effectiveWeather}
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
                weather={effectiveWeather}
                hotspots={currentLocation.hotspots || bassForecast.bestZones}
              />
            ) : (
              <WindScentCompass
                location={currentLocation}
                weather={effectiveWeather}
                standSpots={[]}
                activeDate={activeAppDate}
              />
            )}
          </div>
        )}

        {/* Tab 3: Live Weather & Radar */}
        {activeTab === 'weather' && (
          <WeatherRadarView
            mode={mode}
            location={currentLocation}
            weather={effectiveWeather}
            activeDate={activeAppDate}
            onResetDate={() => setActiveAppDate(new Date())}
            isLoading={isLoadingWeather}
            onRefreshWeather={() => fetchWeather()}
          />
        )}

        {/* Tab 4: Future Forecast Calendar */}
        {activeTab === 'calendar' && (
          <FutureForecastCalendar
            mode={mode}
            location={currentLocation}
            currentWeather={effectiveWeather}
            activeAppDate={activeAppDate}
            onSelectDate={(newDate) => {
              setActiveAppDate(newDate);
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
