// Historical stock data with simulated fluctuations
// Starting prices for major stocks in 1970

const historicalData = {
  'IBM': [
    { date: new Date('1970-01-01'), price: 22.50 },
    { date: new Date('1970-06-01'), price: 24.30 },
    { date: new Date('1971-01-01'), price: 26.80 },
    { date: new Date('1972-01-01'), price: 30.50 },
    { date: new Date('1973-01-01'), price: 28.20 },
    { date: new Date('1974-01-01'), price: 25.10 },
    { date: new Date('1975-01-01'), price: 32.50 }
  ],
  'XOM': [ // Exxon (was Esso)
    { date: new Date('1970-01-01'), price: 18.75 },
    { date: new Date('1970-06-01'), price: 19.20 },
    { date: new Date('1971-01-01'), price: 21.30 },
    { date: new Date('1972-01-01'), price: 23.80 },
    { date: new Date('1973-01-01'), price: 28.50 },
    { date: new Date('1974-01-01'), price: 24.30 },
    { date: new Date('1975-01-01'), price: 26.80 }
  ],
  'GE': [ // General Electric
    { date: new Date('1970-01-01'), price: 16.25 },
    { date: new Date('1970-06-01'), price: 17.80 },
    { date: new Date('1971-01-01'), price: 19.50 },
    { date: new Date('1972-01-01'), price: 22.10 },
    { date: new Date('1973-01-01'), price: 20.30 },
    { date: new Date('1974-01-01'), price: 18.60 },
    { date: new Date('1975-01-01'), price: 24.20 }
  ]
};

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
  
  // If before the first data point, use first price
  if (currentTime < stockData[0].date) {
    return {
      symbol,
      price: stockData[0].price,
      change: 0
    };
  }
  
  // If after the last data point, use last price
  if (currentTime >= stockData[stockData.length - 1].date) {
    return {
      symbol,
      price: stockData[stockData.length - 1].price,
      change: 0
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
    name: getStockName(symbol)
  };
}

function getStockName(symbol) {
  const names = {
    'IBM': 'International Business Machines',
    'XOM': 'Exxon Corporation',
    'GE': 'General Electric'
  };
  return names[symbol] || symbol;
}

function getStockData(currentTime) {
  const symbols = Object.keys(historicalData);
  return symbols.map(symbol => getStockPrice(symbol, currentTime));
}

module.exports = {
  getStockPrice,
  getStockData
};
