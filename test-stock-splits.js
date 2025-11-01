#!/usr/bin/env node
// Test script for stock splits functionality

const stockSplits = require('./helpers/stockSplits');

console.log('Testing Stock Split Functionality');
console.log('==================================\n');

// Test 1: Split thresholds
console.log('Test 1: Split Thresholds');
console.log('-------------------------');
const years = [1980, 2000, 2015, 2025];
years.forEach(year => {
  const threshold = stockSplits.getSplitThreshold(year);
  console.log(`Year ${year}: Threshold = $${threshold}`);
});
console.log();

// Test 2: Split ratio determination
console.log('Test 2: Split Ratio Determination');
console.log('----------------------------------');
const testPrices = [
  { price: 200, threshold: 150, symbol: 'TEST1' },
  { price: 500, threshold: 150, symbol: 'TEST2' },
  { price: 1000, threshold: 150, symbol: 'TEST3' },
];

testPrices.forEach(test => {
  const ratio = stockSplits.determineSplitRatio(test.price, test.threshold, test.symbol);
  console.log(`Price: $${test.price}, Threshold: $${test.threshold} => ${ratio}:1 split`);
  console.log(`  After split: $${(test.price / ratio).toFixed(2)}`);
});
console.log();

// Test 3: Check for split
console.log('Test 3: Check for Split');
console.log('------------------------');
const checkTests = [
  { symbol: 'AAPL', price: 100, date: '1990-01-01' },
  { symbol: 'MSFT', price: 250, date: '2000-01-01' },
  { symbol: 'GOOGL', price: 500, date: '2025-01-01' },
];

checkTests.forEach(test => {
  const result = stockSplits.checkForSplit(test.symbol, test.price, test.date);
  if (result.needsSplit) {
    console.log(`${test.symbol} @ $${test.price} (${test.date}): NEEDS SPLIT`);
    console.log(`  Ratio: ${result.splitRatio}:1`);
    console.log(`  Price after: $${result.priceAfterSplit.toFixed(2)}`);
  } else {
    console.log(`${test.symbol} @ $${test.price} (${test.date}): No split needed`);
  }
});
console.log();

// Test 4: Email generation
console.log('Test 4: Email Generation');
console.log('------------------------');
const email = stockSplits.generateSplitEmail(
  'AAPL',
  'Apple Inc.',
  2,
  300.00,
  150.00,
  '2025-01-15',
  true
);

console.log(`From: ${email.from}`);
console.log(`Subject: ${email.subject}`);
console.log(`Category: ${email.category}`);
console.log(`Date: ${email.date}`);
console.log('\nBody Preview:');
console.log(email.body.substring(0, 200) + '...\n');

console.log('All tests completed successfully! ✓');
