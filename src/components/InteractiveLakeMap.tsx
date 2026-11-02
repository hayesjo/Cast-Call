import React, { useState } from 'react';
import { Hotspot, SavedLocation, WeatherData } from '../types';
import {
  Compass,
  Wind,
  Navigation,
  Info,
  Layers,
  Sparkles,
  ArrowRight,
  Maximize2,
  CheckCircle2,
} from 'lucide-react';

interface InteractiveLakeMapProps {
  location: SavedLocation;
  weather: WeatherData;
  hotspots: Hotspot[];
  onSelectHotspot?: (spot: Hotspot) => void;
}

export const InteractiveLakeMap: React.FC<InteractiveLakeMapProps> = ({
  location,
  weather,
  hotspots,
  onSelectHotspot,
}) => {
  const [selectedSpot, setSelectedSpot] = useState<Hotspot | null>(hotspots[0] || null);
  const [showContours, setShowContours] = useState(true);
  const [showGrassLayer, setShowGrassLayer] = useState(true);
  const [showWindOverlay, setShowWindOverlay] = useState(true);

  const windAngle = weather.windDirection; // degrees (0 is North)

  return (
    <div className="bg-[#111a17] border border-[#233830] rounded-2xl overflow-hidden shadow-xl">
      {/* Map Control Bar */}
      <div className="p-4 bg-[#14201c] border-b border-[#233830] flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-stone-100 flex items-center gap-1.5">
              <span>Tactical Lake Bathymetric & Hotspot Chart</span>
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono">
              Live Contours
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mt-0.5">
            Click any hotspot pin to inspect depth, ambush positioning, and optimal boat approach angles.
          </p>
        </div>

        {/* Layer Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowContours(!showContours)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              showContours
                ? 'bg-emerald-900/60 text-emerald-300 border-emerald-700/60'
                : 'bg-[#182621] text-stone-400 border-[#2b443a]'
            }`}
          >
            Contours
          </button>
          <button
            onClick={() => setShowGrassLayer(!showGrassLayer)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              showGrassLayer
                ? 'bg-emerald-900/60 text-emerald-300 border-emerald-700/60'
                : 'bg-[#182621] text-stone-400 border-[#2b443a]'
            }`}
          >
            Grass & Timber
          </button>
          <button
            onClick={() => setShowWindOverlay(!showWindOverlay)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1 transition-colors ${
              showWindOverlay
                ? 'bg-emerald-900/60 text-emerald-300 border-emerald-700/60'
                : 'bg-[#182621] text-stone-400 border-[#2b443a]'
            }`}
          >
            <Wind className="w-3 h-3" />
            <span>Wind {weather.windCardinal}</span>
          </button>
        </div>
      </div>

      {/* Map Grid Canvas & Hotspot Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Interactive SVG Lake Canvas (7 cols on large screens) */}
        <div className="lg:col-span-7 relative bg-[#09110e] min-h-[380px] sm:min-h-[440px] flex items-center justify-center p-4 overflow-hidden border-b lg:border-b-0 lg:border-r border-[#233830]">
          {/* Compass Rose */}
          <div className="absolute top-3 right-3 z-10 bg-[#121e1a]/90 backdrop-blur-sm border border-[#2a453b] rounded-xl p-2 flex flex-col items-center">
            <span className="text-[10px] font-mono text-emerald-400 font-bold">N</span>
            <div className="w-6 h-6 relative my-0.5">
              <div
                className="w-full h-full transition-transform duration-700"
                style={{ transform: `rotate(${windAngle}deg)` }}
              >
                <div className="w-0.5 h-6 bg-gradient-to-b from-rose-500 to-emerald-400 mx-auto" />
                <div className="w-0 h-0 border-x-4 border-x-transparent border-b-6 border-b-rose-500 absolute -top-1 left-1/2 -translate-x-1/2" />
              </div>
            </div>
            <span className="text-[9px] font-mono text-stone-400">
              {weather.windSpeed} mph {weather.windCardinal}
            </span>
          </div>

          {/* Depth Legend */}
          <div className="absolute bottom-3 left-3 z-10 bg-[#121e1a]/90 backdrop-blur-sm border border-[#2a453b] rounded-lg p-2 text-[10px] space-y-1">
            <div className="font-mono text-stone-300 font-bold uppercase text-[9px]">Depth Gradients</div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#165b4c]" />
              <span className="text-stone-300">0 - 5 ft (Shallow Flats)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#0e3b33]" />
              <span className="text-stone-300">6 - 15 ft (Secondary Shelves)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#072420]" />
              <span className="text-stone-300">16 - 35+ ft (Creek/River Basin)</span>
            </div>
          </div>

          {/* SVG Map of the Lake */}
          <svg
            viewBox="0 0 600 440"
            className="w-full h-full max-h-[440px] drop-shadow-2xl select-none"
          >
            <defs>
              {/* Pattern for submerged vegetation / grass */}
              <pattern id="grassPattern" width="16" height="16" patternUnits="userSpaceOnUse">
                <path d="M 4 12 Q 6 4 8 2 Q 10 4 12 12" stroke="#22c55e" strokeWidth="1" fill="none" opacity="0.45" />
                <circle cx="8" cy="14" r="1" fill="#16a34a" opacity="0.4" />
              </pattern>

              {/* Water Gradient */}
              <radialGradient id="waterDepthGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#051714" />
                <stop offset="60%" stopColor="#0b2c26" />
                <stop offset="100%" stopColor="#144b3f" />
              </radialGradient>

              {/* Wind Arrow Marker */}
              <marker id="windArrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#34d399" opacity="0.7" />
              </marker>
            </defs>

            {/* Shoreline / Surrounding Land Terrain */}
            <rect width="600" height="440" fill="#0d1815" />

            {/* Topographic Land Contours */}
            <path d="M 0 60 Q 150 40 300 80 T 600 40" stroke="#1f362f" strokeWidth="1" fill="none" />
            <path d="M 0 380 Q 200 410 400 370 T 600 400" stroke="#1f362f" strokeWidth="1" fill="none" />

            {/* Main Lake Water Body Polygon */}
            <path
              d="M 50 140
                 C 80 80, 180 50, 260 70
                 C 340 90, 420 50, 480 80
                 C 550 110, 570 190, 540 260
                 C 510 330, 440 370, 360 380
                 C 280 390, 220 340, 160 370
                 C 100 400, 40 330, 40 250
                 C 40 190, 30 170, 50 140 Z"
              fill="url(#waterDepthGrad)"
              stroke="#2e594d"
              strokeWidth="2.5"
            />

            {/* Shallow Flat Zone (0 - 5 ft) */}
            {showContours && (
              <path
                d="M 65 155
                   C 95 98, 175 75, 245 88
                   C 325 105, 405 70, 460 98
                   C 525 125, 545 190, 520 250
                   C 490 315, 425 350, 350 360
                   C 275 370, 215 325, 160 350
                   C 110 375, 60 315, 60 245
                   C 60 195, 50 180, 65 155 Z"
                fill="#113e34"
                stroke="#1f6153"
                strokeWidth="1.2"
                strokeDasharray="4 2"
                opacity="0.8"
              />
            )}

            {/* Mid-Depth Shelf (6 - 15 ft) */}
            {showContours && (
              <path
                d="M 110 180
                   C 140 130, 210 115, 270 125
                   C 340 138, 400 110, 440 135
                   C 485 160, 495 210, 475 255
                   C 450 300, 395 325, 330 330
                   C 265 335, 210 295, 170 315
                   C 130 335, 95 285, 95 235
                   C 95 195, 90 190, 110 180 Z"
                fill="#0a2a23"
                stroke="#1a5245"
                strokeWidth="1.5"
                opacity="0.85"
              />
            )}

            {/* Deep River Channel / Trench (16 - 35 ft) */}
            {showContours && (
              <path
                d="M 160 210
                   C 200 165, 260 160, 310 168
                   C 370 178, 410 160, 430 180
                   C 450 205, 445 240, 425 270
                   C 400 300, 350 305, 300 305
                   C 245 305, 205 270, 180 275
                   C 155 280, 140 240, 160 210 Z"
                fill="#051915"
                stroke="#133d33"
                strokeWidth="2"
              />
            )}

            {/* Submerged Grass Beds Layer */}
            {showGrassLayer && (
              <>
                <ellipse cx="380" cy="130" rx="45" ry="25" fill="url(#grassPattern)" />
                <ellipse cx="200" cy="320" rx="35" ry="20" fill="url(#grassPattern)" />
                <ellipse cx="140" cy="200" rx="25" ry="18" fill="url(#grassPattern)" />
              </>
            )}

            {/* Submerged Roadbed & Bridge Pilings */}
            <line x1="210" y1="70" x2="250" y2="385" stroke="#4a5550" strokeWidth="2.5" strokeDasharray="3 3" opacity="0.6" />
            <circle cx="230" cy="225" r="4" fill="#a8a29e" />
            <circle cx="235" cy="265" r="4" fill="#a8a29e" />

            {/* Wind Vector Lines Overlay */}
            {showWindOverlay && (
              <g opacity="0.45">
                {[
                  { x: 120, y: 100 },
                  { x: 280, y: 110 },
                  { x: 420, y: 130 },
                  { x: 220, y: 250 },
                  { x: 380, y: 270 },
                  { x: 160, y: 310 },
                ].map((pos, i) => {
                  const rad = (windAngle * Math.PI) / 180;
                  const dx = Math.sin(rad) * 35;
                  const dy = -Math.cos(rad) * 35;
                  return (
                    <line
                      key={i}
                      x1={pos.x - dx / 2}
                      y1={pos.y - dy / 2}
                      x2={pos.x + dx / 2}
                      y2={pos.y + dy / 2}
                      stroke="#34d399"
                      strokeWidth="2"
                      markerEnd="url(#windArrow)"
                    />
                  );
                })}
              </g>
            )}

            {/* Hotspots Interactive Pins */}
            {hotspots.map((spot, index) => {
              // Convert 0-100 coordinates to SVG viewBox (600x440)
              const cx = (spot.x / 100) * 520 + 40;
              const cy = (spot.y / 100) * 360 + 40;
              const isSelected = selectedSpot?.id === spot.id;

              return (
                <g
                  key={spot.id}
                  onClick={() => {
                    setSelectedSpot(spot);
                    if (onSelectHotspot) onSelectHotspot(spot);
                  }}
                  className="cursor-pointer group"
                >
                  {/* Ping Animation Ring on Selected or High-Rating Hotspot */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? '20' : '15'}
                    fill={spot.rating >= 92 ? '#10b981' : '#f59e0b'}
                    opacity={isSelected ? '0.35' : '0.15'}
                    className={isSelected ? 'animate-pulse' : ''}
                  />

                  {/* Pin Circle */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? '12' : '9'}
                    fill={isSelected ? '#10b981' : '#142a22'}
                    stroke={isSelected ? '#ffffff' : '#34d399'}
                    strokeWidth={isSelected ? '2.5' : '1.5'}
                    className="transition-all duration-150"
                  />

                  {/* Hotspot Number or Icon */}
                  <text
                    x={cx}
                    y={cy + 3.5}
                    textAnchor="middle"
                    fontSize={isSelected ? '10' : '8'}
                    fontWeight="bold"
                    fill={isSelected ? '#062017' : '#ffffff'}
                    fontFamily="monospace"
                  >
                    {index + 1}
                  </text>

                  {/* Label tooltip banner */}
                  <rect
                    x={cx - 45}
                    y={cy - 26}
                    width="90"
                    height="16"
                    rx="4"
                    fill="#0d1814"
                    stroke="#274438"
                    strokeWidth="1"
                    opacity={isSelected ? '0.95' : '0.75'}
                  />
                  <text
                    x={cx}
                    y={cy - 15}
                    textAnchor="middle"
                    fontSize="8"
                    fontWeight="600"
                    fill="#e5e7eb"
                  >
                    {spot.name.length > 15 ? spot.name.substring(0, 14) + '…' : spot.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Hotspot Intelligence Briefing (5 cols on large screens) */}
        <div className="lg:col-span-5 p-4 sm:p-5 flex flex-col justify-between bg-[#111c18]">
          {selectedSpot ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2 border-b border-[#243932] pb-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                      Zone #{hotspots.findIndex((h) => h.id === selectedSpot.id) + 1} Tactical Profile
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-stone-100 mt-0.5">{selectedSpot.name}</h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-stone-300">
                    <span className="bg-[#192b25] px-2 py-0.5 rounded text-[11px] font-mono text-emerald-300 border border-emerald-700/40">
                      Depth: {selectedSpot.depth}
                    </span>
                    <span className="text-stone-400">•</span>
                    <span className="text-stone-300 capitalize">{selectedSpot.type} Structure</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-2xl font-black text-emerald-400">{selectedSpot.rating}%</div>
                  <div className="text-[9px] uppercase tracking-wider text-stone-400 font-mono">Bite Index</div>
                </div>
              </div>

              {/* Description */}
              <div className="text-xs text-stone-300 leading-relaxed bg-[#15231e] p-3 rounded-xl border border-[#273d34]">
                <div className="text-[10px] font-mono text-emerald-400 uppercase font-semibold mb-1">Structure Anatomy</div>
                {selectedSpot.description}
              </div>

              {/* Why it works right now */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-mono uppercase tracking-wider text-amber-300 font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Why Bass Are Stacked Here Right Now</span>
                </div>
                <p className="text-xs text-stone-300 leading-relaxed bg-[#18231c] p-2.5 rounded-lg border border-amber-900/30">
                  {selectedSpot.whyItWorks}
                </p>
              </div>

              {/* Recommended Lure to Cast */}
              <div className="space-y-1 bg-gradient-to-r from-emerald-950/70 to-teal-950/70 p-3 rounded-xl border border-emerald-600/40">
                <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 font-bold">
                  Recommended Primary Presentation
                </div>
                <p className="text-xs font-semibold text-emerald-100">
                  {selectedSpot.recommendedLure}
                </p>
              </div>

              {/* Boat Approach Angle */}
              <div className="flex items-center justify-between bg-[#15231e] p-2.5 rounded-xl border border-[#273d34] text-xs">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-emerald-400" />
                  <span className="text-stone-300">Optimal Boat Position Bearing:</span>
                </div>
                <span className="font-mono font-bold text-emerald-300">{selectedSpot.approachBearing}°</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-stone-400">
              <Compass className="w-8 h-8 text-emerald-500 mb-2 opacity-50" />
              <p className="text-xs">Click any numbered hotspot pin on the lake map above to view tactical intelligence.</p>
            </div>
          )}

          {/* Quick Hotspot Buttons */}
          <div className="mt-4 pt-3 border-t border-[#233830]">
            <div className="text-[10px] font-mono uppercase text-stone-400 mb-1.5">Quick Select Zones</div>
            <div className="flex flex-wrap gap-1.5">
              {hotspots.map((spot, i) => (
                <button
                  key={spot.id}
                  onClick={() => {
                    setSelectedSpot(spot);
                    if (onSelectHotspot) onSelectHotspot(spot);
                  }}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                    selectedSpot?.id === spot.id
                      ? 'bg-emerald-600 text-white border-emerald-400 font-semibold'
                      : 'bg-[#15231e] text-stone-300 border-[#273d34] hover:border-emerald-600/50'
                  }`}
                >
                  #{i + 1} {spot.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
