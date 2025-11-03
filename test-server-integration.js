/**
 * Integration test to verify inflation and dividend data linking works correctly in server context
 */

const constants = require('./helpers/constants');
const dynamicRatesGenerator = require('./helpers/dynamicRatesGenerator');

console.log('=== Server Integration Test for Inflation/Dividend Linking ===\n');

// Test 1: Verify that constants exports work correctly
console.log('Test 1: Verify constants module exports');
try {
  if (typeof constants.inflationRates !== 'object') {
    throw new Error('inflationRates is not an object');
  }
  if (typeof constants.dividendRates !== 'object') {
    throw new Error('dividendRates is not an object');
  }
  if (typeof constants.getInflationRate !== 'function') {
    throw new Error('getInflationRate is not a function');
  }
  if (typeof constants.getDividendRate !== 'function') {
    throw new Error('getDividendRate is not a function');
  }
  
  console.log('✓ All required exports present');
  console.log('  - inflationRates (object/proxy)');
  console.log('  - dividendRates (object/proxy)');
  console.log('  - getInflationRate (function)');
  console.log('  - getDividendRate (function)\n');
} catch (error) {
  console.error('✗ Failed:', error.message, '\n');
  process.exit(1);
}

// Test 2: Verify transition from historical to dynamic at 2024/2025 boundary
console.log('Test 2: Verify smooth transition at 2024/2025 boundary');
try {
  const inflation2024 = constants.inflationRates[2024];
  const inflation2025 = constants.inflationRates[2025];
  const inflation2026 = constants.inflationRates[2026];
  
  // All should be valid numbers
  if (typeof inflation2024 !== 'number' || isNaN(inflation2024)) {
    throw new Error('2024 inflation rate is invalid');
  }
  if (typeof inflation2025 !== 'number' || isNaN(inflation2025)) {
    throw new Error('2025 inflation rate is invalid');
  }
  if (typeof inflation2026 !== 'number' || isNaN(inflation2026)) {
    throw new Error('2026 inflation rate is invalid');
  }
  
  // 2024 should be historical (2.9%)
  if (inflation2024 !== 2.9) {
    throw new Error(`Expected 2024 to be 2.9%, got ${inflation2024}%`);
  }
  
  // 2025+ should be reasonable (between -2% and 15%)
  if (inflation2025 < -2 || inflation2025 > 15) {
    throw new Error(`2025 inflation ${inflation2025}% outside expected range`);
  }
  
  console.log('✓ Smooth transition at boundary');
  console.log(`  2024: ${inflation2024}% (historical)`);
  console.log(`  2025: ${inflation2025}% (dynamic)`);
  console.log(`  2026: ${inflation2026}% (dynamic)\n`);
} catch (error) {
  console.error('✗ Failed:', error.message, '\n');
  process.exit(1);
}

// Test 3: Simulate server code using inflationRates directly
console.log('Test 3: Simulate server code patterns');
try {
  // Pattern 1: Direct access (as might be used in legacy code)
  const rate1990 = constants.inflationRates[1990];
  const rate2030 = constants.inflationRates[2030];
  
  if (rate1990 !== 5.4) {
    throw new Error(`Expected 1990 to be 5.4%, got ${rate1990}%`);
  }
  
  // Pattern 2: Function call (preferred pattern)
  const rate1990Func = constants.getInflationRate(1990);
  const rate2030Func = constants.getInflationRate(2030);
  
  if (rate1990 !== rate1990Func) {
    throw new Error('Direct access and function call return different values for 1990');
  }
  if (rate2030 !== rate2030Func) {
    throw new Error('Direct access and function call return different values for 2030');
  }
  
  console.log('✓ Both access patterns work correctly');
  console.log(`  Direct access: 1990=${rate1990}%, 2030=${rate2030}%`);
  console.log(`  Function call: 1990=${rate1990Func}%, 2030=${rate2030Func}%\n`);
} catch (error) {
  console.error('✗ Failed:', error.message, '\n');
  process.exit(1);
}

// Test 4: Test dividend rates work with server patterns
console.log('Test 4: Test dividend rates with server patterns');
try {
  // Pattern 1: Direct access (legacy)
  const aaplDiv = constants.dividendRates['AAPL'];
  const ibmDiv = constants.dividendRates['IBM'];
  
  if (aaplDiv !== 0.25) {
    throw new Error(`Expected AAPL dividend to be 0.25, got ${aaplDiv}`);
  }
  if (ibmDiv !== 0.50) {
    throw new Error(`Expected IBM dividend to be 0.50, got ${ibmDiv}`);
  }
  
  // Pattern 2: Function call for specific year (preferred for post-2024)
  const aaplDiv2024 = constants.getDividendRate('AAPL', 2024);
  const aaplDiv2030 = constants.getDividendRate('AAPL', 2030);
  
  if (aaplDiv !== aaplDiv2024) {
    throw new Error('Direct access and function call (2024) return different values');
  }
  
  // 2030 should be different (dynamically generated)
  if (typeof aaplDiv2030 !== 'number' || isNaN(aaplDiv2030)) {
    throw new Error('2030 dividend rate is invalid');
  }
  
  console.log('✓ Dividend rates work correctly');
  console.log(`  Direct access: AAPL=$${aaplDiv}, IBM=$${ibmDiv}`);
  console.log(`  Function call: AAPL 2024=$${aaplDiv2024}, AAPL 2030=$${aaplDiv2030}\n`);
} catch (error) {
  console.error('✗ Failed:', error.message, '\n');
  process.exit(1);
}

// Test 5: Test iteration over rates (for Object.keys, for...in, etc.)
console.log('Test 5: Test iteration patterns');
try {
  // Inflation rates - should be able to iterate over historical years
  const inflationKeys = Object.keys(constants.inflationRates);
  if (inflationKeys.length < 50) {
    throw new Error('Expected at least 50 years of inflation data');
  }
  
  // Dividend rates - should be able to iterate over symbols
  const dividendKeys = Object.keys(constants.dividendRates);
  if (dividendKeys.length < 100) {
    throw new Error('Expected at least 100 dividend symbols');
  }
  
  console.log('✓ Iteration patterns work correctly');
  console.log(`  Inflation years: ${inflationKeys.length} (${inflationKeys[0]}-${inflationKeys[inflationKeys.length-1]})`);
  console.log(`  Dividend symbols: ${dividendKeys.length}\n`);
} catch (error) {
  console.error('✗ Failed:', error.message, '\n');
  process.exit(1);
}

// Test 6: Verify consistency across multiple accesses
console.log('Test 6: Verify deterministic behavior');
try {
  const year = 2027;
  const access1 = constants.inflationRates[year];
  const access2 = constants.inflationRates[year];
  const access3 = constants.getInflationRate(year);
  
  if (access1 !== access2) {
    throw new Error('Multiple proxy accesses return different values');
  }
  if (access1 !== access3) {
    throw new Error('Proxy and function return different values');
  }
  
  console.log('✓ Deterministic behavior verified');
  console.log(`  All three accesses return: ${access1}%\n`);
} catch (error) {
  console.error('✗ Failed:', error.message, '\n');
  process.exit(1);
}

// Test 7: Test edge cases
console.log('Test 7: Test edge cases');
try {
  // Very old year (before 1970) - should not be available
  const before1970 = constants.getInflationRate(1950);
  const hasBefore1970 = 1950 in constants.inflationRates;
  
  if (hasBefore1970) {
    throw new Error('Years before 1970 should not be in inflationRates');
  }
  
  // Very far future
  const farFuture = constants.inflationRates[2100];
  if (typeof farFuture !== 'number' || isNaN(farFuture)) {
    throw new Error('Far future year returns invalid value');
  }
  if (farFuture < -2 || farFuture > 15) {
    throw new Error(`Far future inflation ${farFuture}% outside expected range`);
  }
  
  // Non-existent dividend symbol
  const nonExistent = constants.dividendRates['NOTREAL'];
  if (nonExistent !== 0) {
    throw new Error(`Expected non-existent symbol to return 0, got ${nonExistent}`);
  }
  
  console.log('✓ Edge cases handled correctly');
  console.log(`  Year 2100: ${farFuture}%`);
  console.log(`  Non-existent symbol: $${nonExistent}\n`);
} catch (error) {
  console.error('✗ Failed:', error.message, '\n');
  process.exit(1);
}

console.log('=== All Integration Tests Passed! ===');
console.log('\nConclusion:');
console.log('- inflationRates successfully links historical data (≤2024) with dynamic data (>2024)');
console.log('- dividendRates provides historical data via proxy');
console.log('- Both direct access and function calls work consistently');
console.log('- Server code patterns are fully compatible');
console.log('- Edge cases are handled gracefully');
