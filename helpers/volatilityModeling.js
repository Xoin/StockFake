/**
 * Volatility Modeling Module
 * 
 * Implements advanced volatility models based on recent research:
 * - GARCH(1,1) for volatility clustering and persistence
 * - Fat-tailed distributions (Student's t, GED) for realistic extreme events
 * 
 * References:
 * - "On GARCH and Autoregressive Stochastic Volatility Approaches" (MDPI, 2025)
 * - "Understanding GARCH Models in Finance" (Stavrianos, 2024)
 */

/**
 * GARCH(1,1) Volatility Model
 * 
 * Equation: σ²ₜ = ω + α·ε²ₜ₋₁ + β·σ²ₜ₋₁
 * 
 * Where:
 *   σ²ₜ = conditional variance at time t
 *   ω = constant term (long-run variance component)
 *   α = ARCH coefficient (shock impact)
 *   β = GARCH coefficient (persistence)
 *   ε²ₜ₋₁ = squared residual from previous period
 */
class GARCHModel {
  constructor(omega = 0.00001, alpha = 0.09, beta = 0.90) {
    // Standard calibrated parameters for daily stock returns
    // These are typical values from empirical studies
    this.omega = omega;  // Long-run variance component
    this.alpha = alpha;  // ARCH coefficient (shock impact) - typical: 0.05-0.15
    this.beta = beta;    // GARCH coefficient (persistence) - typical: 0.85-0.95
    
    // Calculate unconditional variance (long-run volatility)
    // σ² = ω / (1 - α - β)
    this.unconditionalVariance = omega / (1 - alpha - beta);
    
    // State variables
    this.currentVariance = this.unconditionalVariance;
    this.lastReturn = 0;
    this.lastShock = 0;
    
    // Validation: ensure stationarity (alpha + beta < 1)
    if (alpha + beta >= 1) {
      console.warn(`GARCH model may be non-stationary: α + β = ${alpha + beta}`);
    }
    
    // Track history for diagnostics
    this.varianceHistory = [];
    this.returnHistory = [];
  }
  
  /**
   * Update volatility based on new return (shock)
   * @param {number} returnValue - Return (price change / previous price)
   */
  updateVolatility(returnValue) {
    // Calculate squared shock (innovation)
    const shockSquared = Math.pow(returnValue, 2);
    
    // GARCH(1,1) equation
    // New variance = constant + (impact of last shock) + (persistence of last variance)
    this.currentVariance = this.omega + 
                          this.alpha * shockSquared + 
                          this.beta * this.currentVariance;
    
    // Cap variance to prevent explosive growth (max 100% daily vol)
    this.currentVariance = Math.min(this.currentVariance, 1.0);
    
    // Update state
    this.lastReturn = returnValue;
    this.lastShock = returnValue;
    
    // Store history (limit to last 252 days = 1 trading year)
    if (this.varianceHistory.length < 252) {
      this.varianceHistory.push(this.currentVariance);
      this.returnHistory.push(returnValue);
    } else {
      this.varianceHistory.shift();
      this.returnHistory.shift();
      this.varianceHistory.push(this.currentVariance);
      this.returnHistory.push(returnValue);
    }
  }
  
  /**
   * Get current volatility (standard deviation)
   * @returns {number} Current volatility (annualized if desired)
   */
  getCurrentVolatility() {
    return Math.sqrt(this.currentVariance);
  }
  
  /**
   * Get annualized volatility
   * @returns {number} Annualized volatility (252 trading days)
   */
  getAnnualizedVolatility() {
    return Math.sqrt(this.currentVariance * 252);
  }
  
  /**
   * Generate random return with current volatility
   * Uses Student's t-distribution for fat tails
   * 
   * @param {number} degreesOfFreedom - Lower = fatter tails (typical: 3-7)
   * @param {number} drift - Expected return (default: 0)
   * @param {number} maxReturn - Maximum absolute return (default: 0.15 for ±15%)
   * @returns {number} Random return
   */
  generateReturn(degreesOfFreedom = 5, drift = 0, maxReturn = 0.15) {
    const volatility = this.getCurrentVolatility();
    
    // Generate Student's t sample
    const tSample = generateStudentT(degreesOfFreedom);
    
    // Scale by volatility and add drift
    // Cap return at realistic levels to prevent unrealistic price movements
    // Default ±15% for normal market conditions, can be increased during crashes
    const rawReturn = drift + volatility * tSample;
    return Math.max(-maxReturn, Math.min(maxReturn, rawReturn));
  }
  
  /**
   * Reset model to initial state
   */
  reset() {
    this.currentVariance = this.unconditionalVariance;
    this.lastReturn = 0;
    this.lastShock = 0;
    this.varianceHistory = [];
    this.returnHistory = [];
  }
  
  /**
   * Get model parameters
   */
  getParameters() {
    return {
      omega: this.omega,
      alpha: this.alpha,
      beta: this.beta,
      persistence: this.alpha + this.beta,
      unconditionalVolatility: Math.sqrt(this.unconditionalVariance)
    };
  }
  
  /**
   * Adjust volatility multiplier (for crash events)
   * @param {number} multiplier - Factor to multiply current variance
   */
  applyVolatilityShock(multiplier) {
    this.currentVariance *= multiplier;
  }
}

/**
 * Generate random sample from Student's t-distribution
 * 
 * Student's t has fatter tails than normal distribution,
 * better capturing extreme market events (crashes, spikes)
 * 
 * @param {number} degreesOfFreedom - Lower = fatter tails (typical: 3-7 for finance)
 * @returns {number} Random sample from t-distribution
 */
function generateStudentT(degreesOfFreedom = 5) {
  // Generate chi-squared variable (sum of squared normals)
  let chiSquared = 0;
  for (let i = 0; i < degreesOfFreedom; i++) {
    const normal = generateStandardNormal();
    chiSquared += normal * normal;
  }
  
  // Generate standard normal
  const z = generateStandardNormal();
  
  // Student's t = Z / sqrt(ChiSquared / df)
  return z / Math.sqrt(chiSquared / degreesOfFreedom);
}

/**
 * Generate random sample from Generalized Error Distribution (GED)
 * 
 * More flexible tail behavior than Student's t
 * 
 * @param {number} nu - Shape parameter (nu < 2: fat tails, nu = 2: normal, nu > 2: thin tails)
 * @returns {number} Random sample from GED
 */
function generateGED(nu = 1.5) {
  // Gamma function approximation
  const gamma = (x) => {
    // Stirling's approximation for gamma function
    if (x === 1) return 1;
    if (x === 0.5) return Math.sqrt(Math.PI);
    if (x > 1) return (x - 1) * gamma(x - 1);
    // For other values, use approximation
    return Math.sqrt(2 * Math.PI / x) * Math.pow(x / Math.E, x);
  };
  
  // Calculate lambda parameter
  const lambda = Math.sqrt(
    Math.pow(2, -2/nu) * gamma(1/nu) / gamma(3/nu)
  );
  
  // Generate exponential random variable
  const e = -Math.log(Math.random());
  
  // Random sign
  const sign = Math.random() < 0.5 ? -1 : 1;
  
  // GED sample
  return sign * Math.pow(e / lambda, 1/nu);
}

/**
 * Generate standard normal random variable
 * Using Box-Muller transform
 * 
 * @returns {number} Random sample from N(0,1)
 */
function generateStandardNormal() {
  const u1 = Math.random();
  const u2 = Math.random();
  
  // Box-Muller transform
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Generate normal random variable with specified mean and std dev
 * 
 * @param {number} mean - Mean of distribution
 * @param {number} stdDev - Standard deviation
 * @returns {number} Random sample from N(mean, stdDev²)
 */
function generateNormal(mean = 0, stdDev = 1) {
  return mean + stdDev * generateStandardNormal();
}

/**
 * Calculate sample kurtosis (measure of tail fatness)
 * Kurtosis > 3 indicates fat tails (leptokurtic)
 * 
 * @param {Array<number>} returns - Array of return values
 * @returns {number} Excess kurtosis (Kurt - 3)
 */
function calculateKurtosis(returns) {
  const n = returns.length;
  const mean = returns.reduce((a, b) => a + b, 0) / n;
  
  // Calculate moments
  const m2 = returns.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / n;
  const m4 = returns.reduce((sum, x) => sum + Math.pow(x - mean, 4), 0) / n;
  
  // Kurtosis = m4 / m2^2
  const kurtosis = m4 / Math.pow(m2, 2);
  
  // Return excess kurtosis (subtract 3 for normal distribution baseline)
  return kurtosis - 3;
}

/**
 * Calculate sample skewness (measure of asymmetry)
 * Negative skew = left tail heavier (crashes more likely than booms)
 * 
 * @param {Array<number>} returns - Array of return values
 * @returns {number} Skewness
 */
function calculateSkewness(returns) {
  const n = returns.length;
  const mean = returns.reduce((a, b) => a + b, 0) / n;
  
  // Calculate moments
  const m2 = returns.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / n;
  const m3 = returns.reduce((sum, x) => sum + Math.pow(x - mean, 3), 0) / n;
  
  // Skewness = m3 / m2^(3/2)
  return m3 / Math.pow(m2, 3/2);
}

module.exports = {
  GARCHModel,
  generateStudentT,
  generateGED,
  generateStandardNormal,
  generateNormal,
  calculateKurtosis,
  calculateSkewness
};
