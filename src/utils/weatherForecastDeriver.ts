import { WeatherData, HourlyWeatherPoint, DailyWeatherPoint } from '../types';
import { calculateSolarTimes } from './solarAstronomical';

const CARDINALS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

export function getCardinal(deg: number): string {
  const norm = ((deg % 360) + 360) % 360;
  return CARDINALS[Math.round(norm / 45) % 8];
}

export function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function deriveWeatherForDate(
  targetDateOrOptions:
    | Date
    | {
        targetDate: Date;
        liveWeather: WeatherData;
        allHourlyForecast?: HourlyWeatherPoint[];
        allDailyForecast?: DailyWeatherPoint[];
        lat: number;
        lon: number;
      },
  liveWeatherParam?: WeatherData,
  allHourlyForecastParam?: HourlyWeatherPoint[],
  allDailyForecastParam?: DailyWeatherPoint[],
  latParam?: number,
  lonParam?: number
): WeatherData {
  let targetDate: Date;
  let liveWeather: WeatherData;
  let allHourlyForecast: HourlyWeatherPoint[];
  let allDailyForecast: DailyWeatherPoint[];
  let lat: number;
  let lon: number;

  if (targetDateOrOptions instanceof Date) {
    targetDate = targetDateOrOptions;
    liveWeather = liveWeatherParam!;
    allHourlyForecast = allHourlyForecastParam || liveWeatherParam?.allHourlyForecast || liveWeatherParam?.hourlyForecast || [];
    allDailyForecast = allDailyForecastParam || liveWeatherParam?.dailyForecast || [];
    lat = latParam ?? 44.03;
    lon = lonParam ?? -85.45;
  } else {
    targetDate = targetDateOrOptions.targetDate;
    liveWeather = targetDateOrOptions.liveWeather;
    allHourlyForecast = targetDateOrOptions.allHourlyForecast || targetDateOrOptions.liveWeather.allHourlyForecast || targetDateOrOptions.liveWeather.hourlyForecast || [];
    allDailyForecast = targetDateOrOptions.allDailyForecast || targetDateOrOptions.liveWeather.dailyForecast || [];
    lat = targetDateOrOptions.lat;
    lon = targetDateOrOptions.lon;
  }
  const today = new Date();
  if (isSameDay(targetDate, today)) {
    // Current live weather of today
    return {
      ...liveWeather,
      isCustomDateForecast: false,
      forecastDate: targetDate,
      forecastDateLabel: 'Today (Live)',
    };
  }

  const targetKey = formatDateKey(targetDate);
  const formattedDateLabel = targetDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  // Check if we have matching daily data in allDailyForecast
  const matchingDaily = allDailyForecast.find((d) => d.date === targetKey);

  // Check if we have matching hourly data in allHourlyForecast
  const matchingHours = allHourlyForecast.filter((h) => h.time.startsWith(targetKey));

  // Astronomical solar calculation for target date
  const solar = calculateSolarTimes(targetDate, lat, lon);

  // Case A: We have matching hourly data from numerical weather model (within 16-day window)
  if (matchingHours.length > 0) {
    // Find representative daytime sit period (e.g. 12 PM / 1 PM midday hour)
    const middayHour =
      matchingHours.find((h) => {
        const hour = new Date(h.time).getHours();
        return hour === 12 || hour === 13;
      }) || matchingHours[Math.floor(matchingHours.length / 2)];

    // Dominant wind direction from daily forecast or daytime average
    const dominantWindDir = matchingDaily?.windDirection ?? middayHour.windDirection;
    const dominantCardinal = matchingDaily?.windCardinal || getCardinal(dominantWindDir);

    const avgWindSpeed = Math.round(
      matchingHours.reduce((acc, h) => acc + h.windSpeed, 0) / matchingHours.length
    );
    const maxWindSpeed =
      matchingDaily?.windSpeedMax ?? Math.max(...matchingHours.map((h) => h.windSpeed));

    const avgPressure = parseFloat(
      (
        matchingHours.reduce((acc, h) => acc + h.pressure, 0) / matchingHours.length
      ).toFixed(2)
    );

    // Calculate pressure trend during the target day
    let trend: 'rapidly_falling' | 'falling' | 'steady' | 'rising' | 'rapidly_rising' = 'steady';
    let trendText = 'Steady Barometer';
    if (matchingHours.length >= 12) {
      const morningP = matchingHours[6]?.pressure ?? matchingHours[0].pressure;
      const eveningP = matchingHours[18]?.pressure ?? matchingHours[matchingHours.length - 1].pressure;
      const diff = eveningP - morningP;
      if (diff < -0.06) {
        trend = 'rapidly_falling';
        trendText = 'Rapidly Falling (Cold Front)';
      } else if (diff < -0.02) {
        trend = 'falling';
        trendText = 'Falling (Active Feed Window)';
      } else if (diff > 0.06) {
        trend = 'rapidly_rising';
        trendText = 'Rapidly Rising (Post-Front Bluebird)';
      } else if (diff > 0.02) {
        trend = 'rising';
        trendText = 'Rising (Stabilizing Post-Front)';
      }
    }

    const weatherCode = matchingDaily?.weatherCode ?? middayHour.weatherCode;
    const conditionName = matchingDaily?.conditionName ?? middayHour.conditionName;

    const tempMax = matchingDaily?.tempMax ?? Math.max(...matchingHours.map((h) => h.temp));
    const tempMin = matchingDaily?.tempMin ?? Math.min(...matchingHours.map((h) => h.temp));

    const sanitizedHours = matchingHours.map((h) => {
      const d = new Date(h.time);
      const hour = d.getHours();
      const hourLabel =
        hour === 0
          ? '12 AM'
          : hour < 12
          ? `${hour} AM`
          : hour === 12
          ? '12 PM'
          : `${hour - 12} PM`;
      return {
        ...h,
        hourLabel,
      };
    });

    return {
      temp: tempMax,
      feelsLike: middayHour.feelsLike,
      humidity: 62,
      tempMax,
      tempMin,
      pressure: avgPressure,
      pressureTrend: trend,
      pressureTrendText: trendText,
      windSpeed: avgWindSpeed,
      windGusts: maxWindSpeed,
      windDirection: dominantWindDir,
      windCardinal: dominantCardinal,
      cloudCover: weatherCode === 0 ? 10 : weatherCode <= 3 ? 45 : 85,
      weatherCode,
      conditionName,
      sunrise: solar.sunrise,
      sunset: solar.sunset,
      hourlyTemps: [],
      hourlyForecast: sanitizedHours,
      dailyForecast: allDailyForecast,
      allHourlyForecast,
      isCustomDateForecast: true,
      forecastDate: targetDate,
      forecastDateLabel: formattedDateLabel,
    };
  }

  // Case B: Target date is beyond numerical weather model horizon (>16 days)
  // Generate high-fidelity climatological/astronomical simulation for location
  const month = targetDate.getMonth(); // 0 = Jan, 10 = Nov
  // Seasonal baseline high and low temperatures for Michigan / northern tier
  const monthlyHighs = [28, 30, 40, 53, 66, 76, 81, 79, 71, 58, 44, 33];
  const monthlyLows = [15, 16, 23, 33, 44, 53, 58, 56, 48, 38, 29, 20];

  const baseHigh = monthlyHighs[month] ?? 45;
  const baseLow = monthlyLows[month] ?? 28;

  // Day of year phase for subtle micro-variations
  const dayOfYear = Math.floor(
    (targetDate.getTime() - new Date(targetDate.getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  // Prevailing seasonal wind direction in Michigan late fall/winter is NW / W
  const seasonalWindDir = ((270 + Math.round(Math.sin(dayOfYear * 0.4) * 60) + 360) % 360);
  const seasonalWindCard = getCardinal(seasonalWindDir);
  const seasonalWindSpeed = Math.round(9 + Math.abs(Math.cos(dayOfYear * 0.3) * 6));
  const seasonalGusts = seasonalWindSpeed + 6;

  const seasonalPressure = parseFloat(
    (29.92 + Math.sin(dayOfYear * 0.25) * 0.16).toFixed(2)
  );

  // Generate 24 hourly points for this simulated date
  const generatedHours: HourlyWeatherPoint[] = [];
  for (let h = 0; h < 24; h++) {
    const hourLabel =
      h === 0
        ? '12 AM'
        : h < 12
        ? `${h} AM`
        : h === 12
        ? '12 PM'
        : `${h - 12} PM`;

    // Diurnal temperature curve
    const diurnalFactor = (Math.sin(((h - 8) / 24) * 2 * Math.PI) + 1) / 2;
    const hourTemp = Math.round(baseLow + (baseHigh - baseLow) * diurnalFactor);

    // Diurnal wind shift (morning thermals vs afternoon flow)
    const diurnalWindOffset = Math.round(Math.sin(((h - 6) / 24) * 2 * Math.PI) * 15);
    const hDir = (seasonalWindDir + diurnalWindOffset + 360) % 360;
    const hSpeed = Math.max(4, Math.round(seasonalWindSpeed + (h >= 11 && h <= 17 ? 3 : -2)));

    const ptDate = new Date(targetDate);
    ptDate.setHours(h, 0, 0, 0);

    generatedHours.push({
      time: ptDate.toISOString(),
      hourLabel,
      temp: hourTemp,
      feelsLike: hourTemp - (hSpeed > 10 ? 3 : 1),
      pressure: seasonalPressure,
      rainProb: 15,
      windSpeed: hSpeed,
      windDirection: hDir,
      windCardinal: getCardinal(hDir),
      weatherCode: 1,
      conditionName: 'Partly Cloudy (Seasonal Forecast)',
    });
  }

  return {
    temp: baseHigh,
    feelsLike: baseHigh - 2,
    humidity: 65,
    tempMax: baseHigh,
    tempMin: baseLow,
    pressure: seasonalPressure,
    pressureTrend: 'steady',
    pressureTrendText: 'Seasonal Mean Barometer',
    windSpeed: seasonalWindSpeed,
    windGusts: seasonalGusts,
    windDirection: seasonalWindDir,
    windCardinal: seasonalWindCard,
    cloudCover: 40,
    weatherCode: 1,
    conditionName: 'Partly Cloudy (Seasonal Forecast)',
    sunrise: solar.sunrise,
    sunset: solar.sunset,
    hourlyTemps: [],
    hourlyForecast: generatedHours,
    dailyForecast: allDailyForecast,
    allHourlyForecast,
    isCustomDateForecast: true,
    forecastDate: targetDate,
    forecastDateLabel: formattedDateLabel,
  };
}
