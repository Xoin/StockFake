// Historical stock data with simulated fluctuations
// Data for 200+ major companies from 1970 to current day

const fs = require('fs');
const path = require('path');

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
let lastCacheTime = null;

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

// Calculate volatility scale factor based on game speed
// Slower speeds = less volatility, faster speeds = more volatility
function getVolatilityScale(timeMultiplier) {
  // Default multiplier is 3600 (1s = 1hr)
  const defaultMultiplier = 3600;
  
  if (!timeMultiplier) {
    return 1.0; // No scaling if no multiplier provided
  }
  
  // Speed categories:
  // Slow: 60 (1s = 1min) -> 25% volatility
  // Normal: 3600 (1s = 1hr) -> 100% volatility
  // Fast: 86400 (1s = 1day) -> 150% volatility
  
  if (timeMultiplier <= 60) {
    // Very slow speeds: reduce to 25%
    return 0.25;
  } else if (timeMultiplier <= 600) {
    // Slow speeds: scale between 25% and 75%
    return 0.25 + (timeMultiplier - 60) / (600 - 60) * 0.5;
  } else if (timeMultiplier <= 3600) {
    // Moderate speeds: scale between 75% and 100%
    return 0.75 + (timeMultiplier - 600) / (3600 - 600) * 0.25;
  } else if (timeMultiplier <= 86400) {
    // Fast speeds: scale between 100% and 150%
    return 1.0 + (timeMultiplier - 3600) / (86400 - 3600) * 0.5;
  } else {
    // Very fast speeds: cap at 150%
    return 1.5;
  }
}

// Get interpolated price with minor fluctuations
function getStockPrice(symbol, currentTime, timeMultiplier) {
  const stockData = historicalData[symbol];
  if (!stockData) return null;
  
  const marketOpen = isMarketOpen(currentTime);
  const currentMarketState = marketOpen;
  
  // Check if market state has changed
  if (lastMarketState !== null && lastMarketState !== currentMarketState) {
    if (!currentMarketState) {
      // Market just closed - cache current time for reference
      lastCacheTime = currentTime;
    } else {
      // Market just opened - clear cache
      priceCache = {};
      lastCacheTime = null;
    }
  }
  lastMarketState = currentMarketState;
  
  // If market is closed and we have a cached price, return it
  if (!marketOpen && priceCache[symbol]) {
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
  
  // If after the last data point, use last price
  if (currentTime >= stockData[stockData.length - 1].date) {
    const result = {
      symbol,
      price: stockData[stockData.length - 1].price,
      change: 0,
      name: getStockName(symbol),
      sector: getStockSector(symbol)
    };
    
    // Cache if market is closed
    if (!marketOpen) {
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
  const price = Math.max(0.01, basePrice + fluctuation);
  
  // Calculate change from previous base price
  const change = ((price - before.price) / before.price) * 100;
  
  const result = {
    symbol,
    price: parseFloat(price.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    name: getStockName(symbol),
    sector: getStockSector(symbol)
  };
  
  // Cache if market is closed
  if (!marketOpen) {
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

function getStockData(currentTime, timeMultiplier) {
  const symbols = Object.keys(historicalData);
  return symbols
    .map(symbol => getStockPrice(symbol, currentTime, timeMultiplier))
    .filter(stock => stock !== null); // Filter out stocks not available yet
}

// Get stocks available at a given time (for filtering)
function getAvailableStocks(currentTime, timeMultiplier) {
  return getStockData(currentTime, timeMultiplier);
}

module.exports = {
  getStockPrice,
  getStockData,
  getAvailableStocks
};
