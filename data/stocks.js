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

// Get interpolated price with minor fluctuations
function getStockPrice(symbol, currentTime) {
  const stockData = historicalData[symbol];
  if (!stockData) return null;
  
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
    return {
      symbol,
      price: stockData[stockData.length - 1].price,
      change: 0,
      name: getStockName(symbol),
      sector: getStockSector(symbol)
    };
  }
  
  // Linear interpolation
  const timeRange = after.date - before.date;
  const timePassed = currentTime - before.date;
  const priceRange = after.price - before.price;
  
  const basePrice = before.price + (priceRange * (timePassed / timeRange));
  
  // Add minor random fluctuation (±2%)
  const fluctuation = (Math.random() - 0.5) * 0.04 * basePrice;
  const price = Math.max(0.01, basePrice + fluctuation);
  
  // Calculate change from previous base price
  const change = ((price - before.price) / before.price) * 100;
  
  return {
    symbol,
    price: parseFloat(price.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    name: getStockName(symbol),
    sector: getStockSector(symbol)
  };
}

function getStockName(symbol) {
  return stockNames[symbol] || symbol;
}

function getStockSector(symbol) {
  return stockSectors[symbol] || 'Unknown';
}

function getStockData(currentTime) {
  const symbols = Object.keys(historicalData);
  return symbols
    .map(symbol => getStockPrice(symbol, currentTime))
    .filter(stock => stock !== null); // Filter out stocks not available yet
}

// Get stocks available at a given time (for filtering)
function getAvailableStocks(currentTime) {
  return getStockData(currentTime);
}

module.exports = {
  getStockPrice,
  getStockData,
  getAvailableStocks
};
