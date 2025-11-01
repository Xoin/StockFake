/**
 * Dynamic Event Generator
 * Automatically generates market crash events for dates beyond historical data
 */

const crashEvents = require('../data/market-crash-events');

/**
 * Configuration for dynamic event generation
 */
const DYNAMIC_EVENT_CONFIG = {
  // When to start generating dynamic events (after historical data ends)
  historicalDataEndDate: new Date('2024-12-31T23:59:59'),
  
  // Probability settings (per year)
  annualCrashProbability: 0.15,        // 15% chance of crash per year
  annualCorrectionProbability: 0.25,   // 25% chance of correction per year
  annualSectorCrashProbability: 0.20,  // 20% chance of sector-specific crash per year
  
  // Check intervals
  checkIntervalDays: 30,  // Check for new events every 30 days
  
  // Event parameters
  minDaysBetweenEvents: 90,  // Minimum 90 days between major events
  
  // Sector weights for random selection
  sectorWeights: {
    'Technology': 0.30,
    'Financial': 0.25,
    'Energy': 0.15,
    'Healthcare': 0.10,
    'Industrials': 0.10,
    'Consumer': 0.10
  }
};

/**
 * Track last event generation check
 */
let lastEventCheck = null;
let lastEventDate = null;
let generatedEvents = [];

/**
 * Seeded random number generator for deterministic event generation
 */
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Generate a seed from a date for consistent random generation
 */
function dateSeed(date) {
  return Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
}

/**
 * Randomly select a sector based on weights
 */
function selectRandomSector(seed) {
  const random = seededRandom(seed);
  let cumulative = 0;
  
  for (const [sector, weight] of Object.entries(DYNAMIC_EVENT_CONFIG.sectorWeights)) {
    cumulative += weight;
    if (random <= cumulative) {
      return sector;
    }
  }
  
  return 'Technology';  // Fallback
}

/**
 * Generate a dynamic market crash event
 */
function generateDynamicCrash(eventDate, eventType, seed) {
  const random1 = seededRandom(seed);
  const random2 = seededRandom(seed + 1);
  const random3 = seededRandom(seed + 2);
  
  // Determine severity based on random values
  let severity;
  let marketImpact;
  let volatilityMultiplier;
  
  if (random1 < 0.10) {
    severity = crashEvents.SEVERITY_LEVELS.CATASTROPHIC;
    marketImpact = -0.30 - (random2 * 0.25);  // -30% to -55%
    volatilityMultiplier = 5.0 + (random3 * 5.0);  // 5x to 10x
  } else if (random1 < 0.35) {
    severity = crashEvents.SEVERITY_LEVELS.SEVERE;
    marketImpact = -0.20 - (random2 * 0.15);  // -20% to -35%
    volatilityMultiplier = 3.5 + (random3 * 3.0);  // 3.5x to 6.5x
  } else if (random1 < 0.70) {
    severity = crashEvents.SEVERITY_LEVELS.MODERATE;
    marketImpact = -0.10 - (random2 * 0.12);  // -10% to -22%
    volatilityMultiplier = 2.5 + (random3 * 2.0);  // 2.5x to 4.5x
  } else {
    severity = crashEvents.SEVERITY_LEVELS.MINOR;
    marketImpact = -0.05 - (random2 * 0.08);  // -5% to -13%
    volatilityMultiplier = 1.5 + (random3 * 1.5);  // 1.5x to 3x
  }
  
  const liquidityReduction = Math.min(0.8, Math.abs(marketImpact) * 1.5);
  const sentimentShift = Math.max(-0.95, marketImpact * 2.0);
  
  // Generate sector impacts
  const sectors = {};
  const affectedSectors = ['Technology', 'Financial', 'Energy', 'Healthcare', 'Industrials', 'Consumer'];
  
  if (eventType === crashEvents.CRASH_TYPES.MARKET_CRASH) {
    // Market-wide crash affects all sectors
    for (const sector of affectedSectors) {
      const variation = (seededRandom(seed + sector.charCodeAt(0)) - 0.5) * 0.2;
      sectors[sector] = marketImpact + variation;
    }
  } else if (eventType === crashEvents.CRASH_TYPES.SECTOR_CRASH) {
    // Sector-specific crash
    const targetSector = selectRandomSector(seed + 10);
    sectors[targetSector] = marketImpact * 1.5;  // Primary sector hit harder
    
    // Other sectors have reduced impact
    for (const sector of affectedSectors) {
      if (sector !== targetSector) {
        sectors[sector] = marketImpact * 0.3;
      }
    }
  } else if (eventType === crashEvents.CRASH_TYPES.CORRECTION) {
    // Correction is more uniform
    for (const sector of affectedSectors) {
      const variation = (seededRandom(seed + sector.charCodeAt(0)) - 0.5) * 0.05;
      sectors[sector] = marketImpact + variation;
    }
  }
  
  // Generate cascading effects
  const durationDays = 30 + Math.floor(random2 * 150);  // 30-180 days
  const cascadingEffects = [
    { delay: 0, multiplier: 1.0 },
    { delay: Math.floor(durationDays * 0.1), multiplier: 0.6 - (random3 * 0.2) },
    { delay: Math.floor(durationDays * 0.3), multiplier: 0.3 - (random3 * 0.15) },
    { delay: Math.floor(durationDays * 0.6), multiplier: 0.1 - (random3 * 0.1) }
  ];
  
  // Recovery pattern selection
  const recoveryTypes = ['v-shaped', 'gradual', 'slow'];
  const recoveryType = recoveryTypes[Math.floor(random3 * recoveryTypes.length)];
  
  const recoveryPattern = {
    type: recoveryType,
    durationDays: durationDays,
    volatilityDecay: 0.92 + (random1 * 0.06)  // 0.92 to 0.98
  };
  
  // Generate event name
  const year = eventDate.getFullYear();
  const month = eventDate.getMonth() + 1;
  const eventNames = {
    [crashEvents.CRASH_TYPES.MARKET_CRASH]: [
      `Global Market Turbulence ${year}`,
      `${year} Market Correction`,
      `Economic Downturn ${month}/${year}`,
      `Market Volatility Spike ${year}`
    ],
    [crashEvents.CRASH_TYPES.SECTOR_CRASH]: [
      `Sector Crisis ${year}`,
      `Industry Shakeup ${month}/${year}`,
      `Sector Volatility ${year}`,
      `Industry Correction ${year}`
    ],
    [crashEvents.CRASH_TYPES.CORRECTION]: [
      `Market Correction ${month}/${year}`,
      `${year} Retracement`,
      `Pullback ${year}`,
      `Market Adjustment ${month}/${year}`
    ]
  };
  
  const nameOptions = eventNames[eventType] || eventNames[crashEvents.CRASH_TYPES.MARKET_CRASH];
  const eventName = nameOptions[Math.floor(random1 * nameOptions.length)];
  
  return {
    id: `dynamic_${eventDate.getTime()}_${eventType}`,
    name: eventName,
    type: eventType,
    severity: severity,
    description: `Dynamically generated ${eventType} event for ${year}`,
    trigger: crashEvents.TRIGGER_TYPES.SCHEDULED,
    isDynamic: true,
    generatedAt: new Date(),
    impact: {
      market: marketImpact,
      volatilityMultiplier: volatilityMultiplier,
      liquidityReduction: liquidityReduction,
      sentimentShift: sentimentShift,
      sectors: sectors
    },
    cascadingEffects: cascadingEffects,
    recoveryPattern: recoveryPattern
  };
}

/**
 * Check if we should generate a new dynamic event
 */
function shouldGenerateEvent(currentTime, lastCheck, eventType, probabilityPerYear) {
  if (!lastCheck) return false;
  
  const daysSinceLastCheck = (currentTime - lastCheck) / (1000 * 60 * 60 * 24);
  if (daysSinceLastCheck < DYNAMIC_EVENT_CONFIG.checkIntervalDays) {
    return false;
  }
  
  // Check if minimum time has passed since last event
  if (lastEventDate) {
    const daysSinceLastEvent = (currentTime - lastEventDate) / (1000 * 60 * 60 * 24);
    if (daysSinceLastEvent < DYNAMIC_EVENT_CONFIG.minDaysBetweenEvents) {
      return false;
    }
  }
  
  // Calculate probability for the time period
  const yearsElapsed = daysSinceLastCheck / 365;
  const probability = 1 - Math.pow(1 - probabilityPerYear, yearsElapsed);
  
  // Use deterministic random based on date
  const seed = dateSeed(currentTime);
  const random = seededRandom(seed);
  
  return random < probability;
}

/**
 * Generate dynamic events for the current time period
 */
function generateDynamicEvents(currentTime) {
  // Only generate events if we're past the historical data end date
  if (currentTime <= DYNAMIC_EVENT_CONFIG.historicalDataEndDate) {
    return [];
  }
  
  // Initialize last check if needed
  if (!lastEventCheck) {
    lastEventCheck = new Date(Math.max(
      currentTime.getTime() - (DYNAMIC_EVENT_CONFIG.checkIntervalDays * 24 * 60 * 60 * 1000),
      DYNAMIC_EVENT_CONFIG.historicalDataEndDate.getTime()
    ));
  }
  
  const newEvents = [];
  const seed = dateSeed(currentTime);
  
  // Check for market crash
  if (shouldGenerateEvent(currentTime, lastEventCheck, 'crash', DYNAMIC_EVENT_CONFIG.annualCrashProbability)) {
    const event = generateDynamicCrash(currentTime, crashEvents.CRASH_TYPES.MARKET_CRASH, seed);
    newEvents.push(event);
    generatedEvents.push(event);
    lastEventDate = currentTime;
  }
  
  // Check for correction (if no crash)
  if (newEvents.length === 0 && shouldGenerateEvent(currentTime, lastEventCheck, 'correction', DYNAMIC_EVENT_CONFIG.annualCorrectionProbability)) {
    const event = generateDynamicCrash(currentTime, crashEvents.CRASH_TYPES.CORRECTION, seed + 100);
    newEvents.push(event);
    generatedEvents.push(event);
    lastEventDate = currentTime;
  }
  
  // Check for sector crash (if no other events)
  if (newEvents.length === 0 && shouldGenerateEvent(currentTime, lastEventCheck, 'sector', DYNAMIC_EVENT_CONFIG.annualSectorCrashProbability)) {
    const event = generateDynamicCrash(currentTime, crashEvents.CRASH_TYPES.SECTOR_CRASH, seed + 200);
    newEvents.push(event);
    generatedEvents.push(event);
    lastEventDate = currentTime;
  }
  
  // Update last check time
  lastEventCheck = currentTime;
  
  return newEvents;
}

/**
 * Get all dynamically generated events
 */
function getGeneratedEvents() {
  return generatedEvents;
}

/**
 * Get configuration
 */
function getConfiguration() {
  return { ...DYNAMIC_EVENT_CONFIG };
}

/**
 * Update configuration
 */
function updateConfiguration(newConfig) {
  Object.assign(DYNAMIC_EVENT_CONFIG, newConfig);
}

/**
 * Reset generator state (for testing)
 */
function resetGeneratorState() {
  lastEventCheck = null;
  lastEventDate = null;
  generatedEvents = [];
}

module.exports = {
  generateDynamicEvents,
  getGeneratedEvents,
  getConfiguration,
  updateConfiguration,
  resetGeneratorState,
  
  // For testing
  generateDynamicCrash
};
