/**
 * Centralized Tick Handler Module
 * 
 * This module manages the game's time advancement (ticking) logic.
 * It provides a single place to control how game time advances,
 * ensuring consistent behavior and preventing tick-related bugs.
 * 
 * Purpose:
 * - Centralize game time advancement logic
 * - Respect pause state from pauseHandler
 * - Handle market open/close transitions
 * - Process pending orders when market opens
 * - Provide hooks for tick events
 * 
 * Usage:
 *   const tickHandler = require('./helpers/tickHandler');
 *   tickHandler.initialize(gameTime, timeMultiplier, isMarketOpenFn);
 *   tickHandler.setProcessPendingOrdersCallback(callback);
 *   tickHandler.start();
 */

const pauseHandler = require('./pauseHandler');

// State variables
let gameTime = null;
let timeMultiplier = 3600; // Default: 1 second = 1 hour
let isMarketOpenFn = null;
let wasMarketOpen = false;
let tickInterval = null;

// Callbacks for tick events
let onTimeAdvancedCallback = null;
let processPendingOrdersCallback = null;
let onMarketOpenCallback = null;
let onMarketCloseCallback = null;

/**
 * Initialize the tick handler
 * @param {Date} initialGameTime - Starting game time
 * @param {number} initialTimeMultiplier - Time multiplier (seconds of game time per real second)
 * @param {Function} marketOpenChecker - Function to check if market is open
 */
function initialize(initialGameTime, initialTimeMultiplier, marketOpenChecker) {
  gameTime = initialGameTime;
  timeMultiplier = initialTimeMultiplier;
  isMarketOpenFn = marketOpenChecker;
  
  if (isMarketOpenFn) {
    wasMarketOpen = isMarketOpenFn(gameTime);
  }
  
  console.log('Tick handler initialized:', {
    gameTime: gameTime.toISOString(),
    timeMultiplier,
    wasMarketOpen
  });
}

/**
 * Get current game time
 * @returns {Date} Current game time
 */
function getGameTime() {
  return gameTime;
}

/**
 * Set game time (for debug/testing)
 * @param {Date} newTime - New game time
 */
function setGameTime(newTime) {
  gameTime = newTime;
  if (isMarketOpenFn) {
    wasMarketOpen = isMarketOpenFn(gameTime);
  }
}

/**
 * Get current time multiplier
 * @returns {number} Time multiplier
 */
function getTimeMultiplier() {
  return timeMultiplier;
}

/**
 * Set time multiplier
 * @param {number} multiplier - New time multiplier
 */
function setTimeMultiplier(multiplier) {
  if (multiplier && typeof multiplier === 'number' && multiplier > 0) {
    timeMultiplier = multiplier;
  }
}

/**
 * Set callback for when time advances
 * @param {Function} callback - Called with (oldTime, newTime)
 */
function setOnTimeAdvancedCallback(callback) {
  onTimeAdvancedCallback = callback;
}

/**
 * Set callback for processing pending orders
 * @param {Function} callback - Called when market opens
 */
function setProcessPendingOrdersCallback(callback) {
  processPendingOrdersCallback = callback;
}

/**
 * Set callback for market open events
 * @param {Function} callback - Called when market opens
 */
function setOnMarketOpenCallback(callback) {
  onMarketOpenCallback = callback;
}

/**
 * Set callback for market close events
 * @param {Function} callback - Called when market closes
 */
function setOnMarketCloseCallback(callback) {
  onMarketCloseCallback = callback;
}

/**
 * Advance time by one tick
 * This is the core tick logic
 */
function tick() {
  // Only tick if game is not paused
  if (!pauseHandler.shouldProcessGameState()) {
    return;
  }
  
  const oldTime = new Date(gameTime.getTime());
  const newTime = new Date(gameTime.getTime() + (timeMultiplier * 1000));
  
  // If market is currently closed and we're using fast speed (1s = 1day or more)
  // Advance time in smaller increments to avoid skipping market open hours
  if (isMarketOpenFn && !isMarketOpenFn(gameTime) && timeMultiplier >= 86400) {
    let checkTime = new Date(gameTime.getTime());
    const increment = 3600 * 1000; // 1 hour increments
    const maxAdvance = timeMultiplier * 1000;
    let totalAdvanced = 0;
    
    while (totalAdvanced < maxAdvance && !isMarketOpenFn(checkTime)) {
      checkTime = new Date(checkTime.getTime() + increment);
      totalAdvanced += increment;
      
      // Stop if we hit market open time
      if (isMarketOpenFn(checkTime)) {
        gameTime = checkTime;
        handleMarketTransitions(oldTime);
        return;
      }
    }
    
    // If we still haven't found market open, use the calculated time
    if (totalAdvanced >= maxAdvance) {
      gameTime = newTime;
    }
    handleMarketTransitions(oldTime);
    return;
  }
  
  // Normal time advancement
  gameTime = newTime;
  handleMarketTransitions(oldTime);
  
  // Notify callback if registered
  if (onTimeAdvancedCallback) {
    onTimeAdvancedCallback(oldTime, gameTime);
  }
}

/**
 * Handle market open/close transitions
 * @param {Date} oldTime - Time before the tick
 */
function handleMarketTransitions(oldTime) {
  if (!isMarketOpenFn) {
    return;
  }
  
  const isMarketCurrentlyOpen = isMarketOpenFn(gameTime);
  
  // Market just opened
  if (!wasMarketOpen && isMarketCurrentlyOpen) {
    console.log(`Market just opened at ${gameTime.toISOString()}`);
    
    // Process pending orders
    if (processPendingOrdersCallback) {
      console.log('Processing pending orders...');
      processPendingOrdersCallback();
    }
    
    // Call market open callback
    if (onMarketOpenCallback) {
      onMarketOpenCallback(gameTime);
    }
  }
  
  // Market just closed
  if (wasMarketOpen && !isMarketCurrentlyOpen) {
    console.log(`Market just closed at ${gameTime.toISOString()}`);
    
    // Call market close callback
    if (onMarketCloseCallback) {
      onMarketCloseCallback(gameTime);
    }
  }
  
  wasMarketOpen = isMarketCurrentlyOpen;
}

/**
 * Start the tick loop
 * @param {number} intervalMs - Tick interval in milliseconds (default: 1000)
 */
function start(intervalMs = 1000) {
  if (tickInterval) {
    console.warn('Tick handler already started');
    return;
  }
  
  tickInterval = setInterval(tick, intervalMs);
  console.log(`Tick handler started with ${intervalMs}ms interval`);
}

/**
 * Stop the tick loop
 */
function stop() {
  if (tickInterval) {
    clearInterval(tickInterval);
    tickInterval = null;
    console.log('Tick handler stopped');
  }
}

/**
 * Check if tick loop is running
 * @returns {boolean} True if running
 */
function isRunning() {
  return tickInterval !== null;
}

module.exports = {
  initialize,
  getGameTime,
  setGameTime,
  getTimeMultiplier,
  setTimeMultiplier,
  setOnTimeAdvancedCallback,
  setProcessPendingOrdersCallback,
  setOnMarketOpenCallback,
  setOnMarketCloseCallback,
  tick,
  start,
  stop,
  isRunning
};
