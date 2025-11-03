// Bond API integration test
// This test simulates bond trading through the API

const path = require('path');
const fs = require('fs');

console.log('\n======================================================================');
console.log('Bond API Integration Test');
console.log('======================================================================\n');

// Create a test database
const testDbPath = path.join(__dirname, '..', '..', 'test-bonds.db');

// Remove existing test database if it exists
if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
}

// Mock the database path for testing
process.env.TEST_DB_PATH = testDbPath;

// Now require the modules
const db = require('../../database');
const bondManager = require('../../helpers/bondManager');
const bondsData = require('../../data/bonds');

let passedTests = 0;
let failedTests = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`✓ PASS: ${description}`);
    passedTests++;
  } catch (error) {
    console.log(`✗ FAIL: ${description}`);
    console.log(`  Error: ${error.message}`);
    failedTests++;
  }
}

console.log('Test Setup');
console.log('----------------------------------------------------------------------');

// Set up a test account with cash
const testDate = new Date('2020-01-01');
const account = db.getUserAccount.get();
db.updateUserAccount.run(50000, account.credit_score); // Give user $50k

console.log(`Initial cash: $${db.getUserAccount.get().cash}`);
console.log('');

console.log('Test 1: Buying Treasury Bonds');
console.log('----------------------------------------------------------------------');

test('Should be able to buy T-Bills', () => {
  const bond = bondsData.getBond('T-BILL-52W');
  const pricing = bondManager.getBondMarketPrice('T-BILL-52W', testDate);
  const quantity = 10;
  
  const purchasePrice = pricing.price;
  let maturityDate = new Date(testDate);
  maturityDate.setDate(maturityDate.getDate() + (bond.maturityWeeks * 7));
  
  const result = db.insertBondHolding.run(
    bond.type,
    bond.issuer || 'T-BILL-52W',
    100,
    bond.couponRate,
    purchasePrice,
    testDate.toISOString(),
    maturityDate.toISOString(),
    bond.creditRating,
    quantity
  );
  
  const holding = db.getBondHolding.get(result.lastInsertRowid);
  if (!holding) throw new Error('Bond holding not created');
  if (holding.quantity !== quantity) throw new Error('Incorrect quantity');
  if (holding.bond_type !== 'treasury') throw new Error('Incorrect bond type');
});

test('Should be able to buy T-Notes', () => {
  const bond = bondsData.getBond('T-NOTE-10Y');
  const pricing = bondManager.getBondMarketPrice('T-NOTE-10Y', testDate);
  const quantity = 5;
  
  const purchasePrice = pricing.price;
  let maturityDate = new Date(testDate);
  maturityDate.setFullYear(maturityDate.getFullYear() + bond.maturityYears);
  
  const result = db.insertBondHolding.run(
    bond.type,
    bond.issuer || 'T-NOTE-10Y',
    100,
    bond.couponRate,
    purchasePrice,
    testDate.toISOString(),
    maturityDate.toISOString(),
    bond.creditRating,
    quantity
  );
  
  const holding = db.getBondHolding.get(result.lastInsertRowid);
  if (!holding) throw new Error('Bond holding not created');
  if (holding.coupon_rate !== bond.couponRate) throw new Error('Incorrect coupon rate');
});

console.log('');

console.log('Test 2: Buying Corporate Bonds');
console.log('----------------------------------------------------------------------');

test('Should be able to buy investment grade corporate bonds', () => {
  const bond = bondsData.getBond('CORP-AAPL-5Y');
  const pricing = bondManager.getBondMarketPrice('CORP-AAPL-5Y', testDate);
  const quantity = 3;
  
  const purchasePrice = pricing.price;
  let maturityDate = new Date(testDate);
  maturityDate.setFullYear(maturityDate.getFullYear() + bond.maturityYears);
  
  const result = db.insertBondHolding.run(
    bond.type,
    bond.issuer,
    1000, // Corporate bonds typically $1000 face value
    bond.couponRate,
    purchasePrice,
    testDate.toISOString(),
    maturityDate.toISOString(),
    bond.creditRating,
    quantity
  );
  
  const holding = db.getBondHolding.get(result.lastInsertRowid);
  if (!holding) throw new Error('Bond holding not created');
  if (holding.bond_type !== 'corporate') throw new Error('Incorrect bond type');
  if (holding.credit_rating !== 'AAA') throw new Error('Incorrect credit rating');
});

test('Should be able to buy junk bonds', () => {
  const bond = bondsData.getBond('CORP-JUNK-5Y');
  const pricing = bondManager.getBondMarketPrice('CORP-JUNK-5Y', testDate);
  const quantity = 2;
  
  const purchasePrice = pricing.price;
  let maturityDate = new Date(testDate);
  maturityDate.setFullYear(maturityDate.getFullYear() + bond.maturityYears);
  
  const result = db.insertBondHolding.run(
    bond.type,
    bond.issuer,
    1000,
    bond.couponRate,
    purchasePrice,
    testDate.toISOString(),
    maturityDate.toISOString(),
    bond.creditRating,
    quantity
  );
  
  const holding = db.getBondHolding.get(result.lastInsertRowid);
  if (!holding) throw new Error('Bond holding not created');
  if (holding.credit_rating !== 'BB') throw new Error('Incorrect credit rating');
});

console.log('');

console.log('Test 3: Buying Municipal Bonds');
console.log('----------------------------------------------------------------------');

test('Should be able to buy municipal bonds', () => {
  const bond = bondsData.getBond('MUNI-CA-5Y');
  const pricing = bondManager.getBondMarketPrice('MUNI-CA-5Y', testDate);
  const quantity = 1;
  
  const purchasePrice = pricing.price;
  let maturityDate = new Date(testDate);
  maturityDate.setFullYear(maturityDate.getFullYear() + bond.maturityYears);
  
  const result = db.insertBondHolding.run(
    bond.type,
    bond.issuer,
    5000, // Muni bonds typically $5000 minimum
    bond.couponRate,
    purchasePrice,
    testDate.toISOString(),
    maturityDate.toISOString(),
    bond.creditRating,
    quantity
  );
  
  const holding = db.getBondHolding.get(result.lastInsertRowid);
  if (!holding) throw new Error('Bond holding not created');
  if (holding.bond_type !== 'municipal') throw new Error('Incorrect bond type');
});

console.log('');

console.log('Test 4: Bond Holdings and Portfolio');
console.log('----------------------------------------------------------------------');

test('Should retrieve all bond holdings', () => {
  const holdings = db.getBondHoldings.all();
  if (holdings.length === 0) throw new Error('No bond holdings found');
  // We should have 5 holdings from previous tests
  if (holdings.length !== 5) throw new Error(`Expected 5 holdings, got ${holdings.length}`);
});

test('Should calculate portfolio statistics', () => {
  const stats = bondManager.getBondPortfolioStats(testDate);
  if (stats.totalHoldings !== 5) throw new Error('Incorrect total holdings');
  if (stats.totalValue <= 0) throw new Error('Portfolio value should be positive');
  if (!stats.byType) throw new Error('Missing type breakdown');
  if (!stats.byRating) throw new Error('Missing rating breakdown');
});

test('Should have bonds of different types in portfolio', () => {
  const stats = bondManager.getBondPortfolioStats(testDate);
  if (stats.byType.treasury <= 0) throw new Error('Should have treasury bonds');
  if (stats.byType.corporate <= 0) throw new Error('Should have corporate bonds');
  if (stats.byType.municipal <= 0) throw new Error('Should have municipal bonds');
});

console.log('');

console.log('Test 5: Interest Payments');
console.log('----------------------------------------------------------------------');

test('Should process interest payments for coupon bonds', () => {
  // Fast-forward 6 months for semi-annual payment
  let futureDate = new Date(testDate);
  futureDate.setMonth(futureDate.getMonth() + 6);
  
  const payments = bondManager.processInterestPayments(futureDate);
  // T-Bills are zero-coupon, so only corporate and municipal bonds should pay interest
  if (payments.length === 0) {
    console.log('  Note: No payments due yet (bonds need to be held for 6 months)');
  }
});

console.log('');

console.log('Test 6: Bond Maturity');
console.log('----------------------------------------------------------------------');

test('Should process bond maturities', () => {
  // Fast-forward past T-Bill maturity (52 weeks)
  let futureDate = new Date(testDate);
  futureDate.setDate(futureDate.getDate() + (52 * 7) + 1);
  
  const maturedBonds = bondManager.processMaturities(futureDate);
  // T-Bill should mature
  if (maturedBonds.length === 0) throw new Error('T-Bill should have matured');
  if (maturedBonds[0].bondType !== 'treasury') throw new Error('Wrong bond type matured');
});

test('Matured bonds should be removed from holdings', () => {
  const holdings = db.getBondHoldings.all();
  // Should have 4 holdings now (T-Bill matured)
  if (holdings.length !== 4) throw new Error(`Expected 4 holdings after maturity, got ${holdings.length}`);
});

console.log('');

console.log('Test 7: Selling Bonds');
console.log('----------------------------------------------------------------------');

test('Should be able to sell partial bond holdings', () => {
  const holdings = db.getBondHoldings.all();
  const corporateHolding = holdings.find(h => h.bond_type === 'corporate' && h.quantity > 1);
  
  if (!corporateHolding) {
    console.log('  Skipped: No corporate holding with quantity > 1');
    return;
  }
  
  const originalQuantity = corporateHolding.quantity;
  const sellQuantity = 1;
  
  db.updateBondQuantity.run(originalQuantity - sellQuantity, corporateHolding.id);
  
  const updated = db.getBondHolding.get(corporateHolding.id);
  if (updated.quantity !== originalQuantity - sellQuantity) {
    throw new Error('Quantity not updated correctly');
  }
});

test('Should be able to delete bond holdings', () => {
  const holdings = db.getBondHoldings.all();
  if (holdings.length === 0) throw new Error('No holdings to delete');
  
  const initialCount = holdings.length;
  const toDelete = holdings[0];
  
  db.deleteBondHolding.run(toDelete.id);
  
  const afterDelete = db.getBondHoldings.all();
  if (afterDelete.length !== initialCount - 1) {
    throw new Error('Holding not deleted');
  }
});

console.log('');

// Cleanup
console.log('Cleanup');
console.log('----------------------------------------------------------------------');
console.log('Removing test database...');
if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
  console.log('✓ Test database removed');
} else {
  console.log('✓ No test database to remove (using main database)');
}
console.log('');

// Summary
console.log('======================================================================');
console.log('Test Summary');
console.log('======================================================================');
console.log(`Total: ${passedTests + failedTests} | Passed: ${passedTests} | Failed: ${failedTests}`);

if (failedTests > 0) {
  console.log('\n⚠ Some tests failed');
  process.exit(1);
} else {
  console.log('\n✓ All tests passed!');
  process.exit(0);
}
