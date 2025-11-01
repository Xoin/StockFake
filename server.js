const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Load database module
const dbModule = require('./database');

// Initialize database
dbModule.initializeDatabase();

// Load data modules
const stocks = require('./data/stocks');
const emailGenerator = require('./data/emails');
const companies = require('./data/companies');
const loanCompanies = require('./data/loan-companies');
const tradeHalts = require('./data/trade-halts');
const shareAvailability = require('./data/share-availability');
const indexFunds = require('./data/index-funds');

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public', 'views'));

// Middleware
app.use(express.json());

// Middleware to handle legacy .html URLs (must be before static middleware)
// Whitelist of known pages to prevent open redirects
const validPages = new Set([
  '/index', '/bank', '/trading', '/news', '/email', '/graphs', 
  '/loans', '/taxes', '/cheat', '/indexfunds', '/indexfund', '/company', '/pendingorders'
]);

app.use((req, res, next) => {
  if (req.path.endsWith('.html')) {
    const newPath = req.path.replace('.html', '');
    // Only redirect if the path (without .html) is in our whitelist or starts with /company/
    if (validPages.has(newPath) || newPath.startsWith('/company/')) {
      return res.redirect(301, newPath);
    }
  }
  next();
});

app.use(express.static('public'));

// Load game state from database
const savedGameState = dbModule.getGameState.get();
let gameTime = savedGameState ? new Date(savedGameState.game_time) : new Date('1970-01-01T09:30:00');
let isPaused = savedGameState ? Boolean(savedGameState.is_paused) : true;
let timeMultiplier = savedGameState ? savedGameState.time_multiplier : 3600;

// Log loaded state
console.log(`Loaded game state from database:`);
console.log(`  Game time: ${gameTime.toISOString()}`);
console.log(`  Is paused: ${isPaused}`);
console.log(`  Time multiplier: ${timeMultiplier}`);

// Save game state to database periodically (every 5 seconds)
function saveGameState() {
  try {
    const savedState = dbModule.getGameState.get();
    if (!savedState) {
      console.error('Could not retrieve game state from database for saving');
      return;
    }
    dbModule.updateGameState.run(
      gameTime.toISOString(),
      isPaused ? 1 : 0,
      timeMultiplier,
      savedState.last_dividend_quarter,
      savedState.last_monthly_fee_check,
      savedState.last_inflation_check,
      savedState.cumulative_inflation
    );
  } catch (error) {
    console.error('Error saving game state:', error);
  }
}

// Save state every 5 seconds
setInterval(saveGameState, 5000);

// Save state on process exit
process.on('SIGINT', () => {
  console.log('\nSaving game state before exit...');
  saveGameState();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nSaving game state before termination...');
  saveGameState();
  process.exit(0);
});

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

// Track last market state to detect transitions
let wasMarketOpen = isMarketOpen(gameTime);

// Process pending orders when market opens
function processPendingOrders() {
  const pendingOrders = dbModule.getPendingOrders.all('pending');
  
  if (pendingOrders.length === 0) return;
  
  console.log(`Processing ${pendingOrders.length} pending orders...`);
  
  for (const order of pendingOrders) {
    try {
      let success = false;
      let executionPrice = null;
      let errorMessage = null;
      
      if (order.order_type === 'stock') {
        const stockPrice = stocks.getStockPrice(order.symbol, gameTime, timeMultiplier, isPaused);
        if (!stockPrice) {
          errorMessage = 'Stock not found or not available';
        } else {
          executionPrice = stockPrice.price;
          // Execute the order using the same logic as the trade endpoint
          // We'll need to pass the order details to a helper function
          const result = executeStockOrder(order.symbol, order.action, order.shares, stockPrice);
          success = result.success;
          errorMessage = result.error;
        }
      } else if (order.order_type === 'indexfund') {
        const fund = indexFunds.indexFunds.find(f => f.symbol === order.symbol);
        if (!fund) {
          errorMessage = 'Index fund not found';
        } else {
          const fundPrice = indexFunds.calculateIndexPrice(fund, gameTime, timeMultiplier, isPaused);
          if (!fundPrice) {
            errorMessage = 'Unable to calculate fund price';
          } else {
            executionPrice = fundPrice;
            const result = executeIndexFundOrder(order.symbol, order.action, order.shares, fundPrice, fund);
            success = result.success;
            errorMessage = result.error;
          }
        }
      }
      
      // Update the order status
      if (success) {
        dbModule.updatePendingOrderStatus.run(
          'executed',
          gameTime.toISOString(),
          executionPrice,
          null,
          order.id
        );
        console.log(`✓ Executed pending order #${order.id}: ${order.action} ${order.shares} ${order.symbol} at $${executionPrice}`);
      } else {
        dbModule.updatePendingOrderStatus.run(
          'failed',
          gameTime.toISOString(),
          null,
          errorMessage,
          order.id
        );
        console.log(`✗ Failed to execute pending order #${order.id}: ${errorMessage}`);
      }
    } catch (error) {
      console.error(`Error processing pending order #${order.id}:`, error);
      dbModule.updatePendingOrderStatus.run(
        'failed',
        gameTime.toISOString(),
        null,
        error.message,
        order.id
      );
    }
  }
}

// Time simulation
setInterval(() => {
  if (!isPaused) {
    const oldTime = new Date(gameTime.getTime());
    const newTime = new Date(gameTime.getTime() + (timeMultiplier * 1000));
    
    // If market is currently closed and we're using fast speed (1s = 1day)
    // Check if we would skip over market open hours
    if (!isMarketOpen(gameTime) && timeMultiplier >= 86400) {
      // Advance time in smaller increments to avoid skipping market hours
      let checkTime = new Date(gameTime.getTime());
      const increment = 3600 * 1000; // 1 hour increments
      const maxAdvance = timeMultiplier * 1000;
      let totalAdvanced = 0;
      
      while (totalAdvanced < maxAdvance && !isMarketOpen(checkTime)) {
        checkTime = new Date(checkTime.getTime() + increment);
        totalAdvanced += increment;
        
        // Stop if we hit market open time
        if (isMarketOpen(checkTime)) {
          gameTime = checkTime;
          return;
        }
      }
      
      // If we still haven't found market open, use the calculated time
      if (totalAdvanced >= maxAdvance) {
        gameTime = newTime;
      }
      return;
    }
    
    gameTime = newTime;
    
    // Check if market just opened (transition from closed to open)
    const isMarketCurrentlyOpen = isMarketOpen(gameTime);
    if (!wasMarketOpen && isMarketCurrentlyOpen) {
      console.log(`Market just opened at ${gameTime.toISOString()}. Processing pending orders...`);
      processPendingOrders();
    }
    wasMarketOpen = isMarketCurrentlyOpen;
  }
}, 1000);

// API Routes
app.get('/api/time', (req, res) => {
  const haltStatus = tradeHalts.getCurrentOrUpcomingHalt(gameTime);
  res.json({
    currentTime: gameTime,
    isMarketOpen: isMarketOpen(gameTime),
    isPaused,
    timeMultiplier,
    tradeHalt: haltStatus
  });
});

app.post('/api/time/pause', (req, res) => {
  isPaused = !isPaused;
  saveGameState(); // Save state when pause changes
  res.json({ isPaused });
});

app.post('/api/time/speed', (req, res) => {
  const { multiplier } = req.body;
  // Validate multiplier is a positive number within reasonable bounds
  // Allow up to 2592000 (30 days) for monthly speed
  if (multiplier && typeof multiplier === 'number' && multiplier > 0 && multiplier <= 2592000) {
    timeMultiplier = multiplier;
    saveGameState(); // Save state when speed changes
  }
  res.json({ timeMultiplier });
});

// Routes for different websites
app.get('/bank', (req, res) => {
  res.render('bank');
});

app.get('/news', (req, res) => {
  res.render('news');
});

app.get('/email', (req, res) => {
  res.render('email');
});

app.get('/trading', (req, res) => {
  res.render('trading');
});

app.get('/graphs', (req, res) => {
  res.render('graphs');
});

app.get('/loans', (req, res) => {
  res.render('loans');
});

app.get('/taxes', (req, res) => {
  res.render('taxes');
});

app.get('/company/:symbol', (req, res) => {
  res.render('company');
});

app.get('/indexfund', (req, res) => {
  res.render('indexfund');
});

app.get('/indexfunds', (req, res) => {
  res.render('indexfunds');
});

app.get('/cheat', (req, res) => {
  res.render('cheat');
});

app.get('/pendingorders', (req, res) => {
  res.render('pendingorders');
});

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/api/stocks', (req, res) => {
  const stockData = stocks.getStockData(gameTime, timeMultiplier, isPaused);
  
  // Add share availability info to each stock
  const stocksWithAvailability = stockData.map(stock => {
    const availability = shareAvailability.getAvailableShares(stock.symbol);
    return {
      ...stock,
      sharesAvailable: availability ? availability.availableForTrading : 0,
      ownershipPercent: availability ? shareAvailability.getOwnershipPercentage(stock.symbol) : 0
    };
  });
  
  res.json(stocksWithAvailability);
});

app.get('/api/stocks/:symbol', (req, res) => {
  const { symbol } = req.params;
  const stockPrice = stocks.getStockPrice(symbol, gameTime, timeMultiplier, isPaused);
  
  if (!stockPrice) {
    return res.status(404).json({ error: 'Stock not found' });
  }
  
  // Add share availability info
  const availability = shareAvailability.getAvailableShares(symbol);
  const result = {
    ...stockPrice,
    sharesAvailable: availability ? availability.availableForTrading : 0,
    ownershipPercent: availability ? shareAvailability.getOwnershipPercentage(symbol) : 0,
    publicFloat: availability ? availability.publicFloat : 0,
    totalOutstanding: availability ? availability.totalOutstanding : 0
  };
  
  res.json(result);
});

// Helper function to add hourly sampling when insufficient data
function addHourlySamplingIfNeeded(history, daysToFetch, dataFetcher) {
  if (history.length < 3 && daysToFetch <= 7) {
    history.length = 0; // Clear and rebuild with hourly data
    const hoursToFetch = Math.min(daysToFetch * 24, 168); // Max 7 days of hourly data
    for (let i = hoursToFetch; i >= 0; i -= 1) {
      const date = new Date(gameTime.getTime() - (i * 60 * 60 * 1000));
      const data = dataFetcher(date);
      if (data) {
        history.push(data);
      }
    }
  }
}

// Constants for historical data fetching
const BYPASS_CACHE_FOR_HISTORICAL = true; // Always bypass cache for historical chart data

// Stock history API for charts
app.get('/api/stocks/:symbol/history', (req, res) => {
  const { symbol } = req.params;
  const { days } = req.query;
  
  const daysToFetch = parseInt(days) || 30;
  const history = [];
  
  // Determine sampling interval based on time period
  // For longer periods, sample less frequently to reduce data points
  let sampleInterval = 1; // days
  if (daysToFetch > 365) {
    sampleInterval = 7; // Weekly for > 1 year
  } else if (daysToFetch > 180) {
    sampleInterval = 3; // Every 3 days for > 6 months
  } else if (daysToFetch > 90) {
    sampleInterval = 2; // Every 2 days for > 3 months
  }
  
  // Get historical prices for the specified number of days
  for (let i = daysToFetch; i >= 0; i -= sampleInterval) {
    const date = new Date(gameTime.getTime() - (i * 24 * 60 * 60 * 1000));
    const price = stocks.getStockPrice(symbol, date, timeMultiplier, false, BYPASS_CACHE_FOR_HISTORICAL);
    if (price) {
      history.push({
        date: date.toISOString(),
        price: price.price
      });
    }
  }
  
  // Always include the most recent data point
  if (history.length === 0 || history[history.length - 1].date !== gameTime.toISOString()) {
    const price = stocks.getStockPrice(symbol, gameTime, timeMultiplier, false, BYPASS_CACHE_FOR_HISTORICAL);
    if (price) {
      history.push({
        date: gameTime.toISOString(),
        price: price.price
      });
    }
  }
  
  // If insufficient data, use hourly intervals for recent data
  addHourlySamplingIfNeeded(history, daysToFetch, (date) => {
    const price = stocks.getStockPrice(symbol, date, timeMultiplier, false, BYPASS_CACHE_FOR_HISTORICAL);
    return price ? { date: date.toISOString(), price: price.price } : null;
  });
  
  res.json(history);
});

// Market index API for market overview charts
app.get('/api/market/index', (req, res) => {
  const { days } = req.query;
  const daysToFetch = parseInt(days) || 30;
  const history = [];
  
  // Determine sampling interval based on time period
  let sampleInterval = 1; // days
  if (daysToFetch > 365) {
    sampleInterval = 7; // Weekly for > 1 year
  } else if (daysToFetch > 180) {
    sampleInterval = 3; // Every 3 days for > 6 months
  } else if (daysToFetch > 90) {
    sampleInterval = 2; // Every 2 days for > 3 months
  }
  
  // Calculate simple market index based on average of all stocks
  for (let i = daysToFetch; i >= 0; i -= sampleInterval) {
    const date = new Date(gameTime.getTime() - (i * 24 * 60 * 60 * 1000));
    const allStocks = stocks.getStockData(date, timeMultiplier, false, BYPASS_CACHE_FOR_HISTORICAL);
    
    if (allStocks.length > 0) {
      const avgPrice = allStocks.reduce((sum, s) => sum + s.price, 0) / allStocks.length;
      history.push({
        date: date.toISOString(),
        value: avgPrice,
        count: allStocks.length
      });
    }
  }
  
  // Always include the most recent data point
  if (history.length === 0 || history[history.length - 1].date !== gameTime.toISOString()) {
    const allStocks = stocks.getStockData(gameTime, timeMultiplier, false, BYPASS_CACHE_FOR_HISTORICAL);
    if (allStocks.length > 0) {
      const avgPrice = allStocks.reduce((sum, s) => sum + s.price, 0) / allStocks.length;
      history.push({
        date: gameTime.toISOString(),
        value: avgPrice,
        count: allStocks.length
      });
    }
  }
  
  // If insufficient data, use hourly intervals for recent data
  addHourlySamplingIfNeeded(history, daysToFetch, (date) => {
    const allStocks = stocks.getStockData(date, timeMultiplier, false, BYPASS_CACHE_FOR_HISTORICAL);
    if (allStocks.length > 0) {
      const avgPrice = allStocks.reduce((sum, s) => sum + s.price, 0) / allStocks.length;
      return {
        date: date.toISOString(),
        value: avgPrice,
        count: allStocks.length
      };
    }
    return null;
  });
  
  res.json(history);
});

// Company information API
app.get('/api/companies/:symbol', (req, res) => {
  const { symbol } = req.params;
  const companyInfo = companies.getCompanyInfoAtTime(symbol, gameTime);
  
  if (!companyInfo) {
    return res.status(404).json({ error: 'Company not found' });
  }
  
  res.json(companyInfo);
});

app.get('/api/companies', (req, res) => {
  const allCompanies = companies.getAllCompanies();
  const companiesInfo = allCompanies.map(symbol => ({
    symbol,
    info: companies.getCompanyInfoAtTime(symbol, gameTime)
  })).filter(c => c.info && c.info.isAvailable);
  
  res.json(companiesInfo);
});

// News API
const news = require('./data/news');
app.get('/api/news', (req, res) => {
  res.json(news.getNews(gameTime));
});

// User account (single global account for this single-player game)
// In a multi-user environment, this would need to be per-session
let userAccount = {
  cash: 10000,
  portfolio: {},
  indexFundHoldings: {}, // Track index fund shares: {symbol: {shares, purchaseHistory}}
  shortPositions: {}, // Track short positions (symbol: {shares, borrowPrice, borrowDate})
  purchaseHistory: {}, // Track purchase prices for tax calculation
  transactions: [], // History of all transactions
  dividends: [], // History of dividend payments
  taxes: [], // History of tax payments
  fees: [], // History of fees charged
  lastTradeTime: {}, // Track last trade time per symbol for cooldown
  shareholderInfluence: {}, // Track voting power by company
  creditScore: 750, // Starting credit score (fair)
  loans: [], // Active loans: { id, companyId, principal, balance, interestRate, startDate, dueDate, lastPaymentDate, missedPayments, status }
  loanHistory: [], // History of all loan activities
  lastNegativeBalanceCheck: null, // Track last negative balance check
  daysWithNegativeBalance: 0, // Track consecutive days with negative balance
  marginAccount: {
    marginBalance: 0, // Amount borrowed on margin
    marginInterestRate: 0.08, // 8% annual interest on margin (historical rates varied)
    lastMarginInterestDate: null, // Track last time interest was charged
    marginCalls: [], // History of margin calls
    hasMarginEnabled: false // Whether margin trading is enabled
  },
  riskControls: {
    maxLeverage: 2.0, // Maximum leverage ratio (2:1 = 50% margin)
    maxPositionSize: 0.30, // Max 30% of portfolio in single stock
    maintenanceMarginRatio: 0.30, // Minimum 30% equity ratio to avoid margin call
    concentrationWarningThreshold: 0.20 // Warn at 20% concentration
  }
};

// Trading restrictions
const TRADE_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes cooldown between trades for same stock

// Margin trading constants
const INITIAL_MARGIN_REQUIREMENT = 0.50; // 50% initial margin (post-1974 regulation)
const INITIAL_MARGIN_REQUIREMENT_1970 = 0.70; // 70% initial margin in early 1970s
const MAINTENANCE_MARGIN_REQUIREMENT = 0.30; // 30% maintenance margin (25% is typical, using 30% for safety)
const MARGIN_CALL_GRACE_PERIOD_DAYS = 5; // Days to meet margin call before forced liquidation
const MARGIN_INTEREST_RATE_BASE = 0.08; // 8% annual base rate on margin loans

// Dividend processing constant
const MAX_DIVIDEND_QUARTERS_TO_PROCESS = 40; // Safety limit: maximum quarters to process when catching up (prevents processing too many at once)

// Tax rates
const SHORT_TERM_TAX_RATE = 0.30; // 30% for holdings < 1 year
const LONG_TERM_TAX_RATE = 0.15; // 15% for holdings >= 1 year
const DIVIDEND_TAX_RATE = 0.15; // 15% on dividends
const WEALTH_TAX_RATE = 0.01; // 1% annual wealth tax on total net worth
const WEALTH_TAX_THRESHOLD = 50000; // Only apply wealth tax if net worth exceeds this amount

// Fee structure
const TRADING_FEE_FLAT = 9.99; // Flat fee per trade in 1970s, will decrease over time
const TRADING_FEE_PERCENTAGE = 0.001; // 0.1% of trade value
const MONTHLY_ACCOUNT_FEE = 5.00; // Monthly maintenance fee (starts in 1990s)
const MINIMUM_BALANCE = 1000; // Minimum balance to avoid fees (starts in 1990s)
const SHORT_BORROW_FEE_ANNUAL = 0.05; // 5% annual fee to borrow shares for shorting

// Inflation tracking (CPI-based, annual rate)
const inflationRates = {
  1970: 5.9, 1971: 4.3, 1972: 3.3, 1973: 6.2, 1974: 11.1, 1975: 9.1, 1976: 5.8,
  1977: 6.5, 1978: 7.6, 1979: 11.3, 1980: 13.5, 1981: 10.3, 1982: 6.2, 1983: 3.2,
  1984: 4.3, 1985: 3.6, 1986: 1.9, 1987: 3.6, 1988: 4.1, 1989: 4.8, 1990: 5.4,
  1991: 4.2, 1992: 3.0, 1993: 3.0, 1994: 2.6, 1995: 2.8, 1996: 3.0, 1997: 2.3,
  1998: 1.6, 1999: 2.2, 2000: 3.4, 2001: 2.8, 2002: 1.6, 2003: 2.3, 2004: 2.7,
  2005: 3.4, 2006: 3.2, 2007: 2.8, 2008: 3.8, 2009: -0.4, 2010: 1.6, 2011: 3.2,
  2012: 2.1, 2013: 1.5, 2014: 1.6, 2015: 0.1, 2016: 1.3, 2017: 2.1, 2018: 2.4,
  2019: 1.8, 2020: 1.2, 2021: 4.7, 2022: 8.0, 2023: 4.1, 2024: 2.9
};

let lastMonthlyFeeCheck = null;
let lastInflationCheck = null;
let lastWealthTaxCheck = null;
let cumulativeInflation = 1.0; // Tracks purchasing power relative to 1970

// Dividend data (quarterly payouts per share)
// Companies with consistent dividend history
const dividendRates = {
  // Technology (many tech companies don't pay dividends or started recently)
  'IBM': 0.50, 'AAPL': 0.25, 'MSFT': 0.30, 'INTC': 0.35, 'ORCL': 0.20,
  'TXN': 0.28, 'QCOM': 0.30, 'CSCO': 0.38, 'HPQ': 0.25,
  
  // Energy (typically strong dividend payers)
  'XOM': 0.45, 'CVX': 0.50, 'BP': 0.40, 'RDS': 0.42, 'TOT': 0.38,
  'COP': 0.35, 'SLB': 0.25, 'OXY': 0.30,
  
  // Industrials
  'GE': 0.35, 'BA': 0.52, 'CAT': 0.48, 'MMM': 0.60, 'HON': 0.42,
  'LMT': 0.65, 'UTX': 0.45, 'DE': 0.40, 'EMR': 0.50,
  
  // Automotive
  'GM': 0.38, 'F': 0.35, 'TM': 0.42, 'HMC': 0.35,
  
  // Healthcare & Pharmaceuticals
  'JNJ': 0.55, 'PFE': 0.40, 'MRK': 0.45, 'LLY': 0.42, 'BMY': 0.50,
  'AMGN': 0.48, 'GILD': 0.35, 'UNH': 0.30, 'CVS': 0.25, 'ABT': 0.45,
  'MDT': 0.38, 'TMO': 0.15, 'ABBV': 0.65,
  
  // Financial Services (major dividend payers)
  'JPM': 0.45, 'BAC': 0.40, 'WFC': 0.42, 'C': 0.38, 'GS': 0.50,
  'MS': 0.45, 'AXP': 0.40, 'BLK': 0.52, 'SCHW': 0.25, 'USB': 0.42,
  'PNC': 0.48, 'TFC': 0.45,
  
  // Insurance
  'BRK.B': 0, 'AIG': 0.35, 'MET': 0.48, 'PRU': 0.52, 'ALL': 0.50,
  'TRV': 0.55, 'PGR': 0.30,
  
  // Retail
  'WMT': 0.55, 'HD': 0.50, 'LOW': 0.48, 'TGT': 0.45, 'COST': 0.35,
  'KR': 0.30,
  
  // Consumer Goods (strong dividend history)
  'PG': 0.60, 'KO': 0.42, 'PEP': 0.45, 'PM': 0.65, 'MO': 0.70,
  'CL': 0.48, 'KMB': 0.52, 'GIS': 0.50, 'K': 0.48, 'CPB': 0.45,
  'HSY': 0.42, 'MCD': 0.52, 'SBUX': 0.25, 'NKE': 0.28,
  
  // Telecom (high dividends)
  'T': 0.52, 'VZ': 0.55, 'TMUS': 0, 'CTL': 0.25,
  
  // Media & Entertainment
  'DIS': 0, 'CMCSA': 0.38, 'TWX': 0.40, 'FOXA': 0.35, 'VIAB': 0.42,
  
  // Chemicals & Materials
  'DOW': 0.45, 'DD': 0.42, 'ECL': 0.35, 'APD': 0.52, 'PPG': 0.48,
  'NEM': 0.30, 'FCX': 0.25,
  
  // Utilities (highest dividend payers)
  'NEE': 0.55, 'DUK': 0.58, 'SO': 0.60, 'D': 0.52, 'EXC': 0.48,
  'AEP': 0.55,
  
  // Transportation
  'UPS': 0.52, 'FDX': 0.30, 'UNP': 0.48, 'NSC': 0.50, 'CSX': 0.45,
  
  // Real Estate (REITs typically pay high dividends)
  'AMT': 0.60, 'PLD': 0.55, 'CCI': 0.62, 'SPG': 0.70,
  
  // Other major dividend payers
  'ADM': 0.45, 'BG': 0.40, 'TSN': 0.38, 'CLX': 0.50, 'EL': 0.30,
  'IP': 0.40, 'WY': 0.45, 'NUE': 0.42, 'AA': 0.35
};

// Track last dividend payout
let lastDividendQuarter = null;

// Check and pay dividends (quarterly)
function checkAndPayDividends() {
  const currentDate = new Date(gameTime);
  const currentQuarter = Math.floor(currentDate.getMonth() / 3);
  const currentYear = currentDate.getFullYear();
  const quarterKey = `${currentYear}-Q${currentQuarter + 1}`;
  
  // Handle potential skipped quarters when time advances rapidly
  if (lastDividendQuarter !== quarterKey) {
    // Parse the last quarter processed
    let quartersToProcess = [];
    
    if (lastDividendQuarter) {
      const lastMatch = lastDividendQuarter.match(/^(\d+)-Q(\d)$/);
      if (lastMatch) {
        const lastYear = parseInt(lastMatch[1]);
        const lastQ = parseInt(lastMatch[2]);
        
        // Calculate quarters that were skipped
        let checkYear = lastYear;
        let checkQ = lastQ;
        
        while (true) {
          // Advance to next quarter
          checkQ++;
          if (checkQ > 4) {
            checkQ = 1;
            checkYear++;
          }
          
          const checkQuarterKey = `${checkYear}-Q${checkQ}`;
          if (checkQuarterKey === quarterKey) {
            quartersToProcess.push(checkQuarterKey);
            break;
          }
          
          quartersToProcess.push(checkQuarterKey);
          
          // Safety check: don't process more than MAX_DIVIDEND_QUARTERS_TO_PROCESS quarters
          if (quartersToProcess.length > MAX_DIVIDEND_QUARTERS_TO_PROCESS) {
            console.warn(`Too many skipped quarters detected (${quartersToProcess.length}). Only processing current quarter.`);
            quartersToProcess = [quarterKey];
            break;
          }
        }
      } else {
        quartersToProcess = [quarterKey];
      }
    } else {
      // First dividend payment ever
      quartersToProcess = [quarterKey];
    }
    
    // Process all skipped quarters
    for (const qKey of quartersToProcess) {
      let totalDividends = 0;
      const dividendDetails = [];
      
      for (const [symbol, shares] of Object.entries(userAccount.portfolio)) {
        if (shares > 0 && dividendRates[symbol]) {
          const dividend = shares * dividendRates[symbol];
          totalDividends += dividend;
          dividendDetails.push({ symbol, shares, dividend });
        }
      }
      
      if (totalDividends > 0) {
        // Calculate tax on dividends
        const dividendTax = totalDividends * DIVIDEND_TAX_RATE;
        const netDividends = totalDividends - dividendTax;
        
        userAccount.cash += netDividends;
        
        // Record dividend payment
        userAccount.dividends.push({
          date: new Date(gameTime),
          quarter: qKey,
          grossAmount: totalDividends,
          tax: dividendTax,
          netAmount: netDividends,
          details: dividendDetails
        });
        
        // Record tax payment
        if (dividendTax > 0) {
          userAccount.taxes.push({
            date: new Date(gameTime),
            type: 'dividend',
            amount: dividendTax,
            description: `Dividend tax for ${qKey}`
          });
        }
      }
    }
    
    // Update the last processed quarter
    lastDividendQuarter = quarterKey;
  }
}

// Call this periodically
setInterval(checkAndPayDividends, 5000);

// Calculate trading fee based on year (fees decreased over time)
function getTradingFee(tradeValue, currentTime) {
  const year = currentTime.getFullYear();
  let flatFee = TRADING_FEE_FLAT;
  
  // Fees decreased over time due to deregulation and technology
  if (year >= 1975) flatFee = 7.99; // After May Day 1975
  if (year >= 1990) flatFee = 4.99; // Discount brokers emerge
  if (year >= 2000) flatFee = 2.99; // Online trading boom
  if (year >= 2013) flatFee = 0.99; // Low-cost brokers
  if (year >= 2019) flatFee = 0; // Commission-free trading era
  
  const percentageFee = tradeValue * TRADING_FEE_PERCENTAGE;
  return flatFee + percentageFee;
}

// Check and charge monthly account fees
function checkAndChargeMonthlyFee() {
  const currentDate = new Date(gameTime);
  const currentMonth = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;
  
  if (lastMonthlyFeeCheck !== currentMonth) {
    lastMonthlyFeeCheck = currentMonth;
    
    // Monthly fees started in the 1990s
    if (currentDate.getFullYear() >= 1990) {
      // Charge fee if balance is below minimum
      if (userAccount.cash < MINIMUM_BALANCE) {
        userAccount.cash -= MONTHLY_ACCOUNT_FEE;
        
        userAccount.fees.push({
          date: new Date(gameTime),
          type: 'monthly-maintenance',
          amount: MONTHLY_ACCOUNT_FEE,
          description: `Monthly account maintenance fee (balance below $${MINIMUM_BALANCE})`
        });
      }
    }
  }
}

// Track inflation and purchasing power
function trackInflation() {
  const currentYear = gameTime.getFullYear();
  const yearKey = `${currentYear}`;
  
  if (lastInflationCheck !== yearKey && inflationRates[currentYear]) {
    lastInflationCheck = yearKey;
    
    // Update cumulative inflation (compounds)
    const annualInflationRate = inflationRates[currentYear] / 100;
    cumulativeInflation *= (1 + annualInflationRate);
  }
}

// Assess and collect yearly wealth tax
function assessWealthTax() {
  const currentYear = gameTime.getFullYear();
  const yearKey = `${currentYear}`;
  
  // Check once per year on January 1st
  if (lastWealthTaxCheck !== yearKey) {
    lastWealthTaxCheck = yearKey;
    
    // Calculate total net worth (cash + portfolio value - debts)
    const portfolioValue = calculatePortfolioValue();
    const marginDebt = userAccount.marginAccount.marginBalance;
    
    // Calculate total loan debt
    let totalLoanDebt = 0;
    for (const loan of userAccount.loans) {
      if (loan.status === 'active') {
        totalLoanDebt += loan.balance;
      }
    }
    
    const netWorth = userAccount.cash + portfolioValue - marginDebt - totalLoanDebt;
    
    // Only apply wealth tax if net worth exceeds threshold
    if (netWorth > WEALTH_TAX_THRESHOLD) {
      const taxableWealth = netWorth - WEALTH_TAX_THRESHOLD;
      const wealthTax = taxableWealth * WEALTH_TAX_RATE;
      
      // Check if user has sufficient cash to pay wealth tax
      if (userAccount.cash >= wealthTax) {
        // Deduct wealth tax from cash
        userAccount.cash -= wealthTax;
        
        // Record tax payment
        userAccount.taxes.push({
          date: new Date(gameTime),
          type: 'wealth',
          amount: wealthTax,
          description: `Annual wealth tax for ${currentYear} (${(WEALTH_TAX_RATE * 100).toFixed(2)}% on net worth above $${WEALTH_TAX_THRESHOLD.toLocaleString()})`
        });
        
        console.log(`Wealth tax assessed for ${currentYear}: $${wealthTax.toFixed(2)} (Net worth: $${netWorth.toFixed(2)})`);
      } else {
        // User cannot pay - record as unpaid tax (could trigger penalties in future enhancement)
        console.log(`⚠️ Insufficient cash to pay wealth tax for ${currentYear}: $${wealthTax.toFixed(2)} (Cash: $${userAccount.cash.toFixed(2)})`);
        
        // Deduct whatever cash is available
        const partialPayment = userAccount.cash;
        const unpaidAmount = wealthTax - partialPayment;
        
        if (partialPayment > 0) {
          userAccount.cash = 0;
          
          userAccount.taxes.push({
            date: new Date(gameTime),
            type: 'wealth',
            amount: partialPayment,
            description: `Partial wealth tax payment for ${currentYear} (Unpaid: $${unpaidAmount.toFixed(2)})`
          });
        }
        
        // Record unpaid tax as a fee for tracking
        userAccount.fees.push({
          date: new Date(gameTime),
          type: 'unpaid-wealth-tax',
          amount: unpaidAmount,
          description: `Unpaid wealth tax for ${currentYear} - may incur penalties`
        });
      }
    }
  }
}

// Update short positions (charge borrowing fees)
function updateShortPositions() {
  const currentTime = new Date(gameTime);
  
  for (const [symbol, position] of Object.entries(userAccount.shortPositions)) {
    if (position.shares > 0) {
      const borrowDate = new Date(position.borrowDate);
      const daysSinceBorrow = (currentTime - borrowDate) / (1000 * 60 * 60 * 24);
      
      // Charge daily borrowing fee (annual rate / 365)
      const dailyFeeRate = SHORT_BORROW_FEE_ANNUAL / 365;
      const borrowValue = position.shares * position.borrowPrice;
      const dailyFee = borrowValue * dailyFeeRate;
      
      // Only charge if at least a day has passed since last check
      if (daysSinceBorrow >= 1 && (!position.lastFeeDate || 
          (currentTime - new Date(position.lastFeeDate)) >= 1000 * 60 * 60 * 24)) {
        userAccount.cash -= dailyFee;
        position.lastFeeDate = new Date(gameTime);
        
        userAccount.fees.push({
          date: new Date(gameTime),
          type: 'short-borrow',
          amount: dailyFee,
          description: `Daily borrowing fee for ${position.shares} shares of ${symbol}`
        });
      }
    }
  }
}

// Call these periodically
setInterval(checkAndChargeMonthlyFee, 10000);
setInterval(trackInflation, 5000);
setInterval(assessWealthTax, 5000);
setInterval(updateShortPositions, 10000);

// Margin account helper functions

// Get initial margin requirement based on year (regulations changed over time)
function getInitialMarginRequirement(currentTime) {
  const year = currentTime.getFullYear();
  // Regulation T changed in 1974 from 70% to 50%
  if (year < 1974) {
    return INITIAL_MARGIN_REQUIREMENT_1970;
  }
  return INITIAL_MARGIN_REQUIREMENT;
}

// Calculate current portfolio value
function calculatePortfolioValue() {
  let totalValue = 0;
  
  // Add individual stock positions
  for (const [symbol, shares] of Object.entries(userAccount.portfolio)) {
    if (shares > 0) {
      const stockPrice = stocks.getStockPrice(symbol, gameTime, timeMultiplier, isPaused);
      if (stockPrice) {
        totalValue += stockPrice.price * shares;
      }
    }
  }
  
  // Add index fund positions
  for (const [symbol, holding] of Object.entries(userAccount.indexFundHoldings)) {
    if (holding.shares > 0) {
      const fundPrice = indexFunds.calculateIndexPrice(
        indexFunds.indexFunds.find(f => f.symbol === symbol),
        gameTime
      );
      if (fundPrice) {
        totalValue += fundPrice * holding.shares;
      }
    }
  }
  
  return totalValue;
}

// Calculate total account equity (cash + portfolio - margin debt)
function calculateAccountEquity() {
  const portfolioValue = calculatePortfolioValue();
  const totalEquity = userAccount.cash + portfolioValue - userAccount.marginAccount.marginBalance;
  return totalEquity;
}

// Calculate buying power (how much can be purchased with margin)
function calculateBuyingPower() {
  const initialMarginReq = getInitialMarginRequirement(gameTime);
  const portfolioValue = calculatePortfolioValue();
  const equity = calculateAccountEquity();
  
  // Buying power = (cash + portfolio value) / initial margin requirement - current positions
  const maxPositionValue = equity / initialMarginReq;
  const currentPositionValue = portfolioValue;
  const additionalBuyingPower = Math.max(0, maxPositionValue - currentPositionValue);
  
  return {
    buyingPower: additionalBuyingPower,
    maxLeverage: userAccount.riskControls.maxLeverage,
    currentLeverage: equity > 0 ? (portfolioValue / equity) : 0
  };
}

// Calculate margin ratio (equity / portfolio value)
function calculateMarginRatio() {
  const portfolioValue = calculatePortfolioValue();
  if (portfolioValue === 0) return 1.0; // No positions, fully margined
  
  const equity = calculateAccountEquity();
  return equity / portfolioValue;
}

// Check if account is subject to margin call
function checkMarginCall() {
  const marginRatio = calculateMarginRatio();
  const maintenanceMargin = userAccount.riskControls.maintenanceMarginRatio;
  
  if (marginRatio < maintenanceMargin && userAccount.marginAccount.marginBalance > 0) {
    return {
      isMarginCall: true,
      currentRatio: marginRatio,
      requiredRatio: maintenanceMargin,
      equity: calculateAccountEquity(),
      portfolioValue: calculatePortfolioValue(),
      marginDebt: userAccount.marginAccount.marginBalance,
      amountNeeded: (maintenanceMargin * calculatePortfolioValue()) - calculateAccountEquity()
    };
  }
  
  return { isMarginCall: false };
}

// Check position concentration risk
function checkPositionConcentration(symbol) {
  const portfolioValue = calculatePortfolioValue();
  if (portfolioValue === 0) return { concentration: 0, warning: false, limit: false };
  
  const stockPrice = stocks.getStockPrice(symbol, gameTime, timeMultiplier, isPaused);
  if (!stockPrice) return { concentration: 0, warning: false, limit: false };
  
  const shares = userAccount.portfolio[symbol] || 0;
  const positionValue = shares * stockPrice.price;
  const concentration = positionValue / portfolioValue;
  
  return {
    concentration: concentration,
    warning: concentration >= userAccount.riskControls.concentrationWarningThreshold,
    limit: concentration >= userAccount.riskControls.maxPositionSize,
    currentPercent: concentration * 100,
    maxPercent: userAccount.riskControls.maxPositionSize * 100
  };
}

// Process margin interest (charged daily)
function processMarginInterest() {
  if (userAccount.marginAccount.marginBalance <= 0) return;
  
  const currentDate = new Date(gameTime);
  const lastInterestDate = userAccount.marginAccount.lastMarginInterestDate 
    ? new Date(userAccount.marginAccount.lastMarginInterestDate) 
    : currentDate;
  
  const daysSinceLastCharge = (currentDate - lastInterestDate) / (1000 * 60 * 60 * 24);
  
  // Charge interest daily with compound interest
  if (daysSinceLastCharge >= 1) {
    const dailyRate = userAccount.marginAccount.marginInterestRate / 365;
    const balanceBeforeInterest = userAccount.marginAccount.marginBalance;
    
    // Compound interest: P * (1 + r)^t - P
    const interest = balanceBeforeInterest * (Math.pow(1 + dailyRate, daysSinceLastCharge) - 1);
    
    // Add interest to margin balance
    userAccount.marginAccount.marginBalance += interest;
    userAccount.marginAccount.lastMarginInterestDate = new Date(gameTime);
    
    // Record fee
    userAccount.fees.push({
      date: new Date(gameTime),
      type: 'margin-interest',
      amount: interest,
      description: `Margin interest on $${balanceBeforeInterest.toFixed(2)} balance`
    });
  }
}

// Check and issue margin calls
function processMarginCalls() {
  const marginCallStatus = checkMarginCall();
  
  if (marginCallStatus.isMarginCall) {
    // Check if this is a new margin call or existing one
    const activeMarginCall = userAccount.marginAccount.marginCalls.find(
      call => call.status === 'active'
    );
    
    if (!activeMarginCall) {
      // Issue new margin call
      const marginCall = {
        id: userAccount.marginAccount.marginCalls.length + 1,
        issueDate: new Date(gameTime),
        dueDate: new Date(gameTime.getTime() + (MARGIN_CALL_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000)),
        amountNeeded: marginCallStatus.amountNeeded,
        currentRatio: marginCallStatus.currentRatio,
        requiredRatio: marginCallStatus.requiredRatio,
        status: 'active'
      };
      
      userAccount.marginAccount.marginCalls.push(marginCall);
      
      // This would trigger an email notification
      console.log(`MARGIN CALL ISSUED: Need $${marginCallStatus.amountNeeded.toFixed(2)} by ${marginCall.dueDate}`);
    } else {
      // Check if grace period has expired
      const currentDate = new Date(gameTime);
      const dueDate = new Date(activeMarginCall.dueDate);
      
      if (currentDate > dueDate) {
        // Force liquidation - sell positions to meet margin requirements
        activeMarginCall.status = 'liquidated';
        activeMarginCall.liquidationDate = new Date(gameTime);
        
        // Implement forced liquidation
        forceLiquidation();
      }
    }
  } else {
    // Check if there's an active margin call that can be cleared
    const activeMarginCall = userAccount.marginAccount.marginCalls.find(
      call => call.status === 'active'
    );
    
    if (activeMarginCall) {
      activeMarginCall.status = 'met';
      activeMarginCall.metDate = new Date(gameTime);
    }
  }
}

// Force liquidation to meet margin requirements
function forceLiquidation() {
  // Sort positions by size (liquidate largest first)
  const positions = Object.entries(userAccount.portfolio)
    .filter(([symbol, shares]) => shares > 0)
    .map(([symbol, shares]) => {
      const stockPrice = stocks.getStockPrice(symbol, gameTime, timeMultiplier, isPaused);
      return {
        symbol,
        shares,
        price: stockPrice ? stockPrice.price : 0,
        value: stockPrice ? stockPrice.price * shares : 0
      };
    })
    .sort((a, b) => b.value - a.value);
  
  // Liquidate positions until margin requirements are met
  for (const position of positions) {
    const marginCallStatus = checkMarginCall();
    if (!marginCallStatus.isMarginCall) break;
    
    // Sell entire position
    const saleProceeds = position.value;
    const tradingFee = getTradingFee(saleProceeds, gameTime);
    const netProceeds = saleProceeds - tradingFee;
    
    // Update account
    userAccount.cash += netProceeds;
    delete userAccount.portfolio[position.symbol];
    
    // Record forced sale transaction
    userAccount.transactions.push({
      date: new Date(gameTime),
      type: 'forced-liquidation',
      symbol: position.symbol,
      shares: position.shares,
      pricePerShare: position.price,
      tradingFee: tradingFee,
      netProceeds: netProceeds
    });
    
    console.log(`FORCED LIQUIDATION: Sold ${position.shares} shares of ${position.symbol} for $${netProceeds.toFixed(2)}`);
  }
}

// Call these periodically
setInterval(processMarginInterest, 10000);
setInterval(processMarginCalls, 10000);

// Loan processing functions
let loanIdCounter = 1;

// Process loan interest accrual and check for missed payments
function processLoans() {
  const currentDate = new Date(gameTime);
  
  for (const loan of userAccount.loans) {
    if (loan.status !== 'active') continue;
    
    const company = loanCompanies.getCompany(loan.companyId);
    if (!company) continue;
    
    // Calculate days since last payment
    const lastPayment = loan.lastPaymentDate ? new Date(loan.lastPaymentDate) : new Date(loan.startDate);
    const daysSinceLastPayment = (currentDate - lastPayment) / (1000 * 60 * 60 * 24);
    
    // Accrue interest daily
    if (daysSinceLastPayment >= 1) {
      const dailyRate = loan.interestRate / 365;
      const interest = loan.balance * dailyRate * daysSinceLastPayment;
      loan.balance += interest;
      loan.lastInterestAccrual = new Date(gameTime);
    }
    
    // Check if payment is overdue (30 days grace period)
    const dueDate = new Date(loan.dueDate);
    if (currentDate > dueDate) {
      const daysOverdue = (currentDate - dueDate) / (1000 * 60 * 60 * 24);
      
      // After 30 days, mark as missed payment
      if (daysOverdue > 30 && !loan.markedAsMissed) {
        loan.missedPayments += 1;
        loan.markedAsMissed = true;
        
        // Apply late payment penalty
        const penalty = loan.balance * company.latePaymentPenalty;
        loan.balance += penalty;
        
        // Decrease credit score
        userAccount.creditScore = Math.max(300, userAccount.creditScore + company.creditScoreImpact.late);
        
        // Record fee
        userAccount.fees.push({
          date: new Date(gameTime),
          type: 'loan-late-payment',
          amount: penalty,
          description: `Late payment penalty for loan #${loan.id} from ${company.name}`
        });
        
        userAccount.loanHistory.push({
          date: new Date(gameTime),
          type: 'missed-payment',
          loanId: loan.id,
          companyId: loan.companyId,
          penalty: penalty,
          creditScoreChange: company.creditScoreImpact.late
        });
        
        // After 3 missed payments, loan goes to default
        if (loan.missedPayments >= 3) {
          loan.status = 'default';
          userAccount.creditScore = Math.max(300, userAccount.creditScore + company.creditScoreImpact.default);
          
          userAccount.loanHistory.push({
            date: new Date(gameTime),
            type: 'default',
            loanId: loan.id,
            companyId: loan.companyId,
            remainingBalance: loan.balance,
            creditScoreChange: company.creditScoreImpact.default
          });
        }
      }
    }
  }
}

// Call this periodically
setInterval(processLoans, 10000);

// Process negative balance penalties
function processNegativeBalance() {
  if (userAccount.cash >= 0) {
    // Reset counter when balance becomes positive
    if (userAccount.daysWithNegativeBalance > 0) {
      userAccount.daysWithNegativeBalance = 0;
    }
    return; // No action needed if balance is positive
  }
  
  const negativeAmount = Math.abs(userAccount.cash);
  const lastCheck = userAccount.lastNegativeBalanceCheck || new Date('1970-01-01');
  const daysSinceLastCheck = (gameTime.getTime() - new Date(lastCheck).getTime()) / (1000 * 60 * 60 * 24);
  
  // Only process once per day
  if (daysSinceLastCheck < 1) return;
  
  userAccount.lastNegativeBalanceCheck = gameTime.toISOString();
  
  // Apply credit score penalty for negative balance (daily)
  if (userAccount.creditScore > 300) {
    const penalty = Math.min(5, Math.floor(negativeAmount / 1000)); // Lose 5 points per $1000 negative, max 5 per day
    userAccount.creditScore = Math.max(300, userAccount.creditScore - penalty);
    console.log(`Negative balance penalty: Credit score reduced by ${penalty} points to ${userAccount.creditScore}`);
  }
  
  // If negative for more than 3 days, try to get an emergency loan or sell stocks
  const daysNegative = userAccount.daysWithNegativeBalance || 0;
  userAccount.daysWithNegativeBalance = daysNegative + 1;
  
  // Take action after 3 days of negative balance (reduced from 7)
  if (daysNegative >= 3 && daysNegative % 3 === 0) {
    // Try to get an emergency loan to cover the negative balance
    const loanAmount = Math.ceil(negativeAmount * 1.5); // 50% buffer for safety
    
    // Find available lenders based on credit score
    const availableLenders = loanCompanies.getAvailableCompanies(gameTime, userAccount.creditScore);
    
    if (availableLenders.length > 0) {
      // Take loan from the first available lender
      const lender = availableLenders[0];
      const interestRate = loanCompanies.getAdjustedInterestRate(lender, userAccount.creditScore);
      const originationFee = loanAmount * lender.originationFee;
      const netAmount = loanAmount - originationFee;
      
      // Create loan
      const loan = {
        id: loanIdCounter++,
        companyId: lender.id,
        companyName: lender.name,
        principal: loanAmount,
        balance: loanAmount,
        interestRate: interestRate,
        startDate: new Date(gameTime),
        dueDate: new Date(gameTime.getTime() + (lender.termDays * 24 * 60 * 60 * 1000)),
        lastPaymentDate: null,
        lastInterestAccrual: new Date(gameTime),
        missedPayments: 0,
        status: 'active',
        markedAsMissed: false,
        termDays: lender.termDays,
        automatic: true // Mark as automatic
      };
      
      userAccount.loans.push(loan);
      userAccount.cash += netAmount;
      
      console.log(`Automatic emergency loan taken: $${loanAmount.toFixed(2)} from ${lender.name} (net: $${netAmount.toFixed(2)})`);
      
      // Log loan history
      userAccount.loanHistory.push({
        date: new Date(gameTime),
        type: 'taken',
        loanId: loan.id,
        companyId: lender.id,
        amount: loanAmount,
        netAmount: netAmount,
        interestRate: interestRate,
        originationFee: originationFee,
        automatic: true
      });
    } else {
      // No lenders available - account manager must sell stocks
      console.log(`No lenders available for emergency loan. Account manager selling stocks...`);
      sellStocksToRecoverBalance(negativeAmount);
    }
  }
}

// Account manager sells stocks to recover negative balance
function sellStocksToRecoverBalance(targetAmount) {
  let amountToRaise = targetAmount * 1.3; // 30% buffer to account for fees and taxes
  let amountRaised = 0;
  
  // Sort portfolio by position size (sell largest positions first to minimize transactions)
  const sortedPositions = Object.entries(userAccount.portfolio)
    .filter(([symbol, shares]) => shares > 0)
    .map(([symbol, shares]) => {
      const stockPrice = stocks.getStockPrice(symbol, gameTime, timeMultiplier, isPaused);
      return {
        symbol,
        shares,
        price: stockPrice ? stockPrice.price : 0,
        value: stockPrice ? stockPrice.price * shares : 0
      };
    })
    .filter(p => p.price > 0)
    .sort((a, b) => b.value - a.value);
  
  for (const position of sortedPositions) {
    if (amountRaised >= amountToRaise) break;
    
    const saleValue = position.value;
    const tradingFee = getTradingFee(saleValue, gameTime);
    
    // Calculate approximate tax (use short-term rate as worst case)
    let estimatedTax = 0;
    if (userAccount.purchaseHistory[position.symbol]) {
      const avgCostBasis = userAccount.purchaseHistory[position.symbol].reduce((sum, p) => 
        sum + (p.pricePerShare * p.shares), 0) / position.shares;
      const estimatedGain = Math.max(0, (position.price - avgCostBasis) * position.shares);
      estimatedTax = estimatedGain * SHORT_TERM_TAX_RATE;
    }
    
    const netProceeds = saleValue - tradingFee - estimatedTax;
    
    // Sell this position
    userAccount.portfolio[position.symbol] = 0;
    userAccount.cash += netProceeds;
    amountRaised += netProceeds;
    
    // Clear purchase history for this symbol
    if (userAccount.purchaseHistory[position.symbol]) {
      delete userAccount.purchaseHistory[position.symbol];
    }
    
    // Record transaction
    userAccount.transactions.push({
      date: new Date(gameTime),
      type: 'sell',
      symbol: position.symbol,
      shares: position.shares,
      pricePerShare: position.price,
      total: saleValue,
      tradingFee: tradingFee,
      tax: estimatedTax,
      netProceeds: netProceeds,
      automatic: true,
      reason: 'Account manager liquidation due to negative balance'
    });
    
    // Record fee
    if (tradingFee > 0) {
      userAccount.fees.push({
        date: new Date(gameTime),
        type: 'trading',
        amount: tradingFee,
        description: `Trading fee for automatic sale of ${position.shares} shares of ${position.symbol}`
      });
    }
    
    // Record tax
    if (estimatedTax > 0) {
      userAccount.taxes.push({
        date: new Date(gameTime),
        type: 'capital-gains',
        amount: estimatedTax,
        description: `Capital gains tax on automatic sale of ${position.shares} shares of ${position.symbol}`
      });
    }
    
    console.log(`Account manager sold ${position.shares} shares of ${position.symbol} at $${position.price.toFixed(2)} (net: $${netProceeds.toFixed(2)})`);
  }
  
  console.log(`Account manager raised $${amountRaised.toFixed(2)} from stock sales (target was $${amountToRaise.toFixed(2)})`);
}

setInterval(processNegativeBalance, 10000);

app.get('/api/account', (req, res) => {
  const portfolioValue = calculatePortfolioValue();
  const accountEquity = calculateAccountEquity();
  const marginCallStatus = checkMarginCall();
  const buyingPowerInfo = calculateBuyingPower();
  
  // Calculate position concentrations
  const positionConcentrations = {};
  for (const symbol in userAccount.portfolio) {
    if (userAccount.portfolio[symbol] > 0) {
      positionConcentrations[symbol] = checkPositionConcentration(symbol);
    }
  }
  
  res.json({
    cash: userAccount.cash,
    portfolio: userAccount.portfolio,
    purchaseHistory: userAccount.purchaseHistory,
    indexFundHoldings: userAccount.indexFundHoldings,
    shortPositions: userAccount.shortPositions,
    transactions: userAccount.transactions.slice(-20), // Last 20 transactions
    dividends: userAccount.dividends.slice(-10), // Last 10 dividend payments
    taxes: userAccount.taxes.slice(-10), // Last 10 tax payments
    fees: userAccount.fees.slice(-10), // Last 10 fees
    shareholderInfluence: userAccount.shareholderInfluence,
    creditScore: userAccount.creditScore,
    loans: userAccount.loans,
    loanHistory: userAccount.loanHistory.slice(-20), // Last 20 loan activities
    inflationData: {
      cumulativeInflation: cumulativeInflation,
      realValue: userAccount.cash / cumulativeInflation, // Purchasing power in 1970 dollars
      inflationYear: gameTime.getFullYear(),
      currentRate: inflationRates[gameTime.getFullYear()] || 0
    },
    marginAccount: {
      marginBalance: userAccount.marginAccount.marginBalance,
      marginInterestRate: userAccount.marginAccount.marginInterestRate,
      hasMarginEnabled: userAccount.marginAccount.hasMarginEnabled,
      marginCalls: userAccount.marginAccount.marginCalls.slice(-5), // Last 5 margin calls
      buyingPower: buyingPowerInfo.buyingPower,
      currentLeverage: buyingPowerInfo.currentLeverage,
      maxLeverage: buyingPowerInfo.maxLeverage
    },
    portfolioMetrics: {
      portfolioValue: portfolioValue,
      accountEquity: accountEquity,
      marginRatio: calculateMarginRatio(),
      marginCallStatus: marginCallStatus,
      initialMarginRequirement: getInitialMarginRequirement(gameTime),
      maintenanceMarginRequirement: userAccount.riskControls.maintenanceMarginRatio,
      positionConcentrations: positionConcentrations
    },
    riskControls: userAccount.riskControls
  });
});

// Helper function to execute stock orders (used by both direct trading and pending orders)
function executeStockOrder(symbol, action, shares, stockPrice) {
  const totalCost = stockPrice.price * shares;
  const tradingFee = getTradingFee(totalCost, gameTime);
  
  try {
    if (action === 'buy' || action === 'buy-margin') {
      // Check share availability
      const availabilityCheck = shareAvailability.canPurchaseShares(symbol, shares);
      if (!availabilityCheck.canPurchase) {
        return { 
          success: false, 
          error: availabilityCheck.reason 
        };
      }
      
      const totalWithFee = totalCost + tradingFee;
      const useMargin = action === 'buy-margin' || (userAccount.marginAccount.hasMarginEnabled && userAccount.cash < totalWithFee);
      
      // Check position concentration limits
      const futureShares = (userAccount.portfolio[symbol] || 0) + shares;
      const futurePositionValue = futureShares * stockPrice.price;
      const currentPortfolioValue = calculatePortfolioValue();
      const futurePortfolioValue = currentPortfolioValue + totalCost;
      
      if (futurePortfolioValue > 0 && currentPortfolioValue > 0) {
        const futureConcentration = futurePositionValue / futurePortfolioValue;
        
        if (futureConcentration > userAccount.riskControls.maxPositionSize) {
          return { 
            success: false, 
            error: `Position would exceed maximum concentration limit of ${(userAccount.riskControls.maxPositionSize * 100).toFixed(0)}%` 
          };
        }
      }
      
      // Handle margin trading
      if (useMargin) {
        const initialMarginReq = getInitialMarginRequirement(gameTime);
        const requiredCash = totalWithFee * initialMarginReq;
        const marginAmount = totalWithFee - requiredCash;
        
        if (userAccount.cash < requiredCash) {
          return { 
            success: false, 
            error: `Insufficient funds for margin purchase. Need ${(initialMarginReq * 100).toFixed(0)}% initial margin` 
          };
        }
        
        const currentEquity = calculateAccountEquity();
        const newMarginBalance = userAccount.marginAccount.marginBalance + marginAmount;
        const newPortfolioValue = calculatePortfolioValue() + totalCost;
        const newLeverage = currentEquity > 0 ? newPortfolioValue / currentEquity : 0;
        
        if (newLeverage > userAccount.riskControls.maxLeverage) {
          return { 
            success: false, 
            error: `Trade would exceed maximum leverage of ${userAccount.riskControls.maxLeverage}:1` 
          };
        }
        
        userAccount.cash -= requiredCash;
        userAccount.marginAccount.marginBalance += marginAmount;
        if (!userAccount.marginAccount.hasMarginEnabled) {
          userAccount.marginAccount.hasMarginEnabled = true;
          userAccount.marginAccount.lastMarginInterestDate = new Date(gameTime);
        }
        
        shareAvailability.recordPurchase(symbol, shares);
        userAccount.portfolio[symbol] = (userAccount.portfolio[symbol] || 0) + shares;
        
        if (!userAccount.purchaseHistory[symbol]) {
          userAccount.purchaseHistory[symbol] = [];
        }
        userAccount.purchaseHistory[symbol].push({
          date: new Date(gameTime),
          shares: shares,
          pricePerShare: stockPrice.price
        });
        
        userAccount.shareholderInfluence[symbol] = (userAccount.shareholderInfluence[symbol] || 0) + shares;
        
        userAccount.transactions.push({
          date: new Date(gameTime),
          type: 'buy-margin',
          symbol,
          shares,
          pricePerShare: stockPrice.price,
          tradingFee: tradingFee,
          total: totalWithFee,
          cashPaid: requiredCash,
          marginUsed: marginAmount,
          initialMarginPercent: initialMarginReq * 100
        });
        
        if (tradingFee > 0) {
          userAccount.fees.push({
            date: new Date(gameTime),
            type: 'trading',
            amount: tradingFee,
            description: `Trading fee for buying ${shares} shares of ${symbol} on margin`
          });
        }
      } else {
        // Regular cash purchase
        if (userAccount.cash < totalWithFee) {
          return { 
            success: false, 
            error: 'Insufficient funds (including trading fee)' 
          };
        }
        
        shareAvailability.recordPurchase(symbol, shares);
        userAccount.cash -= totalWithFee;
        userAccount.portfolio[symbol] = (userAccount.portfolio[symbol] || 0) + shares;
        
        if (!userAccount.purchaseHistory[symbol]) {
          userAccount.purchaseHistory[symbol] = [];
        }
        userAccount.purchaseHistory[symbol].push({
          date: new Date(gameTime),
          shares: shares,
          pricePerShare: stockPrice.price
        });
        
        userAccount.shareholderInfluence[symbol] = (userAccount.shareholderInfluence[symbol] || 0) + shares;
        
        userAccount.transactions.push({
          date: new Date(gameTime),
          type: 'buy',
          symbol,
          shares,
          pricePerShare: stockPrice.price,
          tradingFee: tradingFee,
          total: totalWithFee
        });
        
        if (tradingFee > 0) {
          userAccount.fees.push({
            date: new Date(gameTime),
            type: 'trading',
            amount: tradingFee,
            description: `Trading fee for buying ${shares} shares of ${symbol}`
          });
        }
      }
      
      return { success: true };
      
    } else if (action === 'sell') {
      if ((userAccount.portfolio[symbol] || 0) < shares) {
        return { success: false, error: 'Insufficient shares' };
      }
      
      shareAvailability.recordSale(symbol, shares);
      
      let remainingShares = shares;
      let totalCostBasis = 0;
      let taxAmount = 0;
      
      if (userAccount.purchaseHistory[symbol]) {
        const purchases = userAccount.purchaseHistory[symbol].slice();
        
        while (remainingShares > 0 && purchases.length > 0) {
          const purchase = purchases[0];
          const sharesToSell = Math.min(remainingShares, purchase.shares);
          const costBasis = sharesToSell * purchase.pricePerShare;
          totalCostBasis += costBasis;
          
          const purchaseDate = new Date(purchase.date);
          const currentDate = new Date(gameTime);
          const holdingDays = (currentDate - purchaseDate) / (1000 * 60 * 60 * 24);
          const isLongTerm = holdingDays >= 365;
          
          const saleProceeds = sharesToSell * stockPrice.price;
          const capitalGain = saleProceeds - costBasis;
          
          if (capitalGain > 0) {
            const taxRate = isLongTerm ? LONG_TERM_TAX_RATE : SHORT_TERM_TAX_RATE;
            taxAmount += capitalGain * taxRate;
          }
          
          purchase.shares -= sharesToSell;
          if (purchase.shares <= 0) {
            purchases.shift();
          }
          
          remainingShares -= sharesToSell;
        }
        
        userAccount.purchaseHistory[symbol] = purchases;
      }
      
      const grossSaleAmount = stockPrice.price * shares;
      const netSaleProceeds = grossSaleAmount - taxAmount - tradingFee;
      userAccount.cash += netSaleProceeds;
      userAccount.portfolio[symbol] -= shares;
      
      userAccount.shareholderInfluence[symbol] = (userAccount.shareholderInfluence[symbol] || 0) - shares;
      if (userAccount.shareholderInfluence[symbol] <= 0) {
        delete userAccount.shareholderInfluence[symbol];
      }
      
      userAccount.transactions.push({
        date: new Date(gameTime),
        type: 'sell',
        symbol,
        shares,
        pricePerShare: stockPrice.price,
        total: grossSaleAmount,
        tax: taxAmount,
        tradingFee: tradingFee,
        netProceeds: netSaleProceeds
      });
      
      if (tradingFee > 0) {
        userAccount.fees.push({
          date: new Date(gameTime),
          type: 'trading',
          amount: tradingFee,
          description: `Trading fee for selling ${shares} shares of ${symbol}`
        });
      }
      
      if (taxAmount > 0) {
        userAccount.taxes.push({
          date: new Date(gameTime),
          type: 'capital-gains',
          amount: taxAmount,
          description: `Capital gains tax on ${shares} shares of ${symbol}`
        });
      }
      
      return { success: true };
      
    } else if (action === 'short') {
      const saleProceeds = totalCost;
      const totalWithFee = saleProceeds - tradingFee;
      
      userAccount.cash += totalWithFee;
      
      if (!userAccount.shortPositions[symbol]) {
        userAccount.shortPositions[symbol] = {
          shares: 0,
          borrowPrice: 0,
          borrowDate: new Date(gameTime)
        };
      }
      
      const currentShortShares = userAccount.shortPositions[symbol].shares;
      const currentBorrowValue = currentShortShares * userAccount.shortPositions[symbol].borrowPrice;
      const newBorrowValue = shares * stockPrice.price;
      const totalShares = currentShortShares + shares;
      
      userAccount.shortPositions[symbol].shares = totalShares;
      if (totalShares > 0) {
        userAccount.shortPositions[symbol].borrowPrice = (currentBorrowValue + newBorrowValue) / totalShares;
      }
      if (currentShortShares === 0) {
        userAccount.shortPositions[symbol].borrowDate = new Date(gameTime);
      }
      
      userAccount.transactions.push({
        date: new Date(gameTime),
        type: 'short',
        symbol,
        shares,
        pricePerShare: stockPrice.price,
        tradingFee: tradingFee,
        netProceeds: totalWithFee
      });
      
      if (tradingFee > 0) {
        userAccount.fees.push({
          date: new Date(gameTime),
          type: 'trading',
          amount: tradingFee,
          description: `Trading fee for shorting ${shares} shares of ${symbol}`
        });
      }
      
      return { success: true };
      
    } else if (action === 'cover') {
      if (!userAccount.shortPositions[symbol] || userAccount.shortPositions[symbol].shares < shares) {
        return { success: false, error: 'Insufficient short position to cover' };
      }
      
      const totalWithFee = totalCost + tradingFee;
      if (userAccount.cash < totalWithFee) {
        return { success: false, error: 'Insufficient funds to cover short position' };
      }
      
      userAccount.cash -= totalWithFee;
      
      const position = userAccount.shortPositions[symbol];
      const borrowPrice = position.borrowPrice;
      const profit = (borrowPrice - stockPrice.price) * shares;
      
      let taxAmount = 0;
      if (profit > 0) {
        const borrowDate = new Date(position.borrowDate);
        const holdingDays = (gameTime - borrowDate) / (1000 * 60 * 60 * 24);
        const isLongTerm = holdingDays >= 365;
        const taxRate = isLongTerm ? LONG_TERM_TAX_RATE : SHORT_TERM_TAX_RATE;
        taxAmount = profit * taxRate;
        userAccount.cash -= taxAmount;
      }
      
      position.shares -= shares;
      if (position.shares <= 0) {
        delete userAccount.shortPositions[symbol];
      }
      
      userAccount.transactions.push({
        date: new Date(gameTime),
        type: 'cover',
        symbol,
        shares,
        pricePerShare: stockPrice.price,
        borrowPrice: borrowPrice,
        profit: profit,
        tax: taxAmount,
        tradingFee: tradingFee,
        total: totalWithFee
      });
      
      if (tradingFee > 0) {
        userAccount.fees.push({
          date: new Date(gameTime),
          type: 'trading',
          amount: tradingFee,
          description: `Trading fee for covering ${shares} shares of ${symbol}`
        });
      }
      
      if (taxAmount > 0) {
        userAccount.taxes.push({
          date: new Date(gameTime),
          type: 'short-gains',
          amount: taxAmount,
          description: `Tax on short sale profit for ${shares} shares of ${symbol}`
        });
      }
      
      return { success: true };
    }
    
    return { success: false, error: 'Invalid action' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Helper function to execute index fund orders
function executeIndexFundOrder(symbol, action, shares, fundPrice, fund) {
  const totalCost = fundPrice * shares;
  const tradingFee = getTradingFee(totalCost, gameTime);
  
  try {
    if (action === 'buy') {
      const totalWithFee = totalCost + tradingFee;
      
      if (userAccount.cash < totalWithFee) {
        return { success: false, error: 'Insufficient funds' };
      }
      
      userAccount.cash -= totalWithFee;
      
      if (!userAccount.indexFundHoldings[symbol]) {
        userAccount.indexFundHoldings[symbol] = {
          shares: 0,
          purchaseHistory: []
        };
      }
      
      userAccount.indexFundHoldings[symbol].shares += shares;
      userAccount.indexFundHoldings[symbol].purchaseHistory.push({
        date: new Date(gameTime),
        shares: shares,
        pricePerShare: fundPrice
      });
      
      userAccount.transactions.push({
        date: new Date(gameTime),
        type: 'buy-indexfund',
        symbol,
        name: fund.name,
        shares,
        pricePerShare: fundPrice,
        tradingFee: tradingFee,
        total: totalWithFee
      });
      
      if (tradingFee > 0) {
        userAccount.fees.push({
          date: new Date(gameTime),
          type: 'trading',
          amount: tradingFee,
          description: `Trading fee for buying ${shares} shares of ${fund.name}`
        });
      }
      
      return { success: true };
      
    } else if (action === 'sell') {
      const holding = userAccount.indexFundHoldings[symbol];
      if (!holding || holding.shares < shares) {
        return { success: false, error: 'Insufficient shares' };
      }
      
      let remainingShares = shares;
      let totalCostBasis = 0;
      let taxAmount = 0;
      
      const purchases = holding.purchaseHistory.slice();
      
      while (remainingShares > 0 && purchases.length > 0) {
        const purchase = purchases[0];
        const sharesToSell = Math.min(remainingShares, purchase.shares);
        const costBasis = sharesToSell * purchase.pricePerShare;
        totalCostBasis += costBasis;
        
        const purchaseDate = new Date(purchase.date);
        const currentDate = new Date(gameTime);
        const holdingDays = (currentDate - purchaseDate) / (1000 * 60 * 60 * 24);
        const isLongTerm = holdingDays >= 365;
        
        const saleProceeds = sharesToSell * fundPrice;
        const capitalGain = saleProceeds - costBasis;
        
        if (capitalGain > 0) {
          const taxRate = isLongTerm ? LONG_TERM_TAX_RATE : SHORT_TERM_TAX_RATE;
          taxAmount += capitalGain * taxRate;
        }
        
        purchase.shares -= sharesToSell;
        if (purchase.shares <= 0) {
          purchases.shift();
        }
        
        remainingShares -= sharesToSell;
      }
      
      const purchasesUsedInSale = [];
      let remainingForExpense = shares;
      
      for (const purchase of holding.purchaseHistory) {
        if (remainingForExpense <= 0) break;
        
        const sharesFromThisPurchase = Math.min(remainingForExpense, purchase.shares);
        purchasesUsedInSale.push({
          shares: sharesFromThisPurchase,
          pricePerShare: purchase.pricePerShare,
          date: purchase.date
        });
        remainingForExpense -= sharesFromThisPurchase;
      }
      
      holding.purchaseHistory = purchases;
      
      let totalExpenseFee = 0;
      
      purchasesUsedInSale.forEach(purchase => {
        const daysHeld = (gameTime - new Date(purchase.date)) / (1000 * 60 * 60 * 24);
        const dailyFeeRate = fund.expenseRatio / 365;
        const purchaseValue = purchase.shares * purchase.pricePerShare;
        const fee = purchaseValue * dailyFeeRate * daysHeld;
        totalExpenseFee += fee;
      });
      
      if (totalExpenseFee > 0) {
        userAccount.fees.push({
          date: new Date(gameTime),
          type: 'index-fund-expense',
          amount: totalExpenseFee,
          description: `Expense ratio fee (${(fund.expenseRatio * 100).toFixed(2)}%) for ${fund.name}`
        });
      }
      
      const grossSaleAmount = fundPrice * shares;
      const netSaleProceeds = grossSaleAmount - taxAmount - tradingFee - totalExpenseFee;
      userAccount.cash += netSaleProceeds;
      holding.shares -= shares;
      
      if (holding.shares <= 0) {
        delete userAccount.indexFundHoldings[symbol];
      }
      
      userAccount.transactions.push({
        date: new Date(gameTime),
        type: 'sell-indexfund',
        symbol,
        name: fund.name,
        shares,
        pricePerShare: fundPrice,
        total: grossSaleAmount,
        tax: taxAmount,
        tradingFee: tradingFee,
        netProceeds: netSaleProceeds
      });
      
      if (tradingFee > 0) {
        userAccount.fees.push({
          date: new Date(gameTime),
          type: 'trading',
          amount: tradingFee,
          description: `Trading fee for selling ${shares} shares of ${fund.name}`
        });
      }
      
      if (taxAmount > 0) {
        userAccount.taxes.push({
          date: new Date(gameTime),
          type: 'capital-gains',
          amount: taxAmount,
          description: `Capital gains tax on ${shares} shares of ${fund.name}`
        });
      }
      
      return { success: true };
    }
    
    return { success: false, error: 'Invalid action' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

app.post('/api/trade', (req, res) => {
  const { symbol, action, shares } = req.body;
  
  // If market is closed, queue the order instead of rejecting it
  if (!isMarketOpen(gameTime)) {
    try {
      // Validate inputs first
      if (!symbol || !action || !shares || shares <= 0) {
        return res.status(400).json({ error: 'Invalid trade parameters' });
      }
      
      // Validate symbol to prevent prototype pollution
      if (typeof symbol !== 'string' || symbol === '__proto__' || symbol === 'constructor' || symbol === 'prototype') {
        return res.status(400).json({ error: 'Invalid symbol' });
      }
      
      // Validate action
      if (!['buy', 'sell', 'short', 'cover', 'buy-margin'].includes(action)) {
        return res.status(400).json({ error: 'Invalid action' });
      }
      
      // Queue the order
      const result = dbModule.insertPendingOrder.run(
        symbol,
        action,
        shares,
        'stock',
        gameTime.toISOString(),
        'pending'
      );
      
      return res.json({ 
        success: true,
        message: 'Market is closed. Order has been queued and will be executed when market opens.',
        pendingOrderId: result.lastInsertRowid,
        symbol,
        action,
        shares,
        queuedAt: gameTime.toISOString()
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to queue order: ' + error.message });
    }
  }
  
  // Validate symbol to prevent prototype pollution
  if (typeof symbol !== 'string' || symbol === '__proto__' || symbol === 'constructor' || symbol === 'prototype') {
    return res.status(400).json({ error: 'Invalid symbol' });
  }
  
  // Check for trade halts
  const haltStatus = tradeHalts.isTradingHalted(gameTime, symbol);
  if (haltStatus.isHalted) {
    return res.status(400).json({ 
      error: `Trading is currently halted: ${haltStatus.reason}`,
      haltEndTime: haltStatus.endTime
    });
  }
  
  // Check for trade cooldown
  if (userAccount.lastTradeTime[symbol]) {
    const timeSinceLastTrade = gameTime.getTime() - userAccount.lastTradeTime[symbol].getTime();
    if (timeSinceLastTrade < TRADE_COOLDOWN_MS) {
      const remainingCooldown = Math.ceil((TRADE_COOLDOWN_MS - timeSinceLastTrade) / 60000);
      return res.status(400).json({ 
        error: `Please wait ${remainingCooldown} more minute(s) before trading ${symbol} again` 
      });
    }
  }
  
  const stockPrice = stocks.getStockPrice(symbol, gameTime, timeMultiplier, isPaused);
  if (!stockPrice) {
    return res.status(404).json({ error: 'Stock not found' });
  }
  
  const totalCost = stockPrice.price * shares;
  const tradingFee = getTradingFee(totalCost, gameTime);
  
  if (action === 'buy' || action === 'buy-margin') {
    // Check share availability
    const availabilityCheck = shareAvailability.canPurchaseShares(symbol, shares);
    if (!availabilityCheck.canPurchase) {
      return res.status(400).json({ 
        error: availabilityCheck.reason,
        availableShares: availabilityCheck.availableShares
      });
    }
    
    const totalWithFee = totalCost + tradingFee;
    const useMargin = action === 'buy-margin' || (userAccount.marginAccount.hasMarginEnabled && userAccount.cash < totalWithFee);
    
    // Check position concentration limits
    const futureShares = (userAccount.portfolio[symbol] || 0) + shares;
    const futurePositionValue = futureShares * stockPrice.price;
    const currentPortfolioValue = calculatePortfolioValue();
    const futurePortfolioValue = currentPortfolioValue + totalCost;
    
    // Only apply concentration limits if portfolio has existing value
    // For first purchase, skip this check
    if (futurePortfolioValue > 0 && currentPortfolioValue > 0) {
      const futureConcentration = futurePositionValue / futurePortfolioValue;
      
      if (futureConcentration > userAccount.riskControls.maxPositionSize) {
        return res.status(400).json({ 
          error: `Position would exceed maximum concentration limit of ${(userAccount.riskControls.maxPositionSize * 100).toFixed(0)}%. Current concentration would be ${(futureConcentration * 100).toFixed(1)}%`,
          maxPositionSize: userAccount.riskControls.maxPositionSize,
          futureConcentration: futureConcentration
        });
      }
    }
    
    // Handle margin trading
    if (useMargin) {
      const initialMarginReq = getInitialMarginRequirement(gameTime);
      const requiredCash = totalWithFee * initialMarginReq;
      const marginAmount = totalWithFee - requiredCash;
      
      // Check if user has enough cash for initial margin requirement
      if (userAccount.cash < requiredCash) {
        return res.status(400).json({ 
          error: `Insufficient funds for margin purchase. Need ${(initialMarginReq * 100).toFixed(0)}% initial margin ($${requiredCash.toFixed(2)})`,
          requiredCash: requiredCash,
          availableCash: userAccount.cash
        });
      }
      
      // Check leverage limits
      const currentEquity = calculateAccountEquity();
      const newMarginBalance = userAccount.marginAccount.marginBalance + marginAmount;
      const newPortfolioValue = calculatePortfolioValue() + totalCost;
      const newLeverage = currentEquity > 0 ? newPortfolioValue / currentEquity : 0;
      
      if (newLeverage > userAccount.riskControls.maxLeverage) {
        return res.status(400).json({ 
          error: `Trade would exceed maximum leverage of ${userAccount.riskControls.maxLeverage}:1. New leverage would be ${newLeverage.toFixed(2)}:1`,
          maxLeverage: userAccount.riskControls.maxLeverage,
          newLeverage: newLeverage
        });
      }
      
      // Execute margin purchase
      userAccount.cash -= requiredCash;
      userAccount.marginAccount.marginBalance += marginAmount;
      if (!userAccount.marginAccount.hasMarginEnabled) {
        userAccount.marginAccount.hasMarginEnabled = true;
        userAccount.marginAccount.lastMarginInterestDate = new Date(gameTime);
      }
      
      // Record the share purchase in availability tracking
      shareAvailability.recordPurchase(symbol, shares);
      
      userAccount.portfolio[symbol] = (userAccount.portfolio[symbol] || 0) + shares;
      
      // Track purchase for tax calculation
      if (!userAccount.purchaseHistory[symbol]) {
        userAccount.purchaseHistory[symbol] = [];
      }
      userAccount.purchaseHistory[symbol].push({
        date: new Date(gameTime),
        shares: shares,
        pricePerShare: stockPrice.price
      });
      
      // Update shareholder influence
      userAccount.shareholderInfluence[symbol] = (userAccount.shareholderInfluence[symbol] || 0) + shares;
      
      // Record transaction
      userAccount.transactions.push({
        date: new Date(gameTime),
        type: 'buy-margin',
        symbol,
        shares,
        pricePerShare: stockPrice.price,
        tradingFee: tradingFee,
        total: totalWithFee,
        cashPaid: requiredCash,
        marginUsed: marginAmount,
        initialMarginPercent: initialMarginReq * 100
      });
      
      // Record fee
      if (tradingFee > 0) {
        userAccount.fees.push({
          date: new Date(gameTime),
          type: 'trading',
          amount: tradingFee,
          description: `Trading fee for buying ${shares} shares of ${symbol} on margin`
        });
      }
    } else {
      // Regular cash purchase
      if (userAccount.cash < totalWithFee) {
        return res.status(400).json({ 
          error: 'Insufficient funds (including trading fee). Enable margin trading to use leverage.',
          requiredCash: totalWithFee,
          availableCash: userAccount.cash
        });
      }
      
      // Record the share purchase in availability tracking
      shareAvailability.recordPurchase(symbol, shares);
      
      userAccount.cash -= totalWithFee;
      userAccount.portfolio[symbol] = (userAccount.portfolio[symbol] || 0) + shares;
      
      // Track purchase for tax calculation
      if (!userAccount.purchaseHistory[symbol]) {
        userAccount.purchaseHistory[symbol] = [];
      }
      userAccount.purchaseHistory[symbol].push({
        date: new Date(gameTime),
        shares: shares,
        pricePerShare: stockPrice.price
      });
      
      // Update shareholder influence
      userAccount.shareholderInfluence[symbol] = (userAccount.shareholderInfluence[symbol] || 0) + shares;
      
      // Record transaction
      userAccount.transactions.push({
        date: new Date(gameTime),
        type: 'buy',
        symbol,
        shares,
        pricePerShare: stockPrice.price,
        tradingFee: tradingFee,
        total: totalWithFee
      });
      
      // Record fee
      if (tradingFee > 0) {
        userAccount.fees.push({
          date: new Date(gameTime),
          type: 'trading',
          amount: tradingFee,
          description: `Trading fee for buying ${shares} shares of ${symbol}`
        });
      }
    }
    
  } else if (action === 'sell') {
    if ((userAccount.portfolio[symbol] || 0) < shares) {
      return res.status(400).json({ error: 'Insufficient shares' });
    }
    
    // Record the share sale in availability tracking
    shareAvailability.recordSale(symbol, shares);
    
    // Calculate capital gains tax using FIFO method
    let remainingShares = shares;
    let totalCostBasis = 0;
    let taxAmount = 0;
    
    if (userAccount.purchaseHistory[symbol]) {
      const purchases = userAccount.purchaseHistory[symbol].slice();
      
      while (remainingShares > 0 && purchases.length > 0) {
        const purchase = purchases[0];
        const sharesToSell = Math.min(remainingShares, purchase.shares);
        const costBasis = sharesToSell * purchase.pricePerShare;
        totalCostBasis += costBasis;
        
        // Calculate holding period
        const purchaseDate = new Date(purchase.date);
        const currentDate = new Date(gameTime);
        const holdingDays = (currentDate - purchaseDate) / (1000 * 60 * 60 * 24);
        const isLongTerm = holdingDays >= 365;
        
        // Calculate gain/loss
        const saleProceeds = sharesToSell * stockPrice.price;
        const capitalGain = saleProceeds - costBasis;
        
        if (capitalGain > 0) {
          const taxRate = isLongTerm ? LONG_TERM_TAX_RATE : SHORT_TERM_TAX_RATE;
          taxAmount += capitalGain * taxRate;
        }
        
        // Update purchase history
        purchase.shares -= sharesToSell;
        if (purchase.shares <= 0) {
          purchases.shift();
        }
        
        remainingShares -= sharesToSell;
      }
      
      // Update purchase history
      userAccount.purchaseHistory[symbol] = purchases;
    }
    
    // Apply sale and deduct tax and fee
    const grossSaleAmount = stockPrice.price * shares;  // Fixed: use actual sale proceeds
    const netSaleProceeds = grossSaleAmount - taxAmount - tradingFee;
    userAccount.cash += netSaleProceeds;
    userAccount.portfolio[symbol] -= shares;
    
    // Update shareholder influence
    userAccount.shareholderInfluence[symbol] = (userAccount.shareholderInfluence[symbol] || 0) - shares;
    if (userAccount.shareholderInfluence[symbol] <= 0) {
      delete userAccount.shareholderInfluence[symbol];
    }
    
    // Record transaction
    userAccount.transactions.push({
      date: new Date(gameTime),
      type: 'sell',
      symbol,
      shares,
      pricePerShare: stockPrice.price,
      total: grossSaleAmount,
      tax: taxAmount,
      tradingFee: tradingFee,
      netProceeds: netSaleProceeds
    });
    
    // Record fee
    if (tradingFee > 0) {
      userAccount.fees.push({
        date: new Date(gameTime),
        type: 'trading',
        amount: tradingFee,
        description: `Trading fee for selling ${shares} shares of ${symbol}`
      });
    }
    
    // Record tax if any
    if (taxAmount > 0) {
      userAccount.taxes.push({
        date: new Date(gameTime),
        type: 'capital-gains',
        amount: taxAmount,
        description: `Capital gains tax on ${shares} shares of ${symbol}`
      });
    }
  } else if (action === 'short') {
    // Short selling: borrow and sell shares
    const saleProceeds = totalCost;
    const totalWithFee = saleProceeds - tradingFee;
    
    userAccount.cash += totalWithFee;
    
    // Track short position
    if (!userAccount.shortPositions[symbol]) {
      userAccount.shortPositions[symbol] = {
        shares: 0,
        borrowPrice: 0,
        borrowDate: new Date(gameTime)
      };
    }
    
    const currentShortShares = userAccount.shortPositions[symbol].shares;
    const currentBorrowValue = currentShortShares * userAccount.shortPositions[symbol].borrowPrice;
    const newBorrowValue = shares * stockPrice.price;
    const totalShares = currentShortShares + shares;
    
    // Calculate weighted average borrow price
    userAccount.shortPositions[symbol].shares = totalShares;
    if (totalShares > 0) {
      userAccount.shortPositions[symbol].borrowPrice = (currentBorrowValue + newBorrowValue) / totalShares;
    }
    if (currentShortShares === 0) {
      userAccount.shortPositions[symbol].borrowDate = new Date(gameTime);
    }
    
    // Record transaction
    userAccount.transactions.push({
      date: new Date(gameTime),
      type: 'short',
      symbol,
      shares,
      pricePerShare: stockPrice.price,
      tradingFee: tradingFee,
      netProceeds: totalWithFee
    });
    
    // Record fee
    if (tradingFee > 0) {
      userAccount.fees.push({
        date: new Date(gameTime),
        type: 'trading',
        amount: tradingFee,
        description: `Trading fee for shorting ${shares} shares of ${symbol}`
      });
    }
  } else if (action === 'cover') {
    // Cover short: buy back shares to close short position
    if (!userAccount.shortPositions[symbol] || userAccount.shortPositions[symbol].shares < shares) {
      return res.status(400).json({ error: 'Insufficient short position to cover' });
    }
    
    const totalWithFee = totalCost + tradingFee;
    if (userAccount.cash < totalWithFee) {
      return res.status(400).json({ error: 'Insufficient funds to cover short position' });
    }
    
    userAccount.cash -= totalWithFee;
    
    const position = userAccount.shortPositions[symbol];
    const borrowPrice = position.borrowPrice;
    const profit = (borrowPrice - stockPrice.price) * shares;
    
    // Calculate tax on profit (if any)
    let taxAmount = 0;
    if (profit > 0) {
      const borrowDate = new Date(position.borrowDate);
      const holdingDays = (gameTime - borrowDate) / (1000 * 60 * 60 * 24);
      const isLongTerm = holdingDays >= 365;
      const taxRate = isLongTerm ? LONG_TERM_TAX_RATE : SHORT_TERM_TAX_RATE;
      taxAmount = profit * taxRate;
      userAccount.cash -= taxAmount;
    }
    
    // Update short position
    position.shares -= shares;
    if (position.shares <= 0) {
      delete userAccount.shortPositions[symbol];
    }
    
    // Record transaction
    userAccount.transactions.push({
      date: new Date(gameTime),
      type: 'cover',
      symbol,
      shares,
      pricePerShare: stockPrice.price,
      borrowPrice: borrowPrice,
      profit: profit,
      tax: taxAmount,
      tradingFee: tradingFee,
      total: totalWithFee
    });
    
    // Record fee
    if (tradingFee > 0) {
      userAccount.fees.push({
        date: new Date(gameTime),
        type: 'trading',
        amount: tradingFee,
        description: `Trading fee for covering ${shares} shares of ${symbol}`
      });
    }
    
    // Record tax if profit
    if (taxAmount > 0) {
      userAccount.taxes.push({
        date: new Date(gameTime),
        type: 'short-gains',
        amount: taxAmount,
        description: `Tax on short sale profit for ${shares} shares of ${symbol}`
      });
    }
  }
  
  // Update last trade time for this symbol
  userAccount.lastTradeTime[symbol] = new Date(gameTime);
  
  res.json(userAccount);
});

// Loan API endpoints
app.get('/api/loans/companies', (req, res) => {
  const availableCompanies = loanCompanies.getAvailableCompanies(gameTime, userAccount.creditScore);
  const portfolioValue = calculatePortfolioValue();
  
  // Add adjusted interest rates and max loan amounts for each company
  const companiesWithRates = availableCompanies.map(company => ({
    ...company,
    adjustedInterestRate: loanCompanies.getAdjustedInterestRate(company, userAccount.creditScore),
    effectiveMaxLoan: loanCompanies.getMaxLoanAmount(company, portfolioValue),
    availableFrom: company.availableFrom.toISOString()
  }));
  
  res.json(companiesWithRates);
});

app.get('/api/loans/active', (req, res) => {
  const activeLoans = userAccount.loans.filter(loan => loan.status === 'active');
  
  // Add company details to each loan
  const loansWithDetails = activeLoans.map(loan => {
    const company = loanCompanies.getCompany(loan.companyId);
    return {
      ...loan,
      companyName: company ? company.name : 'Unknown',
      companyTrustLevel: company ? company.trustLevel : 0
    };
  });
  
  res.json(loansWithDetails);
});

app.post('/api/loans/take', (req, res) => {
  const { companyId, amount } = req.body;
  
  const company = loanCompanies.getCompany(companyId);
  if (!company) {
    return res.status(404).json({ error: 'Loan company not found' });
  }
  
  // Check if company is available yet
  if (gameTime < company.availableFrom) {
    return res.status(400).json({ error: 'This loan company is not yet available' });
  }
  
  // Check credit score requirement
  if (userAccount.creditScore < company.minCreditScore) {
    return res.status(400).json({ 
      error: `Your credit score (${userAccount.creditScore}) is too low. Minimum required: ${company.minCreditScore}` 
    });
  }
  
  // Calculate effective max loan (considering portfolio value for portfolio-based loans)
  const portfolioValue = calculatePortfolioValue();
  const effectiveMaxLoan = loanCompanies.getMaxLoanAmount(company, portfolioValue);
  
  // Validate loan amount against effective max
  if (amount < company.minLoan || amount > effectiveMaxLoan) {
    return res.status(400).json({ 
      error: `Loan amount must be between $${company.minLoan.toLocaleString()} and $${effectiveMaxLoan.toLocaleString()}` 
    });
  }
  
  // Calculate interest rate based on credit score
  const interestRate = loanCompanies.getAdjustedInterestRate(company, userAccount.creditScore);
  
  // Calculate origination fee
  const originationFee = amount * company.originationFee;
  const netAmount = amount - originationFee;
  
  // Create loan
  const loan = {
    id: loanIdCounter++,
    companyId: company.id,
    companyName: company.name,
    principal: amount,
    balance: amount,
    interestRate: interestRate,
    startDate: new Date(gameTime),
    dueDate: new Date(gameTime.getTime() + (company.termDays * 24 * 60 * 60 * 1000)),
    lastPaymentDate: null,
    lastInterestAccrual: new Date(gameTime),
    missedPayments: 0,
    status: 'active',
    markedAsMissed: false,
    termDays: company.termDays
  };
  
  // Add loan to account
  userAccount.loans.push(loan);
  
  // Add cash (minus origination fee)
  userAccount.cash += netAmount;
  
  // Record fee
  if (originationFee > 0) {
    userAccount.fees.push({
      date: new Date(gameTime),
      type: 'loan-origination',
      amount: originationFee,
      description: `Origination fee for loan #${loan.id} from ${company.name}`
    });
  }
  
  // Record loan history
  userAccount.loanHistory.push({
    date: new Date(gameTime),
    type: 'taken',
    loanId: loan.id,
    companyId: company.id,
    amount: amount,
    netAmount: netAmount,
    interestRate: interestRate,
    originationFee: originationFee
  });
  
  res.json({
    loan: loan,
    netAmount: netAmount,
    originationFee: originationFee,
    message: `Loan approved! $${netAmount.toFixed(2)} has been deposited to your account.`
  });
});

app.post('/api/loans/pay', (req, res) => {
  const { loanId, amount } = req.body;
  
  const loan = userAccount.loans.find(l => l.id === loanId);
  if (!loan) {
    return res.status(404).json({ error: 'Loan not found' });
  }
  
  if (loan.status !== 'active') {
    return res.status(400).json({ error: 'Loan is not active' });
  }
  
  if (amount <= 0) {
    return res.status(400).json({ error: 'Payment amount must be positive' });
  }
  
  if (userAccount.cash < amount) {
    return res.status(400).json({ error: 'Insufficient funds' });
  }
  
  const company = loanCompanies.getCompany(loan.companyId);
  if (!company) {
    return res.status(400).json({ error: 'Loan company not found' });
  }
  
  // Deduct payment from cash
  userAccount.cash -= amount;
  
  // Apply payment to loan balance
  const previousBalance = loan.balance;
  loan.balance = Math.max(0, loan.balance - amount);
  loan.lastPaymentDate = new Date(gameTime);
  
  // If this was an overdue payment, reset missed payment flag
  if (loan.markedAsMissed) {
    loan.markedAsMissed = false;
  }
  
  // Check if loan is paid off
  const isPaidOff = loan.balance <= 0;
  if (isPaidOff) {
    loan.status = 'paid';
    loan.paidOffDate = new Date(gameTime);
    
    // Increase credit score for paying off loan
    const wasOnTime = new Date(gameTime) <= new Date(loan.dueDate);
    const creditScoreIncrease = wasOnTime ? company.creditScoreImpact.onTime : Math.floor(company.creditScoreImpact.onTime / 2);
    userAccount.creditScore = Math.min(850, userAccount.creditScore + creditScoreIncrease);
    
    userAccount.loanHistory.push({
      date: new Date(gameTime),
      type: 'paid-off',
      loanId: loan.id,
      companyId: company.id,
      finalPayment: amount,
      wasOnTime: wasOnTime,
      creditScoreChange: creditScoreIncrease
    });
  } else {
    // Record regular payment
    userAccount.loanHistory.push({
      date: new Date(gameTime),
      type: 'payment',
      loanId: loan.id,
      companyId: company.id,
      amount: amount,
      remainingBalance: loan.balance
    });
  }
  
  res.json({
    loan: loan,
    amountPaid: amount,
    previousBalance: previousBalance,
    newBalance: loan.balance,
    isPaidOff: isPaidOff,
    creditScore: userAccount.creditScore,
    message: isPaidOff ? 
      `Congratulations! Loan #${loanId} has been paid off. Your credit score increased!` :
      `Payment of $${amount.toFixed(2)} applied. Remaining balance: $${loan.balance.toFixed(2)}`
  });
});

// Margin account endpoints

// Enable/disable margin trading
app.post('/api/margin/toggle', (req, res) => {
  userAccount.marginAccount.hasMarginEnabled = !userAccount.marginAccount.hasMarginEnabled;
  
  if (userAccount.marginAccount.hasMarginEnabled) {
    userAccount.marginAccount.lastMarginInterestDate = new Date(gameTime);
  }
  
  res.json({
    marginEnabled: userAccount.marginAccount.hasMarginEnabled,
    message: userAccount.marginAccount.hasMarginEnabled ? 
      'Margin trading enabled. You can now buy stocks with leverage.' :
      'Margin trading disabled. You can only make cash purchases.'
  });
});

// Pay down margin debt
app.post('/api/margin/pay', (req, res) => {
  const { amount } = req.body;
  
  if (amount <= 0) {
    return res.status(400).json({ error: 'Payment amount must be positive' });
  }
  
  if (userAccount.cash < amount) {
    return res.status(400).json({ error: 'Insufficient funds' });
  }
  
  if (userAccount.marginAccount.marginBalance <= 0) {
    return res.status(400).json({ error: 'No margin debt to pay down' });
  }
  
  const paymentAmount = Math.min(amount, userAccount.marginAccount.marginBalance);
  userAccount.cash -= paymentAmount;
  userAccount.marginAccount.marginBalance -= paymentAmount;
  
  // Record transaction
  userAccount.transactions.push({
    date: new Date(gameTime),
    type: 'margin-payment',
    amount: paymentAmount,
    remainingMarginBalance: userAccount.marginAccount.marginBalance
  });
  
  res.json({
    amountPaid: paymentAmount,
    remainingMarginBalance: userAccount.marginAccount.marginBalance,
    message: userAccount.marginAccount.marginBalance > 0 ?
      `Payment of $${paymentAmount.toFixed(2)} applied. Remaining margin balance: $${userAccount.marginAccount.marginBalance.toFixed(2)}` :
      'Margin debt fully paid off!'
  });
});

// Get margin requirements for a potential trade
app.post('/api/margin/calculate', (req, res) => {
  const { symbol, shares } = req.body;
  
  const stockPrice = stocks.getStockPrice(symbol, gameTime, timeMultiplier, isPaused);
  if (!stockPrice) {
    return res.status(404).json({ error: 'Stock not found' });
  }
  
  const totalCost = stockPrice.price * shares;
  const tradingFee = getTradingFee(totalCost, gameTime);
  const totalWithFee = totalCost + tradingFee;
  const initialMarginReq = getInitialMarginRequirement(gameTime);
  const requiredCash = totalWithFee * initialMarginReq;
  const marginAmount = totalWithFee - requiredCash;
  
  // Check concentration
  const futureShares = (userAccount.portfolio[symbol] || 0) + shares;
  const futurePositionValue = futureShares * stockPrice.price;
  const currentPortfolioValue = calculatePortfolioValue();
  const futurePortfolioValue = currentPortfolioValue + totalCost;
  const futureConcentration = futurePositionValue / futurePortfolioValue;
  
  // Check leverage
  const currentEquity = calculateAccountEquity();
  const newMarginBalance = userAccount.marginAccount.marginBalance + marginAmount;
  const newPortfolioValue = calculatePortfolioValue() + totalCost;
  const newLeverage = currentEquity > 0 ? newPortfolioValue / currentEquity : 0;
  
  res.json({
    totalCost: totalCost,
    tradingFee: tradingFee,
    totalWithFee: totalWithFee,
    initialMarginRequirement: initialMarginReq,
    requiredCash: requiredCash,
    marginAmount: marginAmount,
    canAffordCash: userAccount.cash >= totalWithFee,
    canAffordMargin: userAccount.cash >= requiredCash,
    futureConcentration: futureConcentration,
    concentrationLimit: userAccount.riskControls.maxPositionSize,
    wouldExceedConcentration: futureConcentration > userAccount.riskControls.maxPositionSize,
    newLeverage: newLeverage,
    leverageLimit: userAccount.riskControls.maxLeverage,
    wouldExceedLeverage: newLeverage > userAccount.riskControls.maxLeverage
  });
});

// Index Funds API endpoints

// Get all available index funds
app.get('/api/indexfunds', (req, res) => {
  const availableFunds = indexFunds.getAvailableIndexFunds(gameTime, timeMultiplier, isPaused);
  res.json(availableFunds);
});

// Get specific index fund details
app.get('/api/indexfunds/:symbol', (req, res) => {
  const { symbol } = req.params;
  const fundDetails = indexFunds.getIndexFundDetails(symbol, gameTime, timeMultiplier, isPaused);
  
  if (!fundDetails) {
    return res.status(404).json({ error: 'Index fund not found or not available yet' });
  }
  
  res.json(fundDetails);
});

// Get index fund history
app.get('/api/indexfunds/:symbol/history', (req, res) => {
  const { symbol } = req.params;
  const { days } = req.query;
  
  const daysToFetch = parseInt(days) || 30;
  const history = indexFunds.getIndexFundHistory(symbol, gameTime, daysToFetch, timeMultiplier, BYPASS_CACHE_FOR_HISTORICAL);
  
  res.json(history);
});

// Trade index funds (buy/sell)
app.post('/api/indexfunds/trade', (req, res) => {
  const { symbol, action, shares } = req.body;
  
  // If market is closed, queue the order instead of rejecting it
  if (!isMarketOpen(gameTime)) {
    try {
      // Validate inputs
      if (!symbol || !action || !shares || shares <= 0) {
        return res.status(400).json({ error: 'Invalid trade parameters' });
      }
      
      // Validate action
      if (!['buy', 'sell'].includes(action)) {
        return res.status(400).json({ error: 'Invalid action for index fund' });
      }
      
      // Validate symbol to prevent prototype pollution
      if (typeof symbol !== 'string' || symbol === '__proto__' || symbol === 'constructor' || symbol === 'prototype') {
        return res.status(400).json({ error: 'Invalid symbol' });
      }
      
      // Queue the order
      const result = dbModule.insertPendingOrder.run(
        symbol,
        action,
        shares,
        'indexfund',
        gameTime.toISOString(),
        'pending'
      );
      
      return res.json({ 
        success: true,
        message: 'Market is closed. Order has been queued and will be executed when market opens.',
        pendingOrderId: result.lastInsertRowid,
        symbol,
        action,
        shares,
        queuedAt: gameTime.toISOString()
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to queue order: ' + error.message });
    }
  }
  
  const fund = indexFunds.indexFunds.find(f => f.symbol === symbol);
  if (!fund) {
    return res.status(404).json({ error: 'Index fund not found' });
  }
  
  if (gameTime < fund.inceptionDate) {
    return res.status(400).json({ error: 'This index fund is not available yet' });
  }
  
  const fundPrice = indexFunds.calculateIndexPrice(fund, gameTime, timeMultiplier, isPaused);
  if (!fundPrice) {
    return res.status(404).json({ error: 'Unable to calculate fund price' });
  }
  
  const totalCost = fundPrice * shares;
  const tradingFee = getTradingFee(totalCost, gameTime);
  
  if (action === 'buy') {
    // Validate symbol to prevent prototype pollution
    if (typeof symbol !== 'string' || symbol === '__proto__' || symbol === 'constructor' || symbol === 'prototype') {
      return res.status(400).json({ error: 'Invalid symbol' });
    }
    
    const totalWithFee = totalCost + tradingFee;
    
    if (userAccount.cash < totalWithFee) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }
    
    userAccount.cash -= totalWithFee;
    
    // Initialize index fund holding if needed
    if (!userAccount.indexFundHoldings[symbol]) {
      userAccount.indexFundHoldings[symbol] = {
        shares: 0,
        purchaseHistory: []
      };
    }
    
    userAccount.indexFundHoldings[symbol].shares += shares;
    userAccount.indexFundHoldings[symbol].purchaseHistory.push({
      date: new Date(gameTime),
      shares: shares,
      pricePerShare: fundPrice
    });
    
    // Record transaction
    userAccount.transactions.push({
      date: new Date(gameTime),
      type: 'buy-indexfund',
      symbol,
      name: fund.name,
      shares,
      pricePerShare: fundPrice,
      tradingFee: tradingFee,
      total: totalWithFee
    });
    
    // Record fee
    if (tradingFee > 0) {
      userAccount.fees.push({
        date: new Date(gameTime),
        type: 'trading',
        amount: tradingFee,
        description: `Trading fee for buying ${shares} shares of ${fund.name}`
      });
    }
    
  } else if (action === 'sell') {
    // Validate symbol to prevent prototype pollution
    if (typeof symbol !== 'string' || symbol === '__proto__' || symbol === 'constructor' || symbol === 'prototype') {
      return res.status(400).json({ error: 'Invalid symbol' });
    }
    
    const holding = userAccount.indexFundHoldings[symbol];
    if (!holding || holding.shares < shares) {
      return res.status(400).json({ error: 'Insufficient shares' });
    }
    
    // Calculate capital gains tax using FIFO
    let remainingShares = shares;
    let totalCostBasis = 0;
    let taxAmount = 0;
    
    const purchases = holding.purchaseHistory.slice();
    
    while (remainingShares > 0 && purchases.length > 0) {
      const purchase = purchases[0];
      const sharesToSell = Math.min(remainingShares, purchase.shares);
      const costBasis = sharesToSell * purchase.pricePerShare;
      totalCostBasis += costBasis;
      
      // Calculate holding period
      const purchaseDate = new Date(purchase.date);
      const currentDate = new Date(gameTime);
      const holdingDays = (currentDate - purchaseDate) / (1000 * 60 * 60 * 24);
      const isLongTerm = holdingDays >= 365;
      
      // Calculate gain/loss
      const saleProceeds = sharesToSell * fundPrice;
      const capitalGain = saleProceeds - costBasis;
      
      if (capitalGain > 0) {
        const taxRate = isLongTerm ? LONG_TERM_TAX_RATE : SHORT_TERM_TAX_RATE;
        taxAmount += capitalGain * taxRate;
      }
      
      // Update purchase history
      purchase.shares -= sharesToSell;
      if (purchase.shares <= 0) {
        purchases.shift();
      }
      
      remainingShares -= sharesToSell;
    }
    
    // Track which purchases were used in the sale for expense ratio calculation
    const purchasesUsedInSale = [];
    let remainingForExpense = shares;
    
    for (const purchase of holding.purchaseHistory) {
      if (remainingForExpense <= 0) break;
      
      const sharesFromThisPurchase = Math.min(remainingForExpense, purchase.shares);
      purchasesUsedInSale.push({
        shares: sharesFromThisPurchase,
        pricePerShare: purchase.pricePerShare,
        date: purchase.date
      });
      remainingForExpense -= sharesFromThisPurchase;
    }
    
    // Update holding purchase history
    holding.purchaseHistory = purchases;
    
    // Calculate expense ratio fee based on actual holding periods for shares sold
    let totalExpenseFee = 0;
    
    purchasesUsedInSale.forEach(purchase => {
      const daysHeld = (gameTime - new Date(purchase.date)) / (1000 * 60 * 60 * 24);
      const dailyFeeRate = fund.expenseRatio / 365;
      const purchaseValue = purchase.shares * purchase.pricePerShare;
      const fee = purchaseValue * dailyFeeRate * daysHeld;
      totalExpenseFee += fee;
    });
    
    if (totalExpenseFee > 0) {
      userAccount.fees.push({
        date: new Date(gameTime),
        type: 'index-fund-expense',
        amount: totalExpenseFee,
        description: `Expense ratio fee (${(fund.expenseRatio * 100).toFixed(2)}%) for ${fund.name}`
      });
    }
    
    // Apply sale and deduct tax, fee, and expense ratio
    const grossSaleAmount = fundPrice * shares;
    const netSaleProceeds = grossSaleAmount - taxAmount - tradingFee - totalExpenseFee;
    userAccount.cash += netSaleProceeds;
    holding.shares -= shares;
    
    // Clean up if no shares left
    if (holding.shares <= 0) {
      delete userAccount.indexFundHoldings[symbol];
    }
    
    // Record transaction
    userAccount.transactions.push({
      date: new Date(gameTime),
      type: 'sell-indexfund',
      symbol,
      name: fund.name,
      shares,
      pricePerShare: fundPrice,
      total: grossSaleAmount,
      tax: taxAmount,
      tradingFee: tradingFee,
      netProceeds: netSaleProceeds
    });
    
    // Record fee
    if (tradingFee > 0) {
      userAccount.fees.push({
        date: new Date(gameTime),
        type: 'trading',
        amount: tradingFee,
        description: `Trading fee for selling ${shares} shares of ${fund.name}`
      });
    }
    
    // Record tax if any
    if (taxAmount > 0) {
      userAccount.taxes.push({
        date: new Date(gameTime),
        type: 'capital-gains',
        amount: taxAmount,
        description: `Capital gains tax on ${shares} shares of ${fund.name}`
      });
    }
  }
  
  res.json(userAccount);
});

// Tax summary API endpoint
app.get('/api/taxes', (req, res) => {
  const { year } = req.query;
  const targetYear = year ? parseInt(year) : gameTime.getFullYear();
  
  // Filter taxes by year
  const yearlyTaxes = userAccount.taxes.filter(tax => {
    const taxYear = new Date(tax.date).getFullYear();
    return taxYear === targetYear;
  });
  
  // Calculate tax breakdown by type
  const taxBreakdown = {
    capitalGains: 0,
    shortGains: 0,
    dividends: 0,
    wealth: 0,
    total: 0
  };
  
  const detailedTaxes = [];
  
  yearlyTaxes.forEach(tax => {
    if (tax.type === 'capital-gains') {
      taxBreakdown.capitalGains += tax.amount;
    } else if (tax.type === 'short-gains') {
      taxBreakdown.shortGains += tax.amount;
    } else if (tax.type === 'dividend') {
      taxBreakdown.dividends += tax.amount;
    } else if (tax.type === 'wealth') {
      taxBreakdown.wealth += tax.amount;
    }
    taxBreakdown.total += tax.amount;
    
    detailedTaxes.push({
      date: tax.date,
      type: tax.type,
      amount: tax.amount,
      description: tax.description
    });
  });
  
  // Get dividend summary for the year
  const yearlyDividends = userAccount.dividends.filter(div => {
    const divYear = new Date(div.date).getFullYear();
    return divYear === targetYear;
  });
  
  const dividendSummary = {
    totalGross: 0,
    totalTax: 0,
    totalNet: 0,
    count: yearlyDividends.length
  };
  
  yearlyDividends.forEach(div => {
    dividendSummary.totalGross += div.grossAmount;
    dividendSummary.totalTax += div.tax;
    dividendSummary.totalNet += div.netAmount;
  });
  
  // Get transaction summary for capital gains calculations
  const yearlyTransactions = userAccount.transactions.filter(tx => {
    const txYear = new Date(tx.date).getFullYear();
    return txYear === targetYear && (tx.type === 'sell' || tx.type === 'sell-indexfund');
  });
  
  const capitalGainsSummary = {
    totalSales: yearlyTransactions.length,
    totalProceeds: 0,
    totalTax: 0,
    shortTermGains: 0,
    longTermGains: 0
  };
  
  yearlyTransactions.forEach(tx => {
    capitalGainsSummary.totalProceeds += tx.total || 0;
    capitalGainsSummary.totalTax += tx.tax || 0;
  });
  
  // Get all years with tax data
  const yearsWithTaxes = [...new Set(
    userAccount.taxes.map(tax => new Date(tax.date).getFullYear())
  )].sort((a, b) => b - a);
  
  res.json({
    year: targetYear,
    taxBreakdown,
    dividendSummary,
    capitalGainsSummary,
    detailedTaxes,
    yearsWithTaxes,
    currentTaxRates: {
      shortTermCapitalGains: SHORT_TERM_TAX_RATE * 100,
      longTermCapitalGains: LONG_TERM_TAX_RATE * 100,
      dividends: DIVIDEND_TAX_RATE * 100,
      wealth: WEALTH_TAX_RATE * 100,
      wealthTaxThreshold: WEALTH_TAX_THRESHOLD
    }
  });
});

// Pending Orders API endpoints

// Get all pending orders
app.get('/api/pendingorders', (req, res) => {
  try {
    const pendingOrders = dbModule.getAllPendingOrders.all();
    
    const formattedOrders = pendingOrders.map(order => ({
      id: order.id,
      symbol: order.symbol,
      action: order.action,
      shares: order.shares,
      orderType: order.order_type,
      createdAt: order.created_at,
      status: order.status,
      executedAt: order.executed_at,
      executionPrice: order.execution_price,
      error: order.error
    }));
    
    res.json(formattedOrders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve pending orders: ' + error.message });
  }
});

// Get pending orders by status
app.get('/api/pendingorders/status/:status', (req, res) => {
  try {
    const { status } = req.params;
    const pendingOrders = dbModule.getPendingOrders.all(status);
    
    const formattedOrders = pendingOrders.map(order => ({
      id: order.id,
      symbol: order.symbol,
      action: order.action,
      shares: order.shares,
      orderType: order.order_type,
      createdAt: order.created_at,
      status: order.status,
      executedAt: order.executed_at,
      executionPrice: order.execution_price,
      error: order.error
    }));
    
    res.json(formattedOrders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve pending orders: ' + error.message });
  }
});

// Cancel a pending order (POST endpoint)
app.post('/api/pendingorders/:id/cancel', (req, res) => {
  try {
    const { id } = req.params;
    const orderId = parseInt(id);
    
    if (isNaN(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }
    
    // Get the order to check if it's pending
    const order = dbModule.getPendingOrder.get(orderId);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    if (order.status !== 'pending') {
      return res.status(400).json({ 
        error: `Cannot cancel order with status '${order.status}'. Only pending orders can be cancelled.` 
      });
    }
    
    // Mark the order as cancelled
    dbModule.updatePendingOrderStatus.run(
      'cancelled',
      gameTime.toISOString(),
      null,
      'Cancelled by user',
      orderId
    );
    
    res.json({ 
      success: true,
      message: 'Order cancelled successfully',
      orderId: orderId
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel order: ' + error.message });
  }
});

// Cancel a pending order (DELETE endpoint)
app.delete('/api/pendingorders/:id', (req, res) => {
  try {
    const { id } = req.params;
    const orderId = parseInt(id);
    
    if (isNaN(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }
    
    // Get the order to check if it's pending
    const order = dbModule.getPendingOrder.get(orderId);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    if (order.status !== 'pending') {
      return res.status(400).json({ 
        error: `Cannot cancel order with status '${order.status}'. Only pending orders can be cancelled.` 
      });
    }
    
    // Mark the order as cancelled
    dbModule.updatePendingOrderStatus.run(
      'cancelled',
      gameTime.toISOString(),
      null,
      'Cancelled by user',
      orderId
    );
    
    res.json({ 
      success: true,
      message: 'Order cancelled successfully',
      orderId: orderId
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel order: ' + error.message });
  }
});

// Email API (generate emails based on game events)
app.get('/api/emails', (req, res) => {
  const emails = [
    {
      id: 1,
      from: 'support@stockfake.com',
      subject: 'Welcome to StockFake Trading!',
      body: 'Welcome to the trading platform. You have been credited with $10,000 to start trading.',
      date: new Date('1970-01-01'),
      spam: false
    }
  ];
  
  // Reduce dividend emails to yearly on higher speeds (86400 = fast speed, 1s = 1day)
  const shouldThrottleDividends = timeMultiplier >= 86400;
  
  if (shouldThrottleDividends) {
    // Group dividends by year and create yearly summary emails
    const dividendsByYear = {};
    userAccount.dividends.forEach((dividend) => {
      const year = new Date(dividend.date).getFullYear();
      if (!dividendsByYear[year]) {
        dividendsByYear[year] = {
          dividends: [],
          totalGross: 0,
          totalTax: 0,
          totalNet: 0,
          date: dividend.date
        };
      }
      dividendsByYear[year].dividends.push(dividend);
      dividendsByYear[year].totalGross += dividend.grossAmount;
      dividendsByYear[year].totalTax += dividend.tax;
      dividendsByYear[year].totalNet += dividend.netAmount;
    });
    
    // Create yearly summary emails
    Object.entries(dividendsByYear).forEach(([year, summary], index) => {
      emails.push({
        id: 100 + index,
        from: 'dividends@stockfake.com',
        subject: `Annual Dividend Summary - ${year}`,
        body: `Annual dividend summary for ${year}: You received a total of $${summary.totalNet.toFixed(2)} in net dividends (Gross: $${summary.totalGross.toFixed(2)}, Tax: $${summary.totalTax.toFixed(2)}) from ${summary.dividends.length} dividend payment(s).`,
        date: summary.date,
        spam: false
      });
    });
  } else {
    // Add individual dividend emails at normal/slow speeds
    userAccount.dividends.forEach((dividend, index) => {
      emails.push({
        id: 100 + index,
        from: 'dividends@stockfake.com',
        subject: `Dividend Payment - ${dividend.quarter}`,
        body: `You have received $${dividend.netAmount.toFixed(2)} in dividends (Gross: $${dividend.grossAmount.toFixed(2)}, Tax: $${dividend.tax.toFixed(2)}). Payment details: ${dividend.details.map(d => `${d.symbol}: ${d.shares} shares × $${d.dividend.toFixed(2)}`).join(', ')}`,
        date: dividend.date,
        spam: false
      });
    });
  }
  
  // Add tax notification emails
  userAccount.taxes.forEach((tax, index) => {
    if (tax.type === 'capital-gains' || tax.type === 'short-gains') {
      emails.push({
        id: 200 + index,
        from: 'tax@stockfake.com',
        subject: `Tax Payment - ${tax.type === 'short-gains' ? 'Short Sale Gains' : 'Capital Gains'}`,
        body: `A ${tax.type === 'short-gains' ? 'short sale' : 'capital gains'} tax of $${tax.amount.toFixed(2)} has been deducted. ${tax.description}`,
        date: tax.date,
        spam: false
      });
    }
  });
  
  // Add fee notification emails for significant fees
  userAccount.fees.forEach((fee, index) => {
    if (fee.type === 'monthly-maintenance') {
      emails.push({
        id: 300 + index,
        from: 'fees@stockfake.com',
        subject: `Account Fee Charged - ${fee.type}`,
        body: `A fee of $${fee.amount.toFixed(2)} has been charged to your account. ${fee.description}`,
        date: fee.date,
        spam: false
      });
    }
  });
  
  // Add loan notification emails
  userAccount.loanHistory.forEach((loanEvent, index) => {
    if (loanEvent.type === 'taken') {
      emails.push({
        id: 500 + index,
        from: 'loans@stockfake.com',
        subject: `Loan Approved - $${loanEvent.amount.toFixed(2)}`,
        body: `Your loan application has been approved! Net amount deposited: $${loanEvent.netAmount.toFixed(2)} (Interest Rate: ${(loanEvent.interestRate * 100).toFixed(2)}%, Origination Fee: $${loanEvent.originationFee.toFixed(2)})`,
        date: loanEvent.date,
        spam: false
      });
    } else if (loanEvent.type === 'paid-off') {
      emails.push({
        id: 600 + index,
        from: 'loans@stockfake.com',
        subject: `Loan Paid Off - Congratulations!`,
        body: `Loan #${loanEvent.loanId} has been successfully paid off. Your credit score has increased by ${loanEvent.creditScoreChange} points. ${loanEvent.wasOnTime ? 'Thank you for paying on time!' : 'Payment received.'}`,
        date: loanEvent.date,
        spam: false
      });
    } else if (loanEvent.type === 'missed-payment') {
      emails.push({
        id: 700 + index,
        from: 'loans@stockfake.com',
        subject: `⚠️ Missed Payment - Loan #${loanEvent.loanId}`,
        body: `You have missed a payment on Loan #${loanEvent.loanId}. A late fee of $${loanEvent.penalty.toFixed(2)} has been applied. Your credit score has decreased by ${Math.abs(loanEvent.creditScoreChange)} points. Please make a payment as soon as possible.`,
        date: loanEvent.date,
        spam: false
      });
    } else if (loanEvent.type === 'default') {
      emails.push({
        id: 800 + index,
        from: 'loans@stockfake.com',
        subject: `🚨 LOAN DEFAULT - Loan #${loanEvent.loanId}`,
        body: `Your loan (Loan #${loanEvent.loanId}) has gone into default after multiple missed payments. Remaining balance: $${loanEvent.remainingBalance.toFixed(2)}. Your credit score has been severely impacted (-${Math.abs(loanEvent.creditScoreChange)} points). This will affect your ability to obtain future loans.`,
        date: loanEvent.date,
        spam: false
      });
    }
  });
  
  // Add margin call notification emails
  userAccount.marginAccount.marginCalls.forEach((marginCall, index) => {
    if (marginCall.status === 'active') {
      emails.push({
        id: 900 + index,
        from: 'margin@stockfake.com',
        subject: `⚠️ MARGIN CALL - Action Required`,
        body: `Your account has fallen below the maintenance margin requirement. Current margin ratio: ${(marginCall.currentRatio * 100).toFixed(1)}%, Required: ${(marginCall.requiredRatio * 100).toFixed(1)}%. You need to deposit $${marginCall.amountNeeded.toFixed(2)} or reduce positions by ${marginCall.dueDate.toLocaleDateString()}. Failure to meet this margin call may result in forced liquidation.`,
        date: marginCall.issueDate,
        spam: false
      });
    } else if (marginCall.status === 'liquidated') {
      emails.push({
        id: 950 + index,
        from: 'margin@stockfake.com',
        subject: `🚨 FORCED LIQUIDATION - Margin Call Not Met`,
        body: `Your positions have been forcibly liquidated due to failure to meet margin call requirements. This action was necessary to protect against further losses. Please review your account and consider the risks of margin trading.`,
        date: marginCall.liquidationDate,
        spam: false
      });
    }
  });
  
  // Add investment opportunity emails
  const opportunities = emailGenerator.generateInvestmentOpportunities(gameTime, stocks);
  opportunities.forEach((opp, index) => {
    emails.push({
      id: 400 + index,
      from: opp.from,
      subject: opp.subject,
      body: opp.body,
      date: opp.date,
      spam: false
    });
  });
  
  // Add spam emails
  const spamEmails = emailGenerator.generateSpamEmails(gameTime);
  spamEmails.forEach((spam, index) => {
    emails.push({
      id: 1000 + index,
      from: spam.from,
      subject: spam.subject,
      body: spam.body,
      date: spam.date,
      spam: true
    });
  });
  
  res.json(emails.filter(email => email.date <= gameTime).sort((a, b) => b.date - a.date));
});

// Debug/Cheat API Endpoints
// These endpoints are for debugging and testing purposes only

// Set game time to a specific date
app.post('/api/debug/settime', (req, res) => {
  const { time } = req.body;
  if (!time) {
    return res.status(400).json({ error: 'Time is required' });
  }
  
  try {
    gameTime = new Date(time);
    // Update market state tracker to prevent false transitions
    wasMarketOpen = isMarketOpen(gameTime);
    saveGameState(); // Save state after time change
    res.json({ success: true, newTime: gameTime });
  } catch (error) {
    res.status(400).json({ error: 'Invalid time format' });
  }
});

// Skip time forward
app.post('/api/debug/skiptime', (req, res) => {
  const { amount, unit } = req.body;
  
  if (!amount || !unit) {
    return res.status(400).json({ error: 'Amount and unit are required' });
  }
  
  const multipliers = {
    'hour': 60 * 60 * 1000,
    'day': 24 * 60 * 60 * 1000,
    'week': 7 * 24 * 60 * 60 * 1000,
    'month': 30 * 24 * 60 * 60 * 1000,
    'year': 365 * 24 * 60 * 60 * 1000
  };
  
  if (!multipliers[unit]) {
    return res.status(400).json({ error: 'Invalid unit. Use: hour, day, week, month, year' });
  }
  
  gameTime = new Date(gameTime.getTime() + (amount * multipliers[unit]));
  // Update market state tracker to prevent false transitions
  wasMarketOpen = isMarketOpen(gameTime);
  saveGameState(); // Save state after time skip
  res.json({ success: true, newTime: gameTime });
});

// Modify cash balance
app.post('/api/debug/modifycash', (req, res) => {
  const { amount } = req.body;
  
  if (typeof amount !== 'number') {
    return res.status(400).json({ error: 'Amount must be a number' });
  }
  
  userAccount.cash += amount;
  res.json({ success: true, newCash: userAccount.cash });
});

// Set credit score
app.post('/api/debug/setcreditscore', (req, res) => {
  const { score } = req.body;
  
  if (typeof score !== 'number' || score < 300 || score > 850) {
    return res.status(400).json({ error: 'Score must be between 300 and 850' });
  }
  
  userAccount.creditScore = score;
  res.json({ success: true, newScore: userAccount.creditScore });
});

// Add stock to portfolio
app.post('/api/debug/addstock', (req, res) => {
  const { symbol, shares } = req.body;
  
  if (!symbol || typeof shares !== 'number' || shares <= 0) {
    return res.status(400).json({ error: 'Valid symbol and positive shares required' });
  }
  
  // Check if stock exists
  const stockPrice = stocks.getStockPrice(symbol, gameTime, timeMultiplier, isPaused);
  if (!stockPrice) {
    return res.status(404).json({ error: 'Stock not found or not available at current time' });
  }
  
  if (!userAccount.portfolio[symbol]) {
    userAccount.portfolio[symbol] = 0;
  }
  
  userAccount.portfolio[symbol] += shares;
  
  // Add to purchase history with current price (for tax purposes)
  if (!userAccount.purchaseHistory[symbol]) {
    userAccount.purchaseHistory[symbol] = [];
  }
  userAccount.purchaseHistory[symbol].push({
    shares,
    price: stockPrice.price,
    date: gameTime
  });
  
  res.json({ 
    success: true, 
    symbol, 
    totalShares: userAccount.portfolio[symbol] 
  });
});

// Remove stock from portfolio
app.post('/api/debug/removestock', (req, res) => {
  const { symbol } = req.body;
  
  if (!symbol) {
    return res.status(400).json({ error: 'Symbol is required' });
  }
  
  if (!userAccount.portfolio[symbol]) {
    return res.status(404).json({ error: 'Stock not in portfolio' });
  }
  
  delete userAccount.portfolio[symbol];
  delete userAccount.purchaseHistory[symbol];
  
  res.json({ success: true, symbol });
});

// Clear all holdings
app.post('/api/debug/clearholdings', (req, res) => {
  userAccount.portfolio = {};
  userAccount.indexFundHoldings = {};
  userAccount.shortPositions = {};
  userAccount.purchaseHistory = {};
  userAccount.shareholderInfluence = {};
  
  res.json({ success: true });
});

// Reset game to initial state
app.post('/api/debug/reset', (req, res) => {
  gameTime = new Date('1970-01-01T09:30:00Z'); // Use UTC timezone
  isPaused = false;
  timeMultiplier = 3600;
  
  userAccount = {
    cash: 10000,
    portfolio: {},
    indexFundHoldings: {},
    shortPositions: {},
    purchaseHistory: {},
    transactions: [],
    dividends: [],
    taxes: [],
    fees: [],
    lastTradeTime: {},
    shareholderInfluence: {},
    creditScore: 750,
    loans: [],
    loanHistory: [],
    marginAccount: {
      marginBalance: 0,
      marginInterestRate: 0.08,
      lastInterestDate: gameTime,
      isEnabled: false,
      marginCalls: []
    }
  };
  
  res.json({ success: true, message: 'Game reset to initial state' });
});

// Add route for cheat page
app.get('/cheat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cheat.html'));
});

app.listen(PORT, () => {
  console.log(`StockFake server running on port ${PORT}`);
  console.log(`Game started at ${gameTime}`);
});
