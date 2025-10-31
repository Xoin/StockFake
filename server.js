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
    const timeSinceLastTrade = gameTime.getTime() - userAccount.lastTradeTime[symbol].getTime();
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
    const grossSaleAmount = totalCost;
    const netSaleProceeds = grossSaleAmount - taxAmount;
    userAccount.cash += netSaleProceeds;
    userAccount.portfolio[symbol] -= shares;
    
    // Record transaction
    userAccount.transactions.push({
      date: new Date(gameTime),
      type: 'sell',
      symbol,
      shares,
      pricePerShare: stockPrice.price,
      total: grossSaleAmount,
      tax: taxAmount,
      netProceeds: netSaleProceeds
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
  userAccount.lastTradeTime[symbol] = new Date(gameTime);
  
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
