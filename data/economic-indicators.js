/**
 * Economic Indicators and Federal Reserve Policy Data
 * 
 * Provides historical and dynamic economic data including:
 * - Federal Funds Rate (Fed's benchmark interest rate)
 * - Quantitative Easing (QE) periods and magnitudes
 * - GDP growth rates
 * - Unemployment rates
 * 
 * These indicators impact stock market growth to prevent excessive gains after 2025
 */

/**
 * Historical Federal Funds Rate (%)
 * Source: Federal Reserve Economic Data (FRED)
 */
const HISTORICAL_FED_FUNDS_RATE = {
  1970: 7.18, 1971: 4.67, 1972: 4.43, 1973: 8.74, 1974: 10.51, 1975: 5.82,
  1976: 5.04, 1977: 5.54, 1978: 7.94, 1979: 11.20, 1980: 13.36, 1981: 16.39,
  1982: 12.24, 1983: 9.09, 1984: 10.23, 1985: 8.10, 1986: 6.80, 1987: 6.67,
  1988: 7.57, 1989: 9.21, 1990: 8.10, 1991: 5.69, 1992: 3.52, 1993: 3.02,
  1994: 4.20, 1995: 5.83, 1996: 5.30, 1997: 5.46, 1998: 5.35, 1999: 4.97,
  2000: 6.24, 2001: 3.88, 2002: 1.67, 2003: 1.13, 2004: 1.35, 2005: 3.22,
  2006: 5.02, 2007: 5.02, 2008: 1.92, 2009: 0.16, 2010: 0.18, 2011: 0.14,
  2012: 0.14, 2013: 0.11, 2014: 0.09, 2015: 0.14, 2016: 0.40, 2017: 1.00,
  2018: 1.82, 2019: 2.16, 2020: 0.38, 2021: 0.08, 2022: 1.68, 2023: 5.00,
  2024: 5.33
};

/**
 * Quantitative Easing (QE) periods and asset purchases (billions USD/year)
 * Positive values = asset purchases (stimulative), negative = tapering/reduction
 */
const QUANTITATIVE_EASING_HISTORY = {
  // QE1: 2008-2010
  2008: 600, 2009: 1200, 2010: 500,
  // QE2: 2010-2011
  2011: 600,
  // QE3: 2012-2014
  2012: 400, 2013: 850, 2014: 400,
  // Tapering: 2015-2019
  2015: -50, 2016: -100, 2017: -150, 2018: -200, 2019: -50,
  // COVID QE: 2020-2021
  2020: 3000, 2021: 1200,
  // Tapering: 2022-2023
  2022: -500, 2023: -800, 2024: -600
};

/**
 * Historical GDP growth rates (%)
 * Source: Bureau of Economic Analysis
 */
const HISTORICAL_GDP_GROWTH = {
  1970: 0.2, 1971: 3.3, 1972: 5.3, 1973: 5.6, 1974: -0.5, 1975: -0.2,
  1976: 5.4, 1977: 4.6, 1978: 5.5, 1979: 3.2, 1980: -0.3, 1981: 2.5,
  1982: -1.8, 1983: 4.6, 1984: 7.2, 1985: 4.2, 1986: 3.5, 1987: 3.5,
  1988: 4.2, 1989: 3.7, 1990: 1.9, 1991: -0.1, 1992: 3.5, 1993: 2.8,
  1994: 4.0, 1995: 2.7, 1996: 3.8, 1997: 4.5, 1998: 4.5, 1999: 4.8,
  2000: 4.1, 2001: 1.0, 2002: 1.7, 2003: 2.9, 2004: 3.8, 2005: 3.5,
  2006: 2.9, 2007: 1.9, 2008: -0.1, 2009: -2.5, 2010: 2.6, 2011: 1.6,
  2012: 2.2, 2013: 1.8, 2014: 2.5, 2015: 2.9, 2016: 1.7, 2017: 2.3,
  2018: 3.0, 2019: 2.3, 2020: -2.8, 2021: 5.8, 2022: 1.9, 2023: 2.5,
  2024: 2.8
};

/**
 * Historical unemployment rates (%)
 * Source: Bureau of Labor Statistics
 */
const HISTORICAL_UNEMPLOYMENT_RATE = {
  1970: 4.9, 1971: 5.9, 1972: 5.6, 1973: 4.9, 1974: 5.6, 1975: 8.5,
  1976: 7.7, 1977: 7.1, 1978: 6.1, 1979: 5.8, 1980: 7.1, 1981: 7.6,
  1982: 9.7, 1983: 9.6, 1984: 7.5, 1985: 7.2, 1986: 7.0, 1987: 6.2,
  1988: 5.5, 1989: 5.3, 1990: 5.6, 1991: 6.8, 1992: 7.5, 1993: 6.9,
  1994: 6.1, 1995: 5.6, 1996: 5.4, 1997: 4.9, 1998: 4.5, 1999: 4.2,
  2000: 4.0, 2001: 4.7, 2002: 5.8, 2003: 6.0, 2004: 5.5, 2005: 5.1,
  2006: 4.6, 2007: 4.6, 2008: 5.8, 2009: 9.3, 2010: 9.6, 2011: 8.9,
  2012: 8.1, 2013: 7.4, 2014: 6.2, 2015: 5.3, 2016: 4.9, 2017: 4.4,
  2018: 3.9, 2019: 3.7, 2020: 8.1, 2021: 5.4, 2022: 3.6, 2023: 3.6,
  2024: 4.0
};

/**
 * Configuration for dynamic economic data generation (post-2024)
 */
const ECONOMIC_CONFIG = {
  // Base rates for future projections
  baseFedFundsRate: 3.5,          // Target neutral rate
  baseGDPGrowth: 2.0,              // Long-term GDP growth target
  baseUnemploymentRate: 4.5,       // Natural rate of unemployment
  
  // Fed policy response parameters
  inflationTargetRate: 2.0,        // Fed's inflation target (%)
  fedResponseStrength: 0.5,        // How aggressively Fed responds to inflation
  qeTaperRate: 100,                // Annual QE reduction rate (billions)
  
  // Economic cycle parameters
  businessCycleLength: 8,          // Average years between recessions
  recessionProbability: 0.12,      // Annual probability of recession (12%)
  recessionDuration: 1.5,          // Average recession duration in years
  
  // Volatility parameters
  rateVolatility: 0.5,             // Fed funds rate variation
  gdpVolatility: 1.0,              // GDP growth variation
  unemploymentVolatility: 0.3      // Unemployment rate variation
};

/**
 * Seeded random number generator for deterministic generation
 */
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Generate seed from year for consistent random generation
 */
function yearSeed(year) {
  return year * 31415;
}

/**
 * Generate Federal Funds Rate for years beyond 2024
 */
function generateFedFundsRate(year, inflationRate = null) {
  if (year <= 2024) {
    return HISTORICAL_FED_FUNDS_RATE[year] || ECONOMIC_CONFIG.baseFedFundsRate;
  }
  
  // Use previous year as baseline
  const previousYear = year - 1;
  const previousRate = previousYear <= 2024 ? 
    HISTORICAL_FED_FUNDS_RATE[previousYear] : 
    generateFedFundsRate(previousYear);
  
  // Fed responds to inflation
  let targetRate = ECONOMIC_CONFIG.baseFedFundsRate;
  
  if (inflationRate !== null) {
    // Taylor Rule-inspired approach
    // Rate adjusts based on deviation from inflation target
    const inflationGap = inflationRate - ECONOMIC_CONFIG.inflationTargetRate;
    targetRate = ECONOMIC_CONFIG.baseFedFundsRate + 
                 (inflationGap * ECONOMIC_CONFIG.fedResponseStrength);
  }
  
  // Gradual adjustment (don't jump to target immediately)
  const adjustmentSpeed = 0.3; // Adjust 30% of gap per year
  let newRate = previousRate + (targetRate - previousRate) * adjustmentSpeed;
  
  // Add some random variation
  const seed = yearSeed(year);
  const random = seededRandom(seed);
  const variation = (random - 0.5) * ECONOMIC_CONFIG.rateVolatility;
  newRate += variation;
  
  // Keep rates in reasonable bounds (0% to 10%)
  newRate = Math.max(0, Math.min(10, newRate));
  
  return Math.round(newRate * 100) / 100;
}

/**
 * Generate Quantitative Easing for years beyond 2024
 */
function generateQE(year, fedFundsRate = null) {
  if (year <= 2024) {
    return QUANTITATIVE_EASING_HISTORY[year] || 0;
  }
  
  // QE typically happens when rates are low (near zero)
  // Taper when rates are rising
  let qeAmount = 0;
  
  if (fedFundsRate !== null) {
    if (fedFundsRate < 0.5) {
      // Very low rates - aggressive QE
      qeAmount = 800;
    } else if (fedFundsRate < 1.5) {
      // Low rates - moderate QE
      qeAmount = 300;
    } else if (fedFundsRate < 3.0) {
      // Moderate rates - gradual taper
      qeAmount = -200;
    } else {
      // High rates - quantitative tightening
      qeAmount = -500;
    }
  }
  
  // Add some randomness
  const seed = yearSeed(year) + 100;
  const random = seededRandom(seed);
  const variation = (random - 0.5) * 200;
  
  return Math.round(qeAmount + variation);
}

/**
 * Generate GDP growth rate for years beyond 2024
 */
function generateGDPGrowth(year) {
  if (year <= 2024) {
    return HISTORICAL_GDP_GROWTH[year] || ECONOMIC_CONFIG.baseGDPGrowth;
  }
  
  const seed = yearSeed(year) + 200;
  const random1 = seededRandom(seed);
  const random2 = seededRandom(seed + 1);
  
  // Check for recession (random chance)
  const recessionThreshold = ECONOMIC_CONFIG.recessionProbability;
  const isRecession = random1 < recessionThreshold;
  
  let gdpGrowth;
  if (isRecession) {
    // Recession: negative growth
    gdpGrowth = -1.5 + (random2 - 0.5) * 2.0; // -2.5% to -0.5%
  } else {
    // Normal growth with variation
    gdpGrowth = ECONOMIC_CONFIG.baseGDPGrowth + 
                (random2 - 0.5) * ECONOMIC_CONFIG.gdpVolatility * 2;
  }
  
  // Ensure reasonable bounds
  gdpGrowth = Math.max(-4, Math.min(6, gdpGrowth));
  
  return Math.round(gdpGrowth * 10) / 10;
}

/**
 * Generate unemployment rate for years beyond 2024
 */
function generateUnemploymentRate(year, gdpGrowth = null) {
  if (year <= 2024) {
    return HISTORICAL_UNEMPLOYMENT_RATE[year] || ECONOMIC_CONFIG.baseUnemploymentRate;
  }
  
  const previousYear = year - 1;
  const previousRate = previousYear <= 2024 ?
    HISTORICAL_UNEMPLOYMENT_RATE[previousYear] :
    generateUnemploymentRate(previousYear);
  
  // Okun's Law: unemployment inversely related to GDP growth
  let change = 0;
  if (gdpGrowth !== null) {
    // Roughly: 1% GDP decline = 0.5% unemployment increase
    const gdpGap = ECONOMIC_CONFIG.baseGDPGrowth - gdpGrowth;
    change = gdpGap * 0.4;
  }
  
  // Gradual mean reversion to natural rate
  const gap = ECONOMIC_CONFIG.baseUnemploymentRate - previousRate;
  change += gap * 0.2;
  
  // Add random variation
  const seed = yearSeed(year) + 300;
  const random = seededRandom(seed);
  const variation = (random - 0.5) * ECONOMIC_CONFIG.unemploymentVolatility;
  
  let newRate = previousRate + change + variation;
  
  // Keep in reasonable bounds (3% to 12%)
  newRate = Math.max(3, Math.min(12, newRate));
  
  return Math.round(newRate * 10) / 10;
}

/**
 * Get all economic indicators for a given year
 */
function getEconomicIndicators(year, inflationRate = null) {
  // For historical years, use actual data
  if (year <= 2024) {
    return {
      year: year,
      fedFundsRate: HISTORICAL_FED_FUNDS_RATE[year] || 0,
      quantitativeEasing: QUANTITATIVE_EASING_HISTORY[year] || 0,
      gdpGrowth: HISTORICAL_GDP_GROWTH[year] || 0,
      unemploymentRate: HISTORICAL_UNEMPLOYMENT_RATE[year] || 0,
      inflationRate: inflationRate
    };
  }
  
  // For future years, generate dynamically
  const gdpGrowth = generateGDPGrowth(year);
  const fedFundsRate = generateFedFundsRate(year, inflationRate);
  const qe = generateQE(year, fedFundsRate);
  const unemploymentRate = generateUnemploymentRate(year, gdpGrowth);
  
  return {
    year: year,
    fedFundsRate: fedFundsRate,
    quantitativeEasing: qe,
    gdpGrowth: gdpGrowth,
    unemploymentRate: unemploymentRate,
    inflationRate: inflationRate
  };
}

/**
 * Calculate market impact from economic indicators
 * Returns a growth rate modifier (-1.0 to +1.0)
 */
function calculateMarketImpact(economicIndicators) {
  let impact = 0;
  
  // Impact calculation coefficients (configurable)
  const NEUTRAL_FED_RATE = 3.5;           // Neutral federal funds rate
  const RATE_IMPACT_COEFF = 0.01;         // Impact per 1% rate deviation
  const QE_IMPACT_COEFF = 0.03;           // Impact per $1T QE
  const GDP_BASELINE = 2.0;               // Long-term GDP trend
  const GDP_IMPACT_COEFF = 0.01;          // Impact per 1% GDP deviation
  const UNEMP_NATURAL_RATE = 4.5;         // Natural unemployment rate
  const UNEMP_IMPACT_COEFF = 0.008;       // Impact per 1% unemployment deviation
  const INFLATION_THRESHOLD = 1.0;        // Inflation deviation before penalty
  const INFLATION_IMPACT_COEFF = 0.005;   // Impact per 1% inflation over threshold
  
  // 1. Fed Funds Rate impact (higher rates = slower growth)
  // Normalize around neutral rate
  const rateDeviation = economicIndicators.fedFundsRate - NEUTRAL_FED_RATE;
  const rateImpact = -RATE_IMPACT_COEFF * rateDeviation;
  impact += rateImpact;
  
  // 2. Quantitative Easing impact (QE boosts markets, QT hurts)
  // Normalize QE impact (every $1T of QE = +3% boost)
  const qeImpact = (economicIndicators.quantitativeEasing / 1000) * QE_IMPACT_COEFF;
  impact += qeImpact;
  
  // 3. GDP growth impact (strong economy = better earnings)
  // Normalize around long-term GDP growth
  const gdpDeviation = economicIndicators.gdpGrowth - GDP_BASELINE;
  const gdpImpact = gdpDeviation * GDP_IMPACT_COEFF;
  impact += gdpImpact;
  
  // 4. Unemployment impact (low unemployment = strong economy)
  // Normalize around natural rate
  const unemploymentDeviation = economicIndicators.unemploymentRate - UNEMP_NATURAL_RATE;
  const unemploymentImpact = -unemploymentDeviation * UNEMP_IMPACT_COEFF;
  impact += unemploymentImpact;
  
  // 5. Inflation impact (moderate inflation good, extreme bad)
  if (economicIndicators.inflationRate) {
    const inflationDeviation = Math.abs(economicIndicators.inflationRate - 2.0);
    // Penalize only if inflation is significantly off target
    if (inflationDeviation > INFLATION_THRESHOLD) {
      const inflationImpact = -(inflationDeviation - INFLATION_THRESHOLD) * INFLATION_IMPACT_COEFF;
      impact += inflationImpact;
    }
  }
  
  // Cap total impact at reasonable bounds
  // Allow some positive boost from good conditions
  return Math.max(-0.15, Math.min(0.10, impact));
}

/**
 * Get historical economic data (for testing/reference)
 */
function getHistoricalData() {
  return {
    fedFundsRate: { ...HISTORICAL_FED_FUNDS_RATE },
    quantitativeEasing: { ...QUANTITATIVE_EASING_HISTORY },
    gdpGrowth: { ...HISTORICAL_GDP_GROWTH },
    unemploymentRate: { ...HISTORICAL_UNEMPLOYMENT_RATE }
  };
}

/**
 * Get configuration
 */
function getConfiguration() {
  return { ...ECONOMIC_CONFIG };
}

/**
 * Update configuration with validation
 */
function updateConfiguration(newConfig) {
  // Validate configuration parameters
  const validations = {
    baseFedFundsRate: { min: 0, max: 15, type: 'number' },
    baseGDPGrowth: { min: -2, max: 10, type: 'number' },
    baseUnemploymentRate: { min: 2, max: 15, type: 'number' },
    inflationTargetRate: { min: 0, max: 10, type: 'number' },
    fedResponseStrength: { min: 0, max: 2, type: 'number' },
    qeTaperRate: { min: 0, max: 2000, type: 'number' },
    businessCycleLength: { min: 3, max: 15, type: 'number' },
    recessionProbability: { min: 0, max: 0.5, type: 'number' },
    recessionDuration: { min: 0.5, max: 5, type: 'number' },
    rateVolatility: { min: 0, max: 5, type: 'number' },
    gdpVolatility: { min: 0, max: 5, type: 'number' },
    unemploymentVolatility: { min: 0, max: 2, type: 'number' }
  };
  
  // Validate each provided parameter
  for (const [key, value] of Object.entries(newConfig)) {
    const validation = validations[key];
    
    if (!validation) {
      console.warn(`Unknown configuration parameter: ${key}`);
      continue;
    }
    
    if (typeof value !== validation.type) {
      throw new Error(`Invalid type for ${key}: expected ${validation.type}, got ${typeof value}`);
    }
    
    if (validation.min !== undefined && value < validation.min) {
      throw new Error(`Invalid value for ${key}: ${value} < ${validation.min}`);
    }
    
    if (validation.max !== undefined && value > validation.max) {
      throw new Error(`Invalid value for ${key}: ${value} > ${validation.max}`);
    }
  }
  
  // All validations passed, update configuration
  Object.assign(ECONOMIC_CONFIG, newConfig);
  return true;
}

module.exports = {
  getEconomicIndicators,
  calculateMarketImpact,
  generateFedFundsRate,
  generateQE,
  generateGDPGrowth,
  generateUnemploymentRate,
  getHistoricalData,
  getConfiguration,
  updateConfiguration,
  
  // Exports for direct access if needed
  HISTORICAL_FED_FUNDS_RATE,
  QUANTITATIVE_EASING_HISTORY,
  HISTORICAL_GDP_GROWTH,
  HISTORICAL_UNEMPLOYMENT_RATE
};
