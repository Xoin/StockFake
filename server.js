const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Game state
let gameTime = new Date('1970-01-01T09:30:00'); // Start at market open
let isPaused = false;
let timeMultiplier = 3600; // 1 real second = 1 game hour by default

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

// Time simulation
setInterval(() => {
  if (!isPaused) {
    gameTime = new Date(gameTime.getTime() + (timeMultiplier * 1000));
  }
}, 1000);

// API Routes
app.get('/api/time', (req, res) => {
  res.json({
    currentTime: gameTime,
    isMarketOpen: isMarketOpen(gameTime),
    isPaused
  });
});

app.post('/api/time/pause', (req, res) => {
  isPaused = !isPaused;
  res.json({ isPaused });
});

app.post('/api/time/speed', (req, res) => {
  const { multiplier } = req.body;
  if (multiplier && multiplier > 0) {
    timeMultiplier = multiplier;
  }
  res.json({ timeMultiplier });
});

// Routes for different websites
app.get('/bank', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'bank.html'));
});

app.get('/news', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'news.html'));
});

app.get('/email', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'email.html'));
});

app.get('/trading', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'trading.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Stock data API
const stocks = require('./data/stocks');
app.get('/api/stocks', (req, res) => {
  res.json(stocks.getStockData(gameTime));
});

app.get('/api/stocks/:symbol', (req, res) => {
  const { symbol } = req.params;
  res.json(stocks.getStockPrice(symbol, gameTime));
});

// News API
const news = require('./data/news');
app.get('/api/news', (req, res) => {
  res.json(news.getNews(gameTime));
});

// User account (simple in-memory for now)
let userAccount = {
  cash: 10000,
  portfolio: {}
};

app.get('/api/account', (req, res) => {
  res.json(userAccount);
});

app.post('/api/trade', (req, res) => {
  const { symbol, action, shares } = req.body;
  
  if (!isMarketOpen(gameTime)) {
    return res.status(400).json({ error: 'Market is closed' });
  }
  
  const stockPrice = stocks.getStockPrice(symbol, gameTime);
  if (!stockPrice) {
    return res.status(404).json({ error: 'Stock not found' });
  }
  
  const totalCost = stockPrice.price * shares;
  
  if (action === 'buy') {
    if (userAccount.cash < totalCost) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }
    userAccount.cash -= totalCost;
    userAccount.portfolio[symbol] = (userAccount.portfolio[symbol] || 0) + shares;
  } else if (action === 'sell') {
    if ((userAccount.portfolio[symbol] || 0) < shares) {
      return res.status(400).json({ error: 'Insufficient shares' });
    }
    userAccount.cash += totalCost;
    userAccount.portfolio[symbol] -= shares;
  }
  
  res.json(userAccount);
});

// Email API (simple messages based on game events)
app.get('/api/emails', (req, res) => {
  const emails = [
    {
      id: 1,
      from: 'support@stockfake.com',
      subject: 'Welcome to StockFake Trading!',
      body: 'Welcome to the trading platform. You have been credited with $10,000 to start trading.',
      date: new Date('1970-01-01')
    }
  ];
  res.json(emails.filter(email => email.date <= gameTime));
});

app.listen(PORT, () => {
  console.log(`StockFake server running on port ${PORT}`);
  console.log(`Game started at ${gameTime}`);
});
