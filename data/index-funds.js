// Index Funds - Track various market indices
// These funds represent baskets of stocks that track specific market segments

const stocks = require('./stocks');

// Define major index funds with their constituent stocks and availability dates
const indexFunds = [
  {
    symbol: 'SPX500',
    name: 'S&P 500 Index Fund',
    description: 'Tracks the 500 largest US companies',
    inceptionDate: new Date('1976-01-01'), // First S&P 500 index fund (Vanguard 500)
    expenseRatio: 0.0015, // 0.15% annual fee (very low for index funds)
    category: 'Large Cap',
    constituents: [
      // Technology
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'INTC', 'CSCO', 'ORCL', 'IBM',
      'QCOM', 'TXN', 'AVGO', 'CRM', 'ADBE', 'NFLX', 'AMD',
      // Finance
      'JPM', 'BAC', 'WFC', 'C', 'GS', 'MS', 'AXP', 'BLK', 'SCHW', 'USB', 'PNC', 'TFC',
      // Healthcare
      'JNJ', 'UNH', 'PFE', 'ABBV', 'MRK', 'TMO', 'ABT', 'LLY', 'BMY', 'AMGN', 'GILD', 'CVS', 'MDT',
      // Consumer
      'WMT', 'HD', 'PG', 'KO', 'PEP', 'COST', 'NKE', 'MCD', 'SBUX', 'LOW', 'TGT',
      // Energy
      'XOM', 'CVX', 'COP', 'SLB', 'OXY',
      // Industrials
      'BA', 'CAT', 'GE', 'MMM', 'HON', 'UPS', 'LMT', 'DE',
      // Others
      'BRK.B', 'V', 'MA', 'DIS', 'CMCSA', 'VZ', 'T', 'PM', 'MO'
    ],
    weights: null // Equal weight initially, can be market-cap weighted
  },
  {
    symbol: 'NASDAQ100',
    name: 'NASDAQ-100 Index Fund',
    description: 'Tracks the 100 largest non-financial NASDAQ stocks',
    inceptionDate: new Date('1985-01-31'), // NASDAQ-100 was created in 1985
    expenseRatio: 0.002, // 0.20% annual fee
    category: 'Tech-Heavy',
    constituents: [
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'AVGO', 'ASML', 'COST',
      'PEP', 'CSCO', 'NFLX', 'ADBE', 'INTC', 'QCOM', 'TXN', 'AMD', 'SBUX', 'GILD',
      'AMGN', 'ISRG', 'MDLZ', 'ADI', 'VRTX', 'REGN', 'BKNG', 'FISV', 'ADP', 'ATVI',
      'LRCX', 'KLAC', 'MRVL', 'SNPS', 'CDNS', 'NXPI', 'WDAY', 'MNST', 'MELI', 'TEAM'
    ],
    weights: null
  },
  {
    symbol: 'DJIA30',
    name: 'Dow Jones Industrial Average Fund',
    description: 'Tracks the 30 most significant US companies',
    inceptionDate: new Date('1970-01-01'), // Dow has existed since 1896, funds since 1970s
    expenseRatio: 0.0025, // 0.25% annual fee
    category: 'Blue Chip',
    constituents: [
      'AAPL', 'MSFT', 'UNH', 'GS', 'HD', 'MCD', 'V', 'AMGN', 'BA', 'CAT',
      'CRM', 'HON', 'IBM', 'JPM', 'JNJ', 'TRV', 'AXP', 'PG', 'CVX', 'CSCO',
      'MMM', 'NKE', 'KO', 'DIS', 'WMT', 'MRK', 'INTC', 'VZ', 'DOW', 'WBA'
    ],
    weights: null // Price-weighted for Dow
  },
  {
    symbol: 'RUSSELL2K',
    name: 'Russell 2000 Small Cap Index Fund',
    description: 'Tracks 2000 small-cap US companies',
    inceptionDate: new Date('1984-01-01'), // Russell 2000 created in 1984
    expenseRatio: 0.003, // 0.30% annual fee (slightly higher for small caps)
    category: 'Small Cap',
    constituents: [
      // Small cap representation - using smaller/mid companies from our data
      'WYNN', 'MGM', 'LVS', 'MAR', 'HLT', 'RCL', 'CCL', 'NCLH', 'HSY', 'K',
      'CPB', 'GIS', 'CAG', 'SJM', 'MKC', 'KMB', 'CLX', 'CHD', 'SWK', 'WHR',
      'NWL', 'TAP', 'STZ', 'BF.B', 'TSN', 'HRL', 'LW', 'LANC', 'JJSF'
    ],
    weights: null
  },
  {
    symbol: 'ENERGY100',
    name: 'Energy Sector Index Fund',
    description: 'Concentrated exposure to energy and oil companies',
    inceptionDate: new Date('1980-01-01'),
    expenseRatio: 0.004, // 0.40% annual fee (sector-specific)
    category: 'Energy Sector',
    constituents: [
      'XOM', 'CVX', 'COP', 'SLB', 'EOG', 'PXD', 'MPC', 'PSX', 'VLO', 'OXY',
      'HAL', 'BKR', 'WMB', 'KMI', 'HES', 'DVN', 'FANG', 'MRO', 'APA'
    ],
    weights: null
  },
  {
    symbol: 'TECH100',
    name: 'Technology Sector Index Fund',
    description: 'Pure technology sector exposure',
    inceptionDate: new Date('1990-01-01'),
    expenseRatio: 0.003, // 0.30% annual fee
    category: 'Technology Sector',
    constituents: [
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'AVGO', 'CSCO', 'ORCL',
      'ACN', 'ADBE', 'CRM', 'INTC', 'AMD', 'QCOM', 'TXN', 'IBM', 'NOW', 'INTU',
      'AMAT', 'MU', 'ADI', 'LRCX', 'KLAC', 'SNPS', 'CDNS', 'MCHP', 'NXPI'
    ],
    weights: null
  },
  {
    symbol: 'FINANCE50',
    name: 'Financial Services Index Fund',
    description: 'Banks, insurance, and financial services',
    inceptionDate: new Date('1975-01-01'),
    expenseRatio: 0.0025, // 0.25% annual fee
    category: 'Financial Sector',
    constituents: [
      'JPM', 'BAC', 'WFC', 'C', 'GS', 'MS', 'BLK', 'AXP', 'SCHW', 'USB',
      'PNC', 'TFC', 'BK', 'STT', 'FITB', 'RF', 'CFG', 'KEY', 'HBAN', 'CMA',
      'AIG', 'MET', 'PRU', 'ALL', 'TRV', 'PGR', 'AFL', 'HIG', 'CINF'
    ],
    weights: null
  },
  {
    symbol: 'HEALTH100',
    name: 'Healthcare Index Fund',
    description: 'Pharmaceuticals, biotech, and healthcare providers',
    inceptionDate: new Date('1982-01-01'),
    expenseRatio: 0.0035, // 0.35% annual fee
    category: 'Healthcare Sector',
    constituents: [
      'JNJ', 'UNH', 'PFE', 'ABBV', 'MRK', 'TMO', 'ABT', 'LLY', 'BMY', 'AMGN',
      'GILD', 'CVS', 'MDT', 'ISRG', 'CI', 'REGN', 'VRTX', 'HUM', 'ZTS', 'ELV',
      'DHR', 'BSX', 'SYK', 'BDX', 'A', 'EW', 'IDXX', 'RMD', 'MTD', 'ALGN'
    ],
    weights: null
  }
];

// Calculate index fund price based on constituent stocks
function calculateIndexPrice(fund, currentTime, timeMultiplier, isPaused) {
  const stocks = require('./stocks');
  let totalValue = 0;
  let validStocks = 0;
  
  for (const symbol of fund.constituents) {
    const stockData = stocks.getStockPrice(symbol, currentTime, timeMultiplier, isPaused);
    if (stockData && stockData.price > 0) {
      totalValue += stockData.price;
      validStocks++;
    }
  }
  
  if (validStocks === 0) return null;
  
  // Simple average for now (could be weighted by market cap)
  const averagePrice = totalValue / validStocks;
  
  // Normalize to a reasonable fund price (divide by 10 for typical fund pricing)
  return averagePrice / 10;
}

// Calculate percentage change for an index fund from previous day
function calculatePercentageChange(fund, currentTime, timeMultiplier, isPaused) {
  const price = calculateIndexPrice(fund, currentTime, timeMultiplier, isPaused);
  if (!price) return 0;
  
  // Calculate previous day's price for change percentage
  const previousDay = new Date(currentTime.getTime() - (24 * 60 * 60 * 1000));
  const previousPrice = calculateIndexPrice(fund, previousDay, timeMultiplier, isPaused);
  
  // Calculate percentage change
  if (previousPrice && previousPrice > 0) {
    return ((price - previousPrice) / previousPrice) * 100;
  }
  
  return 0;
}

// Get all available index funds at a given time
function getAvailableIndexFunds(currentTime, timeMultiplier, isPaused) {
  return indexFunds
    .filter(fund => currentTime >= fund.inceptionDate)
    .map(fund => {
      const price = calculateIndexPrice(fund, currentTime, timeMultiplier, isPaused);
      if (!price) return null;
      
      const change = calculatePercentageChange(fund, currentTime, timeMultiplier, isPaused);
      
      return {
        symbol: fund.symbol,
        name: fund.name,
        description: fund.description,
        price: price,
        change: change,
        category: fund.category,
        expenseRatio: fund.expenseRatio,
        inceptionDate: fund.inceptionDate,
        numConstituents: fund.constituents.length
      };
    })
    .filter(fund => fund !== null);
}

// Get specific index fund details
function getIndexFundDetails(symbol, currentTime, timeMultiplier, isPaused) {
  const fund = indexFunds.find(f => f.symbol === symbol);
  if (!fund || currentTime < fund.inceptionDate) {
    return null;
  }
  
  const price = calculateIndexPrice(fund, currentTime, timeMultiplier, isPaused);
  if (!price) return null;
  
  const change = calculatePercentageChange(fund, currentTime, timeMultiplier, isPaused);
  
  // Get constituent details
  const constituentsWithPrices = fund.constituents
    .map(sym => {
      const stockData = stocks.getStockPrice(sym, currentTime, timeMultiplier, isPaused);
      return stockData ? {
        symbol: sym,
        price: stockData.price,
        change: stockData.change
      } : null;
    })
    .filter(c => c !== null);
  
  return {
    symbol: fund.symbol,
    name: fund.name,
    description: fund.description,
    price: price,
    change: change,
    category: fund.category,
    expenseRatio: fund.expenseRatio,
    inceptionDate: fund.inceptionDate,
    constituents: constituentsWithPrices,
    numConstituents: constituentsWithPrices.length
  };
}

// Get historical prices for an index fund
function getIndexFundHistory(symbol, currentTime, days = 30, timeMultiplier, isPaused) {
  const fund = indexFunds.find(f => f.symbol === symbol);
  if (!fund) return [];
  
  const history = [];
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(currentTime.getTime() - (i * 24 * 60 * 60 * 1000));
    
    // Skip if before inception
    if (date < fund.inceptionDate) continue;
    
    // Always use false for historical data to get real prices
    const price = calculateIndexPrice(fund, date, timeMultiplier, false);
    if (price) {
      history.push({
        date: date.toISOString(),
        price: price
      });
    }
  }
  
  return history;
}

// Calculate expense ratio charge (annual fee divided by days)
// Note: This function is deprecated - expense ratio should be calculated in server.js using game time
function calculateExpenseRatioFee(fund, shares, daysHeld, gameTime, timeMultiplier, isPaused) {
  const annualFee = fund.expenseRatio;
  const dailyFeeRate = annualFee / 365;
  
  // Fee is calculated on the share value at game time
  const currentPrice = calculateIndexPrice(fund, gameTime || new Date(), timeMultiplier, isPaused);
  if (!currentPrice) return 0;
  
  const positionValue = shares * currentPrice;
  const fee = positionValue * dailyFeeRate * daysHeld;
  
  return fee;
}

module.exports = {
  indexFunds,
  getAvailableIndexFunds,
  getIndexFundDetails,
  getIndexFundHistory,
  calculateIndexPrice,
  calculateExpenseRatioFee
};
