/**
 * Market Crash Simulation Engine
 * Handles the execution and impact calculation of market crash events
 * 
 * Enhanced with research-based models:
 * - GARCH(1,1) volatility modeling
 * - Fat-tailed return distributions
 * - Stock correlations
 * - Early warning system
 */

const crashEvents = require('../data/market-crash-events');
const dynamicEventGenerator = require('./dynamicEventGenerator');
const { GARCHModel, generateStudentT } = require('./volatilityModeling');
const { CorrelationMatrix } = require('./correlationMatrix');

/**
 * Active crash events state
 */
let activeEvents = [];

/**
 * Market state tracking
 */
let marketState = {
  baseVolatility: 1.0,
  currentVolatility: 1.0,
  liquidityLevel: 1.0,
  sentimentScore: 0.0,  // -1.0 (extreme fear) to 1.0 (extreme greed)
  sectorSentiment: {}
};

/**
 * GARCH volatility models for each stock
 * Map: symbol -> GARCHModel instance
 */
const stockVolatilityModels = new Map();

/**
 * Correlation matrix manager
 */
const correlationMatrix = new CorrelationMatrix();

// Decay constants for market state recovery
const VOLATILITY_DECAY_RATE = 0.99;  // 1% daily decay when no events active
const LIQUIDITY_RECOVERY_RATE = 1.01;  // 1% daily recovery when no events active
const SENTIMENT_DECAY_RATE = 0.95;  // 5% daily decay towards neutral
const SECTOR_SENTIMENT_DECAY_RATE = 0.95;  // 5% daily decay towards neutral

/**
 * Event history for analytics
 */
let eventHistory = [];

/**
 * Initialize or reset market state
 */
function initializeMarketState() {
  marketState = {
    baseVolatility: 1.0,
    currentVolatility: 1.0,
    liquidityLevel: 1.0,
    sentimentScore: 0.0,
    sectorSentiment: {}
  };
  activeEvents = [];
}

/**
 * Trigger a market crash event
 * @param {string|object} eventIdOrConfig - Event ID or custom event configuration
 * @param {Date} currentTime - Current game time
 * @returns {object} - Activation result
 */
function triggerCrashEvent(eventIdOrConfig, currentTime) {
  let event;
  
  // If string, look up by ID
  if (typeof eventIdOrConfig === 'string') {
    event = crashEvents.getScenarioById(eventIdOrConfig);
    if (!event) {
      return {
        success: false,
        error: `Event not found: ${eventIdOrConfig}`
      };
    }
    // Clone to avoid modifying the original
    event = JSON.parse(JSON.stringify(event));
    event.startDate = currentTime;
  } else {
    // Use custom configuration
    event = crashEvents.createCrashTemplate(eventIdOrConfig);
    event.startDate = currentTime;
  }
  
  // Calculate end date if not specified
  if (!event.endDate && event.recoveryPattern) {
    const durationMs = event.recoveryPattern.durationDays * 24 * 60 * 60 * 1000;
    event.endDate = new Date(event.startDate.getTime() + durationMs);
  }
  
  // Activate the event
  const activeEvent = {
    ...event,
    activatedAt: currentTime,
    status: 'active',
    currentPhase: 'impact',
    daysSinceStart: 0
  };
  
  activeEvents.push(activeEvent);
  
  // Record in history
  eventHistory.push({
    eventId: event.id,
    name: event.name,
    activatedAt: currentTime,
    type: event.type,
    severity: event.severity
  });
  
  // Apply immediate impact
  applyEventImpact(activeEvent, currentTime);
  
  return {
    success: true,
    event: activeEvent,
    message: `Crash event '${event.name}' activated`
  };
}

/**
 * Calculate the impact of active crash events on market state
 * @param {object} event - The crash event
 * @param {Date} currentTime - Current game time
 */
function applyEventImpact(event, currentTime) {
  const daysSinceStart = (currentTime - new Date(event.startDate)) / (1000 * 60 * 60 * 24);
  event.daysSinceStart = daysSinceStart;
  
  // Reset to baseline before applying event impacts to avoid exponential compounding
  if (activeEvents.length === 1) {
    marketState.currentVolatility = marketState.baseVolatility;
    marketState.liquidityLevel = 1.0;
    marketState.sentimentScore = 0.0;
    marketState.sectorSentiment = {};
  }
  
  // Apply volatility impact (multiplicative)
  marketState.currentVolatility *= event.impact.volatilityMultiplier;
  
  // Apply liquidity impact (multiplicative reduction)
  marketState.liquidityLevel *= (1 - event.impact.liquidityReduction);
  
  // Apply sentiment impact (additive, clamped)
  marketState.sentimentScore += event.impact.sentimentShift;
  marketState.sentimentScore = Math.max(-1.0, Math.min(1.0, marketState.sentimentScore));
  
  // Apply sector-specific sentiment
  for (const [sector, impact] of Object.entries(event.impact.sectors || {})) {
    if (!marketState.sectorSentiment[sector]) {
      marketState.sectorSentiment[sector] = 0.0;
    }
    marketState.sectorSentiment[sector] += impact * 0.5;  // Dampen sector sentiment
    marketState.sectorSentiment[sector] = Math.max(-1.0, Math.min(1.0, marketState.sectorSentiment[sector]));
  }
}

/**
 * Calculate cascading effects based on time elapsed
 * @param {object} event - The crash event
 * @param {number} daysSinceStart - Days since event started
 * @returns {number} - Cascading effect multiplier
 */
function calculateCascadingEffect(event, daysSinceStart) {
  if (!event.cascadingEffects || event.cascadingEffects.length === 0) {
    return 1.0;
  }
  
  // Find the appropriate cascading effect for the current time
  let effectMultiplier = 1.0;
  
  for (let i = 0; i < event.cascadingEffects.length; i++) {
    const effect = event.cascadingEffects[i];
    const nextEffect = event.cascadingEffects[i + 1];
    
    if (nextEffect) {
      // Between two effects - interpolate
      if (daysSinceStart >= effect.delay && daysSinceStart < nextEffect.delay) {
        const progress = (daysSinceStart - effect.delay) / (nextEffect.delay - effect.delay);
        effectMultiplier = effect.multiplier + (nextEffect.multiplier - effect.multiplier) * progress;
        break;
      }
    } else {
      // Last effect - use if past its delay
      if (daysSinceStart >= effect.delay) {
        effectMultiplier = effect.multiplier;
        break;
      }
    }
  }
  
  return effectMultiplier;
}

/**
 * Initialize GARCH volatility model for a stock
 * @param {string} symbol - Stock symbol
 * @returns {GARCHModel} - Initialized GARCH model
 */
function initializeStockVolatility(symbol) {
  const garchModel = new GARCHModel();
  stockVolatilityModels.set(symbol, garchModel);
  return garchModel;
}

/**
 * Get or create GARCH model for stock
 * @param {string} symbol - Stock symbol
 * @returns {GARCHModel}
 */
function getStockVolatilityModel(symbol) {
  if (!stockVolatilityModels.has(symbol)) {
    return initializeStockVolatility(symbol);
  }
  return stockVolatilityModels.get(symbol);
}

/**
 * Calculate price impact for a specific stock
 * Enhanced with GARCH volatility and fat-tailed distributions
 * 
 * @param {string} symbol - Stock symbol
 * @param {string} sector - Stock sector
 * @param {number} basePrice - Original stock price
 * @param {Date} currentTime - Current game time
 * @returns {number} - Adjusted price with crash impact
 */
function calculateStockPriceImpact(symbol, sector, basePrice, currentTime) {
  // Get GARCH model for this stock
  const garchModel = getStockVolatilityModel(symbol);
  
  let totalImpact = 0;
  let volatilityFactor = 1.0;
  
  // Calculate crash impact from active events
  for (const event of activeEvents) {
    if (event.status !== 'active') continue;
    
    const daysSinceStart = (currentTime - new Date(event.startDate)) / (1000 * 60 * 60 * 24);
    
    // Check if event has ended
    if (event.endDate && currentTime > new Date(event.endDate)) {
      event.status = 'completed';
      continue;
    }
    
    // Calculate cascading effect
    const cascadingMultiplier = calculateCascadingEffect(event, daysSinceStart);
    
    // Base market impact
    let impact = event.impact.market * cascadingMultiplier;
    
    // Add sector-specific impact
    if (event.impact.sectors && event.impact.sectors[sector]) {
      impact += event.impact.sectors[sector] * cascadingMultiplier;
      impact /= 2;  // Average the market and sector impacts
    }
    
    // Apply recovery pattern
    if (event.recoveryPattern && daysSinceStart > 0) {
      const recoveryProgress = daysSinceStart / event.recoveryPattern.durationDays;
      if (recoveryProgress > 1.0 && event.recoveryPattern.type !== 'prolonged' && event.recoveryPattern.type !== 'decade-long') {
        // Full recovery completed
        impact *= 0;
      } else {
        // Apply recovery curve
        switch (event.recoveryPattern.type) {
          case 'v-shaped':
            // Quick recovery
            impact *= Math.max(0, 1 - recoveryProgress * 1.5);
            break;
          case 'gradual':
            // Linear recovery
            impact *= Math.max(0, 1 - recoveryProgress);
            break;
          case 'slow':
            // Slow logarithmic recovery
            impact *= Math.max(0, 1 - Math.log(1 + recoveryProgress) / Math.log(2));
            break;
          case 'prolonged':
            // Extended decline then slow recovery
            impact *= Math.max(0, 1 - recoveryProgress * 0.5);
            break;
          case 'decade-long':
            // Very extended multi-year decline and recovery (for dot-com, 2008, etc.)
            // Uses logarithmic decay over many years with a slower curve
            impact *= Math.max(0, 1 - Math.log(1 + recoveryProgress) / Math.log(3));
            break;
          case 'immediate':
            // Very fast recovery
            impact *= Math.max(0, 1 - recoveryProgress * 3);
            break;
        }
      }
    }
    
    totalImpact += impact;
    volatilityFactor *= event.impact.volatilityMultiplier;
  }
  
  // Generate stochastic return component
  // Only add significant volatility if crash is active or for normal daily movements
  let volatilityReturn = 0;
  
  if (activeEvents.length > 0 && volatilityFactor > 1.0) {
    // During crash: apply volatility shock and generate larger returns
    // Allow higher volatility during crashes, but still cap at realistic levels (±20%)
    garchModel.applyVolatilityShock(volatilityFactor);
    volatilityReturn = garchModel.generateReturn(5, 0, 0.20);
  } else {
    // Normal times: use moderate drift and volatility (daily scale)
    // Typical daily drift ~0.0003 (about 8% annualized)
    // Typical daily vol ~0.01 (about 15% annualized)
    // Cap at ±12% for realistic daily movements (reduced to prevent compound effects)
    const dailyDrift = 0.0003;
    volatilityReturn = garchModel.generateReturn(5, dailyDrift, 0.12);
  }
  
  // Combine crash impact with stochastic volatility
  const totalReturn = totalImpact + volatilityReturn;
  
  // Update GARCH model with realized return
  garchModel.updateVolatility(totalReturn);
  
  // Apply to price
  let adjustedPrice = basePrice * (1 + totalReturn);
  
  return Math.max(0.01, adjustedPrice);  // Ensure price doesn't go negative or zero
}

/**
 * Update all active events and market state
 * @param {Date} currentTime - Current game time
 */
function updateCrashEvents(currentTime) {
  // Check for and generate dynamic events
  const newDynamicEvents = dynamicEventGenerator.generateDynamicEvents(currentTime);
  
  // Auto-trigger dynamic events
  for (const dynamicEvent of newDynamicEvents) {
    console.log(`Auto-triggering dynamic event: ${dynamicEvent.name}`);
    triggerCrashEvent(dynamicEvent, currentTime);
  }
  
  // Remove completed events
  activeEvents = activeEvents.filter(event => {
    if (event.endDate && currentTime > new Date(event.endDate)) {
      event.status = 'completed';
      return false;
    }
    return event.status === 'active';
  });
  
  // Decay volatility back to baseline
  if (activeEvents.length === 0) {
    marketState.currentVolatility = Math.max(1.0, marketState.currentVolatility * VOLATILITY_DECAY_RATE);
    marketState.liquidityLevel = Math.min(1.0, marketState.liquidityLevel * LIQUIDITY_RECOVERY_RATE);
    marketState.sentimentScore *= SENTIMENT_DECAY_RATE;  // Sentiment returns to neutral
    
    // Decay sector sentiment
    for (const sector in marketState.sectorSentiment) {
      marketState.sectorSentiment[sector] *= SECTOR_SENTIMENT_DECAY_RATE;
    }
  } else {
    // Update day counts
    for (const event of activeEvents) {
      event.daysSinceStart = (currentTime - new Date(event.startDate)) / (1000 * 60 * 60 * 24);
    }
  }
}

/**
 * Deactivate a specific crash event
 * @param {string} eventId - Event ID to deactivate
 * @returns {object} - Deactivation result
 */
function deactivateCrashEvent(eventId) {
  const event = activeEvents.find(e => e.id === eventId);
  
  if (!event) {
    return {
      success: false,
      error: `Active event not found: ${eventId}`
    };
  }
  
  event.status = 'deactivated';
  activeEvents = activeEvents.filter(e => e.id !== eventId);
  
  return {
    success: true,
    message: `Event '${event.name}' deactivated`
  };
}

/**
 * Get all active crash events
 */
function getActiveEvents() {
  return activeEvents;
}

/**
 * Check if there are any active crash events
 * @returns {boolean} - True if there are active crash events
 */
function hasActiveEvents() {
  return getActiveEvents().length > 0;
}

/**
 * Get current market state
 */
function getMarketState() {
  return { ...marketState };
}

/**
 * Get event history
 */
function getEventHistory(limit = 50) {
  return eventHistory.slice(-limit);
}

/**
 * Check if a crash event should be triggered based on conditions
 * @param {object} scenario - Scenario with trigger conditions
 * @param {object} marketData - Current market data
 * @returns {boolean} - Whether conditions are met
 */
function checkTriggerConditions(scenario, marketData) {
  if (!scenario.triggerConditions) {
    return false;
  }
  
  const conditions = scenario.triggerConditions;
  
  switch (conditions.type) {
    case 'sector_valuation':
      // Check if sector P/E ratio exceeds threshold
      if (marketData.sectorPE && marketData.sectorPE[conditions.sector]) {
        return marketData.sectorPE[conditions.sector] > conditions.peRatioThreshold;
      }
      break;
      
    case 'market_decline':
      // Check if market has declined by threshold
      if (marketData.marketChange) {
        return marketData.marketChange < -conditions.declineThreshold;
      }
      break;
      
    case 'volatility_spike':
      // Check if volatility has spiked
      if (marketState.currentVolatility > conditions.volatilityThreshold) {
        return true;
      }
      break;
  }
  
  return false;
}

/**
 * Calculate liquidity impact on trade execution
 * @param {number} shares - Number of shares to trade
 * @param {number} normalLiquidity - Normal liquidity level
 * @returns {object} - Liquidity impact details
 */
function calculateLiquidityImpact(shares, normalLiquidity) {
  const adjustedLiquidity = normalLiquidity * marketState.liquidityLevel;
  
  // If trying to trade more than available liquidity
  if (shares > adjustedLiquidity) {
    return {
      executable: false,
      availableShares: Math.floor(adjustedLiquidity),
      priceImpact: 0.05,  // 5% price impact for illiquid trades
      reason: 'Insufficient liquidity during market stress'
    };
  }
  
  // Calculate price impact based on order size vs liquidity
  const liquidityRatio = shares / adjustedLiquidity;
  const priceImpact = liquidityRatio * 0.02 * (2 - marketState.liquidityLevel);  // Up to 2% impact
  
  return {
    executable: true,
    availableShares: shares,
    priceImpact: priceImpact,
    reason: null
  };
}

/**
 * Get crash analytics and statistics
 */
function getCrashAnalytics() {
  return {
    activeEventsCount: activeEvents.length,
    activeEvents: activeEvents.map(e => ({
      id: e.id,
      name: e.name,
      type: e.type,
      severity: e.severity,
      daysSinceStart: e.daysSinceStart,
      status: e.status
    })),
    marketState: getMarketState(),
    historicalEventsCount: eventHistory.length,
    recentEvents: getEventHistory(10)
  };
}

module.exports = {
  // Core functions
  initializeMarketState,
  triggerCrashEvent,
  deactivateCrashEvent,
  updateCrashEvents,
  
  // Price impact
  calculateStockPriceImpact,
  calculateLiquidityImpact,
  
  // State queries
  getActiveEvents,
  hasActiveEvents,
  getMarketState,
  getEventHistory,
  getCrashAnalytics,
  
  // Condition checking
  checkTriggerConditions,
  
  // New: Advanced volatility features
  getStockVolatilityModel,
  initializeStockVolatility,
  getCorrelationMatrix: () => correlationMatrix,
  
  // Test utilities
  resetForTesting: () => {
    activeEvents = [];
    eventHistory = [];
    stockVolatilityModels.clear();
    initializeMarketState();
  }
};
