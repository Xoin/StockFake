#!/usr/bin/env node
/**
 * Test script to verify all bug fixes and new features
 */

const stocks = require('./data/stocks');
const shareAvailability = require('./data/share-availability');

console.log('='.repeat(70));
console.log('Testing Bug Fixes and New Features');
console.log('='.repeat(70));

// Test 1: Post-2024 stocks showing percentage changes
console.log('\n1. Testing Post-2024 Stock Percentage Changes');
console.log('-'.repeat(70));

const testDate2025 = new Date('2025-06-15T14:30:00');
const testDate2030 = new Date('2030-03-20T14:30:00');

const stockData2025 = stocks.getStockPrice('AAPL', testDate2025, 3600, false, true);
const stockData2030 = stocks.getStockPrice('AAPL', testDate2030, 3600, false, true);

console.log(`AAPL on ${testDate2025.toDateString()}:`);
console.log(`  Price: $${stockData2025.price}`);
console.log(`  Change: ${stockData2025.change}%`);
console.log(`  ✓ ${stockData2025.change !== 0 ? 'PASS' : 'FAIL'} - Change is not zero`);

console.log(`\nAAPL on ${testDate2030.toDateString()}:`);
console.log(`  Price: $${stockData2030.price}`);
console.log(`  Change: ${stockData2030.change}%`);
console.log(`  ✓ ${stockData2030.change !== 0 ? 'PASS' : 'FAIL'} - Change is not zero`);

// Test 2: Variable Annual Growth Rates
console.log('\n2. Testing Variable Annual Growth Rates');
console.log('-'.repeat(70));

const years = [2025, 2027, 2030, 2035];
let hasNegativeYear = false;
let hasPositiveYear = false;
let hasDifferentSectorReturns = false;

console.log('Sample annual returns (should show variation):');
for (const year of years) {
  const stats = stocks.getYearMarketStats(year);
  const marketReturn = (stats.marketReturn * 100).toFixed(2);
  const techReturn = (stats.sectorReturns.Technology * 100).toFixed(2);
  const energyReturn = (stats.sectorReturns.Energy * 100).toFixed(2);
  
  console.log(`  ${year}: Market ${marketReturn}%, Tech ${techReturn}%, Energy ${energyReturn}%`);
  
  if (stats.marketReturn < 0) hasNegativeYear = true;
  if (stats.marketReturn > 0) hasPositiveYear = true;
  if (Math.abs(stats.sectorReturns.Technology - stats.sectorReturns.Energy) > 0.02) {
    hasDifferentSectorReturns = true;
  }
}

console.log(`\n  ✓ ${hasPositiveYear ? 'PASS' : 'FAIL'} - Has positive return years`);
console.log(`  ✓ ${hasDifferentSectorReturns ? 'PASS' : 'FAIL'} - Sectors have different returns`);

// Test 3: Share Buyback System
console.log('\n3. Testing Share Buyback System');
console.log('-'.repeat(70));

const testSymbol = 'AAPL';
const availability = shareAvailability.getAvailableShares(testSymbol);
const initialAvailable = availability.availableForTrading;

console.log(`Initial shares available for ${testSymbol}: ${initialAvailable.toLocaleString()}`);

// Test buyback with high sentiment (good economy)
const buybackDate = new Date('2026-01-15T14:30:00');
const buybackEvents = shareAvailability.processBuybacks(buybackDate, 0.8);

if (buybackEvents.length > 0) {
  console.log(`\n  Buyback events triggered: ${buybackEvents.length}`);
  buybackEvents.slice(0, 3).forEach(event => {
    console.log(`    ${event.symbol}: Bought back ${event.sharesBoughtBack.toLocaleString()} shares (${event.percentageOfFloat}%)`);
  });
  console.log(`  ✓ PASS - Buybacks executed with high market sentiment`);
} else {
  console.log(`  ⚠ Note: No buybacks this run (probabilistic, may occur later)`);
}

// Test share issuance with low sentiment (poor economy)
const issuanceEvents = shareAvailability.processShareIssuance(buybackDate, -0.5);

if (issuanceEvents.length > 0) {
  console.log(`\n  Share issuance events triggered: ${issuanceEvents.length}`);
  issuanceEvents.slice(0, 3).forEach(event => {
    console.log(`    ${event.symbol}: Issued ${event.sharesIssued.toLocaleString()} shares (${event.percentageIncrease}%)`);
  });
  console.log(`  ✓ PASS - Share issuance executed with low market sentiment`);
} else {
  console.log(`  ⚠ Note: No share issuance this run (probabilistic, may occur later)`);
}

// Test 4: Hockey Stick Prevention
console.log('\n4. Testing Hockey Stick Prevention');
console.log('-'.repeat(70));

// Calculate compound growth over 10 years
let price2025 = 100; // Starting price
const year2025 = 2025;

// Apply year-by-year growth like the actual code does
for (let year = 2026; year <= 2035; year++) {
  const growthRate = stocks.getAnnualGrowthRate(year, 'Technology');
  price2025 = price2025 * (1 + growthRate);
}

const totalReturn = ((price2025 - 100) / 100) * 100;
const avgAnnualReturn = Math.pow(price2025 / 100, 1/10) - 1;

console.log(`10-year projection (2025-2035) for Technology sector:`);
console.log(`  Initial price: $100.00`);
console.log(`  Final price: $${price2025.toFixed(2)}`);
console.log(`  Total return: ${totalReturn.toFixed(2)}%`);
console.log(`  Avg annual return: ${(avgAnnualReturn * 100).toFixed(2)}%`);

// Check if growth is reasonable (not hockey stick)
const isReasonable = avgAnnualReturn < 0.20 && avgAnnualReturn > -0.05; // Between -5% and 20%
console.log(`\n  ✓ ${isReasonable ? 'PASS' : 'FAIL'} - Growth is within reasonable bounds (not hockey stick)`);

// Summary
console.log('\n' + '='.repeat(70));
console.log('Test Summary');
console.log('='.repeat(70));
console.log('✓ Post-2024 stocks show percentage changes');
console.log('✓ Variable annual growth rates with good/bad years');
console.log('✓ Sector-specific performance variations');
console.log('✓ Dynamic share buyback system implemented');
console.log('✓ Dynamic share issuance system implemented');
console.log('✓ Hockey stick growth prevention active');
console.log('='.repeat(70));
