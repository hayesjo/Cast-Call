import React, { useState, useEffect, useMemo } from 'react';
import { StandHotspot, WeatherData, SavedLocation, HourlyWeatherPoint } from '../types';
import {
  Wind,
  Compass,
  Layers,
  Image as ImageIcon,
  Maximize2,
  X,
  Navigation,
  Clock,
  RotateCcw,
  AlertTriangle,
  Sun,
  Sunset,
  Sunrise,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface WindScentCompassProps {
  weather: WeatherData;
  standSpots?: StandHotspot[];
  location?: SavedLocation;
  activeDate?: Date;
}

export const WindScentCompass: React.FC<WindScentCompassProps> = ({
  weather,
  location,
  activeDate,
}) => {
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState<HourlyWeatherPoint | null>(null);
  const [timeFilter, setTimeFilter] = useState<'all' | 'morning' | 'evening'>('all');

  // Property aerial photo (LeRoy MI, Tustin MI, Rosebush MI uploaded map, or location propertyMapUrl)
  const rawAerialPhoto =
    location?.propertyMapUrl ||
    (location?.name?.toLowerCase().includes('leroy')
      ? './assets/aistudio/LeRoyHunt_44bbd6d7.png'
      : location?.name?.toLowerCase().includes('tustin')
      ? './assets/aistudio/TustinHunt_14cc4678.png'
      : location?.name?.toLowerCase().includes('rosebush')
      ? './assets/aistudio/RosebushHunt_229e051e.png'
      : undefined);

  // Normalize path so it resolves relatively on GitHub Pages subpaths or root domains
  const propertyAerialPhoto = rawAerialPhoto
    ? rawAerialPhoto.startsWith('http')
      ? rawAerialPhoto
      : `${import.meta.env.BASE_URL || './'}${rawAerialPhoto.replace(/^(\.\/|\/)/, '')}`
    : undefined;

  const hasAerialMap = Boolean(propertyAerialPhoto);

  const isLeRoy =
    Boolean(location?.name?.toLowerCase().includes('leroy')) ||
    Boolean(location?.propertyMapUrl?.includes('LeRoy'));

  const isTustin =
    Boolean(location?.name?.toLowerCase().includes('tustin')) ||
    Boolean(location?.propertyMapUrl?.includes('Tustin'));

  const isRosebush =
    Boolean(location?.name?.toLowerCase().includes('rosebush')) ||
    Boolean(location?.propertyMapUrl?.includes('Rosebush'));

  const mapAspectRatio =
    location?.mapAspectRatio ||
    (isLeRoy ? '1206 / 2213' : isTustin ? '1077 / 915' : '1012 / 1307');

  // If the location has an uploaded aerial property map, default to aerial view
  const [viewMode, setViewMode] = useState<'aerial' | 'radar'>(
    hasAerialMap ? 'aerial' : 'radar'
  );

  useEffect(() => {
    if (hasAerialMap) {
      setViewMode('aerial');
    }
    // Reset hour preview on location change
    setSelectedHour(null);
  }, [location?.id, location?.name, hasAerialMap]);

  // Reset hour preview when active calendar date changes
  useEffect(() => {
    setSelectedHour(null);
  }, [activeDate]);

  // Fallback 24-hour generator if weather.hourlyForecast is empty
  const hourlyData: HourlyWeatherPoint[] = useMemo(() => {
    if (weather.hourlyForecast && weather.hourlyForecast.length > 0) {
      return weather.hourlyForecast;
    }
    // Generate 24 hours based on current weather parameters
    const points: HourlyWeatherPoint[] = [];
    const now = new Date();
    const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    for (let i = 0; i < 24; i++) {
      const hDate = new Date(now.getTime() + i * 3600 * 1000);
      const h = hDate.getHours();
      const standardLabel =
        h === 0
          ? '12 AM'
          : h < 12
          ? `${h} AM`
          : h === 12
          ? '12 PM'
          : `${h - 12} PM`;
      const hourLabel = i === 0 && !weather.isCustomDateForecast ? 'Now' : standardLabel;

      // Slight natural wind veer & speed variance
      const speedOffset = Math.sin(i / 3) * 3;
      const dirOffset = Math.round(Math.cos(i / 4) * 20);
      const hDir = (weather.windDirection + dirOffset + 360) % 360;
      const hCard = cardinals[Math.round(hDir / 45) % 8];
      const hSpeed = Math.max(3, Math.round(weather.windSpeed + speedOffset));

      points.push({
        time: hDate.toISOString(),
        hourLabel,
        temp: Math.round(weather.temp + Math.sin((h - 8) / 3) * 6),
        feelsLike: Math.round(weather.feelsLike + Math.sin((h - 8) / 3) * 6),
        pressure: weather.pressure,
        rainProb: Math.max(0, Math.min(100, Math.round(10 + Math.sin(i) * 15))),
        windSpeed: hSpeed,
        windDirection: hDir,
        windCardinal: hCard,
        weatherCode: weather.weatherCode,
        conditionName: weather.conditionName,
      });
    }
    return points;
  }, [weather]);

  // Filter hourly data if Morning (5 AM - 11 AM) or Evening (3 PM - 9 PM) filter selected
  const filteredHourlyData = useMemo(() => {
    if (timeFilter === 'all') return hourlyData;
    return hourlyData.filter((pt) => {
      const d = new Date(pt.time);
      const h = d.getHours();
      if (timeFilter === 'morning') return h >= 5 && h <= 11;
      if (timeFilter === 'evening') return h >= 15 && h <= 21;
      return true;
    });
  }, [hourlyData, timeFilter]);

  // Detect major wind direction shifts across the timeline
  const windShiftInfo = useMemo(() => {
    if (hourlyData.length < 2) return null;
    let shiftHour: HourlyWeatherPoint | null = null;
    const baseDir = hourlyData[0].windDirection;

    for (let i = 1; i < Math.min(18, hourlyData.length); i++) {
      const diff = Math.abs(hourlyData[i].windDirection - baseDir);
      const normalizedDiff = diff > 180 ? 360 - diff : diff;
      if (normalizedDiff >= 45) {
        shiftHour = hourlyData[i];
        break;
      }
    }
    return shiftHour;
  }, [hourlyData]);

  // Active wind values (either live current or previewed future hour)
  const isPreviewing = selectedHour !== null;
  const activeWindSpeed = selectedHour ? selectedHour.windSpeed : weather.windSpeed;
  const activeWindDirection = selectedHour ? selectedHour.windDirection : weather.windDirection;
  const activeWindCardinal = selectedHour ? selectedHour.windCardinal : weather.windCardinal;
  const activeTemp = selectedHour ? selectedHour.temp : weather.temp;
  const activePressure = selectedHour ? selectedHour.pressure : weather.pressure;

  const windAngle = activeWindDirection; // 0 is North
  // The scent cone travels in the active wind direction
  const downwindAngle = windAngle;

  // Property-wide scent analysis dynamically tailored to location
  const getParcelScentAnalysis = () => {
    const card = activeWindCardinal;

    // Tustin, MI (Carey & Janke Tract along 160th Ave)
    if (isTustin) {
      if (card === 'NW') {
        return {
          driftDirection: 'Southeast (Across 160th Ave Corridor)',
          summary: 'Northwest Wind Drift Across Ridge',
          detail:
            'A NW wind carries human scent from the high northwest elevation contour southeast across the open clearing toward the 160th Ave fence line. Center oak knolls and western contour saddles provide clean upwind staging.',
          accessAdvice:
            'Enter along the western timber line or southwest perimeter, keeping the wind in your face as you approach central knolls.',
          thermals:
            'Thermal updrafts rise along western contour ridges in mid-morning; evening cooling pulls scent down into the south marsh basin.',
        };
      }
      if (card === 'W') {
        return {
          driftDirection: 'East (160th Avenue Boundary)',
          summary: 'West Wind Airflow Corridor',
          detail:
            'West wind pushes scent eastward straight across the Carey & Janke parcel toward 160th Ave. The western contour ridge provides a completely clean upwind staging position for afternoon sits.',
          accessAdvice:
            'Access from the southwest perimeter, keeping scent blowing toward 160th Ave away from interior deer bedding.',
          thermals:
            'Stable horizontal airflow across the center clearing during afternoon sunshine.',
        };
      }
      if (card === 'SW' || card === 'S') {
        return {
          driftDirection: card === 'SW' ? 'Northeast (Upper Thicket Basin)' : 'North (North Boundary Ridge)',
          summary: 'Southerly Flow Vector',
          detail:
            'South/Southwest wind carries hunter scent toward the northeast thicket pocket and northern parcel border. South marsh bedding perimeter remains safe and clean.',
          accessAdvice:
            'Enter from 160th Ave south shoulder and slip along the south contour to keep downwind of moving bucks.',
          thermals:
            'Swirling eddy currents can form in the south marsh depression during mid-day; maintain strict scent control.',
        };
      }
      if (card === 'N' || card === 'NE') {
        return {
          driftDirection: card === 'N' ? 'South (South Marsh Basin)' : 'Southwest (SW Timber Pocket)',
          summary: 'Northerly Scent Corridor',
          detail:
            'North wind carries scent downward into the south marsh basin. Center ridge positions and 160th Ave northern approaches stay clean.',
          accessAdvice:
            'Enter via 160th Ave from the north boundary and overlook the southern bedding pocket.',
          thermals:
            'Thermal pooling settles in the low south marsh thicket at dusk.',
        };
      }
      return {
        driftDirection: 'West (Interior Ridge Timber)',
        summary: 'Easterly Flow Corridor',
        detail:
          'East wind blows scent from 160th Ave westward into the interior timber. Avoid 160th Ave entry points to prevent educating deer in the center clearing.',
        accessAdvice:
          'Circle to the south or north fence lines before entering interior woods.',
        thermals:
          'Gentle east breezes hold scent along the open clearing floor before dispersing over western ridges.',
      };
    }

    // Rosebush, MI (Chippewa River Corridor)
    if (isRosebush) {
      if (card === 'NW' || card === 'N') {
        return {
          driftDirection: 'Southeast (Across Chippewa River)',
          summary: 'Northerly River Corridor Drift',
          detail:
            'North/Northwest wind pushes scent southeast across the Chippewa River corridor into open agricultural fields. North hardwood ridges and river bend funnels offer prime upwind vantage.',
          accessAdvice:
            'Approach from the north boundary road, slipping down through the mature oaks with wind in your face.',
          thermals:
            'River water temperature moderates thermal draft swings, creating consistent morning updrafts along high banks.',
        };
      }
      if (card === 'W' || card === 'SW') {
        return {
          driftDirection: 'East (Toward Eastern Farm Boundary)',
          summary: 'Westerly Airflow Stream',
          detail:
            'West and Southwest wind carries scent eastward away from the main river bedding sanctuary. Ideal for intercepting bucks cruising parallel to the river oxbow.',
          accessAdvice:
            'Slip in from the western boundary lane to access river bottom pinch points cleanly.',
          thermals:
            'Late afternoon river eddies can pull scent downstream; maintain rubber boots and scent sprays.',
        };
      }
      return {
        driftDirection: 'West / Northwest (River Bottom Thickets)',
        summary: 'Easterly / Southerly Flow Vector',
        detail:
          'Wind carries scent westward toward the core river sanctuary. Approach with caution and use eastern edge trails.',
        accessAdvice:
          'Stage along the eastern field edge and avoid penetrating deep into river oxbows on east winds.',
        thermals:
          'Cool morning air settles along the river bend, pulling scent down into oxbow lowlands until sun rises.',
      };
    }

    // LeRoy / Default Osceola County Parcel Analysis
    if (card === 'NW') {
      return {
        driftDirection: 'Northwest (Bear Lake & North Tract)',
        summary: 'Northwest Wind Scent Stream',
        detail:
          'Active Northwest wind carries hunter and property scent directly toward the Northwest perimeter. Southern 1400ft ridge spines and Cadillac Forest approaches remain safe and uncompromised.',
        accessAdvice:
          'Approach silently via the southern Private Road keeping the brisk wind in your face or cross-shoulder.',
        thermals:
          'Morning solar heating pushes updrafts up the 1400ft contour ridges; evening cooling pulls scent down into low pockets.',
      };
    }
    if (card === 'W') {
      return {
        driftDirection: 'West (McGrain Boundary)',
        summary: 'Westward Airflow Corridor',
        detail:
          'A West wind carries scent across toward the western timber boundary. Eastern ridges and central access lanes provide clean upwind staging.',
        accessAdvice:
          'Enter along the eastern lanes, keeping scent drifting out toward the western perimeter.',
        thermals:
          'Perch Lake acts as a thermal buffer in late afternoon, stabilizing scent drift until sundown.',
      };
    }
    if (card === 'SW' || card === 'S') {
      return {
        driftDirection: card === 'SW' ? 'Southwest (South Marsh Basin)' : 'South (Cadillac Forest Unit)',
        summary: 'Southerly Flow Vector',
        detail:
          'Wind pushes scent toward the southern parcel boundaries and Cadillac Forest. Northern Bear Lake shoreline trails and secluded food plots remain clean.',
        accessAdvice:
          'Access from northern ingress points or swing wide to avoid drifting scent into southern deer travel zones.',
        thermals:
          'Gentle winds can swirl around low marsh points during mid-day thermal transitions; maintain scent suppression.',
      };
    }
    if (card === 'N' || card === 'NE') {
      return {
        driftDirection: card === 'N' ? 'North (Bear Lake Basin)' : 'Northeast (Upper Ponds & Swamp)',
        summary: 'Northerly Scent Corridor',
        detail:
          'Active North/Northeast flow carries scent northward toward Bear Lake and northeast ponds. Southern timber ridges and clover food plot approaches stay clear.',
        accessAdvice:
          'Approach from the south lane, keeping your movement downwind of northern bedding thickets.',
        thermals:
          'Strongest scent holding power along low swamp edges; deer bed on high south-facing slopes.',
      };
    }
    return {
      driftDirection: 'East / Southeast (Prosch & Eastern Woods)',
      summary: 'Easterly Flow Corridor',
      detail:
        'East-component winds carry scent eastward across the open parcel. Western timber edges offer high upwind safety.',
      accessAdvice:
        'Utilize the western property edge to enter with clean wind protection.',
      thermals:
        'Watch for evening thermal drainage pooling into low marsh pockets near the south boundary.',
    };
  };

  const parcelAnalysis = getParcelScentAnalysis();

  return (
    <div className="space-y-5">
      {/* ========================================================= */}
      {/* SECTION 1: MAP CONTAINER (Clean satellite with semi-transparent compass) */}
      {/* ========================================================= */}
      <div className="bg-[#111a17] border border-[#233830] rounded-2xl overflow-hidden shadow-xl">
        {/* Top Header Bar */}
        <div className="p-3 sm:p-4 bg-[#14201c] border-b border-[#233830] flex flex-wrap items-center justify-between gap-2 sm:gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-stone-100 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-amber-400" />
                <span>
                  {location?.name ? `${location.name} Wind Direction Map` : 'Stand Wind Direction Map'}
                </span>
              </h3>
              {isPreviewing ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700 font-mono animate-pulse flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Previewing {selectedHour?.hourLabel} Forecast</span>
                </span>
              ) : weather.isCustomDateForecast ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-700 font-mono font-bold flex items-center gap-1 shadow-sm">
                  <Calendar className="w-3 h-3 text-amber-400" />
                  <span>Forecast: {weather.forecastDateLabel || (activeDate && activeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })) || 'Selected Date'}</span>
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800/60 font-mono">
                  Live Wind Direction
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">
              {isPreviewing
                ? `Simulating forecasted ${activeWindSpeed} mph ${activeWindCardinal} (${activeWindDirection}°) wind vector for ${selectedHour?.hourLabel}.`
                : weather.isCustomDateForecast
                ? `High-resolution aerial satellite survey of ${location?.name || 'Hunting Unit'}, MI with wind compass adjusted for ${weather.forecastDateLabel || 'selected date'} (${activeWindSpeed} mph ${activeWindCardinal}).`
                : `High-resolution aerial satellite survey of ${location?.name || 'Hunting Unit'}, MI with tactical semi-transparent wind compass centered on the property.`}
            </p>
          </div>

          {/* View Switcher, Preview Reset & Live Wind Pill */}
          <div className="flex flex-wrap items-center gap-2">
            {isPreviewing && (
              <button
                onClick={() => setSelectedHour(null)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs bg-cyan-900/80 hover:bg-cyan-800 text-cyan-100 border border-cyan-600 transition-colors shadow-sm font-semibold"
                title="Reset map to current live wind"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Return to Live Wind</span>
              </button>
            )}

            {hasAerialMap && (
              <div className="flex p-0.5 bg-[#172520] rounded-xl border border-[#284036]">
                <button
                  onClick={() => setViewMode('aerial')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === 'aerial'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Property Aerial</span>
                </button>
                <button
                  onClick={() => setViewMode('radar')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === 'radar'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Tactical Radar</span>
                </button>
              </div>
            )}

            <div className="flex items-center gap-1.5 bg-[#182621] px-2.5 py-1 rounded-xl border border-[#2b443a] text-xs">
              <Wind className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="font-mono font-bold text-stone-200">
                {activeWindSpeed} mph {activeWindCardinal}
              </span>
            </div>
          </div>
        </div>

        {/* Map Canvas */}
        {viewMode === 'aerial' && hasAerialMap ? (
          <div className="bg-[#0a120f] min-h-[440px] sm:min-h-[500px] p-2 sm:p-5 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Interactive Aerial Satellite Map Container */}
            <div
              style={{ aspectRatio: mapAspectRatio }}
              className={`relative w-full ${
                isLeRoy
                  ? 'max-w-[330px] sm:max-w-[380px]'
                  : isTustin
                  ? 'max-w-md sm:max-w-xl'
                  : 'max-w-sm sm:max-w-md'
              } rounded-2xl overflow-hidden border border-[#2e4c41] shadow-2xl bg-black select-none`}
            >
              {/* Actual Uploaded Satellite Aerial Photo */}
              <img
                src={propertyAerialPhoto}
                alt={`${location?.name || 'Hunt Property'} Satellite Map`}
                className="w-full h-full object-cover"
              />

              {/* Floating Prevailing Wind Vector & Compass Overlay */}
              <div className="absolute top-2.5 right-2.5 z-20 bg-[#0d1613]/85 backdrop-blur-md border border-[#2a453b] rounded-xl p-2 flex flex-col items-center shadow-lg">
                <span className="text-[9px] font-mono font-bold text-amber-400">N</span>
                <div className="w-6 h-6 relative my-0.5">
                  <div
                    className="w-full h-full transition-transform duration-700"
                    style={{ transform: `rotate(${windAngle}deg)` }}
                  >
                    <div className="w-0.5 h-6 bg-gradient-to-b from-rose-500 to-amber-400 mx-auto" />
                    <div className="w-0 h-0 border-x-4 border-x-transparent border-b-6 border-b-rose-500 absolute -top-1 left-1/2 -translate-x-1/2" />
                  </div>
                </div>
                <span className="text-[8px] font-mono text-stone-300">
                  {activeWindSpeed}m {activeWindCardinal}
                </span>
              </div>

              {/* Property Identification Banner & Fullscreen Zoom trigger */}
              <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5">
                <div className="bg-[#0d1613]/85 backdrop-blur-md border border-[#2a453b] px-2.5 py-1 rounded-lg text-[10px] text-stone-200 font-mono shadow-md flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>
                    {location?.name || 'Property'} • Wind Vector
                  </span>
                </div>
                <button
                  onClick={() => setIsZoomModalOpen(true)}
                  aria-label="View full photo"
                  className="bg-[#0d1613]/85 backdrop-blur-md border border-[#2a453b] p-1.5 rounded-lg text-amber-400 hover:text-white hover:bg-amber-600 transition-colors shadow-md"
                  title="Expand Full Photo"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* CENTRAL TACTICAL WIND DIRECTION INDICATOR (Semi-Transparent HUD in middle of map, NO RED CONE) */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none flex items-center justify-center">
                {/* 360-Degree Compass Dial HUD Ring - Semi-Transparent */}
                <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full border-2 border-amber-400/70 bg-[#07130e]/30 backdrop-blur-sm shadow-xl shadow-black/80 flex items-center justify-center">
                  {/* Outer glow ring */}
                  <div className="absolute -inset-1 rounded-full border border-amber-400/30 animate-pulse pointer-events-none" />

                  {/* Crosshairs */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-full h-[1px] bg-emerald-400/40" />
                    <div className="h-full w-[1px] bg-emerald-400/40 absolute" />
                  </div>

                  {/* Compass Cardinals */}
                  <span className="absolute top-1 text-[11px] font-mono font-black text-amber-400 tracking-wider drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">N</span>
                  <span className="absolute bottom-1 text-[10px] font-mono font-bold text-stone-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">S</span>
                  <span className="absolute right-1.5 text-[10px] font-mono font-bold text-stone-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">E</span>
                  <span className="absolute left-1.5 text-[10px] font-mono font-bold text-stone-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">W</span>

                  {/* Compass Ordinals */}
                  <span className="absolute top-5 right-5 text-[8px] font-mono text-stone-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">NE</span>
                  <span className="absolute bottom-5 right-5 text-[8px] font-mono text-stone-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">SE</span>
                  <span className="absolute bottom-5 left-5 text-[8px] font-mono text-stone-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">SW</span>
                  <span className="absolute top-5 left-5 text-[8px] font-mono text-stone-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">NW</span>

                  {/* Rotating Wind Vector Arrow */}
                  <div
                    className="absolute inset-0 flex items-center justify-center transition-transform duration-700 pointer-events-none"
                    style={{ transform: `rotate(${windAngle}deg)` }}
                  >
                    <div className="relative w-1.5 h-28 sm:h-34">
                      {/* Direction Arrow Head */}
                      <div className="w-0 h-0 border-x-6 border-x-transparent border-b-10 border-b-amber-400 absolute -top-2 left-1/2 -translate-x-1/2 drop-shadow-[0_0_10px_rgba(251,191,36,0.95)]" />
                      {/* Arrow Shaft */}
                      <div className="w-1.5 h-full bg-gradient-to-b from-amber-400 via-amber-500 to-rose-500 rounded-full mx-auto" />
                      {/* Feather tail */}
                      <div className="w-3.5 h-0.5 bg-rose-400 rounded-full absolute -bottom-1 left-1/2 -translate-x-1/2" />
                    </div>
                  </div>

                  {/* Center Core Display Badge - Semi-Transparent */}
                  <div className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#0a1813]/40 backdrop-blur-sm border border-amber-400/60 shadow-lg flex flex-col items-center justify-center text-center p-1">
                    <Wind className="w-4 h-4 text-amber-400 animate-pulse mb-0.5" />
                    <div className="text-xs sm:text-sm font-black font-mono text-white leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                      {activeWindCardinal}
                    </div>
                    <div className="text-[11px] sm:text-xs font-bold font-mono text-amber-400 leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                      {activeWindSpeed} <span className="text-[9px] font-normal text-stone-200">MPH</span>
                    </div>
                    <div className="text-[9px] font-mono text-stone-300 mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                      {activeWindDirection}°
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* VIEW 2: TACTICAL RADAR COMPASS (NO RED CONE, Semi-transparent HUD) */
          <div className="bg-[#0c1512] min-h-[380px] sm:min-h-[440px] p-4 sm:p-6 relative flex items-center justify-center overflow-hidden">
            {/* Radar Circles */}
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full border border-[#1e342c] flex items-center justify-center shrink-0">
              <div className="w-50 h-50 sm:w-56 sm:h-56 rounded-full border border-[#1b2f27] flex items-center justify-center">
                <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full border border-[#162922] flex items-center justify-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border border-[#14241e]" />
                </div>
              </div>

              {/* Crosshairs */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-full h-[1px] bg-[#1a3028]" />
                <div className="h-full w-[1px] bg-[#1a3028] absolute" />
              </div>

              {/* Compass Cardinal Labels */}
              <span className="absolute top-2 text-[11px] font-mono font-bold text-amber-400">N</span>
              <span className="absolute bottom-2 text-[11px] font-mono font-bold text-stone-400">S</span>
              <span className="absolute right-2 text-[11px] font-mono font-bold text-stone-400">E</span>
              <span className="absolute left-2 text-[11px] font-mono font-bold text-stone-400">W</span>

              {/* Rotating Wind Vector Arrow */}
              <div
                className="absolute inset-0 flex items-center justify-center transition-transform duration-700 pointer-events-none"
                style={{ transform: `rotate(${windAngle}deg)` }}
              >
                <div className="relative w-1.5 h-32 sm:h-40">
                  <div className="w-0 h-0 border-x-6 border-x-transparent border-b-10 border-b-amber-400 absolute -top-2 left-1/2 -translate-x-1/2 drop-shadow-[0_0_10px_rgba(251,191,36,0.95)]" />
                  <div className="w-1.5 h-full bg-gradient-to-b from-amber-400 via-amber-500 to-rose-500 rounded-full mx-auto" />
                </div>
              </div>

              {/* Center Core HUD - Semi-Transparent */}
              <div className="relative z-20 w-20 h-20 rounded-full bg-[#0a1813]/60 backdrop-blur-sm border-2 border-amber-400/80 shadow-lg flex flex-col items-center justify-center text-center p-1">
                <Wind className="w-4 h-4 text-amber-400 animate-pulse mb-0.5" />
                <div className="text-xs sm:text-sm font-black font-mono text-white leading-tight">
                  {activeWindCardinal}
                </div>
                <div className="text-[11px] font-bold font-mono text-amber-400 leading-none">
                  {activeWindSpeed} <span className="text-[8px] font-normal text-stone-300">MPH</span>
                </div>
                <div className="text-[8px] font-mono text-stone-400 mt-0.5">
                  {activeWindDirection}°
                </div>
              </div>
            </div>

            <div className="absolute bottom-3 left-3 bg-[#111d18]/90 border border-[#274035] rounded-lg p-2 text-[10px] space-y-1">
              <div className="font-mono text-stone-300 font-bold uppercase text-[9px]">Tactical Legend</div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="text-stone-300">Wind Direction Vector</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* SECTION 2: HOURLY WIND FORECAST (RIGHT UNDER THE MAP)     */}
      {/* ========================================================= */}
      <div className="bg-[#111a17] border border-[#233830] rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        {/* Forecast Header & Quick Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#233830] pb-3.5">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <h4 className="font-bold text-sm text-stone-100 flex items-center gap-1.5">
                <span>Hourly Wind Direction & Velocity Forecast</span>
                {weather.isCustomDateForecast && (
                  <span className="text-amber-300 font-semibold text-xs">
                    • {weather.forecastDateLabel || 'Selected Date'}
                  </span>
                )}
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                Interactive Scent Scrubber
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Tap any hour to simulate that hour's wind direction on the map above.
            </p>
          </div>

          {/* Time Filter Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-[#14221d] rounded-xl border border-[#273e34]">
            <button
              onClick={() => setTimeFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                timeFilter === 'all'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              All 24 Hours
            </button>
            <button
              onClick={() => setTimeFilter('morning')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                timeFilter === 'morning'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Sunrise className="w-3.5 h-3.5" />
              <span>Morning Sit (5-11 AM)</span>
            </button>
            <button
              onClick={() => setTimeFilter('evening')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                timeFilter === 'evening'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Sunset className="w-3.5 h-3.5" />
              <span>Evening Sit (3-9 PM)</span>
            </button>
          </div>
        </div>

        {/* Tactical Wind Shift Alert Banner if wind shifts >= 45 degrees */}
        {windShiftInfo && (
          <div className="bg-amber-950/70 border border-amber-600/70 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs shadow-md">
            <div className="flex items-center gap-2 text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong className="text-white">Noticeable Wind Shift Detected:</strong> Direction veers to{' '}
                <strong className="text-amber-300 font-mono">
                  {windShiftInfo.windCardinal} ({windShiftInfo.windDirection}°) at {windShiftInfo.hourLabel}
                </strong>
                . Scent will swing across opposite timber ridges.
              </span>
            </div>
            <button
              onClick={() => setSelectedHour(windShiftInfo)}
              className="text-[11px] font-bold text-amber-300 hover:text-white underline font-mono"
            >
              Preview {windShiftInfo.hourLabel} Shift →
            </button>
          </div>
        )}

        {/* 24-Hour Horizontal Scrollable Card Strip */}
        <div className="relative">
          <div className="flex items-center gap-2.5 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-[#253d33] scrollbar-track-transparent">
            {filteredHourlyData.map((hour, idx) => {
              const isSelected = selectedHour?.time === hour.time;
              const isCurrent =
                (hour.hourLabel === 'Now' || (!weather.isCustomDateForecast && idx === 0)) &&
                !selectedHour;

              // Color based on velocity
              const speedColor =
                hour.windSpeed >= 15
                  ? 'text-rose-400'
                  : hour.windSpeed >= 9
                  ? 'text-amber-400'
                  : 'text-emerald-400';

              return (
                <button
                  key={hour.time}
                  onClick={() => {
                    // Toggle preview on click
                    if (isSelected) {
                      setSelectedHour(null);
                    } else {
                      setSelectedHour(hour);
                    }
                  }}
                  className={`flex flex-col items-center justify-between min-w-[82px] sm:min-w-[92px] p-2.5 rounded-2xl border transition-all shrink-0 cursor-pointer text-left select-none ${
                    isSelected
                      ? 'bg-amber-950/80 border-amber-400 ring-2 ring-amber-400/60 shadow-xl scale-105 z-10'
                      : isCurrent
                      ? 'bg-[#162720] border-emerald-500/80 hover:bg-[#1a2f26]'
                      : 'bg-[#131f1a] border-[#22362f] hover:bg-[#182822] hover:border-[#2f4c40]'
                  }`}
                >
                  {/* Hour Tag */}
                  <div className="flex items-center justify-between w-full mb-1">
                    <span
                      className={`text-[11px] font-mono font-bold ${
                        isSelected
                          ? 'text-amber-300'
                          : isCurrent
                          ? 'text-emerald-400'
                          : 'text-stone-300'
                      }`}
                    >
                      {hour.hourLabel}
                    </span>
                    {isCurrent && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    )}
                  </div>

                  {/* Wind Direction Mini-Compass Needle Dial */}
                  <div className="relative my-2 w-10 h-10 rounded-full border border-[#2b443a] bg-[#0c1613] flex items-center justify-center shadow-inner">
                    <span className="absolute -top-1 text-[7px] font-mono text-stone-500 font-bold">N</span>
                    <div
                      className="w-full h-full flex items-center justify-center transition-transform duration-500"
                      style={{ transform: `rotate(${hour.windDirection}deg)` }}
                    >
                      <div className="relative w-1 h-7">
                        <div className="w-0 h-0 border-x-3 border-x-transparent border-b-6 border-b-amber-400 absolute -top-1 left-1/2 -translate-x-1/2 drop-shadow-sm" />
                        <div className="w-0.5 h-full bg-gradient-to-b from-amber-400 to-rose-500 mx-auto rounded-full" />
                      </div>
                    </div>
                  </div>

                  {/* Wind Velocity */}
                  <div className="text-center w-full">
                    <div className={`text-xs font-mono font-black ${speedColor} leading-tight`}>
                      {hour.windSpeed} <span className="text-[9px] font-normal text-stone-400">mph</span>
                    </div>
                    <div className="text-[10px] font-mono font-bold text-stone-200 mt-0.5">
                      {hour.windCardinal}
                    </div>
                    <div className="text-[9px] font-mono text-stone-400 leading-none">
                      {hour.windDirection}°
                    </div>
                  </div>

                  {/* Temp & Rain Indicator */}
                  <div className="w-full pt-2 mt-2 border-t border-[#233830] flex items-center justify-between text-[10px] font-mono text-stone-400">
                    <span>{hour.temp}°</span>
                    <span className={hour.rainProb > 25 ? 'text-cyan-400 font-bold' : 'text-stone-500'}>
                      {hour.rainProb}%
                    </span>
                  </div>

                  {/* Click to Preview Action Pill */}
                  <div className="mt-1 w-full text-center">
                    <span
                      className={`text-[8px] font-mono uppercase tracking-wider block py-0.5 rounded ${
                        isSelected
                          ? 'bg-amber-400 text-stone-950 font-black'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      {isSelected ? 'Active' : 'Preview'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tactical Sit Windows (AM vs PM Sit Insights) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {/* AM Sit Window Card */}
          <div className="bg-[#14201c] border border-[#233830] rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                <Sunrise className="w-4 h-4 text-amber-400" />
                <span>Morning Sit Window (Dawn - 11:00 AM)</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#1a2d26] text-emerald-300 font-mono">
                AM Thermals
              </span>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              Early morning starts with calm down-valley thermal drainage. As the sun warms ridge slopes around 8:30 AM,
              thermals reverse into upward drafts. Set up above bedding benches before sunrise to catch rutting bucks scent-checking ridge corridors.
            </p>
          </div>

          {/* PM Sit Window Card */}
          <div className="bg-[#14201c] border border-[#233830] rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                <Sunset className="w-4 h-4 text-amber-400" />
                <span>Evening Sit Window (3:00 PM - Sunset)</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#1a2d26] text-amber-300 font-mono">
                PM Settle
              </span>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              Afternoon winds tend to stabilize horizontally across open fields and clearings. In the final 45 minutes of legal shooting light,
              cooling shadows trigger downward thermal drainage into bottom marshes and creeks.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 3: PARCEL WIND & SCENT INTELLIGENCE               */}
      {/* ========================================================= */}
      <div className="bg-[#111a17] border border-[#233830] rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        {/* Property Header */}
        <div className="flex items-start justify-between border-b border-[#243932] pb-3 gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                {isPreviewing
                  ? `Forecast Vector (${selectedHour?.hourLabel})`
                  : weather.isCustomDateForecast
                  ? `Forecast Vector (${weather.forecastDateLabel || 'Selected Date'})`
                  : 'Live Parcel Wind Vector'}
              </span>
            </div>
            <h4 className="text-base font-bold text-stone-100 mt-1">
              {location?.name || 'Hunting Unit'}, MI Parcel Intelligence
            </h4>
            <p className="text-xs text-stone-300 mt-0.5">
              {isTustin
                ? 'Osceola Co. • Carey & Janke 160th Ave Tract'
                : isLeRoy
                ? 'Osceola Co. • Bear Lake & Cadillac Forest Tract'
                : isRosebush
                ? 'Isabella Co. • Feinaur Family Chippewa River Tract'
                : location?.acreage || 'Whitetail Hunting Unit'}
            </p>
          </div>

          <div className="text-right shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-950 text-amber-300 border border-amber-700 shadow-md">
              <Wind className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>{activeWindCardinal} {activeWindSpeed} mph</span>
            </span>
          </div>
        </div>

        {/* 4-Stat Live Telemetry Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-[#15231e] p-2.5 rounded-xl border border-[#273d34] text-center">
            <span className="text-[10px] font-mono text-stone-400 block uppercase">Heading</span>
            <span className="text-sm font-mono font-bold text-amber-400">
              {activeWindCardinal} ({activeWindDirection}°)
            </span>
          </div>
          <div className="bg-[#15231e] p-2.5 rounded-xl border border-[#273d34] text-center">
            <span className="text-[10px] font-mono text-stone-400 block uppercase">Speed</span>
            <span className="text-sm font-mono font-bold text-stone-100">
              {activeWindSpeed} <span className="text-[10px] text-stone-400 font-normal">mph</span>
            </span>
          </div>
          <div className="bg-[#15231e] p-2.5 rounded-xl border border-[#273d34] text-center">
            <span className="text-[10px] font-mono text-stone-400 block uppercase">Barometer</span>
            <span className="text-sm font-mono font-bold text-emerald-400">
              {activePressure} <span className="text-[10px] text-stone-400 font-normal">inHg</span>
            </span>
          </div>
          <div className="bg-[#15231e] p-2.5 rounded-xl border border-[#273d34] text-center">
            <span className="text-[10px] font-mono text-stone-400 block uppercase">Temp</span>
            <span className="text-sm font-mono font-bold text-stone-100">
              {activeTemp}°F
            </span>
          </div>
        </div>

        {/* Scent Dispersion Drift Path */}
        <div className="space-y-1">
          <div className="text-[10px] font-mono uppercase text-amber-400 font-bold flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Wind className="w-3.5 h-3.5 text-amber-400" />
              <span>Scent Drift Corridor</span>
            </span>
            <span className="text-amber-300 text-[10px] font-bold">
              Carrying: {parcelAnalysis.driftDirection}
            </span>
          </div>
          <p className="text-xs text-stone-200 bg-[#172621] p-3 rounded-xl border border-[#294237] leading-relaxed">
            {parcelAnalysis.detail}
          </p>
        </div>

        {/* Thermal Drafts & Topography */}
        <div className="space-y-1">
          <div className="text-[10px] font-mono uppercase text-stone-400 font-bold flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-amber-300" />
            <span>Terrain & Thermal Draft Dynamics</span>
          </div>
          <p className="text-xs text-stone-300 bg-[#131f1a] p-2.5 rounded-lg border border-[#20332c] leading-relaxed">
            {parcelAnalysis.thermals}
          </p>
        </div>

        {/* Stealth Access Route */}
        <div className="space-y-1">
          <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold flex items-center gap-1">
            <Navigation className="w-3 h-3" />
            <span>Recommended Stealth Ingress Route</span>
          </div>
          <p className="text-xs text-stone-300 bg-[#14201c] p-2.5 rounded-lg border border-[#20332c] leading-relaxed">
            {parcelAnalysis.accessAdvice}
          </p>
        </div>
      </div>

      {/* ========================================================= */}
      {/* FULLSCREEN PHOTO ZOOM MODAL (Clean map, semi-transparent compass, NO RED CONE)  */}
      {/* ========================================================= */}
      {isZoomModalOpen && propertyAerialPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col p-3 sm:p-6 overflow-y-auto"
          onClick={() => setIsZoomModalOpen(false)}
        >
          <div
            className="relative max-w-3xl w-full mx-auto my-auto bg-[#0d1613] border border-[#2a453b] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-3.5 bg-[#121f1a] border-b border-[#253c33] flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-stone-100 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-amber-400" />
                  <span>{location?.name || 'Hunting Unit'}, MI Aerial Satellite Survey</span>
                </h4>
                <p className="text-[11px] text-stone-400">
                  {isTustin
                    ? 'Osceola Co. • Carey & Janke 160th Ave Tract'
                    : isLeRoy
                    ? 'Osceola Co. • Bear Lake & Cadillac Forest Tract'
                    : isRosebush
                    ? 'Isabella Co. • Feinaur Family Chippewa River Tract'
                    : 'Whitetail Hunting Unit'}{' '}
                  • Live Tactical Wind Direction Vector
                </p>
              </div>
              <button
                onClick={() => setIsZoomModalOpen(false)}
                className="p-1.5 rounded-lg bg-[#182822] text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Photo Container */}
            <div className="relative p-2 sm:p-4 bg-black flex items-center justify-center max-h-[75vh] overflow-y-auto">
              <div
                style={{ aspectRatio: mapAspectRatio }}
                className={`relative w-full ${
                  isLeRoy ? 'max-w-xs sm:max-w-sm' : isTustin ? 'max-w-md sm:max-w-2xl' : 'max-w-lg'
                } rounded-xl overflow-hidden shadow-lg select-none`}
              >
                <img
                  src={propertyAerialPhoto}
                  alt={`${location?.name || 'Hunting Unit'} Full Property Map`}
                  className="w-full h-full object-cover"
                />

                {/* Central Tactical Wind Direction Indicator in Modal (Semi-Transparent, NO RED CONE) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none flex items-center justify-center">
                  {/* 360-Degree Compass Dial HUD Ring - Semi-Transparent */}
                  <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-full border-2 border-amber-400/70 bg-[#07130e]/30 backdrop-blur-sm shadow-2xl shadow-black/90 flex items-center justify-center">
                    <div className="absolute -inset-1.5 rounded-full border border-amber-400/30 animate-pulse pointer-events-none" />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-full h-[1px] bg-emerald-400/40" />
                      <div className="h-full w-[1px] bg-emerald-400/40 absolute" />
                    </div>
                    <span className="absolute top-1.5 text-xs font-mono font-black text-amber-400 tracking-wider drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">N</span>
                    <span className="absolute bottom-1.5 text-[11px] font-mono font-bold text-stone-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">S</span>
                    <span className="absolute right-2 text-[11px] font-mono font-bold text-stone-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">E</span>
                    <span className="absolute left-2 text-[11px] font-mono font-bold text-stone-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">W</span>

                    {/* Rotating Vector Arrow */}
                    <div
                      className="absolute inset-0 flex items-center justify-center transition-transform duration-700 pointer-events-none"
                      style={{ transform: `rotate(${windAngle}deg)` }}
                    >
                      <div className="relative w-2 h-34 sm:h-40">
                        <div className="w-0 h-0 border-x-7 border-x-transparent border-b-12 border-b-amber-400 absolute -top-2.5 left-1/2 -translate-x-1/2 drop-shadow-[0_0_12px_rgba(251,191,36,0.95)]" />
                        <div className="w-2 h-full bg-gradient-to-b from-amber-400 via-amber-500 to-rose-500 rounded-full mx-auto" />
                        <div className="w-4 h-0.5 bg-rose-400 rounded-full absolute -bottom-1 left-1/2 -translate-x-1/2" />
                      </div>
                    </div>

                    {/* Center Badge - Semi-Transparent */}
                    <div className="relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#0a1813]/40 backdrop-blur-sm border border-amber-400/60 shadow-lg flex flex-col items-center justify-center text-center p-1">
                      <Wind className="w-5 h-5 text-amber-400 animate-pulse mb-0.5" />
                      <div className="text-sm sm:text-base font-black font-mono text-white leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                        {activeWindCardinal}
                      </div>
                      <div className="text-xs sm:text-sm font-bold font-mono text-amber-400 leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                        {activeWindSpeed} <span className="text-[10px] font-normal text-stone-200">MPH</span>
                      </div>
                      <div className="text-[10px] font-mono text-stone-300 mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                        {activeWindDirection}°
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Notes */}
            <div className="p-3 bg-[#111a17] border-t border-[#233830] text-[11px] text-stone-300 flex flex-wrap items-center justify-between gap-2 font-mono">
              <div className="flex items-center gap-3">
                <span className="text-amber-400 font-bold">
                  Wind: {activeWindSpeed} mph {activeWindCardinal} ({activeWindDirection}°)
                </span>
                <span className="text-stone-300">
                  Carrying: <span className="text-amber-300 font-semibold">{parcelAnalysis.driftDirection}</span>
                </span>
              </div>
              <button
                onClick={() => setIsZoomModalOpen(false)}
                className="px-3 py-1 bg-[#1a2d26] hover:bg-[#233d34] text-stone-200 rounded-lg border border-[#2b443a] text-xs font-sans transition-colors"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
