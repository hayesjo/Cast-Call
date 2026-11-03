/**
 * Solar Astronomical Calculations
 * Calculates sunrise, sunset, solar noon, and day length for any given date and latitude/longitude.
 * Uses standard NOAA solar calculations.
 */

export interface SolarTimes {
  sunrise: string;
  sunset: string;
  dawn: string; // Civil twilight (legal shooting light starts ~30m before sunrise)
  dusk: string; // Civil twilight (legal shooting light ends ~30m after sunset)
  dayLengthHours: number;
}

export function calculateSolarTimes(
  date: Date = new Date(),
  latitude: number = 44.0,
  longitude: number = -85.5
): SolarTimes {
  const rad = Math.PI / 180;
  const deg = 180 / Math.PI;

  // Day of year
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  // Approximate solar declination
  const declination = -23.44 * Math.cos(((360 / 365) * (dayOfYear + 10)) * rad);

  // Approximate equation of time (minutes)
  const b = (360 / 365) * (dayOfYear - 81) * rad;
  const eot = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);

  // Timezone offset in hours
  // Estimate local timezone offset or use system offset
  const tzOffsetHours = -date.getTimezoneOffset() / 60;

  // Solar noon in local standard time
  const solarNoonMinutes = 720 - 4 * longitude - eot + tzOffsetHours * 60;

  // Hour angle for sunrise/sunset (sun zenith = 90.833° for refraction)
  const zenithRad = 90.833 * rad;
  const latRad = latitude * rad;
  const decRad = declination * rad;

  const cosHourAngle =
    (Math.cos(zenithRad) - Math.sin(latRad) * Math.sin(decRad)) /
    (Math.cos(latRad) * Math.cos(decRad));

  // Clamp for polar days/nights
  const clampedCos = Math.max(-1, Math.min(1, cosHourAngle));
  const hourAngleDeg = Math.acos(clampedCos) * deg;
  const halfDayMinutes = hourAngleDeg * 4;

  const sunriseMin = solarNoonMinutes - halfDayMinutes;
  const sunsetMin = solarNoonMinutes + halfDayMinutes;
  const dawnMin = sunriseMin - 30; // Civil twilight legal shooting
  const duskMin = sunsetMin + 30;

  const formatMinutes = (totalMin: number): string => {
    let m = Math.round(totalMin);
    while (m < 0) m += 1440;
    while (m >= 1440) m -= 1440;
    const hours = Math.floor(m / 60);
    const mins = m % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 === 0 ? 12 : hours % 12;
    const minPadded = mins < 10 ? `0${mins}` : `${mins}`;
    return `${h12}:${minPadded} ${period}`;
  };

  const dayLengthHours = parseFloat(((sunsetMin - sunriseMin) / 60).toFixed(1));

  return {
    sunrise: formatMinutes(sunriseMin),
    sunset: formatMinutes(sunsetMin),
    dawn: formatMinutes(dawnMin),
    dusk: formatMinutes(duskMin),
    dayLengthHours,
  };
}
