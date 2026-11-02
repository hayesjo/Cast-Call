import React, { useState } from 'react';
import { CatchReport, SavedLocation, WeatherData } from '../types';
import {
  Fish,
  Crosshair,
  Plus,
  Calendar,
  Clock,
  Compass,
  Droplets,
  Layers,
  Sparkles,
  Search,
  Filter,
  TrendingDown,
  TrendingUp,
  MapPin,
  X,
} from 'lucide-react';

interface CatchLogViewProps {
  reports: CatchReport[];
  currentLocation: SavedLocation;
  currentWeather: WeatherData;
  onAddReport: (report: CatchReport) => void;
}

export const CatchLogView: React.FC<CatchLogViewProps> = ({
  reports,
  currentLocation,
  currentWeather,
  onAddReport,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'fish' | 'game'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New report form state
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'fish' | 'game'>('fish');
  const [species, setSpecies] = useState('Largemouth Bass');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [lureOrTackle, setLureOrTackle] = useState('1/2 oz Vibrating Jig (Chatterbait)');
  const [depthOrStand, setDepthOrStand] = useState('6 ft (Grass Edge)');
  const [waterTemp, setWaterTemp] = useState('68');
  const [waterClarity, setWaterClarity] = useState('Stained');
  const [notes, setNotes] = useState('');

  const filteredReports = reports.filter((rep) => {
    if (filterType !== 'all' && rep.type !== filterType) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        rep.title.toLowerCase().includes(q) ||
        rep.species.toLowerCase().includes(q) ||
        rep.locationName.toLowerCase().includes(q) ||
        rep.lureOrTackle.toLowerCase().includes(q) ||
        rep.notes.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate pattern insights
  const fishReports = reports.filter((r) => r.type === 'fish');
  const lureCounts: Record<string, number> = {};
  fishReports.forEach((r) => {
    const key = r.lureOrTackle.split('(')[0].trim();
    lureCounts[key] = (lureCounts[key] || 0) + 1;
  });
  const topLures = Object.entries(lureCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newRep: CatchReport = {
      id: `catch_${Date.now()}`,
      title: title.trim(),
      type,
      species,
      weight: weight.trim() || undefined,
      length: length.trim() || undefined,
      locationName: currentLocation.name + (currentLocation.state ? `, ${currentLocation.state}` : ''),
      lat: currentLocation.lat,
      lon: currentLocation.lon,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      lureOrTackle: lureOrTackle.trim(),
      depthOrStand: depthOrStand.trim(),
      waterTemp: type === 'fish' && waterTemp ? parseFloat(waterTemp) : undefined,
      waterClarity: type === 'fish' ? waterClarity : undefined,
      weatherSnapshot: `${currentWeather.temp}°F, ${currentWeather.windSpeed} mph ${currentWeather.windCardinal}, ${currentWeather.conditionName}, ${currentWeather.pressure.toFixed(2)} inHg`,
      barometricPressure: currentWeather.pressure,
      notes: notes.trim(),
    };

    onAddReport(newRep);
    setShowAddModal(false);
    setTitle('');
    setNotes('');
    setWeight('');
    setLength('');
  };

  return (
    <div className="space-y-6">
      {/* Pattern Intelligence Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#111a17] border border-[#233830] rounded-2xl p-4 shadow-xl">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono uppercase font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Proven Catch Pattern Lures</span>
          </div>
          <div className="space-y-1.5">
            {topLures.length > 0 ? (
              topLures.map(([lure, count], i) => (
                <div key={i} className="flex justify-between items-center text-xs bg-[#15231e] px-2.5 py-1.5 rounded-lg border border-[#233930]">
                  <span className="text-stone-200 font-medium truncate max-w-[180px]">{lure}</span>
                  <span className="font-mono text-emerald-300 font-bold">{count} logged</span>
                </div>
              ))
            ) : (
              <span className="text-xs text-stone-400">Log catches to build pattern stats</span>
            )}
          </div>
        </div>

        <div className="bg-[#111a17] border border-[#233830] rounded-2xl p-4 shadow-xl">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono uppercase font-bold mb-2">
            <Droplets className="w-3.5 h-3.5" />
            <span>Productive Temp Range</span>
          </div>
          <div className="text-xs text-stone-300 bg-[#15231e] p-2.5 rounded-lg border border-[#233930] space-y-1">
            <div className="flex justify-between font-mono">
              <span className="text-stone-400">Sweet Spot:</span>
              <strong className="text-cyan-300">62°F - 72°F</strong>
            </div>
            <p className="text-[11px] text-stone-400">
              80% of historical trophy bass were recorded in transitional temperature bands.
            </p>
          </div>
        </div>

        <div className="bg-[#111a17] border border-[#233830] rounded-2xl p-4 shadow-xl">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-mono uppercase font-bold mb-2">
            <Crosshair className="w-3.5 h-3.5" />
            <span>Barometric Bite Correlation</span>
          </div>
          <div className="text-xs text-stone-300 bg-[#15231e] p-2.5 rounded-lg border border-[#233830] space-y-1">
            <div className="flex justify-between font-mono">
              <span className="text-stone-400">Highest Strike Rate:</span>
              <strong className="text-emerald-400">Falling Barometer</strong>
            </div>
            <p className="text-[11px] text-stone-400">
              Pre-frontal 6-hour windows produced the most aggressive hookups.
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Action Toolbar */}
      <div className="bg-[#111a17] border border-[#233830] rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by species, lure, lake, notes..."
              className="w-full bg-[#15231e] border border-[#263e34] rounded-xl pl-8 pr-3 py-1.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Type Filter */}
          <div className="flex p-0.5 bg-[#14201c] rounded-xl border border-[#233830]">
            {(['all', 'fish', 'game'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                  filterType === t
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {t === 'all' ? 'All Logs' : t === 'fish' ? 'Fishing' : 'Hunting'}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Catch or Harvest</span>
          </button>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        {filteredReports.length > 0 ? (
          filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-[#111a17] border border-[#233830] hover:border-[#2f4c40] rounded-2xl p-4 shadow-lg transition-all"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#1f332b] pb-2.5">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-2 rounded-xl text-white ${
                      report.type === 'fish' ? 'bg-emerald-800' : 'bg-amber-800'
                    }`}
                  >
                    {report.type === 'fish' ? <Fish className="w-4 h-4" /> : <Crosshair className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-100">{report.title}</h4>
                    <div className="text-[11px] text-stone-400 flex items-center gap-2 mt-0.5">
                      <span className="font-semibold text-emerald-300">{report.species}</span>
                      <span>•</span>
                      <span>{report.locationName}</span>
                      <span>•</span>
                      <span>{report.date} at {report.time}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {report.weight && (
                    <span className="px-2.5 py-1 rounded-lg bg-[#162520] border border-emerald-800/60 font-mono font-bold text-xs text-emerald-300">
                      {report.weight}
                    </span>
                  )}
                  {report.length && (
                    <span className="px-2 py-1 rounded-lg bg-[#162520] border border-[#273d34] font-mono text-xs text-stone-300">
                      {report.length}
                    </span>
                  )}
                </div>
              </div>

              {/* Conditions & Tackle grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 text-xs bg-[#14211d] p-3 rounded-xl border border-[#21352e]">
                <div>
                  <span className="text-[10px] text-stone-400 font-mono uppercase block">Lure / Weapon:</span>
                  <span className="font-semibold text-stone-200">{report.lureOrTackle}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 font-mono uppercase block">Depth / Stand:</span>
                  <span className="font-semibold text-cyan-300">{report.depthOrStand}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 font-mono uppercase block">Atmospheric Snapshot:</span>
                  <span className="text-stone-300 text-[11px] block truncate" title={report.weatherSnapshot}>
                    {report.weatherSnapshot}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {report.notes && (
                <p className="text-xs text-stone-300 mt-2.5 leading-relaxed bg-[#131d1a] p-2.5 rounded-lg border border-[#1e2e28] italic">
                  "{report.notes}"
                </p>
              )}
            </div>
          ))
        ) : (
          <div className="bg-[#111a17] border border-[#233830] rounded-2xl p-8 text-center text-stone-400 text-xs space-y-2">
            <Fish className="w-8 h-8 text-emerald-500/50 mx-auto" />
            <p>No reports found matching your current filter.</p>
          </div>
        )}
      </div>

      {/* Add Report Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#111a17] border border-[#2b443a] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-[#21352e] bg-[#14201c]">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-900/60 rounded-lg text-emerald-300">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-100">Log New Catch or Harvest Report</h3>
                  <p className="text-[11px] text-stone-400">Save water conditions, lure used, and tactical notes</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-stone-400 block mb-1">Entry Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-[#162420] border border-[#2c473c] rounded-lg px-2.5 py-1.5 text-xs text-stone-100 focus:outline-none"
                  >
                    <option value="fish">Fish Catch</option>
                    <option value="game">Game Harvest / Sighting</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-stone-400 block mb-1">Species</label>
                  <input
                    type="text"
                    value={species}
                    onChange={(e) => setSpecies(e.target.value)}
                    placeholder="e.g. Largemouth Bass, Whitetail Buck"
                    className="w-full bg-[#162420] border border-[#2c473c] rounded-lg px-2.5 py-1.5 text-xs text-stone-100 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-stone-400 block mb-1">Report Title / Summary</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 7.2 lb Lunker on windward grass point"
                  className="w-full bg-[#162420] border border-[#2c473c] rounded-lg px-2.5 py-1.5 text-xs text-stone-100 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-stone-400 block mb-1">Weight</label>
                  <input
                    type="text"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="e.g. 6 lbs 8 oz"
                    className="w-full bg-[#162420] border border-[#2c473c] rounded-lg px-2.5 py-1.5 text-xs text-stone-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-stone-400 block mb-1">Length / Score</label>
                  <input
                    type="text"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    placeholder="e.g. 22.5 inches or 155 B&C"
                    className="w-full bg-[#162420] border border-[#2c473c] rounded-lg px-2.5 py-1.5 text-xs text-stone-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-stone-400 block mb-1">Lure / Tackle / Weapon</label>
                  <input
                    type="text"
                    value={lureOrTackle}
                    onChange={(e) => setLureOrTackle(e.target.value)}
                    placeholder="e.g. 1/2 oz Chatterbait White"
                    className="w-full bg-[#162420] border border-[#2c473c] rounded-lg px-2.5 py-1.5 text-xs text-stone-100 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-stone-400 block mb-1">Depth / Structure / Stand</label>
                  <input
                    type="text"
                    value={depthOrStand}
                    onChange={(e) => setDepthOrStand(e.target.value)}
                    placeholder="e.g. 6 ft Outside Weedline"
                    className="w-full bg-[#162420] border border-[#2c473c] rounded-lg px-2.5 py-1.5 text-xs text-stone-100 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {type === 'fish' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-stone-400 block mb-1">Water Temp (°F)</label>
                    <input
                      type="number"
                      value={waterTemp}
                      onChange={(e) => setWaterTemp(e.target.value)}
                      placeholder="68"
                      className="w-full bg-[#162420] border border-[#2c473c] rounded-lg px-2.5 py-1.5 text-xs text-stone-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-400 block mb-1">Water Clarity</label>
                    <input
                      type="text"
                      value={waterClarity}
                      onChange={(e) => setWaterClarity(e.target.value)}
                      placeholder="e.g. Stained (3 ft)"
                      className="w-full bg-[#162420] border border-[#2c473c] rounded-lg px-2.5 py-1.5 text-xs text-stone-100 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] text-stone-400 block mb-1">Tactical Notes & Observations</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="How did you retrieve the bait? Where were the fish positioned? Wind speed and mudline notes..."
                  className="w-full bg-[#162420] border border-[#2c473c] rounded-lg p-2.5 text-xs text-stone-100 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Save Log Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
