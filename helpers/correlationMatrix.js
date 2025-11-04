/**
 * Stock Correlation Matrix Module
 * 
 * Implements realistic correlation structure between stocks based on:
 * - Sector correlations (stocks in same sector move together)
 * - Stress correlations (correlations increase during market crashes)
 * - Cholesky decomposition for correlated return generation
 * 
 * References:
 * - Fama-French multi-factor models
 * - Dynamic Conditional Correlation (DCC-GARCH) literature
 */

/**
 * Stock Correlation Matrix Manager
 * 
 * Manages correlation structure between stocks and generates
 * correlated returns using Cholesky decomposition
 */
class CorrelationMatrix {
  constructor() {
    // Historical correlation estimates based on empirical data
    // These are approximate values from academic research
    
    // Within-sector correlations (higher - stocks in same sector move together)
    this.withinSectorCorrelations = {
      'Technology': 0.65,
      'Financial': 0.70,
      'Energy': 0.60,
      'Healthcare': 0.55,
      'Industrials': 0.60,
      'Consumer': 0.50,
      'Materials': 0.58,
      'Utilities': 0.62,
      'Real Estate': 0.68,
      'Communication': 0.63
    };
    
    // Cross-sector correlation matrix
    // Rows and columns represent sectors
    this.crossSectorCorrelations = {
      'Technology-Financial': 0.35,
      'Technology-Energy': 0.20,
      'Technology-Healthcare': 0.28,
      'Technology-Industrials': 0.38,
      'Technology-Consumer': 0.42,
      'Financial-Energy': 0.30,
      'Financial-Healthcare': 0.25,
      'Financial-Industrials': 0.45,
      'Financial-Consumer': 0.38,
      'Energy-Healthcare': 0.18,
      'Energy-Industrials': 0.35,
      'Energy-Consumer': 0.28,
      'Healthcare-Industrials': 0.30,
      'Healthcare-Consumer': 0.32,
      'Industrials-Consumer': 0.48
    };
    
    // Default cross-sector correlation (when not specified)
    this.defaultCrossSectorCorrelation = 0.25;
    
    // Market factor beta (all stocks somewhat correlated with market)
    this.marketBeta = 0.40;  // Base market correlation
    
    // Correlation amplification during market stress
    // Research shows correlations increase during crashes ("correlation breakdown")
    this.stressMultiplier = 1.5;  // Correlations increase 50% during stress
    this.maxCorrelation = 0.95;   // Cap correlations to prevent singularity
  }
  
  /**
   * Get correlation between two stocks
   * 
   * @param {string} sector1 - First stock's sector
   * @param {string} sector2 - Second stock's sector
   * @param {boolean} isMarketStress - Whether market is under stress
   * @returns {number} Correlation coefficient (-1 to 1)
   */
  getCorrelation(sector1, sector2, isMarketStress = false) {
    let correlation;
    
    // Same sector - use within-sector correlation
    if (sector1 === sector2) {
      correlation = this.withinSectorCorrelations[sector1] || 0.55;
    } else {
      // Different sectors - use cross-sector correlation
      const key1 = `${sector1}-${sector2}`;
      const key2 = `${sector2}-${sector1}`;
      
      correlation = this.crossSectorCorrelations[key1] || 
                   this.crossSectorCorrelations[key2] || 
                   this.defaultCrossSectorCorrelation;
    }
    
    // Increase correlation during market stress
    // Research finding: correlations tend toward 1 during crashes
    if (isMarketStress) {
      correlation = Math.min(this.maxCorrelation, correlation * this.stressMultiplier);
    }
    
    return correlation;
  }
  
  /**
   * Build correlation matrix for given stocks
   * 
   * @param {Array<Object>} stocks - Array of stock objects with sector property
   * @param {boolean} isMarketStress - Whether market is under stress
   * @returns {Array<Array<number>>} n x n correlation matrix
   */
  buildCorrelationMatrix(stocks, isMarketStress = false) {
    const n = stocks.length;
    const C = Array(n).fill(0).map(() => Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          C[i][j] = 1.0;  // Perfect correlation with self
        } else {
          C[i][j] = this.getCorrelation(
            stocks[i].sector, 
            stocks[j].sector, 
            isMarketStress
          );
        }
      }
    }
    
    return C;
  }
  
  /**
   * Generate correlated returns for multiple stocks
   * Uses Cholesky decomposition: if C = L·L', then L·z gives correlated returns
   * 
   * @param {Array<Object>} stocks - Array of stock objects with sector property
   * @param {Array<number>} independentShocks - Array of independent random shocks (N(0,1))
   * @param {boolean} isMarketStress - Whether market is under stress
   * @returns {Array<number>} Correlated return shocks
   */
  generateCorrelatedReturns(stocks, independentShocks, isMarketStress = false) {
    const n = stocks.length;
    
    // Build correlation matrix
    const C = this.buildCorrelationMatrix(stocks, isMarketStress);
    
    // Cholesky decomposition
    const L = this.choleskyDecomposition(C);
    
    // Generate correlated shocks: y = L * z
    const correlatedShocks = Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j <= i; j++) {
        correlatedShocks[i] += L[i][j] * independentShocks[j];
      }
    }
    
    return correlatedShocks;
  }
  
  /**
   * Cholesky decomposition of symmetric positive-definite matrix
   * Decomposes C = L·L' where L is lower triangular
   * 
   * @param {Array<Array<number>>} matrix - Correlation matrix
   * @returns {Array<Array<number>>} Lower triangular matrix L
   */
  choleskyDecomposition(matrix) {
    const n = matrix.length;
    const L = Array(n).fill(0).map(() => Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j <= i; j++) {
        let sum = 0;
        for (let k = 0; k < j; k++) {
          sum += L[i][k] * L[j][k];
        }
        
        if (i === j) {
          // Diagonal element
          const value = matrix[i][i] - sum;
          // Ensure positive (numerical stability)
          L[i][j] = Math.sqrt(Math.max(0.0001, value));
        } else {
          // Off-diagonal element
          L[i][j] = (matrix[i][j] - sum) / L[j][j];
        }
      }
    }
    
    return L;
  }
  
  /**
   * Add market factor to returns (single-factor model)
   * All stocks partially move with the market
   * 
   * @param {Array<number>} stockReturns - Individual stock returns
   * @param {number} marketReturn - Overall market return
   * @param {Array<number>} betas - Market betas for each stock (default: 1.0)
   * @returns {Array<number>} Returns adjusted for market factor
   */
  addMarketFactor(stockReturns, marketReturn, betas = null) {
    const n = stockReturns.length;
    const adjustedReturns = Array(n);
    
    for (let i = 0; i < n; i++) {
      const beta = betas ? betas[i] : 1.0;
      
      // Total return = market component + idiosyncratic component
      // Assuming stockReturns are already idiosyncratic, we add market
      adjustedReturns[i] = beta * marketReturn + stockReturns[i];
    }
    
    return adjustedReturns;
  }
  
  /**
   * Update correlation matrix based on market regime
   * Allows dynamic adjustment of correlations
   * 
   * @param {number} stressLevel - Market stress level (0 = normal, 1 = maximum stress)
   */
  updateStressMultiplier(stressLevel) {
    // Linear interpolation between normal (1.0) and stress (1.5)
    this.stressMultiplier = 1.0 + stressLevel * 0.5;
  }
  
  /**
   * Get average correlation for a sector
   * Useful for portfolio construction
   * 
   * @param {string} sector - Target sector
   * @param {Array<string>} otherSectors - Other sectors in portfolio
   * @returns {number} Average correlation
   */
  getAverageSectorCorrelation(sector, otherSectors) {
    let totalCorr = 0;
    let count = 0;
    
    for (const otherSector of otherSectors) {
      totalCorr += this.getCorrelation(sector, otherSector, false);
      count++;
    }
    
    return count > 0 ? totalCorr / count : 0;
  }
}

/**
 * Simple function to generate correlated pair of returns
 * Useful for two-stock scenarios
 * 
 * @param {number} correlation - Desired correlation (-1 to 1)
 * @param {number} vol1 - Volatility of stock 1
 * @param {number} vol2 - Volatility of stock 2
 * @returns {Object} {return1, return2} pair of correlated returns
 */
function generateCorrelatedPair(correlation, vol1 = 1.0, vol2 = 1.0) {
  // Generate two independent standard normals
  const z1 = generateStandardNormal();
  const z2 = generateStandardNormal();
  
  // Make z2 correlated with z1
  const x1 = z1;
  const x2 = correlation * z1 + Math.sqrt(1 - correlation * correlation) * z2;
  
  // Scale by volatilities
  return {
    return1: vol1 * x1,
    return2: vol2 * x2
  };
}

/**
 * Generate standard normal random variable
 * Helper function for correlation calculations
 */
function generateStandardNormal() {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

module.exports = {
  CorrelationMatrix,
  generateCorrelatedPair
};
