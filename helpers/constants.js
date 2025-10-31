// Trading restrictions
const TRADE_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes cooldown between trades for same stock

// Margin trading constants
const INITIAL_MARGIN_REQUIREMENT = 0.50; // 50% initial margin (post-1974 regulation)
const INITIAL_MARGIN_REQUIREMENT_1970 = 0.70; // 70% initial margin in early 1970s
const MAINTENANCE_MARGIN_REQUIREMENT = 0.30; // 30% maintenance margin
const MARGIN_CALL_GRACE_PERIOD_DAYS = 5; // Days to meet margin call before forced liquidation
const MARGIN_INTEREST_RATE_BASE = 0.08; // 8% annual base rate on margin loans

// Tax rates
const SHORT_TERM_TAX_RATE = 0.30; // 30% for holdings < 1 year
const LONG_TERM_TAX_RATE = 0.15; // 15% for holdings >= 1 year
const DIVIDEND_TAX_RATE = 0.15; // 15% on dividends

// Fee structure
const TRADING_FEE_FLAT = 9.99; // Flat fee per trade in 1970s
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

// Dividend data (quarterly payouts per share)
const dividendRates = {
  // Technology
  'IBM': 0.50, 'AAPL': 0.25, 'MSFT': 0.30, 'INTC': 0.35, 'ORCL': 0.20,
  'TXN': 0.28, 'QCOM': 0.30, 'CSCO': 0.38, 'HPQ': 0.25,
  
  // Energy
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
  
  // Financial Services
  'JPM': 0.45, 'BAC': 0.40, 'WFC': 0.42, 'C': 0.38, 'GS': 0.50,
  'MS': 0.45, 'AXP': 0.40, 'BLK': 0.52, 'SCHW': 0.25, 'USB': 0.42,
  'PNC': 0.48, 'TFC': 0.45,
  
  // Insurance
  'BRK.B': 0, 'AIG': 0.35, 'MET': 0.48, 'PRU': 0.52, 'ALL': 0.50,
  'TRV': 0.55, 'PGR': 0.30,
  
  // Retail
  'WMT': 0.55, 'HD': 0.50, 'LOW': 0.48, 'TGT': 0.45, 'COST': 0.35, 'KR': 0.30,
  
  // Consumer Goods
  'PG': 0.60, 'KO': 0.42, 'PEP': 0.45, 'PM': 0.65, 'MO': 0.70,
  'CL': 0.48, 'KMB': 0.52, 'GIS': 0.50, 'K': 0.48, 'CPB': 0.45,
  'HSY': 0.42, 'MCD': 0.52, 'SBUX': 0.25, 'NKE': 0.28,
  
  // Telecom
  'T': 0.52, 'VZ': 0.55, 'TMUS': 0, 'CTL': 0.25,
  
  // Media & Entertainment
  'DIS': 0, 'CMCSA': 0.38, 'TWX': 0.40, 'FOXA': 0.35, 'VIAB': 0.42,
  
  // Chemicals & Materials
  'DOW': 0.45, 'DD': 0.42, 'ECL': 0.35, 'APD': 0.52, 'PPG': 0.48,
  'NEM': 0.30, 'FCX': 0.25,
  
  // Utilities
  'NEE': 0.55, 'DUK': 0.58, 'SO': 0.60, 'D': 0.52, 'EXC': 0.48, 'AEP': 0.55,
  
  // Transportation
  'UPS': 0.52, 'FDX': 0.30, 'UNP': 0.48, 'NSC': 0.50, 'CSX': 0.45,
  
  // Real Estate (REITs)
  'AMT': 0.60, 'PLD': 0.55, 'CCI': 0.62, 'SPG': 0.70,
  
  // Other
  'ADM': 0.45, 'BG': 0.40, 'TSN': 0.38, 'CLX': 0.50, 'EL': 0.30,
  'IP': 0.40, 'WY': 0.45, 'NUE': 0.42, 'AA': 0.35
};

// Get initial margin requirement based on year (regulations changed over time)
function getInitialMarginRequirement(currentTime) {
  const year = currentTime.getFullYear();
  // Regulation T changed in 1974 from 70% to 50%
  if (year < 1974) {
    return INITIAL_MARGIN_REQUIREMENT_1970;
  }
  return INITIAL_MARGIN_REQUIREMENT;
}

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

module.exports = {
  TRADE_COOLDOWN_MS,
  INITIAL_MARGIN_REQUIREMENT,
  INITIAL_MARGIN_REQUIREMENT_1970,
  MAINTENANCE_MARGIN_REQUIREMENT,
  MARGIN_CALL_GRACE_PERIOD_DAYS,
  MARGIN_INTEREST_RATE_BASE,
  SHORT_TERM_TAX_RATE,
  LONG_TERM_TAX_RATE,
  DIVIDEND_TAX_RATE,
  TRADING_FEE_FLAT,
  TRADING_FEE_PERCENTAGE,
  MONTHLY_ACCOUNT_FEE,
  MINIMUM_BALANCE,
  SHORT_BORROW_FEE_ANNUAL,
  inflationRates,
  dividendRates,
  getInitialMarginRequirement,
  getTradingFee
};
