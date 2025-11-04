/**
 * Test: Realistic Stock Price Volatility
 * 
 * Validates that stock prices don't exhibit unrealistic daily changes,
 * especially in future years (2025+, 2045, etc.)
 * 
 * Issue: Unrealistic stock price changes (>200%) in 2045 and after 2025
 * Fix: Cap daily price changes to realistic bounds (±20%)
 */

const stocks = require('../../data/stocks');

console.log('======================================================================');
console.log('Stock Price Volatility Test');
console.log('======================================================================\n');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ PASS: ${message}`);
    testsPassed++;
  } else {
    console.log(`✗ FAIL: ${message}`);
    testsFailed++;
  }
}

// Test 1: Check daily price changes in 2045
console.log('Test 1: Daily price changes in July 2045');
console.log('----------------------------------------------------------------------\n');

const testStocks = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'IBM'];
const testYear = 2045;
const testMonth = 6; // July (0-indexed)

for (const symbol of testStocks) {
  let maxDailyChange = 0;
  
  for (let day = 1; day <= 30; day++) {
    const date1 = new Date(testYear, testMonth, day);
    const date2 = new Date(testYear, testMonth, day + 1);
    
    const price1 = stocks.getStockPrice(symbol, date1, 3600, false, true);
    const price2 = stocks.getStockPrice(symbol, date2, 3600, false, true);
    
    if (price1 && price2) {
      const change = Math.abs(((price2.price - price1.price) / price1.price) * 100);
      maxDailyChange = Math.max(maxDailyChange, change);
    }
  }
  
  assert(maxDailyChange <= 26, `${symbol}: Max daily change ${maxDailyChange.toFixed(2)}% <= 26%`);
  assert(maxDailyChange < 50, `${symbol}: Max daily change ${maxDailyChange.toFixed(2)}% < 50%`);
}

// Test 2: Check price changes across all stocks on a single day in 2045
console.log('\nTest 2: Price distribution across all stocks (July 15-16, 2045)');
console.log('----------------------------------------------------------------------\n');

const date1 = new Date(2045, 6, 15);
const date2 = new Date(2045, 6, 16);

const allStocks = stocks.getAvailableStocks(date1, 3600, false);
const changes = [];

for (const stock of allStocks) {
  const price1 = stocks.getStockPrice(stock.symbol, date1, 3600, false, true);
  const price2 = stocks.getStockPrice(stock.symbol, date2, 3600, false, true);
  
  if (price1 && price2) {
    const change = Math.abs(((price2.price - price1.price) / price1.price) * 100);
    changes.push({ symbol: stock.symbol, change });
  }
}

const extremeChanges = changes.filter(c => c.change > 50);
const largeChanges = changes.filter(c => c.change > 25);
const moderateChanges = changes.filter(c => c.change <= 25 && c.change > 10);
const normalChanges = changes.filter(c => c.change <= 10);

console.log(`Total stocks tested: ${changes.length}`);
console.log(`  >50% changes: ${extremeChanges.length} (${((extremeChanges.length/changes.length)*100).toFixed(1)}%)`);
console.log(`  25-50% changes: ${largeChanges.length - extremeChanges.length} (${(((largeChanges.length - extremeChanges.length)/changes.length)*100).toFixed(1)}%)`);
console.log(`  10-25% changes: ${moderateChanges.length} (${((moderateChanges.length/changes.length)*100).toFixed(1)}%)`);
console.log(`  <10% changes: ${normalChanges.length} (${((normalChanges.length/changes.length)*100).toFixed(1)}%)\n`);

assert(extremeChanges.length === 0, 'No stocks should have >50% daily changes');
assert(largeChanges.length < changes.length * 0.05, `<5% of stocks should have >25% changes (actual: ${((largeChanges.length/changes.length)*100).toFixed(1)}%)`);
assert(normalChanges.length > changes.length * 0.50, `>50% of stocks should have <10% changes (actual: ${((normalChanges.length/changes.length)*100).toFixed(1)}%)`);

// Test 3: Check price changes at maximum game speed
console.log('\nTest 3: Price changes at maximum game speed (1s = 1 day)');
console.log('----------------------------------------------------------------------\n');

for (const symbol of ['AAPL', 'MSFT', 'GOOGL']) {
  let maxDailyChange = 0;
  
  for (let day = 1; day <= 30; day++) {
    const date1 = new Date(testYear, testMonth, day);
    const date2 = new Date(testYear, testMonth, day + 1);
    
    // Test at maximum speed: timeMultiplier = 86400 (1s = 1 day)
    const price1 = stocks.getStockPrice(symbol, date1, 86400, false, true);
    const price2 = stocks.getStockPrice(symbol, date2, 86400, false, true);
    
    if (price1 && price2) {
      const change = Math.abs(((price2.price - price1.price) / price1.price) * 100);
      maxDailyChange = Math.max(maxDailyChange, change);
    }
  }
  
  assert(maxDailyChange <= 26, `${symbol} at max speed: Max daily change ${maxDailyChange.toFixed(2)}% <= 26%`);
}

// Test 4: Check price changes in 2026 (just after current date)
console.log('\nTest 4: Price changes in 2026 (early future)');
console.log('----------------------------------------------------------------------\n');

for (const symbol of ['AAPL', 'MSFT']) {
  let maxDailyChange = 0;
  
  for (let day = 1; day <= 30; day++) {
    const date1 = new Date(2026, 0, day);
    const date2 = new Date(2026, 0, day + 1);
    
    const price1 = stocks.getStockPrice(symbol, date1, 3600, false, true);
    const price2 = stocks.getStockPrice(symbol, date2, 3600, false, true);
    
    if (price1 && price2) {
      const change = Math.abs(((price2.price - price1.price) / price1.price) * 100);
      maxDailyChange = Math.max(maxDailyChange, change);
    }
  }
  
  assert(maxDailyChange <= 26, `${symbol} in 2026: Max daily change ${maxDailyChange.toFixed(2)}% <= 26%`);
}

// Test 5: Verify GARCH model caps are reasonable
console.log('\nTest 5: GARCH volatility model caps');
console.log('----------------------------------------------------------------------\n');

const { GARCHModel } = require('../../helpers/volatilityModeling');
const garch = new GARCHModel();

// Generate multiple returns and check they're capped
let maxReturn = 0;
for (let i = 0; i < 1000; i++) {
  const ret = Math.abs(garch.generateReturn(5, 0, 0.15)); // Normal conditions: ±15%
  maxReturn = Math.max(maxReturn, ret);
}

assert(maxReturn <= 0.16, `GARCH normal mode: Returns capped at ~15% (max observed: ${(maxReturn*100).toFixed(2)}%)`);

// Test crash mode cap
maxReturn = 0;
for (let i = 0; i < 1000; i++) {
  const ret = Math.abs(garch.generateReturn(5, 0, 0.25)); // Crash conditions: ±25%
  maxReturn = Math.max(maxReturn, ret);
}

assert(maxReturn <= 0.26, `GARCH crash mode: Returns capped at ~25% (max observed: ${(maxReturn*100).toFixed(2)}%)`);

// Summary
console.log('\n======================================================================');
console.log('Summary');
console.log('======================================================================\n');
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);

if (testsFailed === 0) {
  console.log('\n✓ All tests passed! Stock price volatility is realistic.');
  process.exit(0);
} else {
  console.log('\n✗ Some tests failed. Please review the output above.');
  process.exit(1);
}
