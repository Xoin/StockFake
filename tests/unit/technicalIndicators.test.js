/**
 * Unit tests for Technical Indicators Module
 */

const technicalIndicators = require('../../helpers/technicalIndicators');

console.log('\n======================================================================');
console.log('Technical Indicators Unit Tests');
console.log('======================================================================\n');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log('✓ ' + message);
    passed++;
  } else {
    console.log('✗ ' + message);
    failed++;
  }
}

function assertAlmostEqual(actual, expected, tolerance, message) {
  const diff = Math.abs(actual - expected);
  if (diff <= tolerance) {
    console.log('✓ ' + message);
    passed++;
  } else {
    console.log('✗ ' + message + ` (expected ${expected}, got ${actual}, diff ${diff})`);
    failed++;
  }
}

// Test data: simple price series
const testPrices = [10, 11, 12, 11, 10, 11, 12, 13, 14, 13, 12, 13, 14, 15, 14, 13, 14, 15, 16, 17];

console.log('Testing SMA (Simple Moving Average)...');
const sma5 = technicalIndicators.calculateSMA(testPrices, 5);
assert(sma5.length === testPrices.length, 'SMA returns correct array length');
assert(sma5[0] === null, 'SMA returns null for insufficient data points');
assert(sma5[4] !== null, 'SMA calculates value at period boundary');
assertAlmostEqual(sma5[4], 10.8, 0.1, 'SMA calculates correct average');

console.log('\nTesting EMA (Exponential Moving Average)...');
const ema5 = technicalIndicators.calculateEMA(testPrices, 5);
assert(ema5.length === testPrices.length, 'EMA returns correct array length');
assert(ema5[0] === null, 'EMA returns null for insufficient data points');
assert(ema5[4] !== null, 'EMA calculates value at period boundary');
assert(ema5[testPrices.length - 1] > 0, 'EMA calculates positive value');

console.log('\nTesting RSI (Relative Strength Index)...');
const rsi14 = technicalIndicators.calculateRSI(testPrices, 14);
assert(rsi14.length === testPrices.length, 'RSI returns correct array length');
assert(rsi14[14] !== null, 'RSI calculates value after period');
assert(rsi14[testPrices.length - 1] >= 0 && rsi14[testPrices.length - 1] <= 100, 'RSI value is between 0 and 100');

console.log('\nTesting MACD (Moving Average Convergence Divergence)...');
const macd = technicalIndicators.calculateMACD(testPrices, 12, 26, 9);
assert(macd.macd.length === testPrices.length, 'MACD returns correct array length');
assert(macd.signal.length === testPrices.length, 'MACD signal returns correct array length');
assert(macd.histogram.length === testPrices.length, 'MACD histogram returns correct array length');
assert(macd.macd[0] === null, 'MACD returns null for insufficient data');

console.log('\nTesting Bollinger Bands...');
const bb = technicalIndicators.calculateBollingerBands(testPrices, 20, 2);
assert(bb.upper.length === testPrices.length, 'Bollinger upper band returns correct array length');
assert(bb.middle.length === testPrices.length, 'Bollinger middle band returns correct array length');
assert(bb.lower.length === testPrices.length, 'Bollinger lower band returns correct array length');
assert(bb.upper[testPrices.length - 1] > bb.middle[testPrices.length - 1], 'Upper band is above middle');
assert(bb.middle[testPrices.length - 1] > bb.lower[testPrices.length - 1], 'Middle band is above lower');

console.log('\nTesting OHLC Generation...');
const priceData = testPrices.map((price, i) => ({
  date: new Date(2020, 0, i + 1),
  price: price
}));
const ohlc = technicalIndicators.generateOHLC(priceData);
assert(ohlc.length === priceData.length, 'OHLC returns correct array length');
assert(ohlc[0].open !== undefined, 'OHLC has open price');
assert(ohlc[0].high !== undefined, 'OHLC has high price');
assert(ohlc[0].low !== undefined, 'OHLC has low price');
assert(ohlc[0].close !== undefined, 'OHLC has close price');
assert(ohlc[0].volume !== undefined, 'OHLC has volume');
assert(ohlc[0].high >= ohlc[0].close, 'High is >= close');
assert(ohlc[0].low <= ohlc[0].close, 'Low is <= close');

console.log('\nTesting ATR (Average True Range)...');
const atr = technicalIndicators.calculateATR(ohlc, 14);
assert(atr.length === ohlc.length, 'ATR returns correct array length');
assert(atr[testPrices.length - 1] > 0, 'ATR calculates positive value');

console.log('\nTesting OBV (On-Balance Volume)...');
const obv = technicalIndicators.calculateOBV(ohlc);
assert(obv.length === ohlc.length, 'OBV returns correct array length');
assert(obv[0] !== undefined, 'OBV calculates initial value');

console.log('\nTesting VWAP (Volume Weighted Average Price)...');
const vwap = technicalIndicators.calculateVWAP(ohlc);
assert(vwap.length === ohlc.length, 'VWAP returns correct array length');
assert(vwap[0] > 0, 'VWAP calculates positive value');

console.log('\n======================================================================');
console.log(`Tests completed: ${passed} passed, ${failed} failed`);
console.log('======================================================================\n');

if (failed > 0) {
  process.exit(1);
}
