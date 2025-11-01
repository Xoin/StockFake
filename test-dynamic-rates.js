#!/usr/bin/env node

/**
 * Integration test for Dynamic Rates Generator
 * This script validates the dynamic tax and dividend rate generation functionality
 */

const dynamicRatesGenerator = require('./helpers/dynamicRatesGenerator');

console.log('=== Dynamic Rates Generator Integration Test ===\n');

// Test 1: Get default configuration
console.log('Test 1: Get default configuration');
try {
  const config = dynamicRatesGenerator.getConfiguration();
  
  if (!config.historicalDataEndDate || config.baseInflationRate === undefined) {
    throw new Error('Configuration missing required fields');
  }
  
  console.log('✓ Configuration retrieved successfully');
  console.log(`  Historical data end: ${config.historicalDataEndDate.toISOString().split('T')[0]}`);
  console.log(`  Base inflation rate: ${config.baseInflationRate}%`);
  console.log(`  Base short-term tax rate: ${(config.baseShortTermTaxRate * 100).toFixed(0)}%`);
  console.log(`  Base long-term tax rate: ${(config.baseLongTermTaxRate * 100).toFixed(0)}%\n`);
} catch (error) {
  console.error('✗ Failed to get configuration:', error.message);
  process.exit(1);
}

// Test 2: Generate inflation rates for future years
console.log('Test 2: Generate inflation rates for future years');
try {
  const inflation2025 = dynamicRatesGenerator.generateInflationRate(2025);
  const inflation2026 = dynamicRatesGenerator.generateInflationRate(2026);
  const inflation2030 = dynamicRatesGenerator.generateInflationRate(2030);
  
  if (typeof inflation2025 !== 'number' || isNaN(inflation2025)) {
    throw new Error('Invalid inflation rate generated for 2025');
  }
  
  if (inflation2025 < -2 || inflation2025 > 15) {
    throw new Error('Inflation rate out of reasonable bounds');
  }
  
  console.log('✓ Future inflation rates generated');
  console.log(`  2025: ${inflation2025}%`);
  console.log(`  2026: ${inflation2026}%`);
  console.log(`  2030: ${inflation2030}%\n`);
} catch (error) {
  console.error('✗ Failed to generate inflation rates:', error.message);
  process.exit(1);
}

// Test 3: Test historical inflation rates (should return exact values)
console.log('Test 3: Test historical inflation rates');
try {
  const inflation2020 = dynamicRatesGenerator.generateInflationRate(2020);
  const inflation2024 = dynamicRatesGenerator.generateInflationRate(2024);
  
  if (inflation2020 !== 1.2) {
    throw new Error(`Expected 2020 inflation to be 1.2%, got ${inflation2020}%`);
  }
  
  if (inflation2024 !== 2.9) {
    throw new Error(`Expected 2024 inflation to be 2.9%, got ${inflation2024}%`);
  }
  
  console.log('✓ Historical inflation rates returned correctly');
  console.log(`  2020: ${inflation2020}%`);
  console.log(`  2024: ${inflation2024}%\n`);
} catch (error) {
  console.error('✗ Historical inflation test failed:', error.message);
  process.exit(1);
}

// Test 4: Get all inflation rates including future
console.log('Test 4: Get all inflation rates up to 2030');
try {
  const allRates = dynamicRatesGenerator.getAllInflationRates(2030);
  
  if (!allRates[2024] || !allRates[2025] || !allRates[2030]) {
    throw new Error('Missing required years in inflation rates');
  }
  
  if (allRates[2024] !== 2.9) {
    throw new Error('Historical rate incorrect in combined rates');
  }
  
  console.log('✓ All inflation rates retrieved');
  console.log(`  Total years: ${Object.keys(allRates).length}`);
  console.log(`  2024: ${allRates[2024]}%`);
  console.log(`  2025: ${allRates[2025]}%`);
  console.log(`  2030: ${allRates[2030]}%\n`);
} catch (error) {
  console.error('✗ Failed to get all inflation rates:', error.message);
  process.exit(1);
}

// Test 5: Generate dividend rates for future years
console.log('Test 5: Generate dividend rates for future years');
try {
  const appl2025 = dynamicRatesGenerator.generateDividendRate('AAPL', 2025);
  const ibm2025 = dynamicRatesGenerator.generateDividendRate('IBM', 2025);
  const appl2030 = dynamicRatesGenerator.generateDividendRate('AAPL', 2030);
  
  if (typeof appl2025 !== 'number' || isNaN(appl2025) || appl2025 < 0) {
    throw new Error('Invalid dividend rate generated');
  }
  
  // Future dividend should generally be higher than base (with growth)
  const historicalDividends = dynamicRatesGenerator.getHistoricalDividends();
  const baseAppl = historicalDividends['AAPL'];
  if (appl2030 < baseAppl * 0.8) {  // Allow some variation
    console.warn(`  Warning: 2030 AAPL dividend (${appl2030}) seems low compared to base (${baseAppl})`);
  }
  
  console.log('✓ Future dividend rates generated');
  console.log(`  AAPL 2025: $${appl2025.toFixed(2)}`);
  console.log(`  IBM 2025: $${ibm2025.toFixed(2)}`);
  console.log(`  AAPL 2030: $${appl2030.toFixed(2)}\n`);
} catch (error) {
  console.error('✗ Failed to generate dividend rates:', error.message);
  process.exit(1);
}

// Test 6: Test historical dividend rates (should return exact values)
console.log('Test 6: Test historical dividend rates');
try {
  const appl2024 = dynamicRatesGenerator.generateDividendRate('AAPL', 2024);
  const ibm2024 = dynamicRatesGenerator.generateDividendRate('IBM', 2024);
  
  const historicalDividends = dynamicRatesGenerator.getHistoricalDividends();
  const historicalAppl = historicalDividends['AAPL'];
  const historicalIbm = historicalDividends['IBM'];
  
  if (appl2024 !== historicalAppl) {
    throw new Error(`Expected AAPL 2024 dividend to be ${historicalAppl}, got ${appl2024}`);
  }
  
  if (ibm2024 !== historicalIbm) {
    throw new Error(`Expected IBM 2024 dividend to be ${historicalIbm}, got ${ibm2024}`);
  }
  
  console.log('✓ Historical dividend rates returned correctly');
  console.log(`  AAPL 2024: $${appl2024}`);
  console.log(`  IBM 2024: $${ibm2024}\n`);
} catch (error) {
  console.error('✗ Historical dividend test failed:', error.message);
  process.exit(1);
}

// Test 7: Get all dividend rates for a future year
console.log('Test 7: Get all dividend rates for 2025');
try {
  const allDividends2025 = dynamicRatesGenerator.getAllDividendRates(2025);
  
  if (!allDividends2025['AAPL'] || !allDividends2025['IBM']) {
    throw new Error('Missing required symbols in dividend rates');
  }
  
  const symbolCount = Object.keys(allDividends2025).length;
  console.log('✓ All dividend rates retrieved for 2025');
  console.log(`  Total symbols: ${symbolCount}`);
  console.log(`  Sample rates:`);
  console.log(`    AAPL: $${allDividends2025['AAPL'].toFixed(2)}`);
  console.log(`    IBM: $${allDividends2025['IBM'].toFixed(2)}`);
  console.log(`    XOM: $${allDividends2025['XOM'].toFixed(2)}\n`);
} catch (error) {
  console.error('✗ Failed to get all dividend rates:', error.message);
  process.exit(1);
}

// Test 8: Generate tax rates for future years
console.log('Test 8: Generate tax rates for future years');
try {
  const taxRates2025 = dynamicRatesGenerator.generateTaxRates(2025);
  const taxRates2030 = dynamicRatesGenerator.generateTaxRates(2030);
  
  if (!taxRates2025.shortTermTaxRate || !taxRates2025.longTermTaxRate || !taxRates2025.dividendTaxRate) {
    throw new Error('Missing required tax rates');
  }
  
  if (!taxRates2025.wealthTaxRate || !taxRates2025.wealthTaxThreshold) {
    throw new Error('Missing wealth tax rates');
  }
  
  // Tax rates should be in reasonable ranges
  if (taxRates2025.shortTermTaxRate < 0.20 || taxRates2025.shortTermTaxRate > 0.40) {
    throw new Error('Short-term tax rate out of bounds');
  }
  
  if (taxRates2025.wealthTaxRate < 0.005 || taxRates2025.wealthTaxRate > 0.02) {
    throw new Error('Wealth tax rate out of bounds');
  }
  
  console.log('✓ Future tax rates generated');
  console.log(`  2025:`);
  console.log(`    Short-term: ${(taxRates2025.shortTermTaxRate * 100).toFixed(0)}%`);
  console.log(`    Long-term: ${(taxRates2025.longTermTaxRate * 100).toFixed(0)}%`);
  console.log(`    Dividend: ${(taxRates2025.dividendTaxRate * 100).toFixed(0)}%`);
  console.log(`    Wealth: ${(taxRates2025.wealthTaxRate * 100).toFixed(2)}%`);
  console.log(`    Wealth Threshold: $${taxRates2025.wealthTaxThreshold.toLocaleString()}`);
  console.log(`  2030:`);
  console.log(`    Short-term: ${(taxRates2030.shortTermTaxRate * 100).toFixed(0)}%`);
  console.log(`    Long-term: ${(taxRates2030.longTermTaxRate * 100).toFixed(0)}%`);
  console.log(`    Dividend: ${(taxRates2030.dividendTaxRate * 100).toFixed(0)}%`);
  console.log(`    Wealth: ${(taxRates2030.wealthTaxRate * 100).toFixed(2)}%`);
  console.log(`    Wealth Threshold: $${taxRates2030.wealthTaxThreshold.toLocaleString()}\n`);
} catch (error) {
  console.error('✗ Failed to generate tax rates:', error.message);
  process.exit(1);
}

// Test 9: Test deterministic generation (same year should give same result)
console.log('Test 9: Test deterministic generation');
try {
  const inflation2025_1 = dynamicRatesGenerator.generateInflationRate(2025);
  const inflation2025_2 = dynamicRatesGenerator.generateInflationRate(2025);
  
  if (inflation2025_1 !== inflation2025_2) {
    throw new Error('Inflation generation not deterministic');
  }
  
  const appl2025_1 = dynamicRatesGenerator.generateDividendRate('AAPL', 2025);
  const appl2025_2 = dynamicRatesGenerator.generateDividendRate('AAPL', 2025);
  
  if (appl2025_1 !== appl2025_2) {
    throw new Error('Dividend generation not deterministic');
  }
  
  const taxRates2025_1 = dynamicRatesGenerator.generateTaxRates(2025);
  const taxRates2025_2 = dynamicRatesGenerator.generateTaxRates(2025);
  
  if (taxRates2025_1.shortTermTaxRate !== taxRates2025_2.shortTermTaxRate) {
    throw new Error('Tax rate generation not deterministic');
  }
  
  console.log('✓ Deterministic generation verified');
  console.log(`  Inflation 2025: ${inflation2025_1}% (both calls)`);
  console.log(`  AAPL dividend 2025: $${appl2025_1.toFixed(2)} (both calls)`);
  console.log(`  Tax rate 2025: ${(taxRates2025_1.shortTermTaxRate * 100).toFixed(0)}% (both calls)\n`);
} catch (error) {
  console.error('✗ Deterministic generation test failed:', error.message);
  process.exit(1);
}

// Test 10: Test configuration update
console.log('Test 10: Test configuration update');
try {
  const originalConfig = dynamicRatesGenerator.getConfiguration();
  
  dynamicRatesGenerator.updateConfiguration({
    baseInflationRate: 3.0,
    dividendGrowthRate: 0.05
  });
  
  const updatedConfig = dynamicRatesGenerator.getConfiguration();
  
  if (updatedConfig.baseInflationRate !== 3.0) {
    throw new Error('Configuration not updated correctly');
  }
  
  if (updatedConfig.dividendGrowthRate !== 0.05) {
    throw new Error('Dividend growth rate not updated correctly');
  }
  
  console.log('✓ Configuration updated successfully');
  console.log(`  New base inflation rate: ${updatedConfig.baseInflationRate}%`);
  console.log(`  New dividend growth rate: ${(updatedConfig.dividendGrowthRate * 100).toFixed(0)}%`);
  
  // Restore original config
  dynamicRatesGenerator.updateConfiguration({
    baseInflationRate: originalConfig.baseInflationRate,
    dividendGrowthRate: originalConfig.dividendGrowthRate
  });
  
  console.log('  Configuration restored\n');
} catch (error) {
  console.error('✗ Failed to update configuration:', error.message);
  process.exit(1);
}

// Test 11: Test dividend growth over time
console.log('Test 11: Test dividend growth over time');
try {
  const appl2025 = dynamicRatesGenerator.generateDividendRate('AAPL', 2025);
  const appl2030 = dynamicRatesGenerator.generateDividendRate('AAPL', 2030);
  const appl2040 = dynamicRatesGenerator.generateDividendRate('AAPL', 2040);
  
  console.log('✓ Dividend growth over time');
  console.log(`  AAPL 2025: $${appl2025.toFixed(2)}`);
  console.log(`  AAPL 2030: $${appl2030.toFixed(2)}`);
  console.log(`  AAPL 2040: $${appl2040.toFixed(2)}`);
  
  // Generally expect growth over long periods
  if (appl2040 > appl2025) {
    console.log(`  Growth factor (2025-2040): ${(appl2040 / appl2025).toFixed(2)}x\n`);
  } else {
    console.log(`  Note: Random variation caused decrease over this period\n`);
  }
} catch (error) {
  console.error('✗ Dividend growth test failed:', error.message);
  process.exit(1);
}

console.log('=== All Tests Passed! ===');
process.exit(0);
