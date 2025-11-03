// Bond functionality tests
const assert = require('assert');
const bondManager = require('../../helpers/bondManager');
const bondsData = require('../../data/bonds');
const treasuryYields = require('../../data/treasury-yields');

console.log('\n======================================================================');
console.log('Bond Functionality Test Suite');
console.log('======================================================================\n');

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

// Test 1: Bond Data Module
console.log('Test 1: Bond Data Module');
console.log('----------------------------------------------------------------------');

test('Should load all bonds', () => {
  const bonds = bondsData.getAvailableBonds();
  assert(bonds.length > 0, 'Should have bonds available');
  assert(bonds.length >= 30, 'Should have at least 30 bonds');
});

test('Should have treasury bonds', () => {
  const treasuryBonds = bondsData.getBondsByType('treasury');
  assert(treasuryBonds.length > 0, 'Should have treasury bonds');
  assert(treasuryBonds.some(b => b.symbol === 'T-BILL-4W'), 'Should have T-Bills');
  assert(treasuryBonds.some(b => b.symbol === 'T-NOTE-10Y'), 'Should have T-Notes');
  assert(treasuryBonds.some(b => b.symbol === 'T-BOND-30Y'), 'Should have T-Bonds');
});

test('Should have corporate bonds', () => {
  const corporateBonds = bondsData.getBondsByType('corporate');
  assert(corporateBonds.length > 0, 'Should have corporate bonds');
  assert(corporateBonds.some(b => b.creditRating === 'AAA'), 'Should have AAA-rated bonds');
  assert(corporateBonds.some(b => b.creditRating === 'BB' || b.creditRating === 'B'), 'Should have junk bonds');
});

test('Should have municipal bonds', () => {
  const muniBonds = bondsData.getBondsByType('municipal');
  assert(muniBonds.length > 0, 'Should have municipal bonds');
  assert(muniBonds.every(b => b.taxStatus === 'tax_free'), 'Municipal bonds should be tax-free');
});

test('Should get specific bond by symbol', () => {
  const bond = bondsData.getBond('T-NOTE-10Y');
  assert(bond !== null, 'Should find T-NOTE-10Y');
  assert(bond.type === 'treasury', 'Should be treasury type');
  assert(bond.maturityYears === 10, 'Should have 10-year maturity');
});

console.log('');

// Test 2: Treasury Yields Module
console.log('Test 2: Treasury Yields Module');
console.log('----------------------------------------------------------------------');

test('Should have historical yield data', () => {
  const yields = treasuryYields.yieldCurveData;
  assert(Object.keys(yields).length > 0, 'Should have yield data');
  assert(yields[1970], 'Should have 1970s data');
  assert(yields[2020], 'Should have 2020s data');
});

test('Should get yield for specific date and maturity', () => {
  const date = new Date('1980-06-15');
  const yield10Y = treasuryYields.getYield(date, '10Y');
  assert(yield10Y > 0, 'Should return positive yield');
  assert(yield10Y > 0.10, '1980 yields should be high (>10%)');
});

test('Should get full yield curve', () => {
  const date = new Date('2000-01-01');
  const curve = treasuryYields.getYieldCurve(date);
  assert(curve['3M'] !== undefined, 'Should have 3-month yield');
  assert(curve['10Y'] !== undefined, 'Should have 10-year yield');
  assert(curve['30Y'] !== undefined, 'Should have 30-year yield');
});

test('Should map bond maturity to yield curve key', () => {
  const tBill = bondsData.getBond('T-BILL-13W');
  const key1 = treasuryYields.getMaturityKey(tBill);
  assert(key1 === '3M', 'T-Bill should map to 3M');
  
  const tNote = bondsData.getBond('T-NOTE-10Y');
  const key2 = treasuryYields.getMaturityKey(tNote);
  assert(key2 === '10Y', 'T-Note 10Y should map to 10Y');
});

console.log('');

// Test 3: Bond Pricing Calculations
console.log('Test 3: Bond Pricing Calculations');
console.log('----------------------------------------------------------------------');

test('Should calculate zero-coupon bond price', () => {
  const bond = bondsData.getBond('T-BILL-52W');
  const yield5pct = 0.05;
  const yearsToMaturity = 1;
  const price = bondManager.calculateBondPrice(bond, yield5pct, yearsToMaturity, 100);
  
  // Zero-coupon bond: Price = FaceValue / (1 + yield)^years
  const expectedPrice = 100 / (1 + 0.05);
  assert(Math.abs(price - expectedPrice) < 0.01, `Price should be ~${expectedPrice.toFixed(2)}`);
  assert(price < 100, 'Zero-coupon bond should trade at discount');
});

test('Should calculate coupon bond price at par', () => {
  const bond = bondsData.getBond('T-NOTE-10Y');
  // When yield = coupon rate, bond should trade at par (100)
  const price = bondManager.calculateBondPrice(bond, bond.couponRate, 10, 100);
  assert(Math.abs(price - 100) < 1, 'Bond should trade near par when yield = coupon');
});

test('Should calculate coupon bond price at premium', () => {
  const bond = bondsData.getBond('T-NOTE-10Y');
  // When yield < coupon rate, bond should trade at premium (>100)
  const lowerYield = bond.couponRate - 0.01;
  const price = bondManager.calculateBondPrice(bond, lowerYield, 10, 100);
  assert(price > 100, 'Bond should trade at premium when yield < coupon');
});

test('Should calculate coupon bond price at discount', () => {
  const bond = bondsData.getBond('T-NOTE-10Y');
  // When yield > coupon rate, bond should trade at discount (<100)
  const higherYield = bond.couponRate + 0.02;
  const price = bondManager.calculateBondPrice(bond, higherYield, 10, 100);
  assert(price < 100, 'Bond should trade at discount when yield > coupon');
});

test('Should get market price for treasury bond', () => {
  const date = new Date('2000-01-01');
  const pricing = bondManager.getBondMarketPrice('T-NOTE-10Y', date);
  
  assert(pricing !== null, 'Should return pricing data');
  assert(pricing.price > 0, 'Should have valid price');
  assert(pricing.yield > 0, 'Should have valid yield');
  assert(pricing.yearsToMaturity === 10, 'Should have correct maturity');
});

test('Should apply credit spread to corporate bonds', () => {
  const date = new Date('2000-01-01');
  const treasuryPricing = bondManager.getBondMarketPrice('T-NOTE-10Y', date);
  const corporatePricing = bondManager.getBondMarketPrice('CORP-AAPL-5Y', date);
  
  // Corporate bonds should have higher yield (lower price) than treasuries
  assert(corporatePricing.yield > treasuryPricing.yield, 'Corporate yield should be higher than treasury');
});

test('Should apply tax adjustment to municipal bonds', () => {
  const date = new Date('2000-01-01');
  const treasuryPricing = bondManager.getBondMarketPrice('T-NOTE-10Y', date);
  const muniPricing = bondManager.getBondMarketPrice('MUNI-CA-5Y', date);
  
  // Municipal bonds typically yield less due to tax advantages
  assert(muniPricing.yield < treasuryPricing.yield, 'Municipal yield should be lower than treasury (tax-adjusted)');
});

console.log('');

// Test 4: Yield to Maturity Calculations
console.log('Test 4: Yield to Maturity Calculations');
console.log('----------------------------------------------------------------------');

test('Should calculate YTM for zero-coupon bond', () => {
  const bond = bondsData.getBond('T-BILL-52W');
  const price = 95; // Trading at $95
  const yearsToMaturity = 1;
  const ytm = bondManager.calculateYieldToMaturity(bond, price, yearsToMaturity, 100);
  
  // YTM for zero-coupon: (100/95)^(1/1) - 1 = 0.0526 or 5.26%
  const expectedYTM = Math.pow(100 / 95, 1) - 1;
  assert(Math.abs(ytm - expectedYTM) < 0.001, `YTM should be ~${(expectedYTM * 100).toFixed(2)}%`);
});

test('Should calculate YTM for coupon bond trading at discount', () => {
  const bond = bondsData.getBond('T-NOTE-10Y');
  const price = 90; // Trading below par
  const yearsToMaturity = 10;
  const ytm = bondManager.calculateYieldToMaturity(bond, price, yearsToMaturity, 100);
  
  // YTM should be higher than coupon rate when trading at discount
  assert(ytm > bond.couponRate, 'YTM should be > coupon rate for discount bond');
  assert(ytm > 0, 'YTM should be positive');
  assert(ytm < 0.5, 'YTM should be reasonable (<50%)');
});

test('Should calculate YTM for coupon bond trading at premium', () => {
  const bond = bondsData.getBond('T-NOTE-10Y');
  const price = 110; // Trading above par
  const yearsToMaturity = 10;
  const ytm = bondManager.calculateYieldToMaturity(bond, price, yearsToMaturity, 100);
  
  // YTM should be lower than coupon rate when trading at premium
  assert(ytm < bond.couponRate, 'YTM should be < coupon rate for premium bond');
  assert(ytm > 0, 'YTM should be positive');
});

console.log('');

// Test 5: Bond Characteristics
console.log('Test 5: Bond Characteristics');
console.log('----------------------------------------------------------------------');

test('All bonds should have required fields', () => {
  const bonds = bondsData.getAvailableBonds();
  bonds.forEach(bond => {
    assert(bond.symbol, 'Bond should have symbol');
    assert(bond.type, 'Bond should have type');
    assert(bond.name, 'Bond should have name');
    assert(bond.issuer, 'Bond should have issuer');
    assert(bond.creditRating, 'Bond should have credit rating');
    assert(bond.hasOwnProperty('couponRate'), 'Bond should have coupon rate');
    assert(bond.minPurchase > 0, 'Bond should have minimum purchase');
  });
});

test('Credit ratings should be valid', () => {
  const bonds = bondsData.getAvailableBonds();
  const validRatings = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'CC', 'C', 'D'];
  bonds.forEach(bond => {
    assert(validRatings.includes(bond.creditRating), `${bond.symbol} should have valid rating`);
  });
});

test('Treasury bonds should have AAA rating', () => {
  const treasuryBonds = bondsData.getBondsByType('treasury');
  treasuryBonds.forEach(bond => {
    assert(bond.creditRating === 'AAA', 'Treasury bonds should be AAA rated');
  });
});

test('Investment grade vs junk bonds', () => {
  const investmentGrade = ['AAA', 'AA', 'A', 'BBB'];
  const corporateBonds = bondsData.getBondsByType('corporate');
  
  const investmentGradeBonds = corporateBonds.filter(b => investmentGrade.includes(b.creditRating));
  const junkBonds = corporateBonds.filter(b => !investmentGrade.includes(b.creditRating));
  
  assert(investmentGradeBonds.length > 0, 'Should have investment grade corporate bonds');
  assert(junkBonds.length > 0, 'Should have junk bonds');
  
  // Junk bonds should have higher coupon rates
  const avgJunkCoupon = junkBonds.reduce((sum, b) => sum + b.couponRate, 0) / junkBonds.length;
  const avgInvGradeCoupon = investmentGradeBonds.reduce((sum, b) => sum + b.couponRate, 0) / investmentGradeBonds.length;
  assert(avgJunkCoupon > avgInvGradeCoupon, 'Junk bonds should have higher average coupon rates');
});

console.log('');

// Test 6: Historical Yield Curve Trends
console.log('Test 6: Historical Yield Curve Trends');
console.log('----------------------------------------------------------------------');

test('1980s had high interest rates', () => {
  const date1981 = new Date('1981-01-01');
  const yield10Y = treasuryYields.getYield(date1981, '10Y');
  assert(yield10Y > 0.10, '1981 yields should be >10%');
});

test('2020 had low interest rates', () => {
  const date2020 = new Date('2020-06-01');
  const yield10Y = treasuryYields.getYield(date2020, '10Y');
  assert(yield10Y < 0.02, '2020 yields should be <2%');
});

test('Yield curve should generally be upward sloping', () => {
  const date = new Date('2010-01-01');
  const curve = treasuryYields.getYieldCurve(date);
  
  // Generally, longer maturities should have higher yields
  assert(curve['30Y'] >= curve['10Y'], '30Y should typically yield >= 10Y');
  assert(curve['10Y'] >= curve['2Y'], '10Y should typically yield >= 2Y');
  // Note: Sometimes yield curves invert, so we use >= not >
});

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
