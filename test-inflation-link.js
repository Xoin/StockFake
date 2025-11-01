/**
 * Test script to verify that inflationRates and dividendRates properly link
 * historical data (up to 2024) with dynamically generated data (post-2024)
 */

const constants = require('./helpers/constants');
const dynamicRatesGenerator = require('./helpers/dynamicRatesGenerator');

console.log('=== Testing Inflation Rates Linking ===\n');

// Test 1: Access historical inflation rates via proxy
console.log('Test 1: Access historical inflation rates (pre-2024)');
try {
  const inflation1970 = constants.inflationRates[1970];
  const inflation2020 = constants.inflationRates[2020];
  const inflation2024 = constants.inflationRates[2024];
  
  if (inflation1970 !== 5.9) {
    throw new Error(`Expected 1970 inflation to be 5.9%, got ${inflation1970}%`);
  }
  if (inflation2020 !== 1.2) {
    throw new Error(`Expected 2020 inflation to be 1.2%, got ${inflation2020}%`);
  }
  if (inflation2024 !== 2.9) {
    throw new Error(`Expected 2024 inflation to be 2.9%, got ${inflation2024}%`);
  }
  
  console.log('✓ Historical inflation rates accessible via proxy');
  console.log(`  1970: ${inflation1970}%`);
  console.log(`  2020: ${inflation2020}%`);
  console.log(`  2024: ${inflation2024}%\n`);
} catch (error) {
  console.error('✗ Failed:', error.message, '\n');
  process.exit(1);
}

// Test 2: Access dynamic inflation rates via proxy (post-2024)
console.log('Test 2: Access dynamic inflation rates (post-2024)');
try {
  const inflation2025 = constants.inflationRates[2025];
  const inflation2026 = constants.inflationRates[2026];
  const inflation2030 = constants.inflationRates[2030];
  
  if (typeof inflation2025 !== 'number' || isNaN(inflation2025)) {
    throw new Error('Invalid inflation rate for 2025');
  }
  if (typeof inflation2026 !== 'number' || isNaN(inflation2026)) {
    throw new Error('Invalid inflation rate for 2026');
  }
  if (typeof inflation2030 !== 'number' || isNaN(inflation2030)) {
    throw new Error('Invalid inflation rate for 2030');
  }
  
  // Verify that the values match what the generator produces
  const expectedInflation2025 = dynamicRatesGenerator.generateInflationRate(2025);
  if (inflation2025 !== expectedInflation2025) {
    throw new Error(`Proxy returned ${inflation2025}% but generator returned ${expectedInflation2025}%`);
  }
  
  console.log('✓ Dynamic inflation rates accessible via proxy');
  console.log(`  2025: ${inflation2025}%`);
  console.log(`  2026: ${inflation2026}%`);
  console.log(`  2030: ${inflation2030}%\n`);
} catch (error) {
  console.error('✗ Failed:', error.message, '\n');
  process.exit(1);
}

// Test 3: Verify consistency between proxy and function calls
console.log('Test 3: Verify consistency between proxy and function');
try {
  const year = 2028;
  const proxyValue = constants.inflationRates[year];
  const functionValue = constants.getInflationRate(year);
  
  if (proxyValue !== functionValue) {
    throw new Error(`Proxy returned ${proxyValue}% but function returned ${functionValue}%`);
  }
  
  console.log('✓ Proxy and function return consistent values');
  console.log(`  Both return ${proxyValue}% for 2028\n`);
} catch (error) {
  console.error('✗ Failed:', error.message, '\n');
  process.exit(1);
}

// Test 4: Test dividend rates proxy
console.log('Test 4: Access dividend rates via proxy');
try {
  const aaplDiv = constants.dividendRates['AAPL'];
  const ibmDiv = constants.dividendRates['IBM'];
  const xomDiv = constants.dividendRates['XOM'];
  
  if (aaplDiv !== 0.25) {
    throw new Error(`Expected AAPL dividend to be 0.25, got ${aaplDiv}`);
  }
  if (ibmDiv !== 0.50) {
    throw new Error(`Expected IBM dividend to be 0.50, got ${ibmDiv}`);
  }
  if (xomDiv !== 0.45) {
    throw new Error(`Expected XOM dividend to be 0.45, got ${xomDiv}`);
  }
  
  console.log('✓ Dividend rates accessible via proxy');
  console.log(`  AAPL: $${aaplDiv}`);
  console.log(`  IBM: $${ibmDiv}`);
  console.log(`  XOM: $${xomDiv}\n`);
} catch (error) {
  console.error('✗ Failed:', error.message, '\n');
  process.exit(1);
}

// Test 5: Test dividend rates for non-existent symbols
console.log('Test 5: Access dividend rates for non-existent symbols');
try {
  const nonExistentDiv = constants.dividendRates['NONEXISTENT'];
  
  if (nonExistentDiv !== 0) {
    throw new Error(`Expected non-existent symbol to return 0, got ${nonExistentDiv}`);
  }
  
  console.log('✓ Non-existent symbols return 0');
  console.log(`  NONEXISTENT: $${nonExistentDiv}\n`);
} catch (error) {
  console.error('✗ Failed:', error.message, '\n');
  process.exit(1);
}

// Test 6: Test Object.keys() on inflationRates (should return historical years)
console.log('Test 6: Test Object.keys() on inflationRates');
try {
  const keys = Object.keys(constants.inflationRates);
  const expectedKeys = Object.keys(dynamicRatesGenerator.HISTORICAL_INFLATION);
  
  if (keys.length !== expectedKeys.length) {
    throw new Error(`Expected ${expectedKeys.length} keys, got ${keys.length}`);
  }
  
  console.log('✓ Object.keys() returns historical years');
  console.log(`  Total years: ${keys.length}`);
  console.log(`  First year: ${keys[0]}`);
  console.log(`  Last year: ${keys[keys.length - 1]}\n`);
} catch (error) {
  console.error('✗ Failed:', error.message, '\n');
  process.exit(1);
}

// Test 7: Test Object.keys() on dividendRates
console.log('Test 7: Test Object.keys() on dividendRates');
try {
  const keys = Object.keys(constants.dividendRates);
  const expectedKeys = Object.keys(dynamicRatesGenerator.HISTORICAL_DIVIDENDS);
  
  if (keys.length !== expectedKeys.length) {
    throw new Error(`Expected ${expectedKeys.length} keys, got ${keys.length}`);
  }
  
  console.log('✓ Object.keys() returns all symbols');
  console.log(`  Total symbols: ${keys.length}`);
  console.log(`  Sample symbols: ${keys.slice(0, 5).join(', ')}\n`);
} catch (error) {
  console.error('✗ Failed:', error.message, '\n');
  process.exit(1);
}

// Test 8: Test 'in' operator for inflationRates
console.log('Test 8: Test "in" operator for inflationRates');
try {
  const has1970 = 1970 in constants.inflationRates;
  const has2025 = 2025 in constants.inflationRates;
  const hasInvalid = 'invalid' in constants.inflationRates;
  
  if (!has1970) {
    throw new Error('Expected 1970 to be in inflationRates');
  }
  if (!has2025) {
    throw new Error('Expected 2025 to be in inflationRates');
  }
  if (hasInvalid) {
    throw new Error('Expected "invalid" to not be in inflationRates');
  }
  
  console.log('✓ "in" operator works correctly');
  console.log(`  1970 in inflationRates: ${has1970}`);
  console.log(`  2025 in inflationRates: ${has2025}`);
  console.log(`  "invalid" in inflationRates: ${hasInvalid}\n`);
} catch (error) {
  console.error('✗ Failed:', error.message, '\n');
  process.exit(1);
}

// Test 9: Test backward compatibility - ensure existing code still works
console.log('Test 9: Test backward compatibility');
try {
  // Simulate existing code that might use these constants
  const inflationFor1990 = constants.inflationRates[1990];
  const inflationFor2025 = constants.inflationRates[2025];
  
  // Ensure both work
  if (typeof inflationFor1990 !== 'number' || isNaN(inflationFor1990)) {
    throw new Error('Historical access broken');
  }
  if (typeof inflationFor2025 !== 'number' || isNaN(inflationFor2025)) {
    throw new Error('Dynamic access broken');
  }
  
  console.log('✓ Backward compatibility maintained');
  console.log(`  Can access both historical (1990: ${inflationFor1990}%) and dynamic (2025: ${inflationFor2025}%) data\n`);
} catch (error) {
  console.error('✗ Failed:', error.message, '\n');
  process.exit(1);
}

console.log('=== All Tests Passed! ===');
console.log('\nSummary:');
console.log('- inflationRates proxy successfully links historical and dynamic data');
console.log('- dividendRates proxy successfully provides historical dividend data');
console.log('- Backward compatibility maintained');
console.log('- Consistency between proxy access and function calls verified');
