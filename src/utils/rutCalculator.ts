import { RutForecast } from '../types';

/**
 * Calculates current Whitetail Rut Phase based on current date and latitude.
 * The rut is photoperiod-driven (daylight length changes trigger melatonin & testosterone spikes).
 */
export function calculateRutForecast(date: Date = new Date(), latitude: number = 38.0): RutForecast {
  const month = date.getMonth(); // 0 = Jan, 9 = Oct, 10 = Nov, 11 = Dec
  const day = date.getDate();

  // Southern deer (e.g. South Texas, Gulf Coast) rut later (Dec-Jan).
  // Midwest/North (Lat > 36°) peaks in early/mid-November.
  const isSouthernRegion = latitude < 32.5;

  let stage = 'Pre-Rut / Early Season';
  let stageSubtitle = 'Food Source Dominance & Velvet Shedding';
  let dateRange = 'Sept 1 - Oct 20';
  let rutActivityScore = 38;
  let buckDaylightMovementScore = 45;
  let behaviorSummary =
    'Bucks are transitioning out of summer bachelor groups. Movement is heavily dictated by bed-to-food transitions in late afternoon. Focus on white oak acorn drops, ag field edges, and early rub lines.';
  let scentStrategy = 'Pure non-estrus buck urine or synthetic curiosity scents along perimeter mock scrapes.';
  let bestStandSetups = [
    'Oak ridge flats with falling acorns',
    'Staged staging timber 100 yards inside agricultural bean/alfalfa fields',
    'Low-impact observation stands to scout movement without blowing bedding sanctuaries',
  ];
  let recommendedWeaponAdvice =
    'Patience is key. Do not burn out primary bedding edges. Hunt afternoon food sources with cross-winds.';

  let callingTactics: RutForecast['callingTactics'] = [
    {
      tactic: 'Light Social Grunts',
      effectiveness: 'Medium' as const,
      notes: 'Subtle contact grunts every 45 minutes to coax nearby feeding bucks.',
    },
    {
      tactic: 'Aggressive Snort Wheeze',
      effectiveness: 'Low' as const,
      notes: 'Too early; risks spooking sub-dominant bucks out of the section.',
    },
    {
      tactic: 'Antler Rattling',
      effectiveness: 'Low' as const,
      notes: 'Keep it light sparring clicks only. Heavy clashes are unnatural right now.',
    },
  ];

  if (!isSouthernRegion) {
    if (month === 9 && day >= 21) {
      // Oct 21 - Oct 31
      stage = 'Seeking & Scraping Phase';
      stageSubtitle = 'Testosterone Rising, Scrape Lines Freshened';
      dateRange = 'Oct 21 - Oct 31';
      rutActivityScore = 72;
      buckDaylightMovementScore = 68;
      behaviorSummary =
        'Bucks are on their feet in daylight searching for the first cycling does. Primary community scrapes are visited and opened up nightly. Dominant bucks patrol downwind of doe bedding areas.';
      scentStrategy = 'Fresh doe urine and dominant buck tarsal scent in active ground scrapes.';
      bestStandSetups = [
        'Downwind side of doe bedding thickets and cedar thickets',
        'Interior pinch points and creek crossings connecting known doe groups',
        'Field edge staging rubs leading to evening food sources',
      ];
      callingTactics = [
        {
          tactic: 'Tend Buck Grunts',
          effectiveness: 'High',
          notes: 'Deep guttural grunts spaced 30 seconds apart show territorial dominance.',
        },
        {
          tactic: 'Light Rattling Sparring',
          effectiveness: 'High',
          notes: 'Tickle antlers together like two young bucks establishing pecking order.',
        },
        {
          tactic: 'Doe Estrus Bleats',
          effectiveness: 'Medium',
          notes: 'Can pull curious young bucks looking for early cycling does.',
        },
      ];
    } else if (month === 10 && day >= 1 && day <= 10) {
      // Nov 1 - Nov 10
      stage = 'The Chase Phase (Peak Daylight Seeking)';
      stageSubtitle = 'Maximum Daylight Buck Movement of the Year!';
      dateRange = 'Nov 1 - Nov 10';
      rutActivityScore = 96;
      buckDaylightMovementScore = 95;
      behaviorSummary =
        'This is the golden window! Big mature bucks throw caution to the wind, sprinting across open fields and ridges pursuing does. All-day sits are mandatory. Any hour between 10:00 AM and 2:00 PM can produce a trophy.';
      scentStrategy = 'Pure Estrus doe urine drags and buck tarsal gland scent to trigger territorial rage.';
      bestStandSetups = [
        'Hourglass terrain pinch points and deep ridge saddles',
        'River & creek oxbow crossings where terrain constricts fleeing does',
        'Thermal leeward timber bluffs overlooking bedding points',
      ];
      callingTactics = [
        {
          tactic: 'Aggressive Antler Rattling',
          effectiveness: 'High',
          notes: 'Violent antler clashes followed by stomping brush. Simulate a brutal fight.',
        },
        {
          tactic: 'Snort Wheeze & Challenge Grunt',
          effectiveness: 'High',
          notes: 'Directly challenge any mature buck hanging out of bow range.',
        },
        {
          tactic: 'Can Bleat (Estrus Doe Call)',
          effectiveness: 'High',
          notes: 'Draw cruising bucks on a string when they lose a doe scent trail.',
        },
      ];
    } else if (month === 10 && day >= 11 && day <= 20) {
      // Nov 11 - Nov 20
      stage = 'Peak Estrus & Lockdown';
      stageSubtitle = 'Bucks Paired with Does in Secluded Cover';
      dateRange = 'Nov 11 - Nov 20';
      rutActivityScore = 84;
      buckDaylightMovementScore = 65;
      behaviorSummary =
        'The majority of does are receptive. Mature bucks lock down with individual does in thick briars, sinkholes, standing corn, or brushy hollows for 24-48 hours. When a buck finishes breeding, he will cruise hard to find his next doe.';
      scentStrategy = 'Heavy estrus scent wicks suspended 5 feet high to carry on thermals.';
      bestStandSetups = [
        'Micro-sanctuaries and isolated thick cover patches inside open hardwoods',
        'Steep drainage draws and brushy cutovers where locked-down pairs seek seclusion',
        'High-elevation vantage saddles between distinct doe bedding units',
      ];
      callingTactics = [
        {
          tactic: 'Continuous Can Bleats',
          effectiveness: 'Medium',
          notes: 'Effective on cruiser bucks searching between locked-down does.',
        },
        {
          tactic: 'Tend Grunt & Foot Stomping',
          effectiveness: 'Medium',
          notes: 'Simulates another buck intruding into the lockdown sanctuary.',
        },
        {
          tactic: 'Rattling',
          effectiveness: 'Medium',
          notes: 'Less responsive if already locked down, but pulls roaming searchers.',
        },
      ];
    } else if (month === 10 && day >= 21) {
      // Nov 21 - Nov 30
      stage = 'Post-Rut Primary Recovery';
      stageSubtitle = 'Exhausted Bucks Refueling & Secondary Seeking';
      dateRange = 'Nov 21 - Nov 30';
      rutActivityScore = 62;
      buckDaylightMovementScore = 60;
      behaviorSummary =
        'Bucks have lost up to 25-30% of their body weight. High-calorie food sources (standing corn, soybeans, winter wheat, late acorns) become magnetic again. Surviving mature bucks return to afternoon feeding patterns.';
      scentStrategy = 'Calm herd scent or mock scrape freshening; estrus loses primary appeal.';
      bestStandSetups = [
        'Standing grain food plots and harvested corn combines',
        'Sunny south-facing timber slopes for thermal bedding warmth',
        'Thick security cover directly adjacent to premier winter food',
      ];
      callingTactics = [
        {
          tactic: 'Soft Contact Grunts',
          effectiveness: 'Medium',
          notes: 'Calm vocalizations reassuring hungry bucks heading to ag fields.',
        },
        {
          tactic: 'Rattling',
          effectiveness: 'Low',
          notes: 'Tired and battered bucks avoid unnecessary physical combat now.',
        },
      ];
    } else if (month === 11 && day >= 1 && day <= 20) {
      // Dec 1 - Dec 20
      stage = 'Secondary Rut & Late Food Focus';
      stageSubtitle = 'Doe Fawns Cycling into Estrus';
      dateRange = 'Dec 1 - Dec 20';
      rutActivityScore = 68;
      buckDaylightMovementScore = 70;
      behaviorSummary =
        'Approximately 28 days after the main peak, unbred mature does and vigorous doe fawns experience estrus. A noticeable spike in chasing occurs around evening food sources. Cold weather triggers intense afternoon movement.';
      scentStrategy = 'Fresh doe estrus scent drags directly across ag trails.',
      bestStandSetups = [
        'Destination food sources (brassicas, clover, standing crops)',
        'Thermal cover thickets where deer yard up during snow/cold fronts',
        'Narrow timber strips between thermal beds and evening grain fields',
      ];
      callingTactics = [
        {
          tactic: 'Estrus Bleat & Trailing Grunt',
          effectiveness: 'High',
          notes: 'High success on bucks actively scouting young doe feeding groups.',
        },
      ];
    } else if (month === 11 || month === 0) {
      // Late Dec / Jan
      stage = 'Late Season Winter Survival';
      stageSubtitle = 'Thermal Cover & High-Carb Energy Need';
      dateRange = 'Late Dec - Jan';
      rutActivityScore = 40;
      buckDaylightMovementScore = 55;
      behaviorSummary =
        'Survival mode. Deer conserve energy in heavy conifer/cedar cover during cold snaps. Best hunting window is consistently between 2:30 PM and dark over high-energy carb food sources.';
      scentStrategy = 'Vanilla or sweet attractant curiosity scents where legal.';
      bestStandSetups = [
        'Standing corn/soybeans and winter rye plots',
        'South-facing thermal cedar thickets receiving midday sunlight',
      ];
      callingTactics = [
        {
          tactic: 'Sparse Subtle Grunting',
          effectiveness: 'Low',
          notes: 'Use sparingly only to stop a moving buck in your shooting lane.',
        },
      ];
    }
  } else {
    // Southern rut timing (Dec/Jan peak)
    if (month === 11) {
      stage = 'Southern Seeking & Chasing Phase';
      stageSubtitle = 'Subtropical Photoperiod Rut Surge';
      dateRange = 'Dec 1 - Dec 25';
      rutActivityScore = 92;
      buckDaylightMovementScore = 90;
      behaviorSummary =
        'In deep south and Gulf states, bucks are in full chase mode through mesquite flats, live oak motts, and pine plantations.';
      scentStrategy = 'Doe estrus and territorial buck scrape drippers.';
      bestStandSetups = ['Senderos and brush funnels', 'Live oak acorns and prickly pear flats'];
    }
  }

  return {
    stage,
    stageSubtitle,
    dateRange,
    rutActivityScore,
    buckDaylightMovementScore,
    behaviorSummary,
    callingTactics,
    scentStrategy,
    bestStandSetups,
    recommendedWeaponAdvice,
  };
}
