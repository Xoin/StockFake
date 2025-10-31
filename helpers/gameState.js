const db = require('../database');

// Load game state from database
let gameState = db.getGameState().get();
let gameTime = new Date(gameState.game_time);
let isPaused = Boolean(gameState.is_paused);
let timeMultiplier = gameState.time_multiplier;
let lastDividendQuarter = gameState.last_dividend_quarter;
let lastMonthlyFeeCheck = gameState.last_monthly_fee_check;
let lastInflationCheck = gameState.last_inflation_check;
let cumulativeInflation = gameState.cumulative_inflation;

// Stock market hours (NYSE)
const MARKET_OPEN_HOUR = 9;
const MARKET_OPEN_MINUTE = 30;
const MARKET_CLOSE_HOUR = 16;
const MARKET_CLOSE_MINUTE = 0;

// Check if market is open
function isMarketOpen(date) {
  const day = date.getDay();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  
  // Weekend check
  if (day === 0 || day === 6) return false;
  
  // Time check
  const currentMinutes = hours * 60 + minutes;
  const openMinutes = MARKET_OPEN_HOUR * 60 + MARKET_OPEN_MINUTE;
  const closeMinutes = MARKET_CLOSE_HOUR * 60 + MARKET_CLOSE_MINUTE;
  
  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

// Save game state to database
function saveGameState() {
  db.updateGameState.run(
    gameTime.toISOString(),
    isPaused ? 1 : 0,
    timeMultiplier,
    lastDividendQuarter,
    lastMonthlyFeeCheck,
    lastInflationCheck,
    cumulativeInflation
  );
}

// Start time simulation
function startTimeSimulation() {
  setInterval(() => {
    if (!isPaused) {
      gameTime = new Date(gameTime.getTime() + (timeMultiplier * 1000));
    }
  }, 1000);
  
  // Save game state every 5 seconds
  setInterval(saveGameState, 5000);
}

function getGameTime() {
  return gameTime;
}

function setGameTime(newTime) {
  gameTime = newTime;
}

function getIsPaused() {
  return isPaused;
}

function setIsPaused(paused) {
  isPaused = paused;
  saveGameState();
}

function getTimeMultiplier() {
  return timeMultiplier;
}

function setTimeMultiplier(multiplier) {
  timeMultiplier = multiplier;
  saveGameState();
}

function getLastDividendQuarter() {
  return lastDividendQuarter;
}

function setLastDividendQuarter(quarter) {
  lastDividendQuarter = quarter;
  saveGameState();
}

function getLastMonthlyFeeCheck() {
  return lastMonthlyFeeCheck;
}

function setLastMonthlyFeeCheck(check) {
  lastMonthlyFeeCheck = check;
  saveGameState();
}

function getLastInflationCheck() {
  return lastInflationCheck;
}

function setLastInflationCheck(check) {
  lastInflationCheck = check;
  saveGameState();
}

function getCumulativeInflation() {
  return cumulativeInflation;
}

function setCumulativeInflation(inflation) {
  cumulativeInflation = inflation;
  saveGameState();
}

module.exports = {
  isMarketOpen,
  startTimeSimulation,
  saveGameState,
  getGameTime,
  setGameTime,
  getIsPaused,
  setIsPaused,
  getTimeMultiplier,
  setTimeMultiplier,
  getLastDividendQuarter,
  setLastDividendQuarter,
  getLastMonthlyFeeCheck,
  setLastMonthlyFeeCheck,
  getLastInflationCheck,
  setLastInflationCheck,
  getCumulativeInflation,
  setCumulativeInflation
};
