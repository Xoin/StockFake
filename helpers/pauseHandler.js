/**
 * Centralized Pause Handler Module
 * 
 * This module provides a single source of truth for game pause state checks.
 * All game state processing functions should use this module to check if
 * the game is paused before executing state changes.
 * 
 * Purpose:
 * - Prevent trades, ticks, and other game state changes when paused
 * - Provide consistent pause behavior across the entire codebase
 * - Simplify future maintenance by centralizing pause logic
 * 
 * Usage:
 *   const pauseHandler = require('./helpers/pauseHandler');
 *   pauseHandler.setIsPaused(true);  // Pause the game
 *   pauseHandler.setIsPaused(false); // Unpause the game
 *   if (pauseHandler.shouldProcessGameState()) {
 *     // Execute game state changes
 *   }
 */

let isPaused = true; // Game starts paused by default

/**
 * Check if game state processing should occur
 * @returns {boolean} true if game state should be processed, false if paused
 */
function shouldProcessGameState() {
  return !isPaused;
}

/**
 * Get the current pause state
 * @returns {boolean} true if game is paused, false if running
 */
function getIsPaused() {
  return isPaused;
}

/**
 * Set the pause state
 * @param {boolean} paused - true to pause, false to unpause
 */
function setIsPaused(paused) {
  isPaused = Boolean(paused);
}

/**
 * Execute a function only if the game is not paused
 * @param {Function} fn - Function to execute if game is not paused
 * @param {*} thisArg - Optional 'this' context for the function
 * @returns {*} Return value of fn if executed, undefined if paused
 */
function executeIfNotPaused(fn, thisArg = null) {
  if (shouldProcessGameState()) {
    return fn.call(thisArg);
  }
  return undefined;
}

/**
 * Wrap a function to only execute when game is not paused
 * @param {Function} fn - Function to wrap
 * @returns {Function} Wrapped function that checks pause state before executing
 */
function wrapWithPauseCheck(fn) {
  return function(...args) {
    if (shouldProcessGameState()) {
      return fn.apply(this, args);
    }
    return undefined;
  };
}

module.exports = {
  shouldProcessGameState,
  getIsPaused,
  setIsPaused,
  executeIfNotPaused,
  wrapWithPauseCheck
};
