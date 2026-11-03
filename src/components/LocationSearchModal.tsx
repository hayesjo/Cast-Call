import React, { useState } from 'react';
import { SavedLocation } from '../types';
import { Search, X, MapPin, Compass, Plus, Loader2, Sparkles, Navigation } from 'lucide-react';

interface LocationSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLocation: (newLocation: SavedLocation) => void;
}

export const LocationSearchModal: React.FC<LocationSearchModalProps> = ({
  isOpen,
  onClose,
  onAddLocation,
}) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Manual Coordinates State
  const [customName, setCustomName] = useState('');
  const [customLat, setCustomLat] = useState('');
  const [customLon, setCustomLon] = useState('');
  const [customType, setCustomType] = useState<'lake' | 'hunting_unit' | 'both'>('lake');
  const [showManualForm, setShowManualForm] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setSearchError(null);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        setSearchResults(data.results);
      } else {
        setSearchResults([]);
        setSearchError('No locations found. Try checking the spelling or typing a nearby city or state.');
      }
    } catch (err: any) {
      console.error('Search error:', err);
      // Fallback direct to open-meteo geocoding if server proxy had an issue
      try {
        const directRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=6&language=en`
        );
        const directData = await directRes.json();
        if (directData.results && directData.results.length > 0) {
          setSearchResults(directData.results);
        } else {
          setSearchError('No matching locations found.');
        }
      } catch (directErr) {
        setSearchError('Failed to search locations. Please enter coordinates manually below.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectGeocoded = (item: any) => {
    const isWaterProbable =
      item.name.toLowerCase().includes('lake') ||
      item.name.toLowerCase().includes('reservoir') ||
      item.name.toLowerCase().includes('river') ||
      item.name.toLowerCase().includes('bay') ||
      item.name.toLowerCase().includes('creek');

    const newLoc: SavedLocation = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: item.name,
      state: item.admin1 || item.country_code || '',
      type: isWaterProbable ? 'lake' : 'both',
      lat: item.latitude,
      lon: item.longitude,
      acreage: item.elevation ? `Elev: ${Math.round(item.elevation * 3.28)} ft` : undefined,
      waterBodyType: isWaterProbable ? 'Freshwater Lake / River' : undefined,
      waterClarityDefault: 'stained',
      terrain: item.admin2 || item.country || 'Woodland / Hills',
      description: `User-selected location: ${item.name}, ${item.admin1 || ''} (${item.country || ''}). Live atmospheric & solunar modeling active.`,
      isCustom: true,
      hotspots: [
        {
          id: `spot_${Date.now()}_1`,
          name: `${item.name} North Point & Channel`,
          type: 'point',
          x: 45,
          y: 35,
          depth: '6 - 15 ft',
          rating: 92,
          description: 'Windward transition point and deep contour drop.',
          whyItWorks: 'Current and baitfish compression create prime ambush opportunities.',
          recommendedLure: '1/2 oz Bladed Jig (Chatterbait) or Texas Rigged Craw.',
          approachBearing: 135,
        },
        {
          id: `spot_${Date.now()}_2`,
          name: `${item.name} Creek Arm & Flats`,
          type: 'flat',
          x: 65,
          y: 65,
          depth: '3 - 8 ft',
          rating: 88,
          description: 'Shallow vegetative flats and timber laydowns.',
          whyItWorks: 'Shallow baitfish roam here during morning and overcast hours.',
          recommendedLure: 'Squarebill Crankbait or Walking Topwater.',
          approachBearing: 270,
        },
      ],
      standSpots: [],
    };

    onAddLocation(newLoc);
    onClose();
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(customLat);
    const lon = parseFloat(customLon);

    if (!customName.trim() || isNaN(lat) || isNaN(lon)) {
      alert('Please provide a valid location name, latitude (-90 to 90), and longitude (-180 to 180).');
      return;
    }

    const newLoc: SavedLocation = {
      id: `manual_${Date.now()}`,
      name: customName.trim(),
      state: 'Custom Coordinates',
      type: customType,
      lat,
      lon,
      waterClarityDefault: 'stained',
      description: `Custom GPS pinned location (${lat.toFixed(4)}, ${lon.toFixed(4)}).`,
      isCustom: true,
      hotspots: [
        {
          id: `spot_${Date.now()}_1`,
          name: 'Primary Structure / Point',
          type: 'point',
          x: 50,
          y: 45,
          depth: '6 - 16 ft',
          rating: 90,
          description: 'High-percentage contour transition and wind break.',
          whyItWorks: 'Predatory fish stack along depth contour changes.',
          recommendedLure: '1/2 oz Vibrating Jig or Football Jig.',
          approachBearing: 180,
        },
      ],
      standSpots: [],
    };

    onAddLocation(newLoc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#111a17] border border-[#2b443a] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#21352e] bg-[#14201c]">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-900/60 rounded-lg text-emerald-300">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-100">Search Any Fishing or Hunting Location</h3>
              <p className="text-[11px] text-stone-400">Search lakes, rivers, counties, WMAs, or enter coordinates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-[#1a2924] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Lake of the Ozarks, Toledo Bend, Buffalo WI..."
                className="w-full bg-[#162420] border border-[#2c473c] rounded-xl pl-9 pr-3 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Search</span>
            </button>
          </form>

          {/* Quick Preset Ideas */}
          {!searchResults.length && !isLoading && (
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-2">
                Popular Quick Searches
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Lake of the Ozarks, MO',
                  'Lake Champlain, NY',
                  'Kentucky Lake, KY',
                  'Grand Lake, OK',
                  'Chickamauga Lake, TN',
                  'Adirondacks, NY',
                  'Pike County, IL',
                ].map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      setQuery(item);
                    }}
                    className="text-xs bg-[#172520] hover:bg-[#20332d] text-stone-300 hover:text-emerald-300 border border-[#294237] px-2.5 py-1 rounded-lg transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {isLoading && (
            <div className="flex items-center justify-center py-8 text-stone-400 text-xs gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Scanning global atmospheric & geographical databases...</span>
            </div>
          )}

          {searchError && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/50 rounded-xl text-rose-300 text-xs">
              {searchError}
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                Found Locations (Click to Forecast)
              </div>
              {searchResults.map((result, idx) => (
                <button
                  key={`${result.id || idx}`}
                  onClick={() => handleSelectGeocoded(result)}
                  className="w-full text-left p-3 bg-[#162420] hover:bg-[#1f332c] border border-[#273f36] hover:border-emerald-600/50 rounded-xl transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-900/50 rounded-lg text-emerald-400 group-hover:bg-emerald-800 transition-colors">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-stone-100 group-hover:text-emerald-300">
                        {result.name}
                      </div>
                      <div className="text-[10px] text-stone-400">
                        {[result.admin2, result.admin1, result.country].filter(Boolean).join(', ')} • Lat: {result.latitude.toFixed(2)}°, Lon: {result.longitude.toFixed(2)}°
                      </div>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-emerald-400 shrink-0 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform" />
                </button>
              ))}
            </div>
          )}

          {/* Manual GPS Coordinate Entry Toggle */}
          <div className="border-t border-[#22352f] pt-3">
            <button
              onClick={() => setShowManualForm(!showManualForm)}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>{showManualForm ? 'Hide Coordinate Input' : 'Or Enter Custom GPS Coordinates (Private Lease / Hidden Pond)'}</span>
            </button>

            {showManualForm && (
              <form onSubmit={handleManualAdd} className="mt-3 space-y-3 bg-[#15221e] p-3 rounded-xl border border-[#2a4339]">
                <div>
                  <label className="text-[10px] text-stone-400 block mb-1">Custom Location Name</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. North Ridge Deer Lease or Secret Quarry"
                    className="w-full bg-[#1a2b25] border border-[#2e4c40] rounded-lg px-2.5 py-1.5 text-xs text-stone-100 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-stone-400 block mb-1">Latitude (e.g. 33.1234)</label>
                    <input
                      type="number"
                      step="any"
                      value={customLat}
                      onChange={(e) => setCustomLat(e.target.value)}
                      placeholder="33.1234"
                      className="w-full bg-[#1a2b25] border border-[#2e4c40] rounded-lg px-2.5 py-1.5 text-xs text-stone-100 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-400 block mb-1">Longitude (e.g. -96.5432)</label>
                    <input
                      type="number"
                      step="any"
                      value={customLon}
                      onChange={(e) => setCustomLon(e.target.value)}
                      placeholder="-96.5432"
                      className="w-full bg-[#1a2b25] border border-[#2e4c40] rounded-lg px-2.5 py-1.5 text-xs text-stone-100 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-stone-400 block mb-1">Location Primary Type</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['lake', 'hunting_unit', 'both'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setCustomType(t)}
                        className={`py-1.5 text-[11px] rounded-lg border font-medium transition-colors ${
                          customType === t
                            ? 'bg-emerald-700 text-white border-emerald-500'
                            : 'bg-[#1a2b25] text-stone-400 border-[#2e4c40] hover:text-stone-200'
                        }`}
                      >
                        {t === 'lake' ? 'Lake/Water' : t === 'hunting_unit' ? 'Hunting Unit' : 'Both'}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save & Load Custom Coordinates</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
