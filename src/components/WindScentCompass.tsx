import React, { useState, useEffect } from 'react';
import { StandHotspot, WeatherData, SavedLocation } from '../types';
import {
  Wind,
  ShieldCheck,
  ShieldAlert,
  Compass,
  MapPin,
  Crosshair,
  Layers,
  Image as ImageIcon,
  Maximize2,
  Navigation,
  X,
  Camera,
  Home,
} from 'lucide-react';

interface WindScentCompassProps {
  weather: WeatherData;
  standSpots: StandHotspot[];
  location?: SavedLocation;
}

export const WindScentCompass: React.FC<WindScentCompassProps> = ({
  weather,
  standSpots,
  location,
}) => {
  const [selectedStand, setSelectedStand] = useState<StandHotspot | null>(
    standSpots[0] || null
  );

  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);

  // Property aerial photo (Rosebush MI uploaded map or location propertyMapUrl)
  const propertyAerialPhoto =
    location?.propertyMapUrl ||
    (location?.name?.toLowerCase().includes('rosebush')
      ? '/assets/aistudio/RosebushHunt_229e051e.png'
      : undefined);

  const hasAerialMap = Boolean(propertyAerialPhoto);

  // If the location has an uploaded aerial property map (like Rosebush, MI), default to aerial view
  const [viewMode, setViewMode] = useState<'aerial' | 'radar'>(
    hasAerialMap ? 'aerial' : 'radar'
  );

  // Sync viewMode and selectedStand when location or standSpots update
  useEffect(() => {
    if (hasAerialMap) {
      setViewMode('aerial');
    }
    if (standSpots && standSpots.length > 0) {
      setSelectedStand(standSpots[0]);
    }
  }, [location?.id, location?.name, hasAerialMap]);

  const windAngle = weather.windDirection; // 0 is North
  const downwindAngle = (windAngle + 180) % 360; // Scent blows downwind

  // Helper to determine if stand is safe with current wind direction
  const evaluateStandWind = (
    stand: StandHotspot
  ): { safe: boolean; status: 'Ideal' | 'Marginal' | 'Compromised'; reason: string } => {
    const isPreferred = stand.windDirectionPreferred.includes(weather.windCardinal);
    if (isPreferred) {
      return {
        safe: true,
        status: 'Ideal',
        reason: `Prevailing ${weather.windCardinal} wind carries hunter scent away from expected deer approach corridors into open or non-target zones.`,
      };
    }
    // Check neighboring cardinal
    const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const currentIdx = cardinals.indexOf(weather.windCardinal);
    const hasNeighbor = stand.windDirectionPreferred.some((pref) => {
      const prefIdx = cardinals.indexOf(pref);
      return Math.abs(currentIdx - prefIdx) <= 1 || Math.abs(currentIdx - prefIdx) === 7;
    });

    if (hasNeighbor) {
      return {
        safe: true,
        status: 'Marginal',
        reason: `Cross-wind situation. Thermal drift could swirl scent into secondary deer trails. Maintain strict scent control.`,
      };
    }

    return {
      safe: false,
      status: 'Compromised',
      reason: `Wind is blowing directly toward bedding sanctuaries or main river funnels. Highly likely to spook approaching deer. Avoid this stand today.`,
    };
  };

  return (
    <div className="bg-[#111a17] border border-[#233830] rounded-2xl overflow-hidden shadow-xl">
      {/* Top Header Bar */}
      <div className="p-3 sm:p-4 bg-[#14201c] border-b border-[#233830] flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-stone-100 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-amber-400" />
              <span>
                {location?.name ? `${location.name} Stand Wind & Scent Planner` : 'Stand Wind & Scent Planner'}
              </span>
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800/60 font-mono">
              Live Wind Direction
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mt-0.5">
            Real-time thermal scent cone analysis to prevent spooking mature bucks before they step into shooting lanes.
          </p>
        </div>

        {/* View Switcher & Live Wind Pill */}
        <div className="flex items-center gap-2">
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
              {weather.windSpeed} mph {weather.windCardinal}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* VIEW 1: AERIAL PROPERTY MAP (Shown for Rosebush, MI with uploaded photo) */}
        {viewMode === 'aerial' && hasAerialMap ? (
          <div className="lg:col-span-7 bg-[#0a120f] min-h-[420px] p-2 sm:p-4 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-[#233830] relative overflow-hidden">
            {/* Interactive Aerial Satellite Map Container */}
            <div
              style={{ aspectRatio: '1012 / 1307' }}
              className="relative w-full max-w-sm sm:max-w-md rounded-2xl overflow-hidden border border-[#2e4c41] shadow-2xl bg-black select-none"
            >
              {/* Actual Uploaded Satellite Aerial Photo */}
              <img
                src={propertyAerialPhoto}
                alt={`${location?.name || 'Rosebush'} Property Satellite Map`}
                className="w-full h-full object-cover"
              />

              {/* Floating Prevailing Wind Vector & Compass Overlay */}
              <div className="absolute top-2.5 right-2.5 z-20 bg-[#0d1613]/90 backdrop-blur-md border border-[#2a453b] rounded-xl p-2 flex flex-col items-center shadow-lg">
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
                  {weather.windSpeed}m {weather.windCardinal}
                </span>
              </div>

              {/* Property Identification Banner & Fullscreen Zoom trigger */}
              <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5">
                <div className="bg-[#0d1613]/90 backdrop-blur-md border border-[#2a453b] px-2.5 py-1 rounded-lg text-[10px] text-stone-200 font-mono shadow-md flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>{location?.name || 'Rosebush'}, MI Property</span>
                </div>
                <button
                  onClick={() => setIsZoomModalOpen(true)}
                  aria-label="View full photo"
                  className="bg-[#0d1613]/90 backdrop-blur-md border border-[#2a453b] p-1.5 rounded-lg text-amber-400 hover:text-white hover:bg-amber-600 transition-colors shadow-md"
                  title="Expand Full Photo"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Scent Dispersion Cone Overlay Emanating from Selected Stand */}
              {selectedStand && (
                <div
                  className="absolute pointer-events-none transition-all duration-700 z-10"
                  style={{
                    left: `${selectedStand.x}%`,
                    top: `${selectedStand.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div
                    className="relative w-0 h-0"
                    style={{ transform: `rotate(${downwindAngle}deg)` }}
                  >
                    <div
                      className="w-0 h-0 border-x-[45px] border-x-transparent border-t-[140px] border-t-rose-600/35 filter blur-[2px]"
                      style={{ transform: 'translate(-50%, -100%)' }}
                    />
                    <div
                      className="w-0 h-0 border-x-[30px] border-x-transparent border-t-[125px] border-t-rose-500/40 absolute"
                      style={{ transform: 'translate(-50%, -100%)' }}
                    />
                  </div>
                </div>
              )}

              {/* Overlaid Stand Markers from photo */}
              {standSpots.map((stand, idx) => {
                const evalResult = evaluateStandWind(stand);
                const isSelected = selectedStand?.id === stand.id;

                return (
                  <button
                    key={stand.id}
                    onClick={() => setSelectedStand(stand)}
                    style={{
                      left: `${stand.x}%`,
                      top: `${stand.y}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className={`absolute z-30 p-1.5 rounded-full border-2 transition-all group ${
                      isSelected
                        ? 'scale-125 ring-4 ring-amber-400/50 shadow-xl'
                        : 'hover:scale-110 shadow-md'
                    } ${
                      evalResult.status === 'Ideal'
                        ? 'bg-emerald-600 border-white text-white'
                        : evalResult.status === 'Marginal'
                        ? 'bg-amber-600 border-white text-white'
                        : 'bg-rose-700 border-white text-white'
                    }`}
                    title={`${stand.name}: ${evalResult.status}`}
                  >
                    <Crosshair className="w-3.5 h-3.5" />

                    {/* Stand Label Tooltip Banner */}
                    <span
                      className={`absolute -bottom-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold whitespace-nowrap shadow-lg border transition-opacity ${
                        isSelected
                          ? 'bg-[#0f1915] text-amber-300 border-amber-500/70 opacity-100'
                          : 'bg-[#0f1915]/90 text-stone-300 border-[#284036] opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      #{idx + 1} {stand.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Bottom Map Note */}
            <div className="mt-2 text-[10px] text-stone-400 flex items-center justify-between w-full max-w-sm sm:max-w-md px-1 font-mono">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Ideal Wind
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Marginal Cross
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-600" /> Downwind Scent
              </span>
            </div>
          </div>
        ) : (
          /* VIEW 2: TACTICAL RADAR COMPASS (Default or switchable) */
          <div className="lg:col-span-7 bg-[#0c1512] min-h-[340px] sm:min-h-[380px] p-3 sm:p-6 relative flex items-center justify-center border-b lg:border-b-0 lg:border-r border-[#233830] overflow-hidden">
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

              {/* Scent Dispersion Danger Cone */}
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform duration-700"
                style={{ transform: `rotate(${downwindAngle}deg)` }}
              >
                <div
                  className="w-0 h-0 border-x-[50px] border-x-transparent border-t-[140px] border-t-rose-600/30 filter blur-sm"
                  style={{ transform: 'translateY(-70px)' }}
                />
                <div
                  className="w-0 h-0 border-x-[35px] border-x-transparent border-t-[130px] border-t-rose-500/40 absolute"
                  style={{ transform: 'translateY(-65px)' }}
                />
              </div>

              {/* Center Hunter Stand Marker */}
              <div className="absolute z-20 w-8 h-8 rounded-full bg-amber-600/90 border-2 border-white flex items-center justify-center shadow-lg shadow-amber-950">
                <Crosshair className="w-4 h-4 text-white" />
              </div>

              {/* Stands Pinned around Terrain */}
              {standSpots.map((stand, idx) => {
                const evalResult = evaluateStandWind(stand);
                const angleRad = ((stand.x * 3.6 - 90) * Math.PI) / 180;
                const radius = 105;
                const left = 50 + (radius * Math.cos(angleRad)) / 1.6;
                const top = 50 + (radius * Math.sin(angleRad)) / 1.6;
                const isSelected = selectedStand?.id === stand.id;

                return (
                  <button
                    key={stand.id}
                    onClick={() => setSelectedStand(stand)}
                    style={{ left: `${left}%`, top: `${top}%` }}
                    className={`absolute z-30 -translate-x-1/2 -translate-y-1/2 p-1.5 rounded-full border-2 transition-all group ${
                      isSelected
                        ? 'scale-125 ring-4 ring-amber-400/30'
                        : 'hover:scale-110'
                    } ${
                      evalResult.status === 'Ideal'
                        ? 'bg-emerald-600 border-white text-white'
                        : evalResult.status === 'Marginal'
                        ? 'bg-amber-600 border-white text-white'
                        : 'bg-rose-700 border-white text-white'
                    }`}
                    title={`${stand.name}: ${evalResult.status}`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="absolute top-6 left-1/2 -translate-x-1/2 bg-[#0c1512] border border-[#274035] text-[9px] font-mono px-1.5 py-0.5 rounded text-stone-200 whitespace-nowrap shadow-md">
                      Stand #{idx + 1}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="absolute bottom-3 left-3 bg-[#111d18]/90 border border-[#274035] rounded-lg p-2 text-[10px] space-y-1">
              <div className="font-mono text-stone-300 font-bold uppercase text-[9px]">Scent Cone Legend</div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-600/60" />
                <span className="text-stone-300">Downwind Scent Cone</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-600" />
                <span className="text-stone-300">Favorable Wind</span>
              </div>
            </div>
          </div>
        )}

        {/* Selected Stand Tactical Analysis Panel */}
        <div className="lg:col-span-5 p-4 sm:p-5 flex flex-col justify-between bg-[#111c18]">
          {selectedStand ? (
            (() => {
              const evalResult = evaluateStandWind(selectedStand);
              return (
                <div className="space-y-4">
                  <div className="flex items-start justify-between border-b border-[#243932] pb-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            evalResult.status === 'Ideal'
                              ? 'bg-emerald-400'
                              : evalResult.status === 'Marginal'
                              ? 'bg-amber-400'
                              : 'bg-rose-400'
                          } animate-ping`}
                        />
                        <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                          Stand Location Assessment
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-stone-100 mt-0.5">{selectedStand.name}</h4>
                      <div className="text-xs text-stone-300 mt-1 flex items-center gap-2">
                        <span className="capitalize">{selectedStand.type.replace('_', ' ')}</span>
                        <span>•</span>
                        <span className="capitalize text-emerald-300 font-medium font-mono">
                          Best Time: {selectedStand.bestTime}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                          evalResult.status === 'Ideal'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                            : evalResult.status === 'Marginal'
                            ? 'bg-amber-950 text-amber-300 border border-amber-700'
                            : 'bg-rose-950 text-rose-300 border border-rose-700'
                        }`}
                      >
                        {evalResult.status === 'Ideal' ? (
                          <ShieldCheck className="w-3.5 h-3.5" />
                        ) : (
                          <ShieldAlert className="w-3.5 h-3.5" />
                        )}
                        <span>{evalResult.status} Wind</span>
                      </span>
                    </div>
                  </div>

                  {/* Wind Direction Compatibility */}
                  <div className="bg-[#15231e] p-3 rounded-xl border border-[#273d34] space-y-2">
                    <div className="text-[10px] font-mono text-stone-400 uppercase">Preferred Wind Directions:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'].map((dir) => {
                        const isDirPreferred = selectedStand.windDirectionPreferred.includes(dir);
                        const isCurrent = weather.windCardinal === dir;
                        return (
                          <span
                            key={dir}
                            className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                              isCurrent && isDirPreferred
                                ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                                : isDirPreferred
                                ? 'bg-[#1e342b] text-emerald-300 border border-emerald-700/50'
                                : isCurrent
                                ? 'bg-rose-900/60 text-rose-300 border border-rose-700'
                                : 'bg-[#131c19] text-stone-500'
                            }`}
                          >
                            {dir}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tactical Reason */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono uppercase text-amber-400 font-bold">
                      Scent Dispersion Dynamics
                    </div>
                    <p className="text-xs text-stone-200 bg-[#172621] p-3 rounded-xl border border-[#294237] leading-relaxed">
                      {evalResult.reason}
                    </p>
                  </div>

                  {/* Ingress / Egress Stealth Advice */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
                      Stealth Ingress & Egress Route
                    </div>
                    <p className="text-xs text-stone-300 bg-[#14201c] p-2.5 rounded-lg border border-[#20332c] leading-relaxed">
                      Approach keeping the prevailing {weather.windCardinal} wind in your face or cross-shoulder.
                      Ascend stand at least 45 minutes prior to first legal shooting light.
                    </p>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-stone-400 text-xs">
              Select a stand pin on the map to view scent safety.
            </div>
          )}

          {/* Stand Quick List */}
          <div className="mt-4 pt-3 border-t border-[#233830]">
            <div className="text-[10px] font-mono uppercase text-stone-400 mb-1.5">Stand Selector</div>
            <div className="flex flex-wrap gap-1.5">
              {standSpots.map((stand, i) => (
                <button
                  key={stand.id}
                  onClick={() => setSelectedStand(stand)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                    selectedStand?.id === stand.id
                      ? 'bg-amber-600 text-white border-amber-400 font-semibold shadow-sm'
                      : 'bg-[#15231e] text-stone-300 border-[#273d34] hover:border-amber-600/50'
                  }`}
                >
                  #{i + 1} {stand.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Photo Zoom Modal */}
      {isZoomModalOpen && propertyAerialPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col p-3 sm:p-6 overflow-y-auto"
          onClick={() => setIsZoomModalOpen(false)}
        >
          <div
            className="relative max-w-2xl w-full mx-auto my-auto bg-[#0d1613] border border-[#2a453b] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-3.5 bg-[#121f1a] border-b border-[#253c33] flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-stone-100 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-amber-400" />
                  <span>{location?.name || 'Rosebush'}, MI Property Satellite Survey</span>
                </h4>
                <p className="text-[11px] text-stone-400">
                  Branch Chippewa River tract • Ladder stands, core crossing, and trail camera grid
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
            <div className="relative p-2 bg-black flex items-center justify-center">
              <div
                style={{ aspectRatio: '1012 / 1307' }}
                className="relative w-full max-w-lg rounded-xl overflow-hidden shadow-lg select-none"
              >
                <img
                  src={propertyAerialPhoto}
                  alt={`${location?.name || 'Rosebush'} Full Property Map`}
                  className="w-full h-full object-cover"
                />

                {/* Overlaid Stand Markers */}
                {standSpots.map((stand, idx) => {
                  const evalResult = evaluateStandWind(stand);
                  const isSelected = selectedStand?.id === stand.id;

                  return (
                    <button
                      key={stand.id}
                      onClick={() => setSelectedStand(stand)}
                      style={{
                        left: `${stand.x}%`,
                        top: `${stand.y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      className={`absolute z-30 p-1.5 rounded-full border-2 transition-all group ${
                        isSelected
                          ? 'scale-125 ring-4 ring-amber-400/50 shadow-xl'
                          : 'hover:scale-110 shadow-md'
                      } ${
                        evalResult.status === 'Ideal'
                          ? 'bg-emerald-600 border-white text-white'
                          : evalResult.status === 'Marginal'
                          ? 'bg-amber-600 border-white text-white'
                          : 'bg-rose-700 border-white text-white'
                      }`}
                    >
                      <Crosshair className="w-3.5 h-3.5" />
                      <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#0f1915] text-amber-300 border border-amber-500/70 whitespace-nowrap shadow-lg">
                        #{idx + 1} {stand.name.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer Notes */}
            <div className="p-3 bg-[#111a17] border-t border-[#233830] text-[11px] text-stone-300 flex flex-wrap items-center justify-between gap-2 font-mono">
              <div className="flex items-center gap-3">
                <span className="text-amber-400 font-bold">
                  Wind: {weather.windSpeed} mph {weather.windCardinal}
                </span>
                <span className="text-stone-400">
                  Selected Stand: <span className="text-stone-100">{selectedStand?.name || 'None'}</span>
                </span>
              </div>
              <button
                onClick={() => setIsZoomModalOpen(false)}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold font-sans transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
