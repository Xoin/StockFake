// Index Fund Rebalancing Module
// Handles dynamic rebalancing of index fund constituents

const dbModule = require('../database');
const stocks = require('../data/stocks');

// Constants for share estimation
const LARGE_CAP_TECH_SHARES = 15000000000;  // 15 billion shares
const LARGE_CAP_NON_TECH_SHARES = 10000000000;  // 10 billion shares
const MID_CAP_SHARES = 5000000000;  // 5 billion shares
const SMALL_CAP_SHARES = 2000000000;  // 2 billion shares

// Threshold for meaningful weight changes
const WEIGHT_CHANGE_THRESHOLD = 0.0001;

// Rebalancing strategy types
const REBALANCING_STRATEGIES = {
  PERIODIC: 'periodic',           // Rebalance on a fixed schedule
  THRESHOLD: 'threshold',         // Rebalance when drift exceeds threshold
  EVENT_DRIVEN: 'event-driven',   // Rebalance on specific market events
  HYBRID: 'hybrid'                // Combination of periodic and threshold
};

// Rebalancing frequency options
const REBALANCING_FREQUENCIES = {
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  SEMI_ANNUAL: 'semi-annual',
  ANNUAL: 'annual'
};

// Trigger types for rebalancing events
const TRIGGER_TYPES = {
  SCHEDULED: 'scheduled',
  DRIFT: 'drift',
  CONSTITUENT_CHANGE: 'constituent_change',
  MANUAL: 'manual',
  MARKET_EVENT: 'market_event'
};

/**
 * Calculate market-cap weighted constituents for an index fund
 * @param {Array} constituents - Array of stock symbols
 * @param {Date} currentTime - Current game time
 * @param {Number} timeMultiplier - Game time multiplier
 * @param {Boolean} isPaused - Whether game is paused
 * @returns {Array} Array of constituents with weights
 */
function calculateMarketCapWeights(constituents, currentTime, timeMultiplier, isPaused) {
  const constituentData = [];
  let totalMarketCap = 0;

  // Get stock data for all constituents
  for (const symbol of constituents) {
    const stockPrice = stocks.getStockPrice(symbol, currentTime, timeMultiplier, isPaused);
    if (stockPrice && stockPrice.price > 0) {
      // Estimate market cap (in real scenario, this would come from actual data)
      // For now, use a proxy: price * arbitrary share count based on company size
      const estimatedShares = getEstimatedSharesOutstanding(symbol);
      const marketCap = stockPrice.price * estimatedShares;
      
      constituentData.push({
        symbol: symbol,
        price: stockPrice.price,
        marketCap: marketCap
      });
      
      totalMarketCap += marketCap;
    }
  }

  // Calculate weights
  if (totalMarketCap > 0) {
    for (const constituent of constituentData) {
      constituent.weight = constituent.marketCap / totalMarketCap;
    }
  }

  return constituentData;
}

/**
 * Get estimated shares outstanding for a company
 * This is a simplified estimation - in real scenario would come from company data
 * @param {String} symbol - Stock symbol
 * @returns {Number} Estimated shares outstanding
 */
function getEstimatedSharesOutstanding(symbol) {
  // Large cap tech companies
  const largeCap = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA'];
  // Large cap non-tech
  const largeCap2 = ['JPM', 'JNJ', 'WMT', 'XOM', 'CVX', 'UNH', 'V', 'MA'];
  // Mid cap
  const midCap = ['BA', 'CAT', 'GE', 'MMM', 'HON', 'UPS', 'LMT', 'DE'];
  
  if (largeCap.includes(symbol)) {
    return LARGE_CAP_TECH_SHARES;
  } else if (largeCap2.includes(symbol)) {
    return LARGE_CAP_NON_TECH_SHARES;
  } else if (midCap.includes(symbol)) {
    return MID_CAP_SHARES;
  } else {
    return SMALL_CAP_SHARES;
  }
}

/**
 * Initialize default rebalancing configuration for all index funds
 * @param {Array} indexFunds - Array of index fund definitions
 * @param {Date} currentTime - Current game time
 */
function initializeRebalancingConfigs(indexFunds, currentTime) {
  for (const fund of indexFunds) {
    const existing = dbModule.getRebalancingConfig.get(fund.symbol);
    
    if (!existing) {
      // Set next rebalancing based on fund inception and frequency
      const nextRebalancing = calculateNextRebalancing(
        fund.inceptionDate,
        REBALANCING_FREQUENCIES.QUARTERLY
      );
      
      dbModule.upsertRebalancingConfig.run(
        fund.symbol,
        REBALANCING_STRATEGIES.HYBRID,
        REBALANCING_FREQUENCIES.QUARTERLY,
        0.05, // 5% drift threshold
        null, // No rebalancing yet
        nextRebalancing.toISOString(),
        1     // Auto-rebalance enabled
      );
    }
  }
}

/**
 * Calculate the next scheduled rebalancing date
 * @param {Date} lastRebalancing - Last rebalancing date (or inception)
 * @param {String} frequency - Rebalancing frequency
 * @returns {Date} Next rebalancing date
 */
function calculateNextRebalancing(lastRebalancing, frequency) {
  const nextDate = new Date(lastRebalancing);
  
  switch (frequency) {
    case REBALANCING_FREQUENCIES.MONTHLY:
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case REBALANCING_FREQUENCIES.QUARTERLY:
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case REBALANCING_FREQUENCIES.SEMI_ANNUAL:
      nextDate.setMonth(nextDate.getMonth() + 6);
      break;
    case REBALANCING_FREQUENCIES.ANNUAL:
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
  }
  
  return nextDate;
}

/**
 * Check if rebalancing is needed based on strategy
 * @param {Object} fund - Index fund definition
 * @param {Date} currentTime - Current game time
 * @param {Number} timeMultiplier - Game time multiplier
 * @param {Boolean} isPaused - Whether game is paused
 * @returns {Object|null} Rebalancing info or null if not needed
 */
function checkRebalancingNeeded(fund, currentTime, timeMultiplier, isPaused) {
  const config = dbModule.getRebalancingConfig.get(fund.symbol);
  
  if (!config || !config.auto_rebalance_enabled) {
    return null;
  }

  // Check scheduled rebalancing
  if (config.next_scheduled_rebalancing) {
    const nextScheduled = new Date(config.next_scheduled_rebalancing);
    if (currentTime >= nextScheduled) {
      return {
        triggerType: TRIGGER_TYPES.SCHEDULED,
        reason: `Scheduled ${config.rebalancing_frequency} rebalancing`
      };
    }
  }

  // Check threshold-based rebalancing
  if (config.strategy === REBALANCING_STRATEGIES.THRESHOLD || 
      config.strategy === REBALANCING_STRATEGIES.HYBRID) {
    const drift = calculateWeightDrift(fund, currentTime, timeMultiplier, isPaused);
    if (drift > config.drift_threshold) {
      return {
        triggerType: TRIGGER_TYPES.DRIFT,
        reason: `Weight drift (${(drift * 100).toFixed(2)}%) exceeded threshold (${(config.drift_threshold * 100).toFixed(2)}%)`
      };
    }
  }

  return null;
}

/**
 * Calculate maximum weight drift from target weights
 * @param {Object} fund - Index fund definition
 * @param {Date} currentTime - Current game time
 * @param {Number} timeMultiplier - Game time multiplier
 * @param {Boolean} isPaused - Whether game is paused
 * @returns {Number} Maximum drift percentage
 */
function calculateWeightDrift(fund, currentTime, timeMultiplier, isPaused) {
  // Get current target weights
  const currentWeights = calculateMarketCapWeights(
    fund.constituents,
    currentTime,
    timeMultiplier,
    isPaused
  );
  
  // Get last recorded weights
  const lastWeights = getLastRecordedWeights(fund.symbol, currentTime);
  
  if (!lastWeights || lastWeights.length === 0) {
    return 0; // No drift if no previous weights
  }

  let maxDrift = 0;
  
  // Compare current vs last recorded weights
  for (const current of currentWeights) {
    const last = lastWeights.find(w => w.constituent_symbol === current.symbol);
    if (last) {
      const drift = Math.abs(current.weight - last.weight);
      maxDrift = Math.max(maxDrift, drift);
    }
  }

  return maxDrift;
}

/**
 * Get last recorded constituent weights for a fund
 * @param {String} fundSymbol - Fund symbol
 * @param {Date} currentTime - Current game time
 * @returns {Array} Array of last recorded weights
 */
function getLastRecordedWeights(fundSymbol, currentTime) {
  try {
    const weights = dbModule.getIndexFundConstituents.all(
      fundSymbol,
      currentTime.toISOString()
    );
    return weights;
  } catch (error) {
    console.error('Error fetching last recorded weights:', error);
    return [];
  }
}

/**
 * Perform rebalancing for an index fund
 * @param {Object} fund - Index fund definition
 * @param {Date} currentTime - Current game time
 * @param {Number} timeMultiplier - Game time multiplier
 * @param {Boolean} isPaused - Whether game is paused
 * @param {String} triggerType - Type of trigger that initiated rebalancing
 * @returns {Object} Rebalancing result
 */
function performRebalancing(fund, currentTime, timeMultiplier, isPaused, triggerType = TRIGGER_TYPES.MANUAL) {
  try {
    // Calculate new weights
    const newWeights = calculateMarketCapWeights(
      fund.constituents,
      currentTime,
      timeMultiplier,
      isPaused
    );

    if (newWeights.length === 0) {
      return {
        success: false,
        error: 'No valid constituents found for rebalancing'
      };
    }

    // Get previous weights for comparison
    const previousWeights = getLastRecordedWeights(fund.symbol, currentTime);
    
    // Determine constituents added/removed/adjusted
    const changes = analyzeConstituentChanges(previousWeights, newWeights);

    // Store new weights in database
    for (const constituent of newWeights) {
      dbModule.insertConstituent.run(
        fund.symbol,
        constituent.symbol,
        constituent.weight,
        constituent.marketCap,
        currentTime.toISOString()
      );
    }

    // Record rebalancing event
    dbModule.insertRebalancingEvent.run(
      fund.symbol,
      currentTime.toISOString(),
      triggerType,
      JSON.stringify(changes.added),
      JSON.stringify(changes.removed),
      JSON.stringify(changes.adjusted),
      newWeights.length
    );

    // Update rebalancing config
    const config = dbModule.getRebalancingConfig.get(fund.symbol);
    if (config) {
      const nextRebalancing = calculateNextRebalancing(
        currentTime,
        config.rebalancing_frequency
      );
      
      dbModule.upsertRebalancingConfig.run(
        fund.symbol,
        config.strategy,
        config.rebalancing_frequency,
        config.drift_threshold,
        currentTime.toISOString(),
        nextRebalancing.toISOString(),
        config.auto_rebalance_enabled
      );
    }

    return {
      success: true,
      constituents: newWeights.length,
      changes: changes,
      triggerType: triggerType,
      date: currentTime.toISOString()
    };

  } catch (error) {
    console.error('Error performing rebalancing:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Analyze changes between previous and new constituent weights
 * @param {Array} previousWeights - Previous constituent weights
 * @param {Array} newWeights - New constituent weights
 * @returns {Object} Changes summary
 */
function analyzeConstituentChanges(previousWeights, newWeights) {
  const changes = {
    added: [],
    removed: [],
    adjusted: []
  };

  const previousSymbols = new Set(previousWeights.map(w => w.constituent_symbol));
  const newSymbols = new Set(newWeights.map(w => w.symbol));

  // Find added constituents
  for (const constituent of newWeights) {
    if (!previousSymbols.has(constituent.symbol)) {
      changes.added.push({
        symbol: constituent.symbol,
        weight: constituent.weight
      });
    }
  }

  // Find removed constituents
  for (const previous of previousWeights) {
    if (!newSymbols.has(previous.constituent_symbol)) {
      changes.removed.push({
        symbol: previous.constituent_symbol,
        weight: previous.weight
      });
    }
  }

  // Find adjusted weights
  for (const constituent of newWeights) {
    const previous = previousWeights.find(w => w.constituent_symbol === constituent.symbol);
    if (previous) {
      const weightChange = constituent.weight - previous.weight;
      if (Math.abs(weightChange) > WEIGHT_CHANGE_THRESHOLD) {
        changes.adjusted.push({
          symbol: constituent.symbol,
          previousWeight: previous.weight,
          newWeight: constituent.weight,
          change: weightChange
        });
      }
    }
  }

  return changes;
}

/**
 * Process automatic rebalancing for all funds
 * @param {Array} indexFunds - Array of index fund definitions
 * @param {Date} currentTime - Current game time
 * @param {Number} timeMultiplier - Game time multiplier
 * @param {Boolean} isPaused - Whether game is paused
 * @returns {Array} Array of rebalancing results
 */
function processAutoRebalancing(indexFunds, currentTime, timeMultiplier, isPaused) {
  const results = [];

  for (const fund of indexFunds) {
    // Skip if fund not yet available
    if (currentTime < fund.inceptionDate) {
      continue;
    }

    const rebalancingNeeded = checkRebalancingNeeded(fund, currentTime, timeMultiplier, isPaused);
    
    if (rebalancingNeeded) {
      console.log(`Rebalancing ${fund.symbol}: ${rebalancingNeeded.reason}`);
      const result = performRebalancing(
        fund,
        currentTime,
        timeMultiplier,
        isPaused,
        rebalancingNeeded.triggerType
      );
      
      if (result.success) {
        results.push({
          fundSymbol: fund.symbol,
          fundName: fund.name,
          ...result
        });
      }
    }
  }

  return results;
}

/**
 * Get rebalancing history for a fund
 * @param {String} fundSymbol - Fund symbol
 * @param {Number} limit - Maximum number of events to return
 * @returns {Array} Array of rebalancing events
 */
function getRebalancingHistory(fundSymbol, limit = 50) {
  try {
    const events = dbModule.getRebalancingEvents.all(fundSymbol, limit);
    
    return events.map(event => ({
      id: event.id,
      fundSymbol: event.fund_symbol,
      date: event.rebalancing_date,
      triggerType: event.trigger_type,
      constituentsAdded: event.constituents_added ? JSON.parse(event.constituents_added) : [],
      constituentsRemoved: event.constituents_removed ? JSON.parse(event.constituents_removed) : [],
      weightsAdjusted: event.weights_adjusted ? JSON.parse(event.weights_adjusted) : [],
      totalConstituents: event.total_constituents,
      createdAt: event.created_at
    }));
  } catch (error) {
    console.error('Error fetching rebalancing history:', error);
    return [];
  }
}

/**
 * Get current constituent weights for a fund
 * @param {String} fundSymbol - Fund symbol
 * @param {Date} currentTime - Current game time
 * @returns {Array} Array of current constituent weights
 */
function getCurrentWeights(fundSymbol, currentTime) {
  try {
    const weights = dbModule.getIndexFundConstituents.all(
      fundSymbol,
      currentTime.toISOString()
    );
    
    // Group by constituent and get latest weight for each
    const latestWeights = {};
    for (const weight of weights) {
      if (!latestWeights[weight.constituent_symbol] || 
          new Date(weight.effective_date) > new Date(latestWeights[weight.constituent_symbol].effective_date)) {
        latestWeights[weight.constituent_symbol] = weight;
      }
    }
    
    return Object.values(latestWeights).map(w => ({
      symbol: w.constituent_symbol,
      weight: w.weight,
      marketCap: w.market_cap,
      effectiveDate: w.effective_date
    }));
  } catch (error) {
    console.error('Error fetching current weights:', error);
    return [];
  }
}

module.exports = {
  REBALANCING_STRATEGIES,
  REBALANCING_FREQUENCIES,
  TRIGGER_TYPES,
  
  calculateMarketCapWeights,
  initializeRebalancingConfigs,
  checkRebalancingNeeded,
  performRebalancing,
  processAutoRebalancing,
  getRebalancingHistory,
  getCurrentWeights,
  calculateNextRebalancing
};
