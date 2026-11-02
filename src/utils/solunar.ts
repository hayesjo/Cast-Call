import { MoonPhaseData, SolunarData, SolunarPeriod } from '../types';

/**
 * Calculates Moon Phase and illumination for a given date
 * Synodic month: 29.53058867 days
 * Reference new moon: Jan 11, 2024 at 11:57 UTC
 */
export function calculateMoonPhase(date: Date = new Date()): MoonPhaseData {
  const referenceNewMoon = new Date('2024-01-11T11:57:00Z').getTime();
  const synodicMonthMs = 29.53058867 * 24 * 60 * 60 * 1000;
  const diffMs = date.getTime() - referenceNewMoon;
  const cycles = diffMs / synodicMonthMs;
  const currentCycleProgress = cycles - Math.floor(cycles); // 0.0 to 1.0

  const phaseAngle = currentCycleProgress * 360;
  // Illumination from 0% (new) to 100% (full)
  // illumination = (1 - cos(radians)) / 2
  const radians = currentCycleProgress * 2 * Math.PI;
  const illumination = Math.round(((1 - Math.cos(radians)) / 2) * 100);

  let phaseName = 'New Moon';
  let isWaxing = true;
  let icon = '🌑';

  if (currentCycleProgress < 0.03 || currentCycleProgress > 0.97) {
    phaseName = 'New Moon';
    icon = '🌑';
    isWaxing = true;
  } else if (currentCycleProgress < 0.22) {
    phaseName = 'Waxing Crescent';
    icon = '🌒';
    isWaxing = true;
  } else if (currentCycleProgress < 0.28) {
    phaseName = 'First Quarter';
    icon = '🌓';
    isWaxing = true;
  } else if (currentCycleProgress < 0.47) {
    phaseName = 'Waxing Gibbous';
    icon = '🌔';
    isWaxing = true;
  } else if (currentCycleProgress < 0.53) {
    phaseName = 'Full Moon';
    icon = '🌕';
    isWaxing = false;
  } else if (currentCycleProgress < 0.72) {
    phaseName = 'Waning Gibbous';
    icon = '🌖';
    isWaxing = false;
  } else if (currentCycleProgress < 0.78) {
    phaseName = 'Last Quarter';
    icon = '🌗';
    isWaxing = false;
  } else {
    phaseName = 'Waning Crescent';
    icon = '🌘';
    isWaxing = false;
  }

  return {
    phaseName,
    illumination,
    phaseAngle: Math.round(phaseAngle),
    isWaxing,
    icon,
  };
}

/**
 * Calculates Solunar Major and Minor periods for fishing & hunting
 * Major Periods: Moon Overhead and Moon Underfoot (duration ~2 hrs)
 * Minor Periods: Moonrise and Moonset (duration ~1 hr)
 */
export function calculateSolunar(date: Date = new Date(), sunriseStr?: string, sunsetStr?: string): SolunarData {
  const moon = calculateMoonPhase(date);

  // Approximate moon transit based on synodic offset from local noon (approx 12:00)
  // Each day moon rises ~50 minutes later
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const moonTransitHourOffset = (dayOfYear * 0.84) % 24;

  const overheadHour = (12 + moonTransitHourOffset) % 24;
  const underfootHour = (overheadHour + 12) % 24;
  const moonriseHour = (overheadHour - 6 + 24) % 24;
  const moonsetHour = (overheadHour + 6) % 24;

  const formatHour = (h: number): string => {
    const hours = Math.floor(h);
    const minutes = Math.floor((h - hours) * 60);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;
    const displayMin = minutes < 10 ? `0${minutes}` : minutes;
    return `${displayHour}:${displayMin} ${period}`;
  };

  const formatWindow = (hCenter: number, halfDurationMinutes: number): { start: string; end: string } => {
    const startH = (hCenter - halfDurationMinutes / 60 + 24) % 24;
    const endH = (hCenter + halfDurationMinutes / 60) % 24;
    return {
      start: formatHour(startH),
      end: formatHour(endH),
    };
  };

  // Full Moon and New Moon have maximum gravitational tidal pull => highest feeding triggers
  const proximityToPeak = Math.min(
    Math.abs(moon.phaseAngle - 0),
    Math.abs(moon.phaseAngle - 180),
    Math.abs(moon.phaseAngle - 360)
  );
  // Score from 65 to 98 based on proximity to new or full moon
  const solunarBonus = Math.round(33 * (1 - proximityToPeak / 90));
  const overallSolunarScore = Math.max(50, Math.min(99, 65 + solunarBonus));

  const major1 = formatWindow(overheadHour, 60);
  const major2 = formatWindow(underfootHour, 60);
  const minor1 = formatWindow(moonriseHour, 40);
  const minor2 = formatWindow(moonsetHour, 40);

  const majorPeriods: SolunarPeriod[] = [
    {
      type: 'major',
      name: 'Major Feeding 1 (Moon Overhead)',
      startTime: major1.start,
      endTime: major1.end,
      intensity: overallSolunarScore > 80 ? 'peak' : 'high',
      description: 'Maximum lunar gravitational alignment. Heavy predatory feeding in bass and whitetail active foraging.',
    },
    {
      type: 'major',
      name: 'Major Feeding 2 (Moon Underfoot)',
      startTime: major2.start,
      endTime: major2.end,
      intensity: 'high',
      description: 'Second primary gravitational axis. Fish aggressively ambush forage on secondary drop-offs.',
    },
  ];

  const minorPeriods: SolunarPeriod[] = [
    {
      type: 'minor',
      name: 'Minor Feeding 1 (Moonrise)',
      startTime: minor1.start,
      endTime: minor1.end,
      intensity: 'moderate',
      description: 'Short 45-minute spike in cruising activity along shallow weedlines and timber edges.',
    },
    {
      type: 'minor',
      name: 'Minor Feeding 2 (Moonset)',
      startTime: minor2.start,
      endTime: minor2.end,
      intensity: 'moderate',
      description: 'Transition movement period. Game shifts toward secondary bedding and deep staging pockets.',
    },
  ];

  return {
    moon,
    moonRise: formatHour(moonriseHour),
    moonSet: formatHour(moonsetHour),
    moonOverhead: formatHour(overheadHour),
    moonUnderfoot: formatHour(underfootHour),
    overallSolunarScore,
    majorPeriods,
    minorPeriods,
  };
}
