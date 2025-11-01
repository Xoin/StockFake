/**
 * Dynamic Rates Generator
 * Automatically generates tax rates, dividend rates, and inflation data for dates beyond 2024
 * Based on historical patterns and economic models
 */

/**
 * Configuration for dynamic rate generation
 */
const DYNAMIC_RATES_CONFIG = {
  // When to start generating dynamic rates (after historical data ends)
  historicalDataEndDate: new Date('2024-12-31T23:59:59'),
  
  // Base rates for extrapolation
  baseInflationRate: 2.5,  // Target inflation rate (Federal Reserve target)
  baseShortTermTaxRate: 0.30,  // 30% short-term capital gains
  baseLongTermTaxRate: 0.15,   // 15% long-term capital gains
  baseDividendTaxRate: 0.15,   // 15% dividend tax
  
  // Variation parameters for realism
  inflationVolatility: 1.5,  // Standard deviation for inflation variation
  taxVolatility: 0.02,        // Standard deviation for tax rate changes
  dividendGrowthRate: 0.03,   // Average annual dividend growth rate
  dividendVolatility: 0.10,   // Dividend rate variation
};

/**
 * Historical baseline data (from constants.js)
 */
const HISTORICAL_INFLATION = {
  1970: 5.9, 1971: 4.3, 1972: 3.3, 1973: 6.2, 1974: 11.1, 1975: 9.1, 1976: 5.8,
  1977: 6.5, 1978: 7.6, 1979: 11.3, 1980: 13.5, 1981: 10.3, 1982: 6.2, 1983: 3.2,
  1984: 4.3, 1985: 3.6, 1986: 1.9, 1987: 3.6, 1988: 4.1, 1989: 4.8, 1990: 5.4,
  1991: 4.2, 1992: 3.0, 1993: 3.0, 1994: 2.6, 1995: 2.8, 1996: 3.0, 1997: 2.3,
  1998: 1.6, 1999: 2.2, 2000: 3.4, 2001: 2.8, 2002: 1.6, 2003: 2.3, 2004: 2.7,
  2005: 3.4, 2006: 3.2, 2007: 2.8, 2008: 3.8, 2009: -0.4, 2010: 1.6, 2011: 3.2,
  2012: 2.1, 2013: 1.5, 2014: 1.6, 2015: 0.1, 2016: 1.3, 2017: 2.1, 2018: 2.4,
  2019: 1.8, 2020: 1.2, 2021: 4.7, 2022: 8.0, 2023: 4.1, 2024: 2.9
};

const HISTORICAL_DIVIDENDS = {
  // Technology
  'IBM': 0.50, 'AAPL': 0.25, 'MSFT': 0.30, 'INTC': 0.35, 'ORCL': 0.20,
  'TXN': 0.28, 'QCOM': 0.30, 'CSCO': 0.38, 'HPQ': 0.25,
  
  // Energy
  'XOM': 0.45, 'CVX': 0.50, 'BP': 0.40, 'RDS': 0.42, 'TOT': 0.38,
  'COP': 0.35, 'SLB': 0.25, 'OXY': 0.30,
  
  // Industrials
  'GE': 0.35, 'BA': 0.52, 'CAT': 0.48, 'MMM': 0.60, 'HON': 0.42,
  'LMT': 0.65, 'UTX': 0.45, 'DE': 0.40, 'EMR': 0.50,
  
  // Automotive
  'GM': 0.38, 'F': 0.35, 'TM': 0.42, 'HMC': 0.35,
  
  // Healthcare & Pharmaceuticals
  'JNJ': 0.55, 'PFE': 0.40, 'MRK': 0.45, 'LLY': 0.42, 'BMY': 0.50,
  'AMGN': 0.48, 'GILD': 0.35, 'UNH': 0.30, 'CVS': 0.25, 'ABT': 0.45,
  'MDT': 0.38, 'TMO': 0.15, 'ABBV': 0.65,
  
  // Financial Services
  'JPM': 0.45, 'BAC': 0.40, 'WFC': 0.42, 'C': 0.38, 'GS': 0.50,
  'MS': 0.45, 'AXP': 0.40, 'BLK': 0.52, 'SCHW': 0.25, 'USB': 0.42,
  'PNC': 0.48, 'TFC': 0.45,
  
  // Insurance
  'BRK.B': 0, 'AIG': 0.35, 'MET': 0.48, 'PRU': 0.52, 'ALL': 0.50,
  'TRV': 0.55, 'PGR': 0.30,
  
  // Retail
  'WMT': 0.55, 'HD': 0.50, 'LOW': 0.48, 'TGT': 0.45, 'COST': 0.35, 'KR': 0.30,
  
  // Consumer Goods
  'PG': 0.60, 'KO': 0.42, 'PEP': 0.45, 'PM': 0.65, 'MO': 0.70,
  'CL': 0.48, 'KMB': 0.52, 'GIS': 0.50, 'K': 0.48, 'CPB': 0.45,
  'HSY': 0.42, 'MCD': 0.52, 'SBUX': 0.25, 'NKE': 0.28,
  
  // Telecom
  'T': 0.52, 'VZ': 0.55, 'TMUS': 0, 'CTL': 0.25,
  
  // Media & Entertainment
  'DIS': 0, 'CMCSA': 0.38, 'TWX': 0.40, 'FOXA': 0.35, 'VIAB': 0.42,
  
  // Chemicals & Materials
  'DOW': 0.45, 'DD': 0.42, 'ECL': 0.35, 'APD': 0.52, 'PPG': 0.48,
  'NEM': 0.30, 'FCX': 0.25,
  
  // Utilities
  'NEE': 0.55, 'DUK': 0.58, 'SO': 0.60, 'D': 0.52, 'EXC': 0.48, 'AEP': 0.55,
  
  // Transportation
  'UPS': 0.52, 'FDX': 0.30, 'UNP': 0.48, 'NSC': 0.50, 'CSX': 0.45,
  
  // Real Estate (REITs)
  'AMT': 0.60, 'PLD': 0.55, 'CCI': 0.62, 'SPG': 0.70,
  
  // Other
  'ADM': 0.45, 'BG': 0.40, 'TSN': 0.38, 'CLX': 0.50, 'EL': 0.30,
  'IP': 0.40, 'WY': 0.45, 'NUE': 0.42, 'AA': 0.35
};

/**
 * Seeded random number generator for deterministic generation
 */
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Generate a seed from a year for consistent random generation
 */
function yearSeed(year) {
  return year * 31415;  // Use prime-like multiplier for better distribution
}

/**
 * Generate inflation rate for a given year beyond 2024
 */
function generateInflationRate(year) {
  if (year <= 2024) {
    return HISTORICAL_INFLATION[year] || DYNAMIC_RATES_CONFIG.baseInflationRate;
  }
  
  // Use seeded random for deterministic generation
  const seed = yearSeed(year);
  const random1 = seededRandom(seed);
  const random2 = seededRandom(seed + 1);
  
  // Mean reversion to target rate with some volatility
  // Use the previous year's rate as starting point for smoothing
  const lastHistoricalYear = 2024;
  const yearsSinceHistorical = year - lastHistoricalYear;
  const lastHistoricalRate = HISTORICAL_INFLATION[lastHistoricalYear];
  
  // Gradually revert to base rate with some random walk
  const meanReversionSpeed = 0.3;  // 30% reversion per year
  const targetRate = DYNAMIC_RATES_CONFIG.baseInflationRate;
  
  // Calculate expected rate with mean reversion
  const expectedRate = lastHistoricalRate + 
    meanReversionSpeed * (targetRate - lastHistoricalRate) * Math.min(yearsSinceHistorical / 5, 1);
  
  // Add random variation using Box-Muller transform for normal distribution
  const u1 = random1;
  const u2 = random2;
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  const variation = z * DYNAMIC_RATES_CONFIG.inflationVolatility;
  
  // Ensure inflation stays in reasonable bounds (-2% to 15%)
  const rate = Math.max(-2, Math.min(15, expectedRate + variation));
  
  // Round to one decimal place
  return Math.round(rate * 10) / 10;
}

/**
 * Get all inflation rates (historical + dynamic)
 */
function getAllInflationRates(upToYear = null) {
  const rates = { ...HISTORICAL_INFLATION };
  
  if (!upToYear) {
    return rates;
  }
  
  // Generate dynamic rates for years beyond 2024
  for (let year = 2025; year <= upToYear; year++) {
    rates[year] = generateInflationRate(year);
  }
  
  return rates;
}

/**
 * Generate dividend rate for a given symbol for years beyond 2024
 */
function generateDividendRate(symbol, year) {
  const baseRate = HISTORICAL_DIVIDENDS[symbol];
  
  // If no historical dividend or before dynamic period, use base rate
  if (!baseRate || year <= 2024) {
    return baseRate || 0;
  }
  
  // Use seeded random for deterministic generation
  const symbolSeed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const seed = yearSeed(year) + symbolSeed;
  const random1 = seededRandom(seed);
  const random2 = seededRandom(seed + 1);
  
  // Calculate years since historical data
  const yearsSinceHistorical = year - 2024;
  
  // Apply compound growth with variation
  const growthFactor = Math.pow(1 + DYNAMIC_RATES_CONFIG.dividendGrowthRate, yearsSinceHistorical);
  
  // Add random variation (some years up, some down)
  const variation = (random1 - 0.5) * 2 * DYNAMIC_RATES_CONFIG.dividendVolatility;
  const yearlyMultiplier = 1 + variation;
  
  // Calculate new dividend rate
  const newRate = baseRate * growthFactor * yearlyMultiplier;
  
  // Round to 2 decimal places and ensure non-negative
  return Math.max(0, Math.round(newRate * 100) / 100);
}

/**
 * Get all dividend rates for a given year
 */
function getAllDividendRates(year = null) {
  if (!year || year <= 2024) {
    return { ...HISTORICAL_DIVIDENDS };
  }
  
  const rates = {};
  for (const symbol of Object.keys(HISTORICAL_DIVIDENDS)) {
    rates[symbol] = generateDividendRate(symbol, year);
  }
  
  return rates;
}

/**
 * Generate tax rates for a given year beyond 2024
 */
function generateTaxRates(year) {
  if (year <= 2024) {
    return {
      shortTermTaxRate: DYNAMIC_RATES_CONFIG.baseShortTermTaxRate,
      longTermTaxRate: DYNAMIC_RATES_CONFIG.baseLongTermTaxRate,
      dividendTaxRate: DYNAMIC_RATES_CONFIG.baseDividendTaxRate
    };
  }
  
  // Use seeded random for deterministic generation
  const seed = yearSeed(year);
  const random1 = seededRandom(seed + 100);
  const random2 = seededRandom(seed + 200);
  const random3 = seededRandom(seed + 300);
  
  // Tax rates change slowly and rarely
  // Model rare legislative changes
  const changeThreshold = 0.95;  // 5% chance of change per year
  
  let shortTermRate = DYNAMIC_RATES_CONFIG.baseShortTermTaxRate;
  let longTermRate = DYNAMIC_RATES_CONFIG.baseLongTermTaxRate;
  let dividendRate = DYNAMIC_RATES_CONFIG.baseDividendTaxRate;
  
  // Small variations around base rates
  if (random1 > changeThreshold) {
    const variation = (random2 - 0.5) * DYNAMIC_RATES_CONFIG.taxVolatility;
    shortTermRate = Math.max(0.20, Math.min(0.40, shortTermRate + variation));
  }
  
  if (random2 > changeThreshold) {
    const variation = (random3 - 0.5) * DYNAMIC_RATES_CONFIG.taxVolatility;
    longTermRate = Math.max(0.10, Math.min(0.25, longTermRate + variation));
  }
  
  if (random3 > changeThreshold) {
    const variation = (random1 - 0.5) * DYNAMIC_RATES_CONFIG.taxVolatility;
    dividendRate = Math.max(0.10, Math.min(0.25, dividendRate + variation));
  }
  
  return {
    shortTermTaxRate: Math.round(shortTermRate * 100) / 100,
    longTermTaxRate: Math.round(longTermRate * 100) / 100,
    dividendTaxRate: Math.round(dividendRate * 100) / 100
  };
}

/**
 * Get configuration
 */
function getConfiguration() {
  return { ...DYNAMIC_RATES_CONFIG };
}

/**
 * Update configuration
 */
function updateConfiguration(newConfig) {
  Object.assign(DYNAMIC_RATES_CONFIG, newConfig);
}

module.exports = {
  generateInflationRate,
  getAllInflationRates,
  generateDividendRate,
  getAllDividendRates,
  generateTaxRates,
  getConfiguration,
  updateConfiguration,
  
  // For testing
  HISTORICAL_INFLATION,
  HISTORICAL_DIVIDENDS
};
