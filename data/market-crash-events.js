/**
 * Market Crash Events Data
 * Historical and hypothetical crash scenarios for simulation
 */

const CRASH_TYPES = {
  MARKET_CRASH: 'market_crash',          // Broad market crash
  SECTOR_CRASH: 'sector_crash',          // Sector-specific crash
  CORRECTION: 'correction',              // Market correction (10-20% drop)
  FLASH_CRASH: 'flash_crash',            // Rapid, temporary crash
  BEAR_MARKET: 'bear_market',            // Prolonged decline (20%+)
  LIQUIDITY_CRISIS: 'liquidity_crisis',  // Liquidity-driven event
  CONTAGION: 'contagion'                 // Cross-market contagion
};

const TRIGGER_TYPES = {
  MANUAL: 'manual',                      // Manually triggered
  SCHEDULED: 'scheduled',                // Time-based trigger
  CONDITION: 'condition',                // Condition-based trigger
  HISTORICAL: 'historical'               // Historical replay
};

const SEVERITY_LEVELS = {
  MINOR: 'minor',           // < 10% impact
  MODERATE: 'moderate',     // 10-20% impact
  SEVERE: 'severe',         // 20-40% impact
  CATASTROPHIC: 'catastrophic'  // > 40% impact
};

/**
 * Historical market crash scenarios
 */
const historicalCrashes = [
  {
    id: 'black_monday_1987',
    name: 'Black Monday 1987',
    type: CRASH_TYPES.MARKET_CRASH,
    severity: SEVERITY_LEVELS.CATASTROPHIC,
    startDate: new Date('1987-10-19T09:30:00'),
    endDate: new Date('1987-10-19T16:00:00'),
    description: 'The largest single-day percentage decline in stock market history',
    trigger: TRIGGER_TYPES.HISTORICAL,
    impact: {
      market: -0.2278,  // 22.78% drop in one day
      volatilityMultiplier: 5.0,
      liquidityReduction: 0.6,
      sentimentShift: -0.8,
      sectors: {
        'Financial': -0.25,
        'Technology': -0.20,
        'Industrials': -0.23,
        'Consumer': -0.18,
        'Energy': -0.22
      }
    },
    cascadingEffects: [
      { delay: 0, multiplier: 1.0 },       // Immediate impact
      { delay: 1, multiplier: 0.3 },       // Next day aftershock
      { delay: 2, multiplier: 0.15 },      // Day 2 continued decline
      { delay: 7, multiplier: -0.2 }       // Week later partial recovery
    ],
    recoveryPattern: {
      type: 'gradual',
      durationDays: 90,
      volatilityDecay: 0.95  // 5% daily volatility reduction
    }
  },
  {
    id: 'dot_com_crash_2000',
    name: 'Dot-Com Bubble Burst',
    type: CRASH_TYPES.SECTOR_CRASH,
    severity: SEVERITY_LEVELS.CATASTROPHIC,
    startDate: new Date('2000-03-10T09:30:00'),
    // No endDate - let recovery pattern determine full duration
    description: 'Technology sector bubble collapse - decade-long impact',
    trigger: TRIGGER_TYPES.HISTORICAL,
    impact: {
      market: -0.40,  // Increased from -0.15 to reflect broader market impact
      volatilityMultiplier: 4.0,  // Increased from 3.0
      liquidityReduction: 0.5,  // Increased from 0.4
      sentimentShift: -0.8,  // Increased from -0.7
      sectors: {
        'Technology': -0.78,  // Tech lost 78% of value - kept accurate
        'Financial': -0.15,  // Increased from -0.10
        'Industrials': -0.12,  // Increased from -0.08
        'Consumer': -0.10,  // Increased from -0.05
        'Energy': -0.08  // Increased from -0.03
      }
    },
    cascadingEffects: [
      { delay: 0, multiplier: 1.0 },       // Initial crash
      { delay: 30, multiplier: 0.9 },      // Month 1 - continued decline
      { delay: 90, multiplier: 0.8 },      // Month 3 - ongoing weakness
      { delay: 180, multiplier: 0.7 },     // Month 6 - sustained downturn
      { delay: 365, multiplier: 0.6 },     // Year 1 - still depressed
      { delay: 730, multiplier: 0.5 },     // Year 2 - bottom reached
      { delay: 1095, multiplier: 0.4 },    // Year 3 - slow recovery begins
      { delay: 1460, multiplier: 0.35 },   // Year 4 - gradual improvement
      { delay: 1825, multiplier: 0.3 },    // Year 5 - continued recovery
      { delay: 2190, multiplier: 0.25 },   // Year 6 - recovery continues
      { delay: 2555, multiplier: 0.2 },    // Year 7 - approaching normal
      { delay: 2920, multiplier: 0.15 },   // Year 8 - getting closer
      { delay: 3285, multiplier: 0.12 },   // Year 9 - almost recovered
      { delay: 3650, multiplier: 0.10 },   // Year 10 - nearing full recovery
      { delay: 4380, multiplier: 0.07 },   // Year 12 - final stages
      { delay: 5110, multiplier: 0.05 },   // Year 14 - nearly complete
      { delay: 5475, multiplier: 0.02 }    // Year 15 - full recovery
    ],
    recoveryPattern: {
      type: 'decade-long',  // New recovery type for 15-year recovery
      durationDays: 5475,  // 15 years (actual historical recovery period)
      volatilityDecay: 0.9995  // Very slow volatility decay over 15 years
    }
  },
  {
    id: 'financial_crisis_2008',
    name: 'Financial Crisis of 2008',
    type: CRASH_TYPES.MARKET_CRASH,
    severity: SEVERITY_LEVELS.CATASTROPHIC,
    startDate: new Date('2008-09-15T09:30:00'),
    // No endDate - let recovery pattern determine full duration
    description: 'Global financial crisis - 6.5 year recovery to pre-crisis levels',
    trigger: TRIGGER_TYPES.HISTORICAL,
    impact: {
      market: -0.57,  // 57% peak-to-trough decline
      volatilityMultiplier: 5.5,  // Increased from 4.5
      liquidityReduction: 0.75,  // Increased from 0.7
      sentimentShift: -0.95,  // Increased from -0.9
      sectors: {
        'Financial': -0.83,  // Financials devastated
        'Technology': -0.42,
        'Industrials': -0.54,
        'Consumer': -0.48,
        'Energy': -0.60,
        'Healthcare': -0.35
      }
    },
    cascadingEffects: [
      { delay: 0, multiplier: 1.0 },       // Initial crash Sept 2008
      { delay: 7, multiplier: 0.95 },      // Week 1 - continued selling
      { delay: 14, multiplier: 0.90 },     // Week 2 - panic continues
      { delay: 30, multiplier: 0.85 },     // Month 1 - sustained decline
      { delay: 60, multiplier: 0.80 },     // Month 2 - deepening crisis
      { delay: 90, multiplier: 0.75 },     // Month 3 - still falling
      { delay: 120, multiplier: 0.70 },    // Month 4 - crisis persists
      { delay: 180, multiplier: 0.65 },    // Month 6 - March 2009 bottom
      { delay: 365, multiplier: 0.60 },    // Year 1 - slow recovery starts
      { delay: 547, multiplier: 0.55 },    // Year 1.5 - gradual improvement
      { delay: 730, multiplier: 0.50 },    // Year 2 - recovery underway
      { delay: 1095, multiplier: 0.40 },   // Year 3 - continued recovery
      { delay: 1460, multiplier: 0.30 },   // Year 4 - gaining momentum
      { delay: 1825, multiplier: 0.20 },   // Year 5 - approaching normal
      { delay: 2190, multiplier: 0.10 },   // Year 6 - nearly recovered
      { delay: 2375, multiplier: 0.05 }    // Year 6.5 - full recovery (March 2013)
    ],
    recoveryPattern: {
      type: 'decade-long',  // Changed from 'slow' to new decade-long type
      durationDays: 2375,  // 6.5 years (actual time to recover to pre-crisis peak)
      volatilityDecay: 0.9997  // Very slow decay over 6.5 years
    }
  },
  {
    id: 'covid_crash_2020',
    name: 'COVID-19 Pandemic Crash',
    type: CRASH_TYPES.MARKET_CRASH,
    severity: SEVERITY_LEVELS.SEVERE,
    startDate: new Date('2020-02-20T09:30:00'),
    endDate: new Date('2020-03-23T16:00:00'),
    description: 'Rapid market crash due to COVID-19 pandemic',
    trigger: TRIGGER_TYPES.HISTORICAL,
    impact: {
      market: -0.34,  // 34% drop
      volatilityMultiplier: 6.0,  // Extreme volatility
      liquidityReduction: 0.5,
      sentimentShift: -0.85,
      sectors: {
        'Financial': -0.40,
        'Technology': -0.25,  // Tech more resilient
        'Industrials': -0.42,
        'Consumer': -0.45,
        'Energy': -0.55,      // Energy hit hardest
        'Healthcare': -0.20   // Healthcare relatively protected
      }
    },
    cascadingEffects: [
      { delay: 0, multiplier: 1.0 },
      { delay: 1, multiplier: 0.5 },
      { delay: 3, multiplier: 0.3 },
      { delay: 7, multiplier: 0.2 },
      { delay: 14, multiplier: -0.3 }  // Quick recovery started
    ],
    recoveryPattern: {
      type: 'v-shaped',
      durationDays: 150,  // Quick recovery
      volatilityDecay: 0.92
    }
  },
  {
    id: 'flash_crash_2010',
    name: 'Flash Crash of 2010',
    type: CRASH_TYPES.FLASH_CRASH,
    severity: SEVERITY_LEVELS.SEVERE,
    startDate: new Date('2010-05-06T14:32:00'),
    endDate: new Date('2010-05-06T15:07:00'),
    description: 'Rapid algorithmic trading-induced crash and recovery',
    trigger: TRIGGER_TYPES.HISTORICAL,
    impact: {
      market: -0.09,  // 9% intraday drop, mostly recovered
      volatilityMultiplier: 10.0,  // Extreme short-term volatility
      liquidityReduction: 0.9,     // Near-total liquidity evaporation
      sentimentShift: -0.6,
      sectors: {
        'Financial': -0.10,
        'Technology': -0.09,
        'Industrials': -0.08,
        'Consumer': -0.08,
        'Energy': -0.09
      }
    },
    cascadingEffects: [
      { delay: 0, multiplier: 1.0 },
      { delay: 0.02, multiplier: -0.7 },  // ~30 minutes later, 70% recovery
      { delay: 1, multiplier: -0.95 }     // Next day, almost full recovery
    ],
    recoveryPattern: {
      type: 'immediate',
      durationDays: 1,
      volatilityDecay: 0.85
    }
  }
];

/**
 * Hypothetical stress test scenarios
 */
const hypotheticalScenarios = [
  {
    id: 'tech_bubble_burst',
    name: 'Hypothetical Tech Bubble Burst',
    type: CRASH_TYPES.SECTOR_CRASH,
    severity: SEVERITY_LEVELS.CATASTROPHIC,
    description: 'Simulated collapse of overvalued technology sector',
    trigger: TRIGGER_TYPES.CONDITION,
    impact: {
      market: -0.25,
      volatilityMultiplier: 4.0,
      liquidityReduction: 0.5,
      sentimentShift: -0.75,
      sectors: {
        'Technology': -0.60,
        'Financial': -0.15,
        'Industrials': -0.10,
        'Consumer': -0.08,
        'Energy': -0.05
      }
    },
    triggerConditions: {
      type: 'sector_valuation',
      sector: 'Technology',
      peRatioThreshold: 50,  // Trigger if sector P/E > 50
      durationDays: 30       // Must be sustained for 30 days
    },
    cascadingEffects: [
      { delay: 0, multiplier: 1.0 },
      { delay: 7, multiplier: 0.3 },
      { delay: 30, multiplier: 0.2 },
      { delay: 90, multiplier: 0.1 }
    ],
    recoveryPattern: {
      type: 'gradual',
      durationDays: 365,
      volatilityDecay: 0.96
    }
  },
  {
    id: 'banking_crisis',
    name: 'Hypothetical Banking Crisis',
    type: CRASH_TYPES.CONTAGION,
    severity: SEVERITY_LEVELS.CATASTROPHIC,
    description: 'Simulated systemic banking failure',
    trigger: TRIGGER_TYPES.MANUAL,
    impact: {
      market: -0.45,
      volatilityMultiplier: 5.0,
      liquidityReduction: 0.8,
      sentimentShift: -0.95,
      sectors: {
        'Financial': -0.70,
        'Technology': -0.35,
        'Industrials': -0.40,
        'Consumer': -0.42,
        'Energy': -0.38
      }
    },
    cascadingEffects: [
      { delay: 0, multiplier: 1.0 },
      { delay: 1, multiplier: 0.5 },
      { delay: 7, multiplier: 0.4 },
      { delay: 30, multiplier: 0.3 },
      { delay: 90, multiplier: 0.2 },
      { delay: 180, multiplier: 0.1 }
    ],
    recoveryPattern: {
      type: 'slow',
      durationDays: 730,
      volatilityDecay: 0.98
    }
  },
  {
    id: 'energy_crisis',
    name: 'Hypothetical Energy Crisis',
    type: CRASH_TYPES.SECTOR_CRASH,
    severity: SEVERITY_LEVELS.SEVERE,
    description: 'Simulated oil/energy supply shock',
    trigger: TRIGGER_TYPES.MANUAL,
    impact: {
      market: -0.18,
      volatilityMultiplier: 3.5,
      liquidityReduction: 0.4,
      sentimentShift: -0.65,
      sectors: {
        'Energy': -0.50,
        'Industrials': -0.25,
        'Consumer': -0.20,
        'Financial': -0.12,
        'Technology': -0.08
      }
    },
    cascadingEffects: [
      { delay: 0, multiplier: 1.0 },
      { delay: 7, multiplier: 0.4 },
      { delay: 30, multiplier: 0.3 },
      { delay: 90, multiplier: 0.15 }
    ],
    recoveryPattern: {
      type: 'gradual',
      durationDays: 180,
      volatilityDecay: 0.95
    }
  },
  {
    id: 'geopolitical_shock',
    name: 'Hypothetical Geopolitical Shock',
    type: CRASH_TYPES.MARKET_CRASH,
    severity: SEVERITY_LEVELS.SEVERE,
    description: 'Simulated major geopolitical crisis',
    trigger: TRIGGER_TYPES.MANUAL,
    impact: {
      market: -0.28,
      volatilityMultiplier: 4.5,
      liquidityReduction: 0.55,
      sentimentShift: -0.80,
      sectors: {
        'Financial': -0.32,
        'Technology': -0.22,
        'Industrials': -0.30,
        'Consumer': -0.25,
        'Energy': -0.35
      }
    },
    cascadingEffects: [
      { delay: 0, multiplier: 1.0 },
      { delay: 1, multiplier: 0.4 },
      { delay: 7, multiplier: 0.25 },
      { delay: 30, multiplier: 0.15 }
    ],
    recoveryPattern: {
      type: 'gradual',
      durationDays: 120,
      volatilityDecay: 0.94
    }
  }
];

/**
 * Crash event template for custom scenarios
 */
function createCrashTemplate(overrides = {}) {
  return {
    id: overrides.id || `custom_${Date.now()}`,
    name: overrides.name || 'Custom Market Event',
    type: overrides.type || CRASH_TYPES.MARKET_CRASH,
    severity: overrides.severity || SEVERITY_LEVELS.MODERATE,
    startDate: overrides.startDate || new Date(),
    endDate: overrides.endDate || null,
    description: overrides.description || 'Custom market crash scenario',
    trigger: overrides.trigger || TRIGGER_TYPES.MANUAL,
    impact: {
      market: overrides.marketImpact || -0.15,
      volatilityMultiplier: overrides.volatilityMultiplier || 2.5,
      liquidityReduction: overrides.liquidityReduction || 0.3,
      sentimentShift: overrides.sentimentShift || -0.5,
      sectors: overrides.sectors || {
        'Financial': -0.15,
        'Technology': -0.15,
        'Industrials': -0.15,
        'Consumer': -0.15,
        'Energy': -0.15
      }
    },
    cascadingEffects: overrides.cascadingEffects || [
      { delay: 0, multiplier: 1.0 },
      { delay: 7, multiplier: 0.3 },
      { delay: 30, multiplier: 0.1 }
    ],
    recoveryPattern: overrides.recoveryPattern || {
      type: 'gradual',
      durationDays: 90,
      volatilityDecay: 0.95
    }
  };
}

module.exports = {
  CRASH_TYPES,
  TRIGGER_TYPES,
  SEVERITY_LEVELS,
  historicalCrashes,
  hypotheticalScenarios,
  createCrashTemplate,
  
  /**
   * Get all available crash scenarios
   */
  getAllScenarios() {
    return [...historicalCrashes, ...hypotheticalScenarios];
  },
  
  /**
   * Get scenario by ID
   */
  getScenarioById(id) {
    return this.getAllScenarios().find(s => s.id === id);
  },
  
  /**
   * Get scenarios by type
   */
  getScenariosByType(type) {
    return this.getAllScenarios().filter(s => s.type === type);
  },
  
  /**
   * Get historical scenarios only
   */
  getHistoricalScenarios() {
    return historicalCrashes;
  },
  
  /**
   * Get hypothetical scenarios only
   */
  getHypotheticalScenarios() {
    return hypotheticalScenarios;
  }
};
