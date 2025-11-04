/**
 * Early Warning System for Market Crashes
 * 
 * Implements research-based crash prediction indicators:
 * - Valuation extremes (P/E ratios, price-to-book)
 * - Volatility spikes
 * - Rapid price growth (bubbles)
 * - Sector concentration risk
 * 
 * References:
 * - "Early Warning Signals for Stock Market Crashes" (EPJ Data Science, 2024)
 * - "Forecasting Stock Market Crashes via Machine Learning" (NAJEF, 2022)
 * - "Graph Learning Based Financial Market Crash Identification" (IEEE, 2023)
 */

/**
 * Early Warning System for detecting crash precursors
 * 
 * Analyzes market conditions to predict increased crash probability
 */
class EarlyWarningSystem {
  constructor() {
    // Warning signal thresholds based on historical crash data
    this.thresholds = {
      // Valuation metrics
      valuationExtreme: 30,         // P/E ratio > 30 (historical average ~15-20)
      priceToBookExtreme: 5,        // P/B ratio > 5
      
      // Volatility metrics
      volatilitySpike: 2.5,         // Volatility > 2.5x baseline
      volatilityAcceleration: 1.5,  // Volatility increasing rapidly
      
      // Growth metrics
      rapidGrowth: 0.50,            // 50% growth in 6 months
      yearlyGrowth: 1.00,           // 100% growth in 12 months (bubble territory)
      
      // Sector metrics
      sectorBubble: 0.80,           // Sector up 80% in 12 months
      sectorConcentration: 0.40,    // Single sector > 40% of market cap
      
      // Sentiment metrics
      extremeGreed: 0.75,           // Sentiment score > 0.75 (scale: -1 to 1)
      
      // Liquidity metrics
      liquidityDrain: 0.30          // Liquidity < 30% of normal
    };
    
    // Weights for different signals (can be tuned based on historical accuracy)
    this.signalWeights = {
      valuation: 0.25,
      volatility: 0.20,
      growth: 0.25,
      sector: 0.15,
      sentiment: 0.10,
      liquidity: 0.05
    };
    
    // Current warning level
    this.warningLevel = 0;  // 0-1 scale
    this.activeSignals = [];
    
    // Historical tracking
    this.warningHistory = [];
    this.crashHistory = [];
  }
  
  /**
   * Calculate crash probability based on market conditions
   * 
   * @param {Object} marketData - Current market data
   * @returns {Object} Crash probability analysis
   */
  calculateCrashProbability(marketData) {
    const signals = {
      valuation: this.checkValuationSignals(marketData),
      volatility: this.checkVolatilitySignals(marketData),
      growth: this.checkGrowthSignals(marketData),
      sector: this.checkSectorSignals(marketData),
      sentiment: this.checkSentimentSignals(marketData),
      liquidity: this.checkLiquiditySignals(marketData)
    };
    
    // Calculate weighted warning level
    this.warningLevel = 0;
    this.activeSignals = [];
    
    for (const [category, signal] of Object.entries(signals)) {
      this.warningLevel += signal.level * this.signalWeights[category];
      if (signal.active) {
        this.activeSignals.push({
          category,
          description: signal.description,
          severity: signal.level
        });
      }
    }
    
    // Baseline crash probability (historical average)
    const baselineProbability = 0.30;  // 30% annual baseline
    
    // Amplify based on warning signals
    // Warning level 0.0 → 1.0x baseline
    // Warning level 0.5 → 2.0x baseline
    // Warning level 1.0 → 3.0x baseline
    const amplificationFactor = 1 + (this.warningLevel * 2);
    
    const adjustedProbability = Math.min(0.90, baselineProbability * amplificationFactor);
    
    // Track history
    this.warningHistory.push({
      timestamp: new Date(),
      warningLevel: this.warningLevel,
      probability: adjustedProbability,
      signals: this.activeSignals.length
    });
    
    // Keep last 365 days only
    if (this.warningHistory.length > 365) {
      this.warningHistory.shift();
    }
    
    return {
      baselineProbability,
      adjustedProbability,
      warningLevel: this.warningLevel,
      activeSignals: this.activeSignals,
      signalCount: this.activeSignals.length,
      amplificationFactor,
      recommendation: this.getRecommendation(this.warningLevel)
    };
  }
  
  /**
   * Check valuation-based warning signals
   */
  checkValuationSignals(marketData) {
    let level = 0;
    let active = false;
    let description = '';
    
    // Check P/E ratio
    if (marketData.averagePE && marketData.averagePE > this.thresholds.valuationExtreme) {
      level += 0.5;
      active = true;
      description += `High P/E ratio (${marketData.averagePE.toFixed(1)}). `;
    }
    
    // Check Price-to-Book ratio
    if (marketData.averagePB && marketData.averagePB > this.thresholds.priceToBookExtreme) {
      level += 0.5;
      active = true;
      description += `High P/B ratio (${marketData.averagePB.toFixed(1)}). `;
    }
    
    return {
      level: Math.min(1.0, level),
      active,
      description: description || 'Valuations normal'
    };
  }
  
  /**
   * Check volatility-based warning signals
   */
  checkVolatilitySignals(marketData) {
    let level = 0;
    let active = false;
    let description = '';
    
    // Current volatility spike
    if (marketData.currentVolatility && marketData.baselineVolatility) {
      const volRatio = marketData.currentVolatility / marketData.baselineVolatility;
      
      if (volRatio > this.thresholds.volatilitySpike) {
        level += 0.6;
        active = true;
        description += `Volatility spike (${volRatio.toFixed(2)}x normal). `;
      }
    }
    
    // Volatility acceleration (increasing trend)
    if (marketData.volatilityTrend && marketData.volatilityTrend > this.thresholds.volatilityAcceleration) {
      level += 0.4;
      active = true;
      description += `Volatility accelerating. `;
    }
    
    return {
      level: Math.min(1.0, level),
      active,
      description: description || 'Volatility normal'
    };
  }
  
  /**
   * Check growth-based warning signals (bubble detection)
   */
  checkGrowthSignals(marketData) {
    let level = 0;
    let active = false;
    let description = '';
    
    // 6-month return (rapid growth)
    if (marketData.sixMonthReturn && marketData.sixMonthReturn > this.thresholds.rapidGrowth) {
      level += 0.5;
      active = true;
      description += `Rapid 6mo growth (+${(marketData.sixMonthReturn * 100).toFixed(0)}%). `;
    }
    
    // 12-month return (bubble territory)
    if (marketData.yearlyReturn && marketData.yearlyReturn > this.thresholds.yearlyGrowth) {
      level += 0.5;
      active = true;
      description += `Bubble-like yearly growth (+${(marketData.yearlyReturn * 100).toFixed(0)}%). `;
    }
    
    return {
      level: Math.min(1.0, level),
      active,
      description: description || 'Growth sustainable'
    };
  }
  
  /**
   * Check sector-based warning signals
   */
  checkSectorSignals(marketData) {
    let level = 0;
    let active = false;
    let description = '';
    
    // Sector bubble (individual sector growing too fast)
    if (marketData.sectorReturns) {
      for (const [sector, sectorReturn] of Object.entries(marketData.sectorReturns)) {
        if (sectorReturn > this.thresholds.sectorBubble) {
          level += 0.5;
          active = true;
          description += `${sector} bubble (+${(sectorReturn * 100).toFixed(0)}%). `;
          break;  // One sector bubble is enough
        }
      }
    }
    
    // Sector concentration risk
    if (marketData.sectorConcentrations) {
      for (const [sector, concentration] of Object.entries(marketData.sectorConcentrations)) {
        if (concentration > this.thresholds.sectorConcentration) {
          level += 0.5;
          active = true;
          description += `${sector} over-concentrated (${(concentration * 100).toFixed(0)}%). `;
          break;
        }
      }
    }
    
    return {
      level: Math.min(1.0, level),
      active,
      description: description || 'Sector balance healthy'
    };
  }
  
  /**
   * Check sentiment-based warning signals
   */
  checkSentimentSignals(marketData) {
    let level = 0;
    let active = false;
    let description = '';
    
    // Extreme greed (sentiment too positive)
    if (marketData.sentimentScore && marketData.sentimentScore > this.thresholds.extremeGreed) {
      level = 1.0;
      active = true;
      description = `Extreme greed (sentiment: ${marketData.sentimentScore.toFixed(2)})`;
    }
    
    return {
      level,
      active,
      description: description || 'Sentiment balanced'
    };
  }
  
  /**
   * Check liquidity-based warning signals
   */
  checkLiquiditySignals(marketData) {
    let level = 0;
    let active = false;
    let description = '';
    
    // Liquidity drain
    if (marketData.liquidityLevel && marketData.liquidityLevel < this.thresholds.liquidityDrain) {
      level = 1.0;
      active = true;
      description = `Low liquidity (${(marketData.liquidityLevel * 100).toFixed(0)}% of normal)`;
    }
    
    return {
      level,
      active,
      description: description || 'Liquidity adequate'
    };
  }
  
  /**
   * Get human-readable recommendation based on warning level
   */
  getRecommendation(warningLevel) {
    if (warningLevel >= 0.75) {
      return 'EXTREME RISK: Multiple crash indicators present. Consider defensive positioning.';
    } else if (warningLevel >= 0.50) {
      return 'HIGH RISK: Elevated crash probability. Monitor closely and reduce exposure.';
    } else if (warningLevel >= 0.25) {
      return 'MODERATE RISK: Some warning signs present. Stay vigilant.';
    } else {
      return 'LOW RISK: Market conditions appear normal.';
    }
  }
  
  /**
   * Record actual crash occurrence for calibration
   */
  recordCrash(crashDate, severity) {
    this.crashHistory.push({
      date: crashDate,
      severity,
      warningLevel: this.warningLevel,
      predictedCorrectly: this.warningLevel > 0.25
    });
  }
  
  /**
   * Calculate accuracy of early warning system
   * (What % of crashes were predicted?)
   */
  getAccuracyMetrics() {
    if (this.crashHistory.length === 0) {
      return null;
    }
    
    const totalCrashes = this.crashHistory.length;
    const predictedCrashes = this.crashHistory.filter(c => c.predictedCorrectly).length;
    
    return {
      totalCrashes,
      predictedCrashes,
      accuracy: predictedCrashes / totalCrashes,
      falsePositives: this.calculateFalsePositives()
    };
  }
  
  /**
   * Calculate false positive rate
   * (How often did we predict crash when none occurred?)
   */
  calculateFalsePositives() {
    // Count high warning periods that didn't result in crashes
    let highWarningPeriods = 0;
    let crashesFollowingWarning = 0;
    
    for (let i = 0; i < this.warningHistory.length - 30; i++) {
      if (this.warningHistory[i].warningLevel > 0.50) {
        highWarningPeriods++;
        
        // Check if crash occurred in next 30 days
        const crashInNext30Days = this.crashHistory.some(crash => {
          const daysDiff = (crash.date - this.warningHistory[i].timestamp) / (1000 * 60 * 60 * 24);
          return daysDiff >= 0 && daysDiff <= 30;
        });
        
        if (crashInNext30Days) {
          crashesFollowingWarning++;
        }
      }
    }
    
    if (highWarningPeriods === 0) return 0;
    return 1 - (crashesFollowingWarning / highWarningPeriods);
  }
  
  /**
   * Reset warning system state
   */
  reset() {
    this.warningLevel = 0;
    this.activeSignals = [];
    this.warningHistory = [];
    this.crashHistory = [];
  }
}

module.exports = {
  EarlyWarningSystem
};
