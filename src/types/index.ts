export type Mode = 'fishing' | 'hunting';

export interface LocationCoordinates {
  lat: number;
  lon: number;
}

export interface Hotspot {
  id: string;
  name: string;
  type: 'point' | 'creek' | 'flat' | 'ledge' | 'dock' | 'timber' | 'riprap' | 'hump';
  x: number; // 0-100% on lake map
  y: number; // 0-100% on lake map
  depth: string;
  rating: number; // 0 - 100
  description: string;
  whyItWorks: string;
  recommendedLure: string;
  approachBearing: number; // boat approach angle in degrees
}

export interface StandHotspot {
  id: string;
  name: string;
  type: 'ridge_funnel' | 'creek_crossing' | 'field_edge' | 'oak_flat' | 'clear_cut' | 'thermal_bedding';
  x: number; // 0-100% on terrain map
  y: number; // 0-100% on terrain map
  rating: number; // 0 - 100
  windSafety: 'ideal' | 'marginal' | 'compromised';
  windDirectionPreferred: string[]; // e.g. ['NW', 'N', 'W']
  description: string;
  bestTime: 'morning' | 'midday' | 'evening' | 'all_day';
}

export interface SavedLocation {
  id: string;
  name: string;
  type: 'lake' | 'hunting_unit' | 'both';
  state: string;
  lat: number;
  lon: number;
  acreage?: string;
  terrain?: string;
  waterBodyType?: string;
  waterClarityDefault?: 'crystal_clear' | 'stained' | 'muddy';
  description: string;
  hotspots?: Hotspot[];
  standSpots?: StandHotspot[];
  propertyMapUrl?: string;
  isCustom?: boolean;
}

export interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  pressure: number; // in inHg or hPa
  pressureTrend: 'rapidly_falling' | 'falling' | 'steady' | 'rising' | 'rapidly_rising';
  pressureTrendText: string;
  windSpeed: number; // mph
  windGusts: number;
  windDirection: number; // 0 - 360
  windCardinal: string; // e.g. "NW"
  cloudCover: number; // %
  weatherCode: number;
  conditionName: string;
  sunrise: string;
  sunset: string;
  hourlyTemps: { time: string; temp: number; pressure: number; rainProb: number }[];
}

export interface MoonPhaseData {
  phaseName: string;
  illumination: number; // 0 - 100%
  phaseAngle: number;
  isWaxing: boolean;
  icon: string;
}

export interface SolunarPeriod {
  type: 'major' | 'minor';
  name: string;
  startTime: string;
  endTime: string;
  intensity: 'peak' | 'high' | 'moderate';
  description: string;
}

export interface SolunarData {
  moon: MoonPhaseData;
  moonRise: string;
  moonSet: string;
  moonOverhead: string;
  moonUnderfoot: string;
  overallSolunarScore: number; // 0 - 100
  majorPeriods: SolunarPeriod[];
  minorPeriods: SolunarPeriod[];
}

export interface RutForecast {
  stage: string;
  stageSubtitle: string;
  dateRange: string;
  rutActivityScore: number; // 0 - 100
  buckDaylightMovementScore: number; // 0 - 100
  behaviorSummary: string;
  callingTactics: { tactic: string; effectiveness: 'High' | 'Medium' | 'Low'; notes: string }[];
  scentStrategy: string;
  bestStandSetups: string[];
  recommendedWeaponAdvice: string;
}

export interface HuntingForecast {
  compositeHuntingScore: number; // 0 - 100
  rutData: RutForecast;
  solunar: SolunarData;
  weather: WeatherData;
  windEvaluation: {
    windSafe: boolean;
    scentConeBearing: number;
    favoredStandsCount: number;
    notes: string;
  };
  recommendedTimeWindow: string;
  keyTactics: string[];
}

export interface BassLure {
  id: string;
  name: string;
  category: 'moving' | 'bottom_contact' | 'finesse' | 'topwater' | 'reaction';
  confidenceScore: number; // 0 - 100
  recommendedColor: string;
  recommendedSizeWeight: string;
  trailerMatch?: string;
  depthRange: string;
  retrieveCadence: string;
  gearRecommendation: {
    rod: string;
    reel: string;
    line: string;
  };
  whyItWorks: string;
}

export interface BassForecast {
  compositeBiteScore: number; // 0 - 100
  waterTemp: number; // in °F
  waterClarity: 'crystal_clear' | 'stained' | 'muddy';
  lightCondition: 'bright_sun' | 'partly_cloudy' | 'overcast' | 'low_light';
  forageActive: 'threadfin_shad' | 'bluegill' | 'crawfish' | 'perch';
  seasonalBehavior: string;
  depthFocus: string;
  peakBiteWindows: string[];
  lures: BassLure[];
  bestZones: Hotspot[];
  thermoclineInsight: string;
}

export interface CatchReport {
  id: string;
  title: string;
  type: 'fish' | 'game';
  species: string;
  weight?: string;
  length?: string;
  locationName: string;
  lat?: number;
  lon?: number;
  date: string;
  time: string;
  lureOrTackle: string;
  depthOrStand: string;
  waterTemp?: number;
  waterClarity?: string;
  weatherSnapshot: string;
  barometricPressure?: number;
  notes: string;
  photoUrl?: string;
}
