import { BassForecast, BassLure, Hotspot } from '../types';

interface BassTacticsParams {
  waterTemp: number; // °F
  pressureTrend: 'rapidly_falling' | 'falling' | 'steady' | 'rising' | 'rapidly_rising';
  pressureValue: number; // inHg (e.g. 29.92)
  waterClarity: 'crystal_clear' | 'stained' | 'muddy';
  lightCondition: 'bright_sun' | 'partly_cloudy' | 'overcast' | 'low_light';
  forageActive: 'threadfin_shad' | 'bluegill' | 'crawfish' | 'perch';
  windSpeed: number; // mph
  windCardinal: string;
  windDirection?: number;
  seasonMonth: number; // 0-11
}

export function calculateBassForecast(params: BassTacticsParams): BassForecast {
  const {
    waterTemp,
    pressureTrend,
    pressureValue,
    waterClarity,
    lightCondition,
    forageActive,
    windSpeed,
    windCardinal,
    seasonMonth,
  } = params;

  // 1. Calculate Composite Bite Score (0 - 100)
  let baseScore = 65;

  // Pressure Impact
  if (pressureTrend === 'falling' || pressureTrend === 'rapidly_falling') {
    baseScore += 18; // Bass gorge right before incoming frontal systems
  } else if (pressureTrend === 'rapidly_rising') {
    baseScore -= 18; // Post-front bluebird sky lockdown
  } else if (pressureTrend === 'rising') {
    baseScore -= 8;
  } else {
    baseScore += 5; // Steady pressure
  }

  // Wind Impact
  if (windSpeed >= 7 && windSpeed <= 16) {
    baseScore += 12; // Ideal chop breaks light penetration and sparks baitfish schools
  } else if (windSpeed > 22) {
    baseScore -= 6; // Tough boat control, muddy shoreline washouts
  } else if (windSpeed < 4 && lightCondition === 'bright_sun') {
    baseScore -= 10; // Slick calm + high sun = spooky bass
  }

  // Light Impact
  if (lightCondition === 'overcast' || lightCondition === 'low_light') {
    baseScore += 12; // Bass roam and strike visual baits freely
  } else if (lightCondition === 'bright_sun') {
    baseScore -= 5;
  }

  // Water Temp Optimal Range (62°F - 78°F is peak metabolic feeding)
  if (waterTemp >= 62 && waterTemp <= 76) {
    baseScore += 12;
  } else if (waterTemp < 48 || waterTemp > 86) {
    baseScore -= 12;
  }

  const compositeBiteScore = Math.max(30, Math.min(98, Math.round(baseScore)));

  // 2. Determine Seasonal Behavior & Thermocline Status
  let seasonalBehavior = '';
  let depthFocus = '';
  let thermoclineInsight = '';

  if (waterTemp < 50) {
    seasonalBehavior =
      'Cold Water Wintering / Deep Suspension. Bass metabolism is slowed; fish group tightly on vertical structure, creek channel bends, and deep bluff walls.';
    depthFocus = '18 - 35 ft (Deep basin transitions, vertical rock walls)';
    thermoclineInsight = 'Lake is completely destratified / mixed with uniform oxygen top to bottom.';
  } else if (waterTemp < 60) {
    seasonalBehavior =
      'Pre-Spawn Transition / Staging. Feeding aggressively to pack on weight. Moving up along secondary creek points and highway channels toward spawning flats.';
    depthFocus = '6 - 14 ft (Secondary points, creek channel edges, transition rock)';
    thermoclineInsight = 'Surface warming initiates shallow baitfish movement into northern protected pockets.';
  } else if (waterTemp < 72) {
    seasonalBehavior =
      'Spawn & Post-Spawn Recovery. Bass are on bedding flats or guarding fry around docks, shallow stump fields, and emerging aquatic grass.';
    depthFocus = '2 - 8 ft (Protected coves, spawning pockets, dock bulkheads)';
    thermoclineInsight = 'Stable spring thermocline beginning to form around 12-16 ft.';
  } else if (waterTemp < 82) {
    seasonalBehavior =
      'Early Summer / Ledge & Grass Season. Heavy schools congregate on offshore ledges, river channel humps, and thick hydrilla/milfoil canopies.';
    depthFocus = '12 - 25 ft Offshore Ledges & 4 - 8 ft Dense Grass Mats';
    thermoclineInsight = 'Strong thermocline established at 15-20 ft. Bass will NOT position below the thermocline due to low dissolved oxygen.';
  } else {
    // High summer or Fall transition
    if (seasonMonth >= 8 && seasonMonth <= 10) {
      seasonalBehavior =
        'Fall Feeding Blitz! Bass chase migrating shad deep into creek arms and shallow flats. Schooling wolfpacks crashing bait on surface.';
      depthFocus = '3 - 12 ft (Backs of creeks, wind-blown main lake flats, riprap)';
      thermoclineInsight = 'Fall turnover begins when surface water cools to ~55-60°F, temporarily scattering fish before regrouping.';
    } else {
      seasonalBehavior =
        'Peak Summer Heat. Deep offshore structure or dense shaded mats (punching) during midday; explosive topwater at sunrise/sunset.';
      depthFocus = '16 - 28 ft Offshore or 2 - 5 ft under heavy punch mats';
      thermoclineInsight = 'Sharp thermocline at 18 ft. Fish stay suspended right at or above the thermocline break.';
    }
  }

  // 3. Recommended Lures based on conditions
  const lures: BassLure[] = [];

  // Lure 1: Reaction / Moving Bait
  if (waterTemp >= 52 && (pressureTrend === 'falling' || pressureTrend === 'rapidly_falling' || windSpeed >= 8)) {
    let color = 'Chartreuse / White Shad';
    if (waterClarity === 'crystal_clear') color = 'Ghost Shad / Natural Minnow';
    if (waterClarity === 'muddy') color = 'Fire Craw / Chartreuse Black Back';

    lures.push({
      id: 'lure_bladed_jig',
      name: 'Custom Bladed Vibrating Jig (Chatterbait) 1/2 oz',
      category: 'reaction',
      confidenceScore: 95,
      recommendedColor: color,
      recommendedSizeWeight: '1/2 oz with 4.5" Paddle Tail or Fork-Tail Minnow trailer',
      trailerMatch: 'Yamamoto Zako or Strike King Blade Minnow trailer',
      depthRange: '2 - 7 ft',
      retrieveCadence: 'Moderate steady wind with intermittent rod-tip snaps to deflect off submerged grass stalks and wood.',
      gearRecommendation: {
        rod: '7\'2" Medium-Heavy Moderate-Fast Glass / Composite Rod',
        reel: '6.3:1 to 7.1:1 Gear Ratio Baitcaster',
        line: '16 - 20 lb Fluorocarbon (or 40 lb Braided Line around heavy milfoil)',
      },
      whyItWorks:
        'The thumping vibration displaces water violently, provoking instinctive reaction strikes from aggressive pre-front bass even in wind-stained water.',
    });
  } else if (waterTemp < 52) {
    let jerkbaitColor = waterClarity === 'crystal_clear' ? 'Pro Blue / Ghost Wakasagi' : 'Table Rock Shad / Matte Gold';
    lures.push({
      id: 'lure_suspending_jerkbait',
      name: 'Suspending Deep Jerkbait (Vision 110+1 style)',
      category: 'reaction',
      confidenceScore: 92,
      recommendedColor: jerkbaitColor,
      recommendedSizeWeight: '1/2 oz (4.3 inches)',
      depthRange: '6 - 12 ft',
      retrieveCadence: 'Twitch - Twitch - PAUSE for 8 to 15 seconds dead-still. 90% of bites come on the dead pause.',
      gearRecommendation: {
        rod: '6\'10" Medium Fast Tip Graphite Casting Rod',
        reel: '6.8:1 Baitcaster with buttery smooth drag',
        line: '10 - 12 lb 100% Fluorocarbon for maximum dive depth and stealth',
      },
      whyItWorks:
        'Cold-water bass cannot resist a dying baitfish suspended right in their face without sinking or floating away.',
    });
  } else {
    // Crankbait option
    let crankColor = forageActive === 'crawfish' ? 'Spring Craw / Delta Red' : 'Sexy Shad / Citrus Shad';
    lures.push({
      id: 'lure_squarebill_crank',
      name: 'Squarebill Crankbait 1.5 / 2.5',
      category: 'moving',
      confidenceScore: 88,
      recommendedColor: crankColor,
      recommendedSizeWeight: '7/16 oz (Runs 3-5 ft)',
      depthRange: '3 - 6 ft',
      retrieveCadence: 'Fast retrieve crashing intentionally into stump roots, rocks, and dock pilings to trigger deflection bites.',
      gearRecommendation: {
        rod: '7\'0" Medium Moderate Crankbait Rod',
        reel: '6.3:1 Ratio Reel',
        line: '14 - 17 lb Fluorocarbon',
      },
      whyItWorks:
        'Square bill forces radical erratic deflections that trigger predatory reflex strikes from bass holding tight to hard structure.',
    });
  }

  // Lure 2: Bottom Contact / Jig
  let jigColor = 'Green Pumpkin / Blue Fleck';
  if (waterClarity === 'muddy') jigColor = 'Black & Blue / Purple Neon';
  if (waterClarity === 'crystal_clear') jigColor = 'Natural PB&J / Green Pumpkin Orange';

  let jigWeight = waterTemp > 75 ? '3/4 oz Football Jig' : '1/2 oz Pitching & Flipping Jig';
  lures.push({
    id: 'lure_casting_jig',
    name: `${jigWeight} with Craw Chunk Trailer`,
    category: 'bottom_contact',
    confidenceScore: 91,
    recommendedColor: jigColor,
    recommendedSizeWeight: jigWeight,
    trailerMatch: 'Strike King Rage Craw or Zoom Super Chunk',
    depthRange: '5 - 18 ft',
    retrieveCadence: 'Pitch into heart of brush piles or drag methodically along ledge drops. Lift 6 inches, let flare, repeat.',
    gearRecommendation: {
      rod: '7\'3" Heavy Fast Action Casting Rod',
      reel: '7.3:1 or 8.1:1 High-Speed Casting Reel',
      line: '17 - 20 lb Fluorocarbon (or 50 lb braid when flipping thick brush)',
    },
    whyItWorks:
      'Imitates a succulent molting crawfish or foraging bluegill. Essential for coaxing quality kicker fish that ignore moving baits.',
  });

  // Lure 3: Finesse / Clear Water / High Pressure Post-Front
  if (waterClarity === 'crystal_clear' || pressureTrend === 'rising' || pressureTrend === 'rapidly_rising' || lightCondition === 'bright_sun') {
    let wormColor = 'Green Pumpkin Green Flake / Watermelon Candy';
    lures.push({
      id: 'lure_dropshot_finesse',
      name: 'Finesse Drop Shot Rig with 4.5" Straight Tail Worm',
      category: 'finesse',
      confidenceScore: 94,
      recommendedColor: wormColor,
      recommendedSizeWeight: '3/16 oz or 1/4 oz Tungsten Cylinder Weight, #1 Mosquito Hook',
      depthRange: '10 - 30 ft',
      retrieveCadence: 'Cast or drop vertically onto sonar arches. Shake slack in line without moving the sinker.',
      gearRecommendation: {
        rod: '7\'0" Medium-Light Extra-Fast Action Spinning Rod',
        reel: '2500 / 3000 Series Spinning Reel',
        line: '10 lb Braid Mainline tied to 8 ft of 6-8 lb Fluorocarbon Leader',
      },
      whyItWorks:
        'Keeps bait hovering horizontally right at eye level of pressured, finicky bass under high-sky post-front lockjaw.',
    });
  } else {
    // Texas Rigged Senko or Creature Bait
    lures.push({
      id: 'lure_texas_rig',
      name: 'Weightless or Light Texas-Rigged 5" Stick Bait (Senko)',
      category: 'finesse',
      confidenceScore: 89,
      recommendedColor: waterClarity === 'muddy' ? 'Black with Blue Tail' : 'Green Pumpkin / Watermelon Red',
      recommendedSizeWeight: '5" Senko with 3/0 EWG Hook (1/16 oz peg weight if windy)',
      depthRange: '2 - 10 ft',
      retrieveCadence: 'Cast next to dock posts or grass edges. Let sink completely on slack line. Watch line for ticks.',
      gearRecommendation: {
        rod: '7\'0" Medium-Heavy Fast Rod',
        reel: '7.1:1 Baitcaster or 3000 Spinning',
        line: '12 - 15 lb Fluorocarbon',
      },
      whyItWorks:
        'The tantalizing horizontal wobble on the fall is universally irresistible to bass of all sizes and mood levels.',
    });
  }

  // Lure 4: Topwater or Specialized Target
  if (waterTemp >= 58 && (lightCondition === 'low_light' || lightCondition === 'overcast' || windSpeed < 10)) {
    lures.push({
      id: 'lure_topwater_walking',
      name: 'Walking Topwater Spook / Popping Frog',
      category: 'topwater',
      confidenceScore: 90,
      recommendedColor: lightCondition === 'overcast' ? 'Bone White / Chrome' : 'Black / Leopard Green (over mats)',
      recommendedSizeWeight: '4.5" Walking Bait or 1/2 oz Hollow Body Frog',
      depthRange: 'Surface (0 ft)',
      retrieveCadence: 'Cadence: "Walk-the-dog" side-to-side rhythm with pauses near isolated weed points and dock corners.',
      gearRecommendation: {
        rod: '7\'0" Medium Heavy Fast Action (Frog: 7\'4" Extra Heavy)',
        reel: '7.1:1+ High Speed Reel',
        line: '30 - 50 lb Braided Line (floating braid allows effortless bait walking)',
      },
      whyItWorks:
        'Generates explosive, heart-stopping surface strikes during low light windows when bass cruise shallow weed lines.',
    });
  } else {
    // Offshore Deep Diving Crank or Lipless
    let liplessColor = 'Gold Sexy Shad / Rayburn Red';
    lures.push({
      id: 'lure_lipless_crank',
      name: '1/2 oz Rattle Trap / Lipless Crankbait',
      category: 'reaction',
      confidenceScore: 87,
      recommendedColor: liplessColor,
      recommendedSizeWeight: '1/2 oz Tungsten Sound Chamber',
      depthRange: '4 - 12 ft',
      retrieveCadence: 'Yo-yo retrieve: Rip out of submerged grass edges and let flutter down on semi-slack line.',
      gearRecommendation: {
        rod: '7\'2" Medium Heavy Moderate Rod',
        reel: '6.4:1 Ratio Baitcasting Reel',
        line: '14 - 17 lb Fluorocarbon',
      },
      whyItWorks:
        'The ripping motion tears grass free and produces an immediate predatory reflex bite from trailing bass.',
    });
  }

  // 4. Lake Zones Hotspot Recommendations
  const bestZones: Hotspot[] = [
    {
      id: 'zone_wind_points',
      name: `Windward Main Lake Points (${windCardinal} Facing)`,
      type: 'point',
      x: 32,
      y: 45,
      depth: '4 - 14 ft',
      rating: windSpeed >= 8 ? 96 : 82,
      description: `Points directly receiving ${windCardinal} wave action and current. Plankton and baitfish schools are compressed against the transition drop.`,
      whyItWorks: `Current breaks and bait push: Ambush bass stack on the leeward drop of the point to ambush passing shad.`,
      recommendedLure: 'Bladed Jig (Chatterbait) or Squarebill Crankbait cast up onto the shallows and retrieved into deeper water.',
      approachBearing: (params.windDirection ? (params.windDirection + 180) % 360 : 135),
    },
    {
      id: 'zone_creek_swings',
      name: 'Secondary Creek Channel Swings & Bluffs',
      type: 'creek',
      x: 68,
      y: 28,
      depth: '8 - 20 ft',
      rating: 91,
      description: 'The sharp outside bend where the old submerged creek channel hugs close to the shoreline bank.',
      whyItWorks: 'Provides bass with immediate vertical access between shallow feeding shelves and deep security water.',
      recommendedLure: '1/2 oz Pitching Jig or Football Jig dragged down the contour ledge into the creek bed.',
      approachBearing: 45,
    },
    {
      id: 'zone_grass_flats',
      name: 'Offshore Submerged Grass Beds & Milfoil Edges',
      type: 'flat',
      x: 52,
      y: 72,
      depth: '6 - 12 ft',
      rating: 88,
      description: 'Expansive submerged grass flats with defined outer drop edges and isolated inside potholes.',
      whyItWorks: 'High dissolved oxygen during daylight, teeming with bluegill, crawfish, and young-of-year shad.',
      recommendedLure: 'Lipless Crankbait ripped out of grass or Texas Rigged Craw pitched into inner potholes.',
      approachBearing: 220,
    },
    {
      id: 'zone_dock_shallows',
      name: 'Shaded Boat Docks & Walkways',
      type: 'dock',
      x: 18,
      y: 65,
      depth: '3 - 8 ft',
      rating: lightCondition === 'bright_sun' ? 95 : 78,
      description: 'Docks with dark overhead shadow lines, especially those with brush piles sunk underneath walkway corners.',
      whyItWorks: 'High sun forces bass under the darkest shade available for ambush camouflage.',
      recommendedLure: 'Weightless Senko skipped deep under the walkways or Finesse Jig skipped to the back corner post.',
      approachBearing: 300,
    },
  ];

  const peakBiteWindows = [
    'Dawn Window: Sunrise + 2.5 hours (Active topwater & reaction shallow)',
    'Solunar Major Period Alignment (Midday flurry around bait schools)',
    'Golden Hour: 1.5 hours prior to sunset through dusk (Shallow wolfpack blitz)',
  ];

  return {
    compositeBiteScore,
    waterTemp,
    waterClarity,
    lightCondition,
    forageActive,
    seasonalBehavior,
    depthFocus,
    peakBiteWindows,
    lures,
    bestZones,
    thermoclineInsight,
  };
}
