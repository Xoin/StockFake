const express = require('express');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
db.initializeDatabase();
console.log('Database initialized');

// Load data modules and helpers
const stocks = require('./data/stocks');
const emailGenerator = require('./data/emails');
const companies = require('./data/companies');
const loanCompanies = require('./data/loan-companies');
const tradeHalts = require('./data/trade-halts');
const shareAvailability = require('./data/share-availability');
const indexFunds = require('./data/index-funds');
const news = require('./data/news');

const gameState = require('./helpers/gameState');
const userAccount = require('./helpers/userAccount');
const constants = require('./helpers/constants');

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Start time simulation
gameState.startTimeSimulation();
console.log(`Game loaded: ${gameState.getGameTime().toISOString()}`);

// Simple route handlers for HTML pages
app.get('/bank', (req, res) => res.sendFile(path.join(__dirname, 'public', 'bank.html')));
app.get('/news', (req, res) => res.sendFile(path.join(__dirname, 'public', 'news.html')));
app.get('/email', (req, res) => res.sendFile(path.join(__dirname, 'public', 'email.html')));
app.get('/trading', (req, res) => res.sendFile(path.join(__dirname, 'public', 'trading.html')));
app.get('/graphs', (req, res) => res.sendFile(path.join(__dirname, 'public', 'graphs.html')));
app.get('/loans', (req, res) => res.sendFile(path.join(__dirname, 'public', 'loans.html')));
app.get('/taxes', (req, res) => res.sendFile(path.join(__dirname, 'public', 'taxes.html')));
app.get('/company/:symbol', (req, res) => res.sendFile(path.join(__dirname, 'public', 'company.html')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// API Routes - Time
app.get('/api/time', (req, res) => {
  const gameTime = gameState.getGameTime();
  const haltStatus = tradeHalts.getCurrentOrUpcomingHalt(gameTime);
  res.json({
    currentTime: gameTime,
    isMarketOpen: gameState.isMarketOpen(gameTime),
    isPaused: gameState.getIsPaused(),
    tradeHalt: haltStatus
  });
});

app.post('/api/time/pause', (req, res) => {
  gameState.setIsPaused(!gameState.getIsPaused());
  res.json({ isPaused: gameState.getIsPaused() });
});

app.post('/api/time/speed', (req, res) => {
  const { multiplier } = req.body;
  if (multiplier && typeof multiplier === 'number' && multiplier > 0 && multiplier <= 86400) {
    gameState.setTimeMultiplier(multiplier);
  }
  res.json({ timeMultiplier: gameState.getTimeMultiplier() });
});

// API Routes - Stocks
app.get('/api/stocks', (req, res) => {
  const gameTime = gameState.getGameTime();
  const stockData = stocks.getStockData(gameTime);
  
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
  const gameTime = gameState.getGameTime();
  const stockPrice = stocks.getStockPrice(symbol, gameTime);
  
  if (!stockPrice) {
    return res.status(404).json({ error: 'Stock not found' });
  }
  
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

app.get('/api/stocks/:symbol/history', (req, res) => {
  const { symbol } = req.params;
  const { days } = req.query;
  const gameTime = gameState.getGameTime();
  
  const daysToFetch = parseInt(days) || 30;
  const history = [];
  
  for (let i = daysToFetch; i >= 0; i--) {
    const date = new Date(gameTime.getTime() - (i * 24 * 60 * 60 * 1000));
    const price = stocks.getStockPrice(symbol, date);
    if (price) {
      history.push({
        date: date.toISOString(),
        price: price.price
      });
    }
  }
  
  res.json(history);
});

app.get('/api/market/index', (req, res) => {
  const { days } = req.query;
  const gameTime = gameState.getGameTime();
  const daysToFetch = parseInt(days) || 30;
  const history = [];
  
  for (let i = daysToFetch; i >= 0; i--) {
    const date = new Date(gameTime.getTime() - (i * 24 * 60 * 60 * 1000));
    const allStocks = stocks.getStockData(date);
    
    if (allStocks.length > 0) {
      const avgPrice = allStocks.reduce((sum, s) => sum + s.price, 0) / allStocks.length;
      history.push({
        date: date.toISOString(),
        value: avgPrice,
        count: allStocks.length
      });
    }
  }
  
  res.json(history);
});

// API Routes - Companies
app.get('/api/companies/:symbol', (req, res) => {
  const { symbol } = req.params;
  const gameTime = gameState.getGameTime();
  const companyInfo = companies.getCompanyInfoAtTime(symbol, gameTime);
  
  if (!companyInfo) {
    return res.status(404).json({ error: 'Company not found' });
  }
  
  res.json(companyInfo);
});

app.get('/api/companies', (req, res) => {
  const gameTime = gameState.getGameTime();
  const allCompanies = companies.getAllCompanies();
  const companiesInfo = allCompanies.map(symbol => ({
    symbol,
    info: companies.getCompanyInfoAtTime(symbol, gameTime)
  })).filter(c => c.info && c.info.isAvailable);
  
  res.json(companiesInfo);
});

// API Routes - News
app.get('/api/news', (req, res) => {
  const gameTime = gameState.getGameTime();
  res.json(news.getNews(gameTime));
});

// API Routes - Account (simplified, full trading logic to be implemented)
app.get('/api/account', (req, res) => {
  const account = userAccount.getUserAccount();
  // Note: Will need portfolio calculations here
  res.json({
    ...account,
    portfolioMetrics: {
      portfolioValue: 0, // TODO: Calculate
      accountEquity: account.cash,
      marginRatio: 1.0
    }
  });
});

// Note: Trading, loans, margin, index funds, taxes, and email endpoints
// would follow similar patterns, using helper modules

app.listen(PORT, () => {
  console.log(`StockFake server running on port ${PORT}`);
  console.log(`Game time: ${gameState.getGameTime()}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  gameState.saveGameState();
  console.log('Game state saved. Server shutting down.');
  process.exit(0);
});

process.on('SIGTERM', () => {
  gameState.saveGameState();
  console.log('Game state saved. Server shutting down.');
  process.exit(0);
});
