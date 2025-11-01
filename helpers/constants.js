const dynamicRatesGenerator = require('./dynamicRatesGenerator');

// Trading restrictions
const TRADE_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes cooldown between trades for same stock

// Margin trading constants
const INITIAL_MARGIN_REQUIREMENT = 0.50; // 50% initial margin (post-1974 regulation)
const INITIAL_MARGIN_REQUIREMENT_1970 = 0.70; // 70% initial margin in early 1970s
const MAINTENANCE_MARGIN_REQUIREMENT = 0.30; // 30% maintenance margin
const MARGIN_CALL_GRACE_PERIOD_DAYS = 5; // Days to meet margin call before forced liquidation
const MARGIN_INTEREST_RATE_BASE = 0.08; // 8% annual base rate on margin loans

// Tax rates (base rates for historical period)
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
// Historical data up to 2024, dynamically generated after that
const inflationRates = dynamicRatesGenerator.HISTORICAL_INFLATION;

// Dividend data (quarterly payouts per share)  
// Historical data up to 2024, dynamically generated after that
const dividendRates = dynamicRatesGenerator.HISTORICAL_DIVIDENDS;

/**
 * Get inflation rate for a given year
 * Uses historical data for years up to 2024, generates dynamically for future years
 */
function getInflationRate(year) {
  return dynamicRatesGenerator.generateInflationRate(year);
}

/**
 * Get all inflation rates up to a given year
 */
function getAllInflationRates(upToYear = null) {
  return dynamicRatesGenerator.getAllInflationRates(upToYear);
}

/**
 * Get dividend rate for a given symbol and year
 * Uses historical data for years up to 2024, generates dynamically for future years
 */
function getDividendRate(symbol, year = null) {
  if (!year || year <= 2024) {
    return dividendRates[symbol] || 0;
  }
  return dynamicRatesGenerator.generateDividendRate(symbol, year);
}

/**
 * Get all dividend rates for a given year
 */
function getAllDividendRates(year = null) {
  return dynamicRatesGenerator.getAllDividendRates(year);
}

/**
 * Get tax rates for a given year
 * Uses base rates for historical period, can generate dynamic rates for future years
 */
function getTaxRates(year = null) {
  if (!year || year <= 2024) {
    return {
      shortTermTaxRate: SHORT_TERM_TAX_RATE,
      longTermTaxRate: LONG_TERM_TAX_RATE,
      dividendTaxRate: DIVIDEND_TAX_RATE
    };
  }
  return dynamicRatesGenerator.generateTaxRates(year);
}

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
  getTradingFee,
  getInflationRate,
  getAllInflationRates,
  getDividendRate,
  getAllDividendRates,
  getTaxRates
};
