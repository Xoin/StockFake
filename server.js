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
  // Validate multiplier is a positive number within reasonable bounds
  if (multiplier && typeof multiplier === 'number' && multiplier > 0 && multiplier <= 86400) {
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

// User account (single global account for this single-player game)
// In a multi-user environment, this would need to be per-session
let userAccount = {
  cash: 10000,
  portfolio: {},
  purchaseHistory: {}, // Track purchase prices for tax calculation
  transactions: [], // History of all transactions
  dividends: [], // History of dividend payments
  taxes: [], // History of tax payments
  lastTradeTime: {} // Track last trade time per symbol for cooldown
};

// Trading restrictions
const TRADE_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes cooldown between trades for same stock

// Tax rates
const SHORT_TERM_TAX_RATE = 0.30; // 30% for holdings < 1 year
const LONG_TERM_TAX_RATE = 0.15; // 15% for holdings >= 1 year
const DIVIDEND_TAX_RATE = 0.15; // 15% on dividends

// Dividend data (quarterly payouts per share)
const dividendRates = {
  'IBM': 0.50,   // $0.50 per share per quarter
  'XOM': 0.40,   // $0.40 per share per quarter
  'GE': 0.35     // $0.35 per share per quarter
};

// Track last dividend payout
let lastDividendQuarter = null;

// Check and pay dividends (quarterly)
function checkAndPayDividends() {
  const currentDate = new Date(gameTime);
  const currentQuarter = Math.floor(currentDate.getMonth() / 3);
  const currentYear = currentDate.getFullYear();
  const quarterKey = `${currentYear}-Q${currentQuarter + 1}`;
  
  if (lastDividendQuarter !== quarterKey) {
    lastDividendQuarter = quarterKey;
    
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
        quarter: quarterKey,
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
          description: `Dividend tax for ${quarterKey}`
        });
      }
    }
  }
}

// Call this periodically
setInterval(checkAndPayDividends, 5000);

app.get('/api/account', (req, res) => {
  res.json({
    cash: userAccount.cash,
    portfolio: userAccount.portfolio,
    transactions: userAccount.transactions.slice(-20), // Last 20 transactions
    dividends: userAccount.dividends.slice(-10), // Last 10 dividend payments
    taxes: userAccount.taxes.slice(-10) // Last 10 tax payments
  });
});

app.post('/api/trade', (req, res) => {
  const { symbol, action, shares } = req.body;
  
  if (!isMarketOpen(gameTime)) {
    return res.status(400).json({ error: 'Market is closed' });
  }
  
  // Check for trade cooldown
  if (userAccount.lastTradeTime[symbol]) {
    const timeSinceLastTrade = gameTime - userAccount.lastTradeTime[symbol];
    if (timeSinceLastTrade < TRADE_COOLDOWN_MS) {
      const remainingCooldown = Math.ceil((TRADE_COOLDOWN_MS - timeSinceLastTrade) / 60000);
      return res.status(400).json({ 
        error: `Please wait ${remainingCooldown} more minute(s) before trading ${symbol} again` 
      });
    }
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
    
    // Track purchase for tax calculation
    if (!userAccount.purchaseHistory[symbol]) {
      userAccount.purchaseHistory[symbol] = [];
    }
    userAccount.purchaseHistory[symbol].push({
      date: new Date(gameTime),
      shares: shares,
      pricePerShare: stockPrice.price
    });
    
    // Record transaction
    userAccount.transactions.push({
      date: new Date(gameTime),
      type: 'buy',
      symbol,
      shares,
      pricePerShare: stockPrice.price,
      total: totalCost
    });
    
  } else if (action === 'sell') {
    if ((userAccount.portfolio[symbol] || 0) < shares) {
      return res.status(400).json({ error: 'Insufficient shares' });
    }
    
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
    
    // Apply sale and deduct tax
    const saleProceeds = totalCost - taxAmount;
    userAccount.cash += saleProceeds;
    userAccount.portfolio[symbol] -= shares;
    
    // Record transaction
    userAccount.transactions.push({
      date: new Date(gameTime),
      type: 'sell',
      symbol,
      shares,
      pricePerShare: stockPrice.price,
      total: totalCost,
      tax: taxAmount,
      netProceeds: saleProceeds
    });
    
    // Record tax if any
    if (taxAmount > 0) {
      userAccount.taxes.push({
        date: new Date(gameTime),
        type: 'capital-gains',
        amount: taxAmount,
        description: `Capital gains tax on ${shares} shares of ${symbol}`
      });
    }
  }
  
  // Update last trade time for this symbol
  userAccount.lastTradeTime[symbol] = gameTime;
  
  res.json(userAccount);
});

// Email API (generate emails based on game events)
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
  
  // Add dividend emails
  userAccount.dividends.forEach((dividend, index) => {
    emails.push({
      id: 100 + index,
      from: 'dividends@stockfake.com',
      subject: `Dividend Payment - ${dividend.quarter}`,
      body: `You have received $${dividend.netAmount.toFixed(2)} in dividends (Gross: $${dividend.grossAmount.toFixed(2)}, Tax: $${dividend.tax.toFixed(2)}). Payment details: ${dividend.details.map(d => `${d.symbol}: ${d.shares} shares × $${d.dividend.toFixed(2)}`).join(', ')}`,
      date: dividend.date
    });
  });
  
  // Add tax notification emails
  userAccount.taxes.forEach((tax, index) => {
    if (tax.type === 'capital-gains') {
      emails.push({
        id: 200 + index,
        from: 'tax@stockfake.com',
        subject: `Tax Payment - Capital Gains`,
        body: `A capital gains tax of $${tax.amount.toFixed(2)} has been deducted from your sale. ${tax.description}`,
        date: tax.date
      });
    }
  });
  
  res.json(emails.filter(email => email.date <= gameTime).sort((a, b) => b.date - a.date));
});

app.listen(PORT, () => {
  console.log(`StockFake server running on port ${PORT}`);
  console.log(`Game started at ${gameTime}`);
});
