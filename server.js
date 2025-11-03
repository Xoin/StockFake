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
const historicalEvents = require('./data/historical-events');
const economicIndicators = require('./data/economic-indicators');
const bondsData = require('./data/bonds');
const treasuryYields = require('./data/treasury-yields');
const cryptoData = require('./data/cryptocurrencies');

// Load helper modules
const indexFundRebalancing = require('./helpers/indexFundRebalancing');
const stockSplits = require('./helpers/stockSplits');
const constants = require('./helpers/constants');
const corporateEvents = require('./helpers/corporateEvents');
const dynamicRates = require('./helpers/dynamicRatesGenerator');
const dataRetention = require('./helpers/dataRetention');
const bondManager = require('./helpers/bondManager');
const cryptoManager = require('./helpers/cryptoManager');

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public', 'views'));

// Middleware
app.use(express.json());

// Middleware to handle legacy .html URLs (must be before static middleware)
// Whitelist of known pages to prevent open redirects
const validPages = new Set([
  '/index', '/bank', '/trading', '/news', '/email', '/graphs', 
  '/loans', '/bonds', '/crypto', '/taxes', '/cheat', '/indexfunds', '/indexfund', '/company', '/pendingorders', '/status'
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

// Initialize rebalancing configurations for all index funds
indexFundRebalancing.initializeRebalancingConfigs(indexFunds.indexFunds, gameTime);
console.log('Index fund rebalancing configurations initialized');

// Initialize corporate events
corporateEvents.initializeCorporateEvents();
console.log('Corporate events initialized');

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

app.get('/bonds', (req, res) => {
  res.render('bonds');
});

app.get('/crypto', (req, res) => {
  res.render('crypto');
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

app.get('/status', (req, res) => {
  res.render('status');
});

app.get('/events', (req, res) => {
  res.render('events');
});

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/api/stocks', (req, res) => {
  const stockData = stocks.getStockData(gameTime, timeMultiplier, isPaused);
  
  // Add share availability info to each stock and filter out unavailable companies
  const stocksWithAvailability = stockData
    .filter(stock => corporateEvents.isCompanyAvailable(stock.symbol, gameTime))
    .map(stock => {
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
const TOP_MOVERS_COUNT = 5; // Number of top gainers/losers to show
const MAX_INDEX_FUNDS_DISPLAY = 10; // Maximum index funds to display in charts

// Helper function to determine sampling interval based on time period
function getSamplingInterval(daysToFetch) {
  let sampleInterval = 1; // days
  if (daysToFetch > 7300) { // > 20 years
    sampleInterval = 365; // Yearly
  } else if (daysToFetch > 1825) { // > 5 years
    sampleInterval = 90; // Quarterly
  } else if (daysToFetch > 730) { // > 2 years
    sampleInterval = 30; // Monthly
  } else if (daysToFetch > 365) { // > 1 year
    sampleInterval = 7; // Weekly
  } else if (daysToFetch > 180) { // > 6 months
    sampleInterval = 3; // Every 3 days
  } else if (daysToFetch > 90) { // > 3 months
    sampleInterval = 2; // Every 2 days
  }
  return sampleInterval;
}

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
  const sampleInterval = getSamplingInterval(daysToFetch);
  
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

// Sector performance API for sector-based charts
app.get('/api/market/sectors', (req, res) => {
  const { days } = req.query;
  const daysToFetch = parseInt(days) || 30;
  
  // Get all unique sectors
  const allStocks = stocks.getStockData(gameTime, timeMultiplier, false, BYPASS_CACHE_FOR_HISTORICAL);
  const sectors = [...new Set(allStocks.map(s => s.sector).filter(Boolean))];
  
  // Calculate sector performance over time
  const sectorHistory = {};
  sectors.forEach(sector => {
    sectorHistory[sector] = [];
  });
  
  // Determine sampling interval
  const sampleInterval = getSamplingInterval(daysToFetch);
  
  // Calculate average price for each sector at each time point
  for (let i = daysToFetch; i >= 0; i -= sampleInterval) {
    const date = new Date(gameTime.getTime() - (i * 24 * 60 * 60 * 1000));
    const stocksAtDate = stocks.getStockData(date, timeMultiplier, false, BYPASS_CACHE_FOR_HISTORICAL);
    
    // Group by sector
    const sectorGroups = {};
    stocksAtDate.forEach(stock => {
      if (stock.sector) {
        if (!sectorGroups[stock.sector]) {
          sectorGroups[stock.sector] = [];
        }
        sectorGroups[stock.sector].push(stock.price);
      }
    });
    
    // Calculate average for each sector
    Object.entries(sectorGroups).forEach(([sector, prices]) => {
      const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
      if (sectorHistory[sector]) {
        sectorHistory[sector].push({
          date: date.toISOString(),
          value: avgPrice,
          count: prices.length
        });
      }
    });
  }
  
  res.json({
    sectors: Object.keys(sectorHistory).sort(),
    history: sectorHistory
  });
});

// Market health indicators API
app.get('/api/market/health', (req, res) => {
  const { days } = req.query;
  const daysToFetch = parseInt(days) || 30;
  const history = [];
  
  // Determine sampling interval
  const sampleInterval = getSamplingInterval(daysToFetch);
  
  // Calculate market health metrics over time
  for (let i = daysToFetch; i >= 0; i -= sampleInterval) {
    const date = new Date(gameTime.getTime() - (i * 24 * 60 * 60 * 1000));
    const stocksAtDate = stocks.getStockData(date, timeMultiplier, false, BYPASS_CACHE_FOR_HISTORICAL);
    
    if (stocksAtDate.length > 0) {
      // Calculate advancing vs declining (compare to 5 days prior to avoid daily noise)
      // This provides a more stable trend indicator
      const lookbackDays = 5;
      const prevDate = new Date(date.getTime() - (lookbackDays * 24 * 60 * 60 * 1000));
      const prevStocks = stocks.getStockData(prevDate, timeMultiplier, false, BYPASS_CACHE_FOR_HISTORICAL);
      
      let advancing = 0;
      let declining = 0;
      let unchanged = 0;
      
      stocksAtDate.forEach(stock => {
        const prevStock = prevStocks.find(s => s.symbol === stock.symbol);
        if (prevStock) {
          // Use a threshold to avoid counting tiny fluctuations
          const priceChange = ((stock.price - prevStock.price) / prevStock.price) * 100;
          if (priceChange > 0.5) advancing++;
          else if (priceChange < -0.5) declining++;
          else unchanged++;
        } else {
          // If no previous stock data found, use the stock's built-in change percentage
          // This handles the case where we're beyond historical data
          if (stock.change > 0.5) advancing++;
          else if (stock.change < -0.5) declining++;
          else unchanged++;
        }
      });
      
      // Calculate market breadth (advancing - declining)
      const breadth = advancing - declining;
      const breadthRatio = stocksAtDate.length > 0 ? breadth / stocksAtDate.length : 0;
      
      // Calculate average price and volatility
      const avgPrice = stocksAtDate.reduce((sum, s) => sum + s.price, 0) / stocksAtDate.length;
      const prices = stocksAtDate.map(s => s.price);
      const variance = prices.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / prices.length;
      const volatility = Math.sqrt(variance);
      
      history.push({
        date: date.toISOString(),
        advancing,
        declining,
        unchanged,
        breadth,
        breadthRatio,
        totalStocks: stocksAtDate.length,
        avgPrice,
        volatility
      });
    }
  }
  
  res.json(history);
});

// Market statistics API (current snapshot)
app.get('/api/market/stats', (req, res) => {
  const allStocks = stocks.getStockData(gameTime, timeMultiplier, false);
  
  if (allStocks.length === 0) {
    return res.json({
      totalStocks: 0,
      sectors: [],
      marketCap: 0
    });
  }
  
  // Calculate sector breakdown
  const sectorGroups = {};
  allStocks.forEach(stock => {
    if (stock.sector) {
      if (!sectorGroups[stock.sector]) {
        sectorGroups[stock.sector] = {
          count: 0,
          totalValue: 0,
          avgPrice: 0
        };
      }
      sectorGroups[stock.sector].count++;
      sectorGroups[stock.sector].totalValue += stock.price;
    }
  });
  
  // Calculate averages
  Object.keys(sectorGroups).forEach(sector => {
    sectorGroups[sector].avgPrice = sectorGroups[sector].totalValue / sectorGroups[sector].count;
  });
  
  // Get top gainers and losers (compared to previous day)
  const prevDate = new Date(gameTime.getTime() - (24 * 60 * 60 * 1000));
  const prevStocks = stocks.getStockData(prevDate, timeMultiplier, false);
  
  const changes = allStocks.map(stock => {
    const prevStock = prevStocks.find(s => s.symbol === stock.symbol);
    if (prevStock) {
      const change = ((stock.price - prevStock.price) / prevStock.price) * 100;
      return {
        symbol: stock.symbol,
        name: stock.name,
        sector: stock.sector,
        price: stock.price,
        change
      };
    }
    return null;
  }).filter(Boolean);
  
  changes.sort((a, b) => b.change - a.change);
  const topGainers = changes.slice(0, TOP_MOVERS_COUNT);
  const topLosers = changes.slice(-TOP_MOVERS_COUNT).reverse();
  
  res.json({
    totalStocks: allStocks.length,
    sectorBreakdown: sectorGroups,
    sectors: Object.keys(sectorGroups).sort(),
    topGainers,
    topLosers,
    avgPrice: allStocks.reduce((sum, s) => sum + s.price, 0) / allStocks.length
  });
});

// Market year stats API - shows expected returns for different years
app.get('/api/market/year-stats', (req, res) => {
  const { year } = req.query;
  
  if (year) {
    // Get stats for a specific year
    const yearStats = stocks.getYearMarketStats(parseInt(year));
    res.json(yearStats);
  } else {
    // Get stats for current year and next 10 years
    const currentYear = gameTime.getFullYear();
    const yearStats = [];
    
    for (let y = currentYear; y <= currentYear + 10; y++) {
      yearStats.push(stocks.getYearMarketStats(y));
    }
    
    res.json({
      currentYear: currentYear,
      stats: yearStats
    });
  }
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
const MS_PER_DAY = 24 * 60 * 60 * 1000; // Milliseconds in a day

// Margin trading constants
const INITIAL_MARGIN_REQUIREMENT = 0.50; // 50% initial margin (post-1974 regulation)
const INITIAL_MARGIN_REQUIREMENT_1970 = 0.70; // 70% initial margin in early 1970s
const MAINTENANCE_MARGIN_REQUIREMENT = 0.30; // 30% maintenance margin (25% is typical, using 30% for safety)
const MARGIN_CALL_GRACE_PERIOD_DAYS = 5; // Days to meet margin call before forced liquidation
const MARGIN_INTEREST_RATE_BASE = 0.08; // 8% annual base rate on margin loans

// Dividend processing constant
const MAX_DIVIDEND_QUARTERS_TO_PROCESS = 40; // Safety limit: maximum quarters to process when catching up (prevents processing too many at once)

// Tax rates (base rates - dynamic rates come from constants module)
const SHORT_TERM_TAX_RATE = constants.SHORT_TERM_TAX_RATE;
const LONG_TERM_TAX_RATE = constants.LONG_TERM_TAX_RATE;
const DIVIDEND_TAX_RATE = constants.DIVIDEND_TAX_RATE;

// Fee structure
const TRADING_FEE_FLAT = 9.99; // Flat fee per trade in 1970s, will decrease over time
const TRADING_FEE_PERCENTAGE = 0.001; // 0.1% of trade value
const MONTHLY_ACCOUNT_FEE = 5.00; // Monthly maintenance fee (starts in 1990s)
const MINIMUM_BALANCE = 1000; // Minimum balance to avoid fees (starts in 1990s)
const SHORT_BORROW_FEE_ANNUAL = 0.05; // 5% annual fee to borrow shares for shorting

// Inflation and dividend rates come from constants module (supports dynamic generation for post-2024)
const inflationRates = constants.inflationRates;
const dividendRates = constants.dividendRates;

let lastMonthlyFeeCheck = null;
let lastInflationCheck = null;
let lastWealthTaxCheck = null;
let cumulativeInflation = 1.0; // Tracks purchasing power relative to 1970

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
      
      // Extract year from quarter key (e.g., "2025-Q1" -> 2025)
      const quarterYear = parseInt(qKey.split('-')[0]);
      
      for (const [symbol, shares] of Object.entries(userAccount.portfolio)) {
        if (shares > 0) {
          const dividendRate = constants.getDividendRate(symbol, quarterYear);
          if (dividendRate > 0) {
            const dividend = shares * dividendRate;
            totalDividends += dividend;
            dividendDetails.push({ symbol, shares, dividend });
          }
        }
      }
      
      if (totalDividends > 0) {
        // Get tax rates for the year
        const taxRates = constants.getTaxRates(quarterYear);
        const dividendTax = totalDividends * taxRates.dividendTaxRate;
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

// Rebalancing check interval (30 seconds)
const REBALANCING_CHECK_INTERVAL_MS = 30000;

// Check and process index fund rebalancing
function checkIndexFundRebalancing() {
  if (!isPaused) {
    const results = indexFundRebalancing.processAutoRebalancing(
      indexFunds.indexFunds,
      gameTime,
      timeMultiplier,
      isPaused
    );
    
    if (results.length > 0) {
      console.log(`Rebalanced ${results.length} index fund(s)`);
      for (const result of results) {
        console.log(`  - ${result.fundName}: ${result.changes.adjusted.length} constituents adjusted, ${result.changes.added.length} added, ${result.changes.removed.length} removed`);
      }
    }
  }
}

// Call this periodically
setInterval(checkIndexFundRebalancing, REBALANCING_CHECK_INTERVAL_MS);

// Stock split check interval (30 minutes - checks daily when conditions are met)
const STOCK_SPLIT_CHECK_INTERVAL_MS = 1800000; // 30 minutes

// Check and process stock splits
function checkStockSplits() {
  if (!isPaused && isMarketOpen(gameTime)) {
    try {
      // Get current stock prices
      const currentStocks = stocks.getStockData(gameTime, timeMultiplier, isPaused, true);
      
      // Check for splits
      const result = stockSplits.checkAndApplySplits(gameTime.toISOString(), currentStocks);
      
      if (result.splitsApplied && result.splitsApplied.length > 0) {
        console.log(`Applied ${result.splitsApplied.length} stock split(s):`);
        for (const split of result.splitsApplied) {
          console.log(`  - ${split.symbol}: ${split.ratio}:1 split ($${split.priceBeforeSplit.toFixed(2)} → $${split.priceAfterSplit.toFixed(2)})`);
          if (split.portfolioAffected) {
            console.log(`    User portfolio adjusted`);
          }
        }
      }
    } catch (error) {
      console.error('Error checking stock splits:', error);
    }
  }
}

// Call this periodically
setInterval(checkStockSplits, STOCK_SPLIT_CHECK_INTERVAL_MS);

// Check and process corporate events (mergers, bankruptcies, IPOs, going private)
function checkCorporateEvents() {
  if (!isPaused) {
    try {
      const processedEvents = corporateEvents.processCorporateEvents(gameTime);
      if (processedEvents.length > 0) {
        console.log(`Processed ${processedEvents.length} corporate event(s) at ${gameTime.toISOString()}`);
      }
    } catch (error) {
      console.error('Error processing corporate events:', error);
    }
  }
}

// Check for corporate events every 10 seconds
const CORPORATE_EVENTS_CHECK_INTERVAL_MS = 10000;
setInterval(checkCorporateEvents, CORPORATE_EVENTS_CHECK_INTERVAL_MS);

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
  
  const inflationRate = constants.getInflationRate(currentYear);
  if (lastInflationCheck !== yearKey && inflationRate !== undefined) {
    lastInflationCheck = yearKey;
    
    // Update cumulative inflation (compounds)
    const annualInflationRate = inflationRate / 100;
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
    
    // Get dynamic tax rates for the current year
    const taxRates = constants.getTaxRates(currentYear);
    const wealthTaxRate = taxRates.wealthTaxRate;
    const wealthTaxThreshold = taxRates.wealthTaxThreshold;
    
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
    if (netWorth > wealthTaxThreshold) {
      const taxableWealth = netWorth - wealthTaxThreshold;
      const wealthTax = taxableWealth * wealthTaxRate;
      
      // Check if user has sufficient cash to pay wealth tax
      if (userAccount.cash >= wealthTax) {
        // Deduct wealth tax from cash
        userAccount.cash -= wealthTax;
        
        // Record tax payment
        userAccount.taxes.push({
          date: new Date(gameTime),
          type: 'wealth',
          amount: wealthTax,
          description: `Annual wealth tax for ${currentYear} (${(wealthTaxRate * 100).toFixed(2)}% on net worth above $${wealthTaxThreshold.toLocaleString()})`
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

// Bond processing functions
let lastBondInterestCheck = null;
let lastBondMaturityCheck = null;

function checkBondInterestPayments() {
  if (isPaused) return;
  
  try {
    const currentCheck = `${gameTime.getFullYear()}-${gameTime.getMonth() + 1}`;
    
    if (lastBondInterestCheck !== currentCheck) {
      const payments = bondManager.processInterestPayments(gameTime);
      if (payments.length > 0) {
        console.log(`Processed ${payments.length} bond interest payment(s)`);
      }
      lastBondInterestCheck = currentCheck;
    }
  } catch (error) {
    console.error('Error processing bond interest payments:', error);
  }
}

function checkBondMaturities() {
  if (isPaused) return;
  
  try {
    const currentCheck = gameTime.toISOString().split('T')[0];
    
    if (lastBondMaturityCheck !== currentCheck) {
      const maturedBonds = bondManager.processMaturities(gameTime);
      if (maturedBonds.length > 0) {
        console.log(`Processed ${maturedBonds.length} bond maturity/maturities`);
      }
      lastBondMaturityCheck = currentCheck;
    }
  } catch (error) {
    console.error('Error processing bond maturities:', error);
  }
}

// Call these periodically
setInterval(checkAndChargeMonthlyFee, 10000);
setInterval(trackInflation, 5000);
setInterval(assessWealthTax, 5000);
setInterval(updateShortPositions, 10000);
setInterval(checkBondInterestPayments, 10000);
setInterval(checkBondMaturities, 10000);

// Check and run data pruning periodically (every 5 minutes of real time)
setInterval(() => {
  try {
    const config = dbModule.getDataRetentionConfig.get();
    if (config && config.auto_pruning_enabled) {
      if (dataRetention.shouldRunPruning(gameTime)) {
        console.log('Running automatic data pruning...');
        dataRetention.pruneOldData(gameTime);
      }
    }
  } catch (error) {
    console.error('Error during data pruning check:', error);
  }
}, 5 * 60 * 1000); // Check every 5 minutes

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
  // Don't process margin interest when game is paused
  if (isPaused) return;
  
  if (userAccount.marginAccount.marginBalance <= 0) return;
  
  const currentDate = new Date(gameTime);
  const lastInterestDate = userAccount.marginAccount.lastMarginInterestDate 
    ? new Date(userAccount.marginAccount.lastMarginInterestDate) 
    : currentDate;
  
  const daysSinceLastCharge = (currentDate - lastInterestDate) / (1000 * 60 * 60 * 24);
  
  // Charge interest daily with compound interest
  // Only accrue for complete days to prevent repeated partial-day accruals
  if (daysSinceLastCharge >= 1) {
    const daysToAccrue = Math.floor(daysSinceLastCharge);
    const dailyRate = userAccount.marginAccount.marginInterestRate / 365;
    const balanceBeforeInterest = userAccount.marginAccount.marginBalance;
    
    // Compound interest: P * (1 + r)^t - P
    const interest = balanceBeforeInterest * (Math.pow(1 + dailyRate, daysToAccrue) - 1);
    
    // Add interest to margin balance
    userAccount.marginAccount.marginBalance += interest;
    
    // Update last interest date by the number of days we accrued
    const newInterestDate = new Date(lastInterestDate.getTime() + (daysToAccrue * MS_PER_DAY));
    userAccount.marginAccount.lastMarginInterestDate = newInterestDate;
    
    // Record fee
    userAccount.fees.push({
      date: new Date(gameTime),
      type: 'margin-interest',
      amount: interest,
      description: `Margin interest on $${balanceBeforeInterest.toFixed(2)} balance for ${daysToAccrue} day(s)`
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
  // Don't process loans when game is paused
  if (isPaused) return;
  
  const currentDate = new Date(gameTime);
  
  for (const loan of userAccount.loans) {
    if (loan.status !== 'active') continue;
    
    const company = loanCompanies.getCompany(loan.companyId);
    if (!company) continue;
    
    // Calculate days since last interest accrual (not last payment!)
    // Initialize lastInterestAccrual if not set
    if (!loan.lastInterestAccrual) {
      loan.lastInterestAccrual = loan.startDate;
    }
    
    const lastAccrual = new Date(loan.lastInterestAccrual);
    const daysSinceLastAccrual = (currentDate - lastAccrual) / (1000 * 60 * 60 * 24);
    
    // Only accrue interest if at least 1 day has passed since last accrual
    if (daysSinceLastAccrual >= 1) {
      const dailyRate = loan.interestRate / 365;
      const daysToAccrue = Math.floor(daysSinceLastAccrual); // Only accrue for complete days
      const interest = loan.balance * dailyRate * daysToAccrue;
      loan.balance += interest;
      
      // Update last accrual time by the number of days we just accrued
      const newAccrualDate = new Date(lastAccrual.getTime() + (daysToAccrue * MS_PER_DAY));
      loan.lastInterestAccrual = newAccrualDate.toISOString();
    }
    
    // Check if payment is overdue (30 days grace period)
    const dueDate = new Date(loan.dueDate);
    if (currentDate > dueDate) {
      const daysOverdue = (currentDate - dueDate) / (1000 * 60 * 60 * 24);
      
      // Calculate how many 30-day periods have passed since due date
      // This allows for multiple missed payments to accumulate
      const missedPaymentPeriods = Math.floor(daysOverdue / 30);
      
      // Only process if we have more missed periods than recorded
      if (missedPaymentPeriods > loan.missedPayments) {
        const newMissedPayments = missedPaymentPeriods - loan.missedPayments;
        
        for (let i = 0; i < newMissedPayments; i++) {
          loan.missedPayments += 1;
          
          // Apply late payment penalty for each missed payment
          const penalty = loan.balance * company.latePaymentPenalty;
          loan.balance += penalty;
          
          // Decrease credit score
          userAccount.creditScore = Math.max(300, userAccount.creditScore + company.creditScoreImpact.late);
          
          // Record fee
          userAccount.fees.push({
            date: new Date(gameTime),
            type: 'loan-late-payment',
            amount: penalty,
            description: `Late payment penalty #${loan.missedPayments} for loan #${loan.id} from ${company.name}`
          });
          
          userAccount.loanHistory.push({
            date: new Date(gameTime),
            type: 'missed-payment',
            loanId: loan.id,
            companyId: loan.companyId,
            penalty: penalty,
            missedPaymentNumber: loan.missedPayments,
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
            
            // Force collection: deduct from cash (can go negative)
            if (userAccount.cash > 0) {
              const amountCollected = Math.min(userAccount.cash, loan.balance);
              userAccount.cash -= amountCollected;
              loan.balance -= amountCollected;
              
              userAccount.transactions.push({
                date: new Date(gameTime),
                type: 'loan-collection',
                amount: -amountCollected,
                description: `Forced collection on defaulted loan #${loan.id} from ${company.name}`
              });
            }
            
            // If still have balance owed and cash is now negative or insufficient, 
            // add to debt that will incur daily penalties
            if (loan.balance > 0) {
              // Negative cash balance will be handled by processNegativeBalance()
              // which charges 10% APR penalty on negative balances
              userAccount.cash -= loan.balance;
              loan.balance = 0;
              
              userAccount.transactions.push({
                date: new Date(gameTime),
                type: 'loan-default-debt',
                amount: 0,
                description: `Defaulted loan balance added to account debt. Total deficit: $${Math.abs(userAccount.cash).toLocaleString()}`
              });
            }
            
            // Break out of the loop once defaulted
            break;
          }
        }
      }
    }
  }
}

// Call this periodically
setInterval(processLoans, 10000);

/**
 * Determine whether to sell assets or take a loan to cover negative balance
 * This function implements smart decision-making based on portfolio value,
 * existing debt, credit score, and the relative size of the shortfall
 * 
 * Note: This function is only called once per day when balance is negative,
 * so the portfolio value recalculation is not a performance concern.
 */
function shouldSellAssetsInsteadOfLoan(negativeAmount) {
  // Calculate portfolio value
  let portfolioValue = 0;
  for (const [symbol, shares] of Object.entries(userAccount.portfolio)) {
    if (shares > 0) {
      const stockData = stocks.getStockPrice(symbol, gameTime, timeMultiplier, isPaused);
      if (stockData && stockData.price > 0) {
        portfolioValue += stockData.price * shares;
      }
    }
  }
  
  // Calculate total loan debt
  let totalLoanDebt = 0;
  for (const loan of userAccount.loans) {
    if (loan.status === 'active') {
      totalLoanDebt += loan.balance;
    }
  }
  
  // Decision logic:
  
  // 1. If no portfolio to sell, must take loan (if available)
  if (portfolioValue === 0) {
    return false;
  }
  
  // 2. If already heavily in debt (loans > 50% of portfolio value), prefer selling
  if (totalLoanDebt > portfolioValue * 0.5) {
    console.log(`Decision: SELL - Already heavily in debt ($${totalLoanDebt.toFixed(2)} vs portfolio $${portfolioValue.toFixed(2)})`);
    return true;
  }
  
  // 3. If portfolio value can easily cover the negative amount (>2x), prefer selling
  if (portfolioValue > negativeAmount * 2) {
    console.log(`Decision: SELL - Portfolio ($${portfolioValue.toFixed(2)}) can easily cover debt ($${negativeAmount.toFixed(2)})`);
    return true;
  }
  
  // 4. If credit score is poor (<600), avoid more loans
  if (userAccount.creditScore < 600) {
    console.log(`Decision: SELL - Credit score too low (${userAccount.creditScore})`);
    return true;
  }
  
  // 5. If negative amount is small relative to portfolio (<10%), prefer selling
  if (portfolioValue > 0 && negativeAmount < portfolioValue * 0.1) {
    console.log(`Decision: SELL - Shortfall is small relative to portfolio (${((negativeAmount / portfolioValue) * 100).toFixed(1)}%)`);
    return true;
  }
  
  // Default: take loan if available (portfolio is small or would be wiped out)
  console.log(`Decision: LOAN - Portfolio too small to liquidate ($${portfolioValue.toFixed(2)} vs debt $${negativeAmount.toFixed(2)})`);
  return false;
}

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
  
  // If negative for more than EMERGENCY_ACTION_DAYS, try to get an emergency loan or sell stocks
  const daysNegative = userAccount.daysWithNegativeBalance || 0;
  userAccount.daysWithNegativeBalance = daysNegative + 1;
  
  // Take action after configured days of negative balance
  if (daysNegative >= EMERGENCY_ACTION_DAYS && daysNegative % EMERGENCY_ACTION_DAYS === 0) {
    // Decide whether to sell assets or take a loan
    const shouldSell = shouldSellAssetsInsteadOfLoan(negativeAmount);
    
    if (shouldSell) {
      // Sell stocks to cover negative balance
      console.log(`Account manager selling stocks to cover negative balance of $${negativeAmount.toFixed(2)}...`);
      sellStocksToRecoverBalance(negativeAmount);
    } else {
      // Try to get an emergency loan to cover the negative balance
      const loanAmount = Math.ceil(negativeAmount * EMERGENCY_LOAN_BUFFER);
      
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
        // No lenders available - must sell stocks
        console.log(`No lenders available for emergency loan. Account manager selling stocks...`);
        sellStocksToRecoverBalance(negativeAmount);
      }
    }
  }
}

// Constants for automated trading
const EMERGENCY_LOAN_BUFFER = 1.5; // 50% buffer for emergency loans
const EMERGENCY_ACTION_DAYS = 3; // Days of negative balance before taking action
const LIQUIDATION_BUFFER_MULTIPLIER = 1.3; // 30% buffer to account for fees and taxes

// Account manager sells stocks to recover negative balance
function sellStocksToRecoverBalance(targetAmount) {
  let amountToRaise = targetAmount * LIQUIDATION_BUFFER_MULTIPLIER;
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
    if (userAccount.purchaseHistory[position.symbol] && userAccount.purchaseHistory[position.symbol].length > 0) {
      // Calculate weighted average cost basis
      const totalCost = userAccount.purchaseHistory[position.symbol].reduce((sum, p) => 
        sum + (p.pricePerShare * p.shares), 0);
      const totalShares = userAccount.purchaseHistory[position.symbol].reduce((sum, p) => 
        sum + p.shares, 0);
      
      // Prevent division by zero
      if (totalShares > 0) {
        const avgCostBasis = totalCost / totalShares;
        const estimatedGain = Math.max(0, (position.price - avgCostBasis) * position.shares);
        const currentYear = gameTime.getFullYear();
        const taxRates = constants.getTaxRates(currentYear);
        estimatedTax = estimatedGain * taxRates.shortTermTaxRate;
      }
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
      currentRate: constants.getInflationRate(gameTime.getFullYear()) || 0
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
            // Get tax rates for the year of the sale
            const saleYear = currentDate.getFullYear();
            const taxRates = constants.getTaxRates(saleYear);
            const taxRate = isLongTerm ? taxRates.longTermTaxRate : taxRates.shortTermTaxRate;
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
        const coverYear = gameTime.getFullYear();
        const taxRates = constants.getTaxRates(coverYear);
        const taxRate = isLongTerm ? taxRates.longTermTaxRate : taxRates.shortTermTaxRate;
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
          const saleYear = currentDate.getFullYear();
          const taxRates = constants.getTaxRates(saleYear);
          const taxRate = isLongTerm ? taxRates.longTermTaxRate : taxRates.shortTermTaxRate;
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
      
      // For buy orders, validate share availability before queueing
      if (action === 'buy' || action === 'buy-margin') {
        const availabilityCheck = shareAvailability.canPurchaseShares(symbol, shares);
        if (!availabilityCheck.canPurchase) {
          return res.status(400).json({ 
            error: availabilityCheck.reason,
            availableShares: availabilityCheck.availableShares
          });
        }
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
          const saleYear = currentDate.getFullYear();
          const taxRates = constants.getTaxRates(saleYear);
          const taxRate = isLongTerm ? taxRates.longTermTaxRate : taxRates.shortTermTaxRate;
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
      const coverYear = gameTime.getFullYear();
      const taxRates = constants.getTaxRates(coverYear);
      const taxRate = isLongTerm ? taxRates.longTermTaxRate : taxRates.shortTermTaxRate;
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
        const saleYear = currentDate.getFullYear();
        const taxRates = constants.getTaxRates(saleYear);
        const taxRate = isLongTerm ? taxRates.longTermTaxRate : taxRates.shortTermTaxRate;
        taxAmount += capitalGain * taxRate;
      }
      
      // Update purchase history
      purchase.shares -= sharesToSell;
      if (purchase.shares <= 0) {
        purchases.shift();
      }
      
      remainingShares -= sharesToSell;
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

// Index Fund Rebalancing API Endpoints

// Get rebalancing history for a specific fund
app.get('/api/indexfunds/:symbol/rebalancing', (req, res) => {
  const { symbol } = req.params;
  const { limit } = req.query;
  
  const limitValue = parseInt(limit) || 50;
  const history = indexFundRebalancing.getRebalancingHistory(symbol, limitValue);
  
  res.json(history);
});

// Get current constituent weights for a fund
app.get('/api/indexfunds/:symbol/weights', (req, res) => {
  const { symbol } = req.params;
  
  const weights = indexFundRebalancing.getCurrentWeights(symbol, gameTime);
  
  if (!weights || weights.length === 0) {
    // If no weights found, calculate and return current theoretical weights
    const fund = indexFunds.indexFunds.find(f => f.symbol === symbol);
    if (!fund) {
      return res.status(404).json({ error: 'Index fund not found' });
    }
    
    const theoreticalWeights = indexFundRebalancing.calculateMarketCapWeights(
      fund.constituents,
      gameTime,
      timeMultiplier,
      isPaused
    );
    
    return res.json({
      weights: theoreticalWeights,
      isTheoretical: true,
      message: 'No historical weights found. Showing current market-cap weighted values.'
    });
  }
  
  res.json({
    weights: weights,
    isTheoretical: false
  });
});

// Get rebalancing configuration for a fund
app.get('/api/indexfunds/:symbol/config', (req, res) => {
  const { symbol } = req.params;
  
  const config = dbModule.getRebalancingConfig.get(symbol);
  
  if (!config) {
    return res.status(404).json({ error: 'Rebalancing configuration not found for this fund' });
  }
  
  res.json({
    fundSymbol: config.fund_symbol,
    strategy: config.strategy,
    frequency: config.rebalancing_frequency,
    driftThreshold: config.drift_threshold,
    lastRebalancing: config.last_rebalancing_date,
    nextScheduled: config.next_scheduled_rebalancing,
    autoRebalanceEnabled: Boolean(config.auto_rebalance_enabled)
  });
});

// Update rebalancing configuration for a fund
app.post('/api/indexfunds/:symbol/config', (req, res) => {
  const { symbol } = req.params;
  const { strategy, frequency, driftThreshold, autoRebalanceEnabled } = req.body;
  
  // Validate fund exists
  const fund = indexFunds.indexFunds.find(f => f.symbol === symbol);
  if (!fund) {
    return res.status(404).json({ error: 'Index fund not found' });
  }
  
  // Get current config
  const currentConfig = dbModule.getRebalancingConfig.get(symbol);
  if (!currentConfig) {
    return res.status(404).json({ error: 'Rebalancing configuration not found' });
  }
  
  // Validate strategy
  const validStrategies = Object.values(indexFundRebalancing.REBALANCING_STRATEGIES);
  if (strategy && !validStrategies.includes(strategy)) {
    return res.status(400).json({ 
      error: `Invalid strategy. Must be one of: ${validStrategies.join(', ')}` 
    });
  }
  
  // Validate frequency
  const validFrequencies = Object.values(indexFundRebalancing.REBALANCING_FREQUENCIES);
  if (frequency && !validFrequencies.includes(frequency)) {
    return res.status(400).json({ 
      error: `Invalid frequency. Must be one of: ${validFrequencies.join(', ')}` 
    });
  }
  
  // Validate drift threshold
  if (driftThreshold !== undefined && (driftThreshold < 0 || driftThreshold > 1)) {
    return res.status(400).json({ error: 'Drift threshold must be between 0 and 1' });
  }
  
  // Calculate new next scheduled rebalancing if frequency changed
  let nextScheduled = currentConfig.next_scheduled_rebalancing;
  if (frequency && frequency !== currentConfig.rebalancing_frequency) {
    const baseDate = currentConfig.last_rebalancing_date 
      ? new Date(currentConfig.last_rebalancing_date)
      : gameTime;
    nextScheduled = indexFundRebalancing.calculateNextRebalancing(baseDate, frequency).toISOString();
  }
  
  // Update configuration
  dbModule.upsertRebalancingConfig.run(
    symbol,
    strategy || currentConfig.strategy,
    frequency || currentConfig.rebalancing_frequency,
    driftThreshold !== undefined ? driftThreshold : currentConfig.drift_threshold,
    currentConfig.last_rebalancing_date,
    nextScheduled,
    autoRebalanceEnabled !== undefined ? (autoRebalanceEnabled ? 1 : 0) : currentConfig.auto_rebalance_enabled
  );
  
  // Get updated config
  const updatedConfig = dbModule.getRebalancingConfig.get(symbol);
  
  res.json({
    success: true,
    message: 'Rebalancing configuration updated',
    config: {
      fundSymbol: updatedConfig.fund_symbol,
      strategy: updatedConfig.strategy,
      frequency: updatedConfig.rebalancing_frequency,
      driftThreshold: updatedConfig.drift_threshold,
      lastRebalancing: updatedConfig.last_rebalancing_date,
      nextScheduled: updatedConfig.next_scheduled_rebalancing,
      autoRebalanceEnabled: Boolean(updatedConfig.auto_rebalance_enabled)
    }
  });
});

// Manually trigger rebalancing for a fund
app.post('/api/indexfunds/:symbol/rebalance', (req, res) => {
  const { symbol } = req.params;
  
  const fund = indexFunds.indexFunds.find(f => f.symbol === symbol);
  if (!fund) {
    return res.status(404).json({ error: 'Index fund not found' });
  }
  
  if (gameTime < fund.inceptionDate) {
    return res.status(400).json({ error: 'This index fund is not available yet' });
  }
  
  const result = indexFundRebalancing.performRebalancing(
    fund,
    gameTime,
    timeMultiplier,
    isPaused,
    indexFundRebalancing.TRIGGER_TYPES.MANUAL
  );
  
  if (result.success) {
    res.json({
      success: true,
      message: `Successfully rebalanced ${fund.name}`,
      result: result
    });
  } else {
    res.status(500).json({
      success: false,
      error: result.error
    });
  }
});

// Get all rebalancing events across all funds
app.get('/api/rebalancing/events', (req, res) => {
  const { limit } = req.query;
  
  const limitValue = parseInt(limit) || 100;
  const events = dbModule.getAllRebalancingEvents.all(limitValue);
  
  const formattedEvents = events.map(event => ({
    id: event.id,
    fundSymbol: event.fund_symbol,
    date: event.rebalancing_date,
    triggerType: event.trigger_type,
    constituentsAdded: event.constituents_added ? JSON.parse(event.constituents_added) : [],
    constituentsRemoved: event.constituents_removed ? JSON.parse(event.constituents_removed) : [],
    weightsAdjusted: event.weights_adjusted ? JSON.parse(event.weights_adjusted) : [],
    totalConstituents: event.total_constituents,
    createdAt: event.created_at
  }));
  
  res.json(formattedEvents);
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
  
  // Get tax rates for the requested year
  const taxRatesForYear = constants.getTaxRates(targetYear);
  
  res.json({
    year: targetYear,
    taxBreakdown,
    dividendSummary,
    capitalGainsSummary,
    detailedTaxes,
    yearsWithTaxes,
    currentTaxRates: {
      shortTermCapitalGains: taxRatesForYear.shortTermTaxRate * 100,
      longTermCapitalGains: taxRatesForYear.longTermTaxRate * 100,
      dividends: taxRatesForYear.dividendTaxRate * 100,
      wealth: taxRatesForYear.wealthTaxRate * 100,
      wealthTaxThreshold: taxRatesForYear.wealthTaxThreshold
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
  
  // Add stock split notification emails from database
  try {
    const splitEmails = dbModule.db.prepare(`
      SELECT * FROM emails 
      WHERE category = 'stock_split' 
      ORDER BY date DESC
    `).all();
    
    splitEmails.forEach((email, index) => {
      emails.push({
        id: 2000 + index,
        from: email.from_address,
        subject: email.subject,
        body: email.body,
        date: new Date(email.date),
        spam: email.spam === 1
      });
    });
  } catch (error) {
    console.error('Error fetching split emails:', error);
  }
  
  res.json(emails.filter(email => email.date <= gameTime).sort((a, b) => b.date - a.date));
});

// Historical Events API endpoint
app.get('/api/historical-events', (req, res) => {
  const { category, severity } = req.query;
  
  // Get historical events up to current game time
  let events = historicalEvents.getEventsUpToDate(gameTime);
  
  // Get dynamic/crash events that have occurred
  const crashEventHistory = marketCrashSim.getEventHistory(1000); // Get all events
  
  // Convert crash events to the same format as historical events
  const dynamicEvents = crashEventHistory
    .filter(event => new Date(event.activatedAt) <= gameTime)
    .map(event => ({
      id: event.id,
      date: event.activatedAt,
      title: event.name,
      category: 'Market Event',
      severity: event.severity,
      description: event.description || `Dynamic market event: ${event.name}`,
      impact: event.impact ? `Market impact: ${JSON.stringify(event.impact)}` : 'Market volatility and uncertainty',
      isDynamic: true
    }));
  
  // Merge historical and dynamic events
  events = [...events, ...dynamicEvents];
  
  // Apply filters if provided
  if (category) {
    events = events.filter(e => e.category === category);
  }
  
  if (severity) {
    events = events.filter(e => e.severity === severity);
  }
  
  // Sort by date, most recent first
  events.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  res.json({
    events: events,
    totalCount: events.length,
    currentGameDate: gameTime,
    categories: historicalEvents.getCategories().concat(['Market Event']),
    hasMore: false
  });
});

// Get events by category
app.get('/api/historical-events/category/:category', (req, res) => {
  const { category } = req.params;
  const events = historicalEvents.getEventsByCategory(category, gameTime);
  
  res.json({
    category: category,
    events: events,
    count: events.length
  });
});

// Get events by severity  
app.get('/api/historical-events/severity/:severity', (req, res) => {
  const { severity } = req.params;
  const events = historicalEvents.getEventsBySeverity(severity, gameTime);
  
  res.json({
    severity: severity,
    events: events,
    count: events.length
  });
});

// Market Crash Simulation API endpoints

const marketCrashSim = require('./helpers/marketCrashSimulation');
const crashEvents = require('./data/market-crash-events');
const dynamicEventGenerator = require('./helpers/dynamicEventGenerator');

// Initialize crash simulation on server start
marketCrashSim.initializeMarketState();

// Update crash events periodically
// Periodically update crash events and generate dynamic events
setInterval(() => {
  if (!isPaused) {
    marketCrashSim.updateCrashEvents(gameTime);
    
    // Check for and generate dynamic events
    const newEvents = dynamicEventGenerator.generateDynamicEvents(gameTime);
    
    // Auto-trigger the generated events
    for (const event of newEvents) {
      const result = marketCrashSim.triggerCrashEvent(event, gameTime);
      if (result.success) {
        console.log(`Auto-triggered dynamic crash event: ${event.name} (${event.type})`);
      }
    }
    
    // Process share buybacks based on market sentiment
    const marketState = marketCrashSim.getMarketState();
    const marketSentiment = marketState.sentimentScore || 0;
    
    // Convert sentiment from -1..1 to 0..1 scale for buyback function
    const normalizedSentiment = (marketSentiment + 1) / 2;
    
    const buybackEvents = shareAvailability.processBuybacks(gameTime, normalizedSentiment);
    if (buybackEvents.length > 0) {
      console.log(`Processed ${buybackEvents.length} stock buyback(s):`);
      buybackEvents.forEach(event => {
        console.log(`  - ${event.symbol}: Bought back ${event.sharesBoughtBack.toLocaleString()} shares (${event.percentageOfFloat}% of float)`);
      });
    }
    
    // Process share issuance (less frequent)
    const issuanceEvents = shareAvailability.processShareIssuance(gameTime, marketSentiment);
    if (issuanceEvents.length > 0) {
      console.log(`Processed ${issuanceEvents.length} share issuance(s):`);
      issuanceEvents.forEach(event => {
        console.log(`  - ${event.symbol}: Issued ${event.sharesIssued.toLocaleString()} shares (${event.percentageIncrease}% increase)`);
      });
    }
  }
}, 10000);  // Update every 10 seconds

// Get all available crash scenarios
app.get('/api/crash/scenarios', (req, res) => {
  const scenarios = crashEvents.getAllScenarios();
  res.json({
    total: scenarios.length,
    historical: crashEvents.getHistoricalScenarios().length,
    hypothetical: crashEvents.getHypotheticalScenarios().length,
    scenarios: scenarios.map(s => ({
      id: s.id,
      name: s.name,
      type: s.type,
      severity: s.severity,
      description: s.description,
      trigger: s.trigger
    }))
  });
});

// Get scenario details by ID
app.get('/api/crash/scenarios/:id', (req, res) => {
  const { id } = req.params;
  const scenario = crashEvents.getScenarioById(id);
  
  if (!scenario) {
    return res.status(404).json({ error: 'Scenario not found' });
  }
  
  res.json(scenario);
});

// Trigger a crash event
app.post('/api/crash/trigger', (req, res) => {
  const { scenarioId, customConfig } = req.body;
  
  let eventConfig = scenarioId;
  if (customConfig) {
    eventConfig = customConfig;
  }
  
  const result = marketCrashSim.triggerCrashEvent(eventConfig, gameTime);
  
  if (result.success) {
    // Save to database
    try {
      dbModule.insertCrashEvent.run(
        result.event.id,
        result.event.name,
        result.event.type,
        result.event.severity,
        result.event.activatedAt.toISOString(),
        result.event.status,
        JSON.stringify(result.event)
      );
    } catch (error) {
      console.error('Failed to save crash event to database:', error);
    }
    
    res.json(result);
  } else {
    res.status(400).json(result);
  }
});

// Get active crash events
app.get('/api/crash/active', (req, res) => {
  const activeEvents = marketCrashSim.getActiveEvents();
  res.json({
    count: activeEvents.length,
    events: activeEvents
  });
});

// Deactivate a crash event
app.post('/api/crash/deactivate/:eventId', (req, res) => {
  const { eventId } = req.params;
  
  const result = marketCrashSim.deactivateCrashEvent(eventId);
  
  if (result.success) {
    // Update database
    try {
      dbModule.updateCrashEventStatus.run(
        'deactivated',
        gameTime.toISOString(),
        eventId
      );
    } catch (error) {
      console.error('Failed to update crash event status in database:', error);
    }
  }
  
  res.json(result);
});

// Get crash analytics
app.get('/api/crash/analytics', (req, res) => {
  const analytics = marketCrashSim.getCrashAnalytics();
  res.json(analytics);
});

// Get market state affected by crashes
app.get('/api/crash/market-state', (req, res) => {
  const marketState = marketCrashSim.getMarketState();
  res.json(marketState);
});

// Get crash event history
app.get('/api/crash/history', (req, res) => {
  const { limit } = req.query;
  const limitValue = parseInt(limit) || 50;
  const history = marketCrashSim.getEventHistory(limitValue);
  res.json({
    count: history.length,
    events: history
  });
});

// Create custom crash scenario
app.post('/api/crash/custom', (req, res) => {
  const customConfig = req.body;
  
  // Validate required fields
  if (!customConfig.name) {
    return res.status(400).json({ error: 'Event name is required' });
  }
  
  const scenario = crashEvents.createCrashTemplate(customConfig);
  res.json({
    success: true,
    scenario: scenario,
    message: 'Custom crash scenario created. Use /api/crash/trigger to activate it.'
  });
});

// Dynamic Event Generation Endpoints

// Get dynamic event configuration
app.get('/api/crash/dynamic/config', (req, res) => {
  const config = dynamicEventGenerator.getConfiguration();
  res.json(config);
});

// Update dynamic event configuration
app.post('/api/crash/dynamic/config', (req, res) => {
  const newConfig = req.body;
  
  try {
    dynamicEventGenerator.updateConfiguration(newConfig);
    const updatedConfig = dynamicEventGenerator.getConfiguration();
    
    res.json({
      success: true,
      config: updatedConfig,
      message: 'Dynamic event configuration updated'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get all dynamically generated events
app.get('/api/crash/dynamic/events', (req, res) => {
  const generatedEvents = dynamicEventGenerator.getGeneratedEvents();
  res.json({
    count: generatedEvents.length,
    events: generatedEvents.map(e => ({
      id: e.id,
      name: e.name,
      type: e.type,
      severity: e.severity,
      generatedAt: e.generatedAt,
      impact: e.impact
    }))
  });
});

// Manually trigger dynamic event generation
app.post('/api/crash/dynamic/generate', (req, res) => {
  try {
    const newEvents = dynamicEventGenerator.generateDynamicEvents(gameTime);
    
    // Auto-trigger the generated events
    const triggeredEvents = [];
    for (const event of newEvents) {
      const result = marketCrashSim.triggerCrashEvent(event, gameTime);
      if (result.success) {
        triggeredEvents.push(result.event);
      }
    }
    
    res.json({
      success: true,
      generatedCount: newEvents.length,
      triggeredCount: triggeredEvents.length,
      events: triggeredEvents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
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

// Set margin debt (debug)
app.post('/api/debug/setmargindebt', (req, res) => {
  const { amount } = req.body;
  
  if (typeof amount !== 'number' || amount < 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }
  
  userAccount.marginAccount.marginBalance = amount;
  res.json({ success: true, marginBalance: amount });
});

// Clear transactions (debug)
app.post('/api/debug/cleartransactions', (req, res) => {
  userAccount.transactions = [];
  res.json({ success: true, message: 'All transactions cleared' });
});

// Clear loans (debug)
app.post('/api/debug/clearloans', (req, res) => {
  userAccount.loans = [];
  userAccount.loanHistory = [];
  res.json({ success: true, message: 'All loans cleared' });
});

// Clear taxes (debug)
app.post('/api/debug/cleartaxes', (req, res) => {
  userAccount.taxes = [];
  res.json({ success: true, message: 'Tax history cleared' });
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

// Stock Splits API Endpoints

// Get split threshold for current year
app.get('/api/splits/threshold', (req, res) => {
  try {
    const year = gameTime.getFullYear();
    const threshold = stockSplits.getSplitThreshold(year);
    
    res.json({
      success: true,
      year: year,
      threshold: threshold
    });
  } catch (error) {
    console.error('Error getting split threshold:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all stock splits
app.get('/api/splits', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const splits = stockSplits.getRecentSplits(limit);
    
    res.json({
      success: true,
      splits: splits,
      count: splits.length
    });
  } catch (error) {
    console.error('Error getting stock splits:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get splits for a specific symbol
app.get('/api/splits/:symbol', (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const splits = stockSplits.getSplitsForSymbol(symbol);
    
    res.json({
      success: true,
      symbol: symbol,
      splits: splits,
      count: splits.length
    });
  } catch (error) {
    console.error('Error getting splits for symbol:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Corporate Events API endpoints
app.get('/api/corporate-events', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const events = dbModule.getAllCorporateEvents.all(limit);
    
    // Parse event_data JSON for each event
    const parsedEvents = events.map(event => ({
      ...event,
      event_data: JSON.parse(event.event_data)
    }));
    
    res.json({ events: parsedEvents });
  } catch (error) {
    console.error('Error fetching corporate events:', error);
    res.status(500).json({ error: 'Failed to fetch corporate events' });
  }
});

app.get('/api/corporate-events/pending', (req, res) => {
  try {
    const events = dbModule.getPendingCorporateEvents.all(gameTime.toISOString());
    
    const parsedEvents = events.map(event => ({
      ...event,
      event_data: JSON.parse(event.event_data)
    }));
    
    res.json({ events: parsedEvents });
  } catch (error) {
    console.error('Error fetching pending corporate events:', error);
    res.status(500).json({ error: 'Failed to fetch pending corporate events' });
  }
});

app.get('/api/companies/:symbol/status', (req, res) => {
  try {
    const { symbol } = req.params;
    const status = dbModule.getCompanyStatus.get(symbol);
    
    if (!status) {
      return res.json({
        symbol,
        status: 'active',
        available: true,
        message: 'Company is available for trading'
      });
    }
    
    const available = status.status === 'active';
    
    res.json({
      symbol,
      status: status.status,
      available,
      statusDate: status.status_date,
      reason: status.reason,
      message: available ? 'Company is available for trading' : `Company is ${status.status}: ${status.reason}`
    });
  } catch (error) {
    console.error('Error fetching company status:', error);
    res.status(500).json({ error: 'Failed to fetch company status' });
  }
});

app.get('/api/companies/:symbol/financials', (req, res) => {
  try {
    const { symbol } = req.params;
    const financials = dbModule.getCompanyFinancials.all(symbol);
    
    res.json({ symbol, financials });
  } catch (error) {
    console.error('Error fetching company financials:', error);
    res.status(500).json({ error: 'Failed to fetch company financials' });
  }
});

// ============================================================================
// Economic Indicators API Endpoints
// ============================================================================

// Get economic indicators for a specific year
app.get('/api/economic/indicators/:year', (req, res) => {
  try {
    const year = parseInt(req.params.year);
    
    if (isNaN(year) || year < 1970 || year > 2100) {
      return res.status(400).json({ error: 'Invalid year. Must be between 1970 and 2100.' });
    }
    
    // Get inflation rate for the year
    const inflationRate = dynamicRates.generateInflationRate(year);
    
    // Get economic indicators
    const indicators = economicIndicators.getEconomicIndicators(year, inflationRate);
    
    res.json(indicators);
  } catch (error) {
    console.error('Error fetching economic indicators:', error);
    res.status(500).json({ error: 'Failed to fetch economic indicators' });
  }
});

// Get all historical economic data
app.get('/api/economic/historical', (req, res) => {
  try {
    const historical = economicIndicators.getHistoricalData();
    res.json(historical);
  } catch (error) {
    console.error('Error fetching historical economic data:', error);
    res.status(500).json({ error: 'Failed to fetch historical economic data' });
  }
});

// Calculate market impact from economic conditions for a year
app.get('/api/economic/impact/:year', (req, res) => {
  try {
    const year = parseInt(req.params.year);
    
    if (isNaN(year) || year < 1970 || year > 2100) {
      return res.status(400).json({ error: 'Invalid year. Must be between 1970 and 2100.' });
    }
    
    // Get inflation rate for the year
    const inflationRate = dynamicRates.generateInflationRate(year);
    
    // Get economic indicators
    const indicators = economicIndicators.getEconomicIndicators(year, inflationRate);
    
    // Calculate market impact
    const impact = economicIndicators.calculateMarketImpact(indicators);
    
    res.json({
      year: year,
      indicators: indicators,
      marketImpact: impact,
      marketImpactPercent: (impact * 100).toFixed(2) + '%'
    });
  } catch (error) {
    console.error('Error calculating market impact:', error);
    res.status(500).json({ error: 'Failed to calculate market impact' });
  }
});

// Get economic modeling configuration
app.get('/api/economic/config', (req, res) => {
  try {
    const config = economicIndicators.getConfiguration();
    res.json(config);
  } catch (error) {
    console.error('Error fetching economic config:', error);
    res.status(500).json({ error: 'Failed to fetch economic configuration' });
  }
});

// Update economic modeling configuration
app.post('/api/economic/config', (req, res) => {
  try {
    const newConfig = req.body;
    
    // Validate configuration update
    economicIndicators.updateConfiguration(newConfig);
    
    res.json({
      success: true,
      message: 'Economic configuration updated',
      config: economicIndicators.getConfiguration()
    });
  } catch (error) {
    console.error('Error updating economic config:', error);
    res.status(400).json({ 
      error: 'Failed to update economic configuration',
      message: error.message 
    });
  }
});

// Data retention configuration endpoints
app.get('/api/retention/config', (req, res) => {
  try {
    const config = dataRetention.getRetentionConfig();
    const lastPruning = dataRetention.getLastPruningTime();
    const dbConfig = dbModule.getDataRetentionConfig.get();
    
    res.json({
      success: true,
      config,
      lastPruningDate: lastPruning,
      autoPruningEnabled: dbConfig ? Boolean(dbConfig.auto_pruning_enabled) : true
    });
  } catch (error) {
    console.error('Error getting retention config:', error);
    res.status(500).json({ 
      error: 'Failed to get retention configuration',
      message: error.message 
    });
  }
});

app.post('/api/retention/config', (req, res) => {
  try {
    const { retentionPeriods, autoPruningEnabled } = req.body;
    
    if (retentionPeriods) {
      dataRetention.saveRetentionConfig(retentionPeriods);
    }
    
    if (autoPruningEnabled !== undefined) {
      const config = dbModule.getDataRetentionConfig.get();
      const currentRetention = config ? config.retention_periods : JSON.stringify(dataRetention.DEFAULT_RETENTION_PERIODS);
      const currentLastPruning = config ? config.last_pruning_date : null;
      
      dbModule.updateDataRetentionConfig.run(
        currentRetention,
        autoPruningEnabled ? 1 : 0,
        currentLastPruning
      );
    }
    
    res.json({
      success: true,
      message: 'Retention configuration updated',
      config: dataRetention.getRetentionConfig()
    });
  } catch (error) {
    console.error('Error updating retention config:', error);
    res.status(400).json({ 
      error: 'Failed to update retention configuration',
      message: error.message 
    });
  }
});

app.get('/api/retention/stats', (req, res) => {
  try {
    const stats = dataRetention.getPruningStats(gameTime);
    
    res.json({
      success: true,
      currentGameTime: gameTime.toISOString(),
      stats
    });
  } catch (error) {
    console.error('Error getting pruning stats:', error);
    res.status(500).json({ 
      error: 'Failed to get pruning statistics',
      message: error.message 
    });
  }
});

app.post('/api/retention/prune', (req, res) => {
  try {
    const results = dataRetention.pruneOldData(gameTime);
    
    res.json({
      success: true,
      message: 'Data pruning completed',
      results
    });
  } catch (error) {
    console.error('Error running manual pruning:', error);
    res.status(500).json({ 
      error: 'Failed to run data pruning',
      message: error.message 
    });
  }
});

// Bond API endpoints

// Get all available bonds
app.get('/api/bonds', (req, res) => {
  try {
    const bonds = bondsData.getAvailableBonds();
    
    // Add current market prices
    const bondsWithPrices = bonds.map(bond => {
      const pricing = bondManager.getBondMarketPrice(bond.symbol, gameTime);
      return {
        ...bond,
        marketPrice: pricing ? pricing.price : 100,
        currentYield: pricing ? pricing.yield : bond.couponRate * 100,
        yearsToMaturity: pricing ? pricing.yearsToMaturity : (bond.maturityYears || bond.maturityWeeks / 52)
      };
    });
    
    res.json(bondsWithPrices);
  } catch (error) {
    console.error('Error fetching bonds:', error);
    res.status(500).json({ error: 'Failed to fetch bonds' });
  }
});

// Get bonds by type
app.get('/api/bonds/type/:type', (req, res) => {
  try {
    const { type } = req.params;
    const bonds = bondsData.getBondsByType(type);
    
    const bondsWithPrices = bonds.map(bond => {
      const pricing = bondManager.getBondMarketPrice(bond.symbol, gameTime);
      return {
        ...bond,
        marketPrice: pricing ? pricing.price : 100,
        currentYield: pricing ? pricing.yield : bond.couponRate * 100,
        yearsToMaturity: pricing ? pricing.yearsToMaturity : (bond.maturityYears || bond.maturityWeeks / 52)
      };
    });
    
    res.json(bondsWithPrices);
  } catch (error) {
    console.error('Error fetching bonds by type:', error);
    res.status(500).json({ error: 'Failed to fetch bonds' });
  }
});

// Get specific bond details
app.get('/api/bonds/:symbol', (req, res) => {
  try {
    const { symbol } = req.params;
    const bond = bondsData.getBond(symbol);
    
    if (!bond) {
      return res.status(404).json({ error: 'Bond not found' });
    }
    
    const pricing = bondManager.getBondMarketPrice(symbol, gameTime);
    
    res.json({
      ...bond,
      marketPrice: pricing ? pricing.price : 100,
      currentYield: pricing ? pricing.yield : bond.couponRate * 100,
      yearsToMaturity: pricing ? pricing.yearsToMaturity : (bond.maturityYears || bond.maturityWeeks / 52)
    });
  } catch (error) {
    console.error('Error fetching bond:', error);
    res.status(500).json({ error: 'Failed to fetch bond' });
  }
});

// Get user's bond holdings
app.get('/api/bonds/holdings/all', (req, res) => {
  try {
    const holdings = dbModule.getBondHoldings.all();
    
    const holdingsWithCurrentValue = holdings.map(holding => {
      const bond = bondsData.getBond(`${holding.bond_type.toUpperCase()}-${holding.issuer}`);
      const pricing = bond ? bondManager.getBondMarketPrice(`${holding.bond_type.toUpperCase()}-${holding.issuer}`, gameTime) : null;
      
      return {
        id: holding.id,
        bondType: holding.bond_type,
        issuer: holding.issuer,
        faceValue: holding.face_value,
        couponRate: holding.coupon_rate,
        purchasePrice: holding.purchase_price,
        purchaseDate: holding.purchase_date,
        maturityDate: holding.maturity_date,
        creditRating: holding.credit_rating,
        quantity: holding.quantity,
        currentPrice: pricing ? pricing.price : holding.purchase_price,
        currentValue: pricing ? pricing.price * holding.quantity : holding.purchase_price * holding.quantity,
        totalCost: holding.purchase_price * holding.quantity,
        gainLoss: pricing ? (pricing.price - holding.purchase_price) * holding.quantity : 0
      };
    });
    
    res.json(holdingsWithCurrentValue);
  } catch (error) {
    console.error('Error fetching bond holdings:', error);
    res.status(500).json({ error: 'Failed to fetch bond holdings' });
  }
});

// Get bond portfolio statistics
app.get('/api/bonds/portfolio/stats', (req, res) => {
  try {
    const stats = bondManager.getBondPortfolioStats(gameTime);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching bond portfolio stats:', error);
    res.status(500).json({ error: 'Failed to fetch bond portfolio stats' });
  }
});

// Get treasury yield curve
app.get('/api/bonds/yields/curve', (req, res) => {
  try {
    const curve = treasuryYields.getYieldCurve(gameTime);
    res.json(curve);
  } catch (error) {
    console.error('Error fetching yield curve:', error);
    res.status(500).json({ error: 'Failed to fetch yield curve' });
  }
});

// Buy bonds
app.post('/api/bonds/buy', (req, res) => {
  try {
    const { symbol, quantity } = req.body;
    
    if (!symbol || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Invalid bond symbol or quantity' });
    }
    
    const bond = bondsData.getBond(symbol);
    if (!bond) {
      return res.status(404).json({ error: 'Bond not found' });
    }
    
    const pricing = bondManager.getBondMarketPrice(symbol, gameTime);
    if (!pricing) {
      return res.status(500).json({ error: 'Failed to calculate bond price' });
    }
    
    const faceValue = bond.minPurchase || 100;
    const purchasePrice = pricing.price;
    const totalCost = purchasePrice * quantity;
    const tradingFee = totalCost * 0.001; // 0.1% trading fee
    const totalAmount = totalCost + tradingFee;
    
    // Check if user has enough cash
    const account = dbModule.getUserAccount.get();
    if (account.cash < totalAmount) {
      return res.status(400).json({ 
        error: 'Insufficient funds',
        required: totalAmount,
        available: account.cash
      });
    }
    
    // Calculate maturity date
    let maturityDate = new Date(gameTime);
    if (bond.maturityWeeks) {
      maturityDate.setDate(maturityDate.getDate() + (bond.maturityWeeks * 7));
    } else {
      maturityDate.setFullYear(maturityDate.getFullYear() + (bond.maturityYears || 10));
    }
    
    // Insert bond holding
    const result = dbModule.insertBondHolding.run(
      bond.type,
      bond.issuer || symbol,
      faceValue,
      bond.couponRate,
      purchasePrice,
      gameTime.toISOString(),
      maturityDate.toISOString(),
      bond.creditRating,
      quantity
    );
    
    // Update user's cash
    dbModule.updateUserAccount.run(
      account.cash - totalAmount,
      account.credit_score
    );
    
    // Record transaction
    dbModule.insertTransaction.run(
      gameTime.toISOString(),
      'bond_purchase',
      bond.issuer || symbol,
      quantity,
      purchasePrice,
      tradingFee,
      null,
      -totalAmount,
      JSON.stringify({
        bondId: result.lastInsertRowid,
        bondType: bond.type,
        bondSymbol: symbol,
        faceValue,
        couponRate: bond.couponRate,
        maturityDate: maturityDate.toISOString()
      })
    );
    
    // Record fee
    dbModule.insertFee.run(
      gameTime.toISOString(),
      'trading',
      tradingFee,
      `Trading fee for bond purchase: ${symbol}`
    );
    
    res.json({
      success: true,
      bondId: result.lastInsertRowid,
      symbol,
      quantity,
      purchasePrice,
      totalCost,
      tradingFee,
      totalAmount,
      remainingCash: account.cash - totalAmount
    });
  } catch (error) {
    console.error('Error buying bond:', error);
    res.status(500).json({ error: 'Failed to buy bond', message: error.message });
  }
});

// Sell bonds (before maturity)
app.post('/api/bonds/sell', (req, res) => {
  try {
    const { bondId, quantity } = req.body;
    
    if (!bondId || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Invalid bond ID or quantity' });
    }
    
    const holding = dbModule.getBondHolding.get(bondId);
    if (!holding) {
      return res.status(404).json({ error: 'Bond holding not found' });
    }
    
    if (holding.quantity < quantity) {
      return res.status(400).json({ 
        error: 'Insufficient quantity',
        available: holding.quantity,
        requested: quantity
      });
    }
    
    const bond = bondsData.getBond(`${holding.bond_type.toUpperCase()}-${holding.issuer}`);
    const pricing = bond ? bondManager.getBondMarketPrice(`${holding.bond_type.toUpperCase()}-${holding.issuer}`, gameTime) : null;
    const sellPrice = pricing ? pricing.price : holding.purchase_price;
    
    const totalProceeds = sellPrice * quantity;
    const tradingFee = totalProceeds * 0.001;
    const netProceeds = totalProceeds - tradingFee;
    
    // Calculate capital gain/loss
    const costBasis = holding.purchase_price * quantity;
    const gainLoss = totalProceeds - costBasis;
    let capitalGainsTax = 0;
    
    if (gainLoss > 0) {
      capitalGainsTax = gainLoss * 0.15; // 15% capital gains tax
      dbModule.insertTax.run(
        gameTime.toISOString(),
        'capital_gains',
        capitalGainsTax,
        `Capital gains tax on bond sale: ${holding.issuer}`
      );
    }
    
    const finalProceeds = netProceeds - capitalGainsTax;
    
    // Update or delete bond holding
    if (holding.quantity === quantity) {
      dbModule.deleteBondHolding.run(bondId);
    } else {
      dbModule.updateBondQuantity.run(holding.quantity - quantity, bondId);
    }
    
    // Update user's cash
    const account = dbModule.getUserAccount.get();
    dbModule.updateUserAccount.run(
      account.cash + finalProceeds,
      account.credit_score
    );
    
    // Record transaction
    dbModule.insertTransaction.run(
      gameTime.toISOString(),
      'bond_sale',
      holding.issuer,
      quantity,
      sellPrice,
      tradingFee,
      capitalGainsTax,
      finalProceeds,
      JSON.stringify({
        bondId,
        bondType: holding.bond_type,
        purchasePrice: holding.purchase_price,
        gainLoss
      })
    );
    
    // Record fee
    dbModule.insertFee.run(
      gameTime.toISOString(),
      'trading',
      tradingFee,
      `Trading fee for bond sale: ${holding.issuer}`
    );
    
    res.json({
      success: true,
      bondId,
      quantity,
      sellPrice,
      totalProceeds,
      tradingFee,
      capitalGainsTax,
      finalProceeds,
      gainLoss,
      remainingCash: account.cash + finalProceeds
    });
  } catch (error) {
    console.error('Error selling bond:', error);
    res.status(500).json({ error: 'Failed to sell bond', message: error.message });
  }
});

// Crypto API endpoints

// Get all available cryptocurrencies
app.get('/api/crypto', (req, res) => {
  try {
    const cryptos = cryptoManager.getAllCryptoPrices(gameTime);
    res.json(cryptos);
  } catch (error) {
    console.error('Error fetching crypto prices:', error);
    res.status(500).json({ error: 'Failed to fetch cryptocurrency data' });
  }
});

// Get specific cryptocurrency price
app.get('/api/crypto/:symbol', (req, res) => {
  try {
    const { symbol } = req.params;
    const crypto = cryptoData.getCrypto(symbol);
    
    if (!crypto) {
      return res.status(404).json({ error: 'Cryptocurrency not found' });
    }
    
    if (!cryptoData.isCryptoAvailable(symbol, gameTime)) {
      return res.status(400).json({ 
        error: `${crypto.name} is not available yet`,
        launchDate: crypto.launchDate
      });
    }
    
    const price = cryptoManager.getCryptoPrice(symbol, gameTime);
    
    res.json({
      symbol,
      name: crypto.name,
      price,
      type: 'cryptocurrency',
      baseVolatility: crypto.baseVolatility,
      tradingFee: crypto.tradingFee,
      hasStaking: crypto.stakingRewards && crypto.stakingRewards.enabled,
      maxSupply: crypto.maxSupply,
      description: crypto.description
    });
  } catch (error) {
    console.error('Error fetching crypto price:', error);
    res.status(500).json({ error: 'Failed to fetch cryptocurrency price' });
  }
});

// Get user's crypto holdings
app.get('/api/crypto/holdings/all', (req, res) => {
  try {
    const holdings = dbModule.getCryptoHoldings.all();
    
    const holdingsWithPrices = holdings.map(holding => {
      const price = cryptoManager.getCryptoPrice(holding.symbol, gameTime);
      const crypto = cryptoData.getCrypto(holding.symbol);
      
      return {
        ...holding,
        currentPrice: price,
        totalValue: price * holding.quantity,
        name: crypto ? crypto.name : holding.symbol,
        hasStaking: crypto && crypto.stakingRewards && crypto.stakingRewards.enabled
      };
    });
    
    res.json(holdingsWithPrices);
  } catch (error) {
    console.error('Error fetching crypto holdings:', error);
    res.status(500).json({ error: 'Failed to fetch crypto holdings' });
  }
});

// Buy cryptocurrency
app.post('/api/crypto/buy', (req, res) => {
  try {
    const { symbol, quantity } = req.body;
    
    if (!symbol || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Invalid cryptocurrency symbol or quantity' });
    }
    
    const crypto = cryptoData.getCrypto(symbol);
    if (!crypto) {
      return res.status(404).json({ error: 'Cryptocurrency not found' });
    }
    
    if (!cryptoData.isCryptoAvailable(symbol, gameTime)) {
      return res.status(400).json({ 
        error: `${crypto.name} is not available yet`,
        launchDate: crypto.launchDate
      });
    }
    
    const price = cryptoManager.getCryptoPrice(symbol, gameTime);
    if (!price) {
      return res.status(500).json({ error: 'Failed to get cryptocurrency price' });
    }
    
    const totalCost = price * quantity;
    const tradingFee = cryptoManager.getCryptoTradingFee(symbol, totalCost);
    const totalAmount = totalCost + tradingFee;
    
    // Check if user has enough cash
    const account = dbModule.getUserAccount.get();
    if (account.cash < totalAmount) {
      return res.status(400).json({ 
        error: 'Insufficient funds',
        required: totalAmount,
        available: account.cash
      });
    }
    
    // Get current holding
    const currentHolding = dbModule.getCryptoHolding.get(symbol);
    const newQuantity = (currentHolding ? currentHolding.quantity : 0) + quantity;
    
    // Update or insert holding
    dbModule.upsertCryptoHolding.run(
      symbol,
      newQuantity,
      currentHolding ? currentHolding.last_staking_reward_date : null,
      gameTime.toISOString()
    );
    
    // Record transaction
    dbModule.insertCryptoTransaction.run(
      symbol,
      'buy',
      quantity,
      price,
      tradingFee,
      totalAmount,
      gameTime.toISOString()
    );
    
    // Update user's cash
    dbModule.updateUserAccount.run(
      account.cash - totalAmount,
      account.credit_score
    );
    
    // Record in general transactions table
    dbModule.insertTransaction.run(
      gameTime.toISOString(),
      'crypto_buy',
      symbol,
      quantity,
      price,
      tradingFee,
      0, // no tax on purchase
      -totalAmount,
      JSON.stringify({ cryptocurrency: crypto.name })
    );
    
    res.json({
      success: true,
      symbol,
      name: crypto.name,
      quantity,
      price,
      totalCost,
      tradingFee,
      totalAmount,
      newQuantity,
      remainingCash: account.cash - totalAmount
    });
  } catch (error) {
    console.error('Error buying crypto:', error);
    res.status(500).json({ error: 'Failed to buy cryptocurrency', message: error.message });
  }
});

// Sell cryptocurrency
app.post('/api/crypto/sell', (req, res) => {
  try {
    const { symbol, quantity } = req.body;
    
    if (!symbol || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Invalid cryptocurrency symbol or quantity' });
    }
    
    const crypto = cryptoData.getCrypto(symbol);
    if (!crypto) {
      return res.status(404).json({ error: 'Cryptocurrency not found' });
    }
    
    // Check if user has enough crypto
    const holding = dbModule.getCryptoHolding.get(symbol);
    if (!holding || holding.quantity < quantity) {
      return res.status(400).json({ 
        error: 'Insufficient cryptocurrency balance',
        available: holding ? holding.quantity : 0
      });
    }
    
    const price = cryptoManager.getCryptoPrice(symbol, gameTime);
    if (!price) {
      return res.status(500).json({ error: 'Failed to get cryptocurrency price' });
    }
    
    const totalProceeds = price * quantity;
    const tradingFee = cryptoManager.getCryptoTradingFee(symbol, totalProceeds);
    
    // Calculate capital gains tax (simplified - 20% on gains)
    const avgCostBasis = calculateCryptoCostBasis(symbol);
    const costBasis = avgCostBasis * quantity;
    const capitalGain = totalProceeds - costBasis;
    const capitalGainsTax = capitalGain > 0 ? capitalGain * 0.20 : 0;
    
    const finalProceeds = totalProceeds - tradingFee - capitalGainsTax;
    
    // Update holding
    const newQuantity = holding.quantity - quantity;
    if (newQuantity > 0.0001) {
      dbModule.upsertCryptoHolding.run(
        symbol,
        newQuantity,
        holding.last_staking_reward_date,
        gameTime.toISOString()
      );
    } else {
      dbModule.deleteCryptoHolding.run(symbol);
    }
    
    // Record transaction
    dbModule.insertCryptoTransaction.run(
      symbol,
      'sell',
      quantity,
      price,
      tradingFee,
      finalProceeds,
      gameTime.toISOString()
    );
    
    // Update user's cash
    const account = dbModule.getUserAccount.get();
    dbModule.updateUserAccount.run(
      account.cash + finalProceeds,
      account.credit_score
    );
    
    // Record tax if applicable
    if (capitalGainsTax > 0) {
      dbModule.insertTax.run(
        gameTime.toISOString(),
        'capital-gains',
        capitalGainsTax,
        `Capital gains tax on ${quantity} ${symbol}`
      );
    }
    
    // Record in general transactions table
    dbModule.insertTransaction.run(
      gameTime.toISOString(),
      'crypto_sell',
      symbol,
      quantity,
      price,
      tradingFee,
      capitalGainsTax,
      finalProceeds,
      JSON.stringify({ 
        cryptocurrency: crypto.name,
        capitalGain: capitalGain
      })
    );
    
    res.json({
      success: true,
      symbol,
      name: crypto.name,
      quantity,
      price,
      totalProceeds,
      tradingFee,
      capitalGainsTax,
      finalProceeds,
      gainLoss: capitalGain,
      newQuantity,
      remainingCash: account.cash + finalProceeds
    });
  } catch (error) {
    console.error('Error selling crypto:', error);
    res.status(500).json({ error: 'Failed to sell cryptocurrency', message: error.message });
  }
});

// Helper function to calculate average cost basis for crypto
function calculateCryptoCostBasis(symbol) {
  try {
    const transactions = dbModule.getCryptoTransactions.all(symbol, 1000);
    let totalCost = 0;
    let totalQuantity = 0;
    
    for (const tx of transactions) {
      if (tx.transaction_type === 'buy') {
        totalCost += tx.price_per_unit * tx.quantity;
        totalQuantity += tx.quantity;
      } else if (tx.transaction_type === 'sell') {
        // Reduce proportionally
        if (totalQuantity > 0) {
          const proportion = tx.quantity / totalQuantity;
          totalCost -= totalCost * proportion;
          totalQuantity -= tx.quantity;
        }
      }
    }
    
    return totalQuantity > 0 ? totalCost / totalQuantity : 0;
  } catch (error) {
    console.error('Error calculating cost basis:', error);
    return 0;
  }
}

// Get blockchain events
app.get('/api/crypto/events', (req, res) => {
  try {
    // Get events from the past year
    const oneYearAgo = new Date(gameTime);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const events = cryptoData.getBlockchainEvents(oneYearAgo, gameTime);
    const activeCrashes = cryptoData.getActiveCryptoCrashes(gameTime);
    
    res.json({
      recentEvents: events,
      activeCrashes: activeCrashes
    });
  } catch (error) {
    console.error('Error fetching crypto events:', error);
    res.status(500).json({ error: 'Failed to fetch blockchain events' });
  }
});

// Process staking rewards (should be called periodically)
app.post('/api/crypto/process-staking', (req, res) => {
  try {
    const holdings = dbModule.getCryptoHoldings.all();
    let totalRewards = 0;
    const rewardDetails = [];
    
    for (const holding of holdings) {
      const crypto = cryptoData.getCrypto(holding.symbol);
      if (!crypto || !crypto.stakingRewards || !crypto.stakingRewards.enabled) {
        continue;
      }
      
      const lastRewardDate = holding.last_staking_reward_date 
        ? new Date(holding.last_staking_reward_date)
        : null;
      
      const rewards = cryptoManager.calculateStakingRewards(
        holding.symbol,
        holding.quantity,
        gameTime,
        lastRewardDate
      );
      
      if (rewards > 0) {
        const price = cryptoManager.getCryptoPrice(holding.symbol, gameTime);
        const rewardValue = rewards * price;
        
        // Update holding quantity
        const newQuantity = holding.quantity + rewards;
        dbModule.upsertCryptoHolding.run(
          holding.symbol,
          newQuantity,
          gameTime.toISOString(),
          gameTime.toISOString()
        );
        
        // Record staking reward
        dbModule.insertStakingReward.run(
          holding.symbol,
          rewards,
          gameTime.toISOString(),
          price,
          rewardValue
        );
        
        totalRewards += rewardValue;
        rewardDetails.push({
          symbol: holding.symbol,
          name: crypto.name,
          quantity: rewards,
          value: rewardValue
        });
      }
    }
    
    res.json({
      success: true,
      totalRewards,
      rewardDetails
    });
  } catch (error) {
    console.error('Error processing staking rewards:', error);
    res.status(500).json({ error: 'Failed to process staking rewards', message: error.message });
  }
});

// Add route for cheat page
app.get('/cheat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cheat.html'));
});

app.listen(PORT, () => {
  console.log(`StockFake server running on port ${PORT}`);
  console.log(`Game started at ${gameTime}`);
});
