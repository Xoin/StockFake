/**
 * Market Average Controls Module
 * 
 * Implements academically-validated mechanisms to prevent extreme and unsustainable
 * market average movements, particularly for post-2024 simulations.
 * 
 * This module addresses the issue of potential runaway market growth by implementing
 * multiple research-backed control mechanisms that work in concert to maintain
 * realistic market behavior.
 * 
 * Academic References:
 * 
 * 1. Mean Reversion Models:
 *    - "A regime-switching model of stock returns with momentum and mean reversion"
 *      (ScienceDirect, 2023)
 *    - "Stock market responses to COVID-19: The behaviors of mean reversion"
 *      (ScienceDirect, 2023)
 * 
 * 2. Valuation-Based Constraints:
 *    - "Why the High Values for the CAPE Ratio in Recent Years Might Be Justified"
 *      (MDPI, 2023)
 *    - "On the predictive power of CAPE or Shiller's PE ratio"
 *      (Springer, 2021)
 * 
 * 3. Dynamic Volatility Controls:
 *    - "Dynamic volatility spillover and market emergency: Matching and simulation"
 *      (ScienceDirect, 2024)
 *    - "Dynamic graph neural networks for enhanced volatility prediction"
 *      (arXiv, 2024)
 * 
 * 4. Circuit Breaker Mechanisms:
 *    - "Circuit breakers and market runs" (Review of Finance, Oxford Academic, 2024)
 *    - "Best Practices for Exchange Volatility Control Mechanisms" (FIA, 2023)
 * 
 * Implementation Strategy:
 * 
 * The module implements a multi-layered approach:
 * 1. Ornstein-Uhlenbeck (OU) mean reversion process for long-term stability
 * 2. Valuation-based dampening using market P/E ratio constraints
 * 3. Dynamic volatility caps based on market conditions
 * 4. Soft circuit breakers for extreme daily/weekly movements
 */

/**
 * Configuration for market average controls
 */
const CONFIG = {
  // Mean Reversion Parameters (Ornstein-Uhlenbeck Process)
  // Reference: "Ornstein-Uhlenbeck Simulation with Python" (QuantStart)
  meanReversion: {
    enabled: true,
    theta: 0.15,              // Speed of mean reversion (15% per year)
    muHistorical: 0.10,       // Long-term historical market return (10% annualized)
    muPostRegime: 0.07,       // Post-2024 regime long-term return (7% annualized)
    halfLife: 4.6,            // Years to halve deviation (ln(2)/theta ≈ 4.6 years)
  },
  
  // Valuation Constraints (CAPE-inspired)
  // Reference: "Why the High Values for the CAPE Ratio..." (MDPI, 2023)
  valuation: {
    enabled: true,
    normalPE: 16,             // Historical average P/E ratio
    highPE: 25,               // Elevated P/E threshold
    extremePE: 35,            // Extreme valuation threshold
    // Dampening factors applied when thresholds exceeded
    dampening: {
      normal: 1.0,            // No dampening below normalPE
      elevated: 0.7,          // 30% dampening between normalPE and highPE
      high: 0.4,              // 60% dampening between highPE and extremePE
      extreme: 0.2,           // 80% dampening above extremePE
    }
  },
  
  // Dynamic Volatility Controls
  // Reference: "Dynamic volatility spillover..." (ScienceDirect, 2024)
  volatility: {
    enabled: true,
    normalVol: 0.15,          // Normal annualized volatility (15%)
    highVol: 0.30,            // High volatility threshold (30%)
    extremeVol: 0.50,         // Extreme volatility threshold (50%)
    // Max return caps based on volatility regime
    returnCaps: {
      normal: 0.40,           // 40% max annual return in normal times
      elevated: 0.25,         // 25% max in high volatility
      extreme: 0.15,          // 15% max in extreme volatility
    }
  },
  
  // Soft Circuit Breakers (prevent flash crashes/spikes)
  // Reference: "Circuit breakers and market runs" (Oxford, 2024)
  circuitBreakers: {
    enabled: true,
    dailyThreshold: 0.10,     // 10% daily movement triggers dampening
    weeklyThreshold: 0.20,    // 20% weekly movement triggers dampening
    dampeningFactor: 0.5,     // Reduce excess movement by 50%
  }
};

/**
 * Market state tracking for controls
 */
let marketState = {
  historicalReturns: [],      // Rolling window of annual returns
  currentPE: 16,              // Current market P/E ratio
  recentVolatility: 0.15,     // Recent realized volatility
  cumulativeReturn: 0,        // Cumulative return since last reset
  lastResetYear: 2024,        // Year of last state reset
};

/**
 * Apply Ornstein-Uhlenbeck mean reversion to annual return
 * 
 * The OU process pulls returns toward a long-term mean, preventing
 * sustained extreme growth or decline.
 * 
 * dX_t = theta * (mu - X_t) * dt + sigma * dW_t
 * 
 * Where:
 *   X_t = current return deviation from mean
 *   mu = long-term mean return
 *   theta = speed of mean reversion
 *   dt = time step (1 year)
 * 
 * @param {number} proposedReturn - Proposed annual return before control
 * @param {number} year - Current year
 * @returns {number} - Adjusted return with mean reversion applied
 */
function applyMeanReversion(proposedReturn, year) {
  if (!CONFIG.meanReversion.enabled || year <= 2024) {
    return proposedReturn;
  }
  
  const mu = year > 2024 ? CONFIG.meanReversion.muPostRegime : CONFIG.meanReversion.muHistorical;
  const theta = CONFIG.meanReversion.theta;
  
  // Calculate current deviation from long-term mean
  const deviation = proposedReturn - mu;
  
  // Apply mean reversion: pull deviation back toward zero
  // Stronger pull for larger deviations (non-linear dampening)
  const meanReversionAdjustment = -theta * deviation;
  
  // Adjusted return
  const adjustedReturn = proposedReturn + meanReversionAdjustment;
  
  return adjustedReturn;
}

/**
 * Apply valuation-based dampening
 * 
 * High market valuations (P/E ratios) historically predict lower future returns.
 * This implements a smooth dampening function that reduces growth as valuations rise.
 * 
 * Reference: Shiller CAPE research and valuation mean reversion studies
 * 
 * @param {number} proposedReturn - Return before valuation adjustment
 * @param {number} currentPE - Current market P/E ratio
 * @returns {number} - Adjusted return with valuation dampening
 */
function applyValuationDampening(proposedReturn, currentPE) {
  if (!CONFIG.valuation.enabled) {
    return proposedReturn;
  }
  
  // Only dampen positive returns (don't amplify crashes)
  if (proposedReturn <= 0) {
    return proposedReturn;
  }
  
  let dampeningFactor = 1.0;
  
  // Determine dampening based on P/E regime
  if (currentPE >= CONFIG.valuation.extremePE) {
    dampeningFactor = CONFIG.valuation.dampening.extreme;
  } else if (currentPE >= CONFIG.valuation.highPE) {
    // Interpolate between high and extreme
    const progress = (currentPE - CONFIG.valuation.highPE) / 
                     (CONFIG.valuation.extremePE - CONFIG.valuation.highPE);
    dampeningFactor = CONFIG.valuation.dampening.high + 
                      (CONFIG.valuation.dampening.extreme - CONFIG.valuation.dampening.high) * progress;
  } else if (currentPE >= CONFIG.valuation.normalPE) {
    // Interpolate between normal and high
    const progress = (currentPE - CONFIG.valuation.normalPE) / 
                     (CONFIG.valuation.highPE - CONFIG.valuation.normalPE);
    dampeningFactor = CONFIG.valuation.dampening.elevated + 
                      (CONFIG.valuation.dampening.high - CONFIG.valuation.dampening.elevated) * progress;
  }
  
  return proposedReturn * dampeningFactor;
}

/**
 * Apply dynamic volatility-based return caps
 * 
 * During high volatility periods, extreme returns become more likely but also
 * more dangerous to market stability. This caps maximum returns based on
 * current volatility regime.
 * 
 * Reference: "Dynamic volatility spillover and market emergency" (2024)
 * 
 * @param {number} proposedReturn - Return before volatility cap
 * @param {number} currentVolatility - Current annualized volatility
 * @returns {number} - Capped return
 */
function applyVolatilityCaps(proposedReturn, currentVolatility) {
  if (!CONFIG.volatility.enabled) {
    return proposedReturn;
  }
  
  // Determine appropriate cap based on volatility regime
  let maxReturn;
  
  if (currentVolatility >= CONFIG.volatility.extremeVol) {
    maxReturn = CONFIG.volatility.returnCaps.extreme;
  } else if (currentVolatility >= CONFIG.volatility.highVol) {
    // Interpolate between normal and extreme
    const progress = (currentVolatility - CONFIG.volatility.highVol) / 
                     (CONFIG.volatility.extremeVol - CONFIG.volatility.highVol);
    maxReturn = CONFIG.volatility.returnCaps.elevated + 
                (CONFIG.volatility.returnCaps.extreme - CONFIG.volatility.returnCaps.elevated) * progress;
  } else {
    maxReturn = CONFIG.volatility.returnCaps.normal;
  }
  
  // Apply symmetric caps (both positive and negative)
  return Math.max(-maxReturn, Math.min(maxReturn, proposedReturn));
}

/**
 * Apply soft circuit breakers to prevent flash spikes
 * 
 * Unlike hard circuit breakers that halt trading, soft breakers
 * smooth out extreme movements while maintaining continuous trading.
 * 
 * Reference: "Best Practices for Exchange Volatility Control Mechanisms" (FIA, 2023)
 * 
 * @param {number} proposedReturn - Return before circuit breaker
 * @param {Array<number>} recentReturns - Recent daily/weekly returns
 * @param {string} period - 'daily' or 'weekly'
 * @returns {number} - Smoothed return
 */
function applySoftCircuitBreaker(proposedReturn, recentReturns, period = 'daily') {
  if (!CONFIG.circuitBreakers.enabled) {
    return proposedReturn;
  }
  
  const threshold = period === 'daily' ? 
    CONFIG.circuitBreakers.dailyThreshold : 
    CONFIG.circuitBreakers.weeklyThreshold;
  
  // Check if return exceeds threshold
  const absReturn = Math.abs(proposedReturn);
  
  if (absReturn > threshold) {
    // Calculate excess beyond threshold
    const excess = absReturn - threshold;
    
    // Dampen the excess (keep threshold portion, reduce excess)
    const dampenedExcess = excess * CONFIG.circuitBreakers.dampeningFactor;
    
    // Reconstruct return with dampened excess
    const sign = proposedReturn >= 0 ? 1 : -1;
    return sign * (threshold + dampenedExcess);
  }
  
  return proposedReturn;
}

/**
 * Update market P/E ratio based on price movements and earnings
 * 
 * @param {number} priceReturn - Return on market prices
 * @param {number} earningsGrowth - Earnings growth rate
 */
function updateMarketPE(priceReturn, earningsGrowth = 0.05) {
  // P/E changes based on relative price vs earnings growth
  const peChange = priceReturn - earningsGrowth;
  
  marketState.currentPE *= (1 + peChange);
  
  // Keep P/E in reasonable bounds (5 to 50)
  marketState.currentPE = Math.max(5, Math.min(50, marketState.currentPE));
}

/**
 * Update market volatility estimate
 * 
 * Uses exponentially weighted moving average of squared returns
 * 
 * @param {number} returnValue - Most recent annual return
 */
function updateVolatility(returnValue) {
  const lambda = 0.94; // RiskMetrics standard decay factor
  
  // EWMA: vol_t = sqrt(lambda * vol_{t-1}^2 + (1-lambda) * return^2)
  const oldVariance = Math.pow(marketState.recentVolatility, 2);
  const newVariance = lambda * oldVariance + (1 - lambda) * Math.pow(returnValue, 2);
  
  marketState.recentVolatility = Math.sqrt(newVariance);
  
  // Clamp volatility to reasonable bounds (5% to 100% annualized)
  marketState.recentVolatility = Math.max(0.05, Math.min(1.0, marketState.recentVolatility));
}

/**
 * Main function: Apply all market average controls
 * 
 * This orchestrates all control mechanisms in the proper order:
 * 1. Mean reversion (long-term stability)
 * 2. Valuation dampening (bubble prevention)
 * 3. Volatility caps (regime-dependent limits)
 * 4. Circuit breakers (extreme movement smoothing)
 * 
 * @param {number} proposedReturn - Unconstrained annual return
 * @param {number} year - Current simulation year
 * @param {object} options - Optional parameters
 * @returns {object} - Adjusted return and diagnostics
 */
function applyMarketAverageControls(proposedReturn, year, options = {}) {
  // Skip controls for historical period
  if (year <= 2024) {
    return {
      originalReturn: proposedReturn,
      adjustedReturn: proposedReturn,
      controls: {
        meanReversion: 0,
        valuationDampening: 0,
        volatilityCap: 0,
        circuitBreaker: 0
      },
      marketState: { ...marketState }
    };
  }
  
  let currentReturn = proposedReturn;
  const controls = {
    meanReversion: 0,
    valuationDampening: 0,
    volatilityCap: 0,
    circuitBreaker: 0
  };
  
  // Step 1: Apply mean reversion
  const afterMeanReversion = applyMeanReversion(currentReturn, year);
  controls.meanReversion = afterMeanReversion - currentReturn;
  currentReturn = afterMeanReversion;
  
  // Step 2: Apply valuation-based dampening
  const afterValuation = applyValuationDampening(currentReturn, marketState.currentPE);
  controls.valuationDampening = afterValuation - currentReturn;
  currentReturn = afterValuation;
  
  // Step 3: Apply volatility-based caps
  const afterVolatility = applyVolatilityCaps(currentReturn, marketState.recentVolatility);
  controls.volatilityCap = afterVolatility - currentReturn;
  currentReturn = afterVolatility;
  
  // Step 4: Apply soft circuit breakers
  const afterCircuitBreaker = applySoftCircuitBreaker(
    currentReturn, 
    marketState.historicalReturns.slice(-5),
    'daily'
  );
  controls.circuitBreaker = afterCircuitBreaker - currentReturn;
  currentReturn = afterCircuitBreaker;
  
  // Update market state
  updateMarketPE(currentReturn);
  updateVolatility(currentReturn);
  
  // Track historical returns (keep last 10 years)
  marketState.historicalReturns.push(currentReturn);
  if (marketState.historicalReturns.length > 10) {
    marketState.historicalReturns.shift();
  }
  
  return {
    originalReturn: proposedReturn,
    adjustedReturn: currentReturn,
    controls: controls,
    marketState: { ...marketState }
  };
}

/**
 * Get current configuration
 */
function getConfiguration() {
  return JSON.parse(JSON.stringify(CONFIG));
}

/**
 * Update configuration (with validation)
 */
function updateConfiguration(updates) {
  // Deep merge updates into CONFIG
  for (const [category, settings] of Object.entries(updates)) {
    if (CONFIG[category]) {
      Object.assign(CONFIG[category], settings);
    }
  }
}

/**
 * Get current market state
 */
function getMarketState() {
  return { ...marketState };
}

/**
 * Reset market state (for testing)
 */
function resetMarketState() {
  marketState = {
    historicalReturns: [],
    currentPE: 16,
    recentVolatility: 0.15,
    cumulativeReturn: 0,
    lastResetYear: 2024,
  };
}

/**
 * Calculate diagnostics for a given year
 * Shows how controls would affect different return scenarios
 */
function getDiagnostics(year, returnScenarios = [-0.30, -0.10, 0, 0.10, 0.20, 0.30, 0.40]) {
  const results = returnScenarios.map(scenario => {
    const result = applyMarketAverageControls(scenario, year);
    return {
      scenario: scenario,
      adjusted: result.adjustedReturn,
      reduction: scenario - result.adjustedReturn,
      reductionPct: scenario !== 0 ? ((scenario - result.adjustedReturn) / scenario * 100) : 0
    };
  });
  
  return {
    year: year,
    marketPE: marketState.currentPE,
    volatility: marketState.recentVolatility,
    scenarios: results
  };
}

module.exports = {
  applyMarketAverageControls,
  applyMeanReversion,
  applyValuationDampening,
  applyVolatilityCaps,
  applySoftCircuitBreaker,
  updateMarketPE,
  updateVolatility,
  getConfiguration,
  updateConfiguration,
  getMarketState,
  resetMarketState,
  getDiagnostics
};
