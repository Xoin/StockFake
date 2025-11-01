// Historical stock data with simulated fluctuations
// Data for 200+ major companies from 1970 to current day

const fs = require('fs');
const path = require('path');

// Load crash simulation module for price impact calculation
let crashSimModule = null;
try {
  crashSimModule = require('../helpers/marketCrashSimulation');
} catch (err) {
  // Crash simulation module not available or error loading
  console.warn('Market crash simulation module not loaded:', err.message);
}

// Load historical stock data
const historicalStockData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'historical-stock-data.json'), 'utf8')
);

// Convert the loaded data to the format we need
const historicalData = {};
const stockNames = {};
const stockSectors = {};

for (const [symbol, stockInfo] of Object.entries(historicalStockData.data)) {
  historicalData[symbol] = stockInfo.history.map(entry => ({
    date: new Date(entry.date),
    price: entry.price
  }));
  stockNames[symbol] = stockInfo.name;
  stockSectors[symbol] = stockInfo.sector;
}

// Price cache for when market is closed
let priceCache = {};
let lastMarketState = null;

// Stock market hours (NYSE) - same as server.js
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

// Deterministic pseudo-random function based on time and symbol
// This ensures the same time always produces the same price
function seededRandom(symbol, time) {
  // Create a hash from symbol and time (rounded to nearest minute for stability)
  const MILLISECONDS_PER_MINUTE = 60000;
  const MAX_STRING_LENGTH = 1000; // Prevent excessive loop iterations
  const roundedTime = Math.floor(time / MILLISECONDS_PER_MINUTE) * MILLISECONDS_PER_MINUTE;
  let hash = 0;
  const str = symbol + roundedTime.toString();
  const safeLength = Math.min(str.length, MAX_STRING_LENGTH);
  
  for (let i = 0; i < safeLength; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convert hash to a value between 0 and 1
  return Math.abs(Math.sin(hash) * 10000) % 1;
}

// Volatility scaling constants
const SPEED_SLOW_THRESHOLD = 60;        // 1s = 1min
const SPEED_MODERATE_THRESHOLD = 600;   // 1s = 10min  
const SPEED_NORMAL = 3600;              // 1s = 1hr (baseline)
const SPEED_FAST = 86400;               // 1s = 1day

const VOLATILITY_SLOW = 0.25;           // 25% at very slow speeds
const VOLATILITY_LOW = 0.75;            // 75% at moderate speeds
const VOLATILITY_NORMAL = 1.0;          // 100% baseline
const VOLATILITY_HIGH = 1.5;            // 150% at very fast speeds

// Calculate volatility scale factor based on game speed
// Slower speeds = less volatility, faster speeds = more volatility
function getVolatilityScale(timeMultiplier) {
  if (!timeMultiplier) {
    return VOLATILITY_NORMAL; // No scaling if no multiplier provided
  }
  
  // Speed categories:
  // Very slow (<=60): 25% volatility
  // Slow (60-600): scale between 25% and 75%
  // Moderate (600-3600): scale between 75% and 100%
  // Fast (3600-86400): scale between 100% and 150%
  // Very fast (>86400): 150% volatility
  
  if (timeMultiplier <= SPEED_SLOW_THRESHOLD) {
    // Very slow speeds: reduce to 25%
    return VOLATILITY_SLOW;
  } else if (timeMultiplier <= SPEED_MODERATE_THRESHOLD) {
    // Slow speeds: scale between 25% and 75%
    const progress = (timeMultiplier - SPEED_SLOW_THRESHOLD) / (SPEED_MODERATE_THRESHOLD - SPEED_SLOW_THRESHOLD);
    return VOLATILITY_SLOW + progress * (VOLATILITY_LOW - VOLATILITY_SLOW);
  } else if (timeMultiplier <= SPEED_NORMAL) {
    // Moderate speeds: scale between 75% and 100%
    const progress = (timeMultiplier - SPEED_MODERATE_THRESHOLD) / (SPEED_NORMAL - SPEED_MODERATE_THRESHOLD);
    return VOLATILITY_LOW + progress * (VOLATILITY_NORMAL - VOLATILITY_LOW);
  } else if (timeMultiplier <= SPEED_FAST) {
    // Fast speeds: scale between 100% and 150%
    const progress = (timeMultiplier - SPEED_NORMAL) / (SPEED_FAST - SPEED_NORMAL);
    return VOLATILITY_NORMAL + progress * (VOLATILITY_HIGH - VOLATILITY_NORMAL);
  } else {
    // Very fast speeds: cap at 150%
    return VOLATILITY_HIGH;
  }
}

// Get interpolated price with minor fluctuations
function getStockPrice(symbol, currentTime, timeMultiplier, isPaused, bypassCache = false) {
  const stockData = historicalData[symbol];
  if (!stockData) return null;
  
  const marketOpen = isMarketOpen(currentTime);
  const currentMarketState = marketOpen;
  
  // Check if market state has changed
  if (lastMarketState !== null && lastMarketState !== currentMarketState) {
    if (!currentMarketState) {
      // Market just closed - keep cache as is
    } else {
      // Market just opened - clear cache
      priceCache = {};
    }
  }
  lastMarketState = currentMarketState;
  
  // If game is paused OR market is closed, return cached price if available (unless bypassCache is true)
  if (!bypassCache && (isPaused || !marketOpen) && priceCache[symbol]) {
    return priceCache[symbol];
  }
  
  // Find the two data points to interpolate between
  let before = stockData[0];
  let after = stockData[stockData.length - 1];
  
  for (let i = 0; i < stockData.length - 1; i++) {
    if (currentTime >= stockData[i].date && currentTime < stockData[i + 1].date) {
      before = stockData[i];
      after = stockData[i + 1];
      break;
    }
  }
  
  // If before the first data point, return null (stock not available yet)
  if (currentTime < stockData[0].date) {
    return null;
  }
  
  // If after the last data point, use last price with continued growth
  if (currentTime >= stockData[stockData.length - 1].date) {
    let basePrice = stockData[stockData.length - 1].price;
    const lastDataDate = stockData[stockData.length - 1].date;
    
    // Calculate time since last data point
    const daysSinceLastData = (currentTime.getTime() - lastDataDate.getTime()) / (1000 * 60 * 60 * 24);
    
    // Apply continued growth: reduced to 5% annual growth to prevent hockey stick
    // This is more conservative and allows market corrections to have meaningful impact
    // Compound daily: (1 + annual_rate)^(days/365.25)
    const annualGrowthRate = 0.05; // 5% per year (reduced from 7%)
    const growthFactor = Math.pow(1 + annualGrowthRate, daysSinceLastData / 365.25);
    basePrice = basePrice * growthFactor;
    
    // Add daily volatility (±2%)
    const randomValue = seededRandom(symbol, Math.floor(currentTime.getTime() / (1000 * 60 * 60 * 24)));
    const volatility = (randomValue - 0.5) * 0.04; // ±2%
    basePrice = basePrice * (1 + volatility);
    
    // Apply crash simulation impact if module is loaded
    let finalPrice = basePrice;
    if (crashSimModule) {
      const sector = getStockSector(symbol);
      finalPrice = crashSimModule.calculateStockPriceImpact(symbol, sector, basePrice, currentTime);
    }
    
    // Calculate change from previous day for percentage change
    let change = 0;
    const previousDay = new Date(currentTime.getTime() - (24 * 60 * 60 * 1000));
    const previousDaysSinceLastData = (previousDay.getTime() - lastDataDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (previousDaysSinceLastData >= 0) {
      // Calculate previous day's price with same methodology
      let prevBasePrice = stockData[stockData.length - 1].price;
      const prevGrowthFactor = Math.pow(1 + annualGrowthRate, previousDaysSinceLastData / 365.25);
      prevBasePrice = prevBasePrice * prevGrowthFactor;
      
      const prevRandomValue = seededRandom(symbol, Math.floor(previousDay.getTime() / (1000 * 60 * 60 * 24)));
      const prevVolatility = (prevRandomValue - 0.5) * 0.04;
      prevBasePrice = prevBasePrice * (1 + prevVolatility);
      
      // Apply crash simulation impact for previous day
      let prevFinalPrice = prevBasePrice;
      if (crashSimModule) {
        const sector = getStockSector(symbol);
        prevFinalPrice = crashSimModule.calculateStockPriceImpact(symbol, sector, prevBasePrice, previousDay);
      }
      
      // Calculate percentage change
      change = ((finalPrice - prevFinalPrice) / prevFinalPrice) * 100;
    }
    
    const result = {
      symbol,
      price: parseFloat(finalPrice.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      name: getStockName(symbol),
      sector: getStockSector(symbol)
    };
    
    // Cache if market is closed (and not bypassing cache)
    if (!bypassCache && !marketOpen) {
      priceCache[symbol] = result;
    }
    
    return result;
  }
  
  // Linear interpolation
  const timeRange = after.date - before.date;
  const timePassed = currentTime - before.date;
  const priceRange = after.price - before.price;
  
  const basePrice = before.price + (priceRange * (timePassed / timeRange));
  
  // Calculate volatility scale based on game speed
  const volatilityScale = getVolatilityScale(timeMultiplier);
  
  // Add minor deterministic fluctuation (±2% base, scaled by game speed)
  const randomValue = seededRandom(symbol, currentTime.getTime());
  const baseFluctuation = (randomValue - 0.5) * 0.04 * basePrice;
  const fluctuation = baseFluctuation * volatilityScale;
  let price = Math.max(0.01, basePrice + fluctuation);
  
  // Apply crash simulation impact if module is loaded
  if (crashSimModule) {
    const sector = getStockSector(symbol);
    price = crashSimModule.calculateStockPriceImpact(symbol, sector, price, currentTime);
  }
  
  // Calculate change from previous base price
  const change = ((price - before.price) / before.price) * 100;
  
  const result = {
    symbol,
    price: parseFloat(price.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    name: getStockName(symbol),
    sector: getStockSector(symbol)
  };
  
  // Cache if market is closed or game is paused (and not bypassing cache)
  if (!bypassCache && (!marketOpen || isPaused)) {
    priceCache[symbol] = result;
  }
  
  return result;
}

function getStockName(symbol) {
  return stockNames[symbol] || symbol;
}

function getStockSector(symbol) {
  return stockSectors[symbol] || 'Unknown';
}

function getStockData(currentTime, timeMultiplier, isPaused, bypassCache = false) {
  const symbols = Object.keys(historicalData);
  return symbols
    .map(symbol => getStockPrice(symbol, currentTime, timeMultiplier, isPaused, bypassCache))
    .filter(stock => stock !== null); // Filter out stocks not available yet
}

// Get stocks available at a given time (for filtering)
function getAvailableStocks(currentTime, timeMultiplier, isPaused, bypassCache = false) {
  return getStockData(currentTime, timeMultiplier, isPaused, bypassCache);
}

module.exports = {
  getStockPrice,
  getStockData,
  getAvailableStocks
};
