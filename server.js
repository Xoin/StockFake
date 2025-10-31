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

app.get('/graphs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'graphs.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Stock data API
const stocks = require('./data/stocks');
const emailGenerator = require('./data/emails');

app.get('/api/stocks', (req, res) => {
  res.json(stocks.getStockData(gameTime));
});

app.get('/api/stocks/:symbol', (req, res) => {
  const { symbol } = req.params;
  res.json(stocks.getStockPrice(symbol, gameTime));
});

// Stock history API for charts
app.get('/api/stocks/:symbol/history', (req, res) => {
  const { symbol } = req.params;
  const { days } = req.query;
  
  const daysToFetch = parseInt(days) || 30;
  const history = [];
  
  // Get historical prices for the specified number of days
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

// Market index API for market overview charts
app.get('/api/market/index', (req, res) => {
  const { days } = req.query;
  const daysToFetch = parseInt(days) || 30;
  const history = [];
  
  // Calculate simple market index based on average of all stocks
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
  shortPositions: {}, // Track short positions (symbol: {shares, borrowPrice, borrowDate})
  purchaseHistory: {}, // Track purchase prices for tax calculation
  transactions: [], // History of all transactions
  dividends: [], // History of dividend payments
  taxes: [], // History of tax payments
  fees: [], // History of fees charged
  lastTradeTime: {}, // Track last trade time per symbol for cooldown
  shareholderInfluence: {} // Track voting power by company
};

// Trading restrictions
const TRADE_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes cooldown between trades for same stock

// Tax rates
const SHORT_TERM_TAX_RATE = 0.30; // 30% for holdings < 1 year
const LONG_TERM_TAX_RATE = 0.15; // 15% for holdings >= 1 year
const DIVIDEND_TAX_RATE = 0.15; // 15% on dividends

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
setInterval(updateShortPositions, 10000);

app.get('/api/account', (req, res) => {
  res.json({
    cash: userAccount.cash,
    portfolio: userAccount.portfolio,
    shortPositions: userAccount.shortPositions,
    transactions: userAccount.transactions.slice(-20), // Last 20 transactions
    dividends: userAccount.dividends.slice(-10), // Last 10 dividend payments
    taxes: userAccount.taxes.slice(-10), // Last 10 tax payments
    fees: userAccount.fees.slice(-10), // Last 10 fees
    shareholderInfluence: userAccount.shareholderInfluence,
    inflationData: {
      cumulativeInflation: cumulativeInflation,
      realValue: userAccount.cash / cumulativeInflation, // Purchasing power in 1970 dollars
      inflationYear: gameTime.getFullYear(),
      currentRate: inflationRates[gameTime.getFullYear()] || 0
    }
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
  const tradingFee = getTradingFee(totalCost, gameTime);
  
  if (action === 'buy') {
    const totalWithFee = totalCost + tradingFee;
    if (userAccount.cash < totalWithFee) {
      return res.status(400).json({ error: 'Insufficient funds (including trading fee)' });
    }
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
    
    // Apply sale and deduct tax and fee
    const grossSaleAmount = totalCost;
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
  
  // Add dividend emails
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

app.listen(PORT, () => {
  console.log(`StockFake server running on port ${PORT}`);
  console.log(`Game started at ${gameTime}`);
});
