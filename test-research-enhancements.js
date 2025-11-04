/**
 * Test Suite for Research-Based Enhancements
 * 
 * Tests GARCH volatility, fat-tailed distributions, correlations,
 * and early warning system
 */

const { GARCHModel, generateStudentT, calculateKurtosis, calculateSkewness } = require('./helpers/volatilityModeling');
const { CorrelationMatrix } = require('./helpers/correlationMatrix');
const { EarlyWarningSystem } = require('./helpers/earlyWarningSystem');
const marketCrash = require('./helpers/marketCrashSimulation');

console.log('======================================================================');
console.log('Research-Based Enhancements Test Suite');
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

function assertApprox(value, expected, tolerance, message) {
  const diff = Math.abs(value - expected);
  if (diff <= tolerance) {
    console.log(`✓ PASS: ${message} (${value.toFixed(4)} ≈ ${expected.toFixed(4)})`);
    testsPassed++;
  } else {
    console.log(`✗ FAIL: ${message} (${value.toFixed(4)} vs ${expected.toFixed(4)}, diff: ${diff.toFixed(4)})`);
    testsFailed++;
  }
}

// ============================================================================
// Test 1: GARCH Volatility Model
// ============================================================================
console.log('Test 1: GARCH(1,1) Volatility Model');
console.log('----------------------------------------------------------------------\n');

const garch = new GARCHModel(0.00001, 0.09, 0.90);
const params = garch.getParameters();

assert(params.alpha === 0.09, 'GARCH alpha parameter initialized correctly');
assert(params.beta === 0.90, 'GARCH beta parameter initialized correctly');
assert(params.persistence < 1.0, 'GARCH model is stationary (α + β < 1)');

// Test volatility persistence
const initialVol = garch.getCurrentVolatility();
garch.updateVolatility(0.05);  // 5% return shock
const volAfterShock = garch.getCurrentVolatility();

assert(volAfterShock > initialVol, 'Volatility increases after positive shock');

// Test volatility clustering
const returns = [];
for (let i = 0; i < 100; i++) {
  const ret = garch.generateReturn(5);
  returns.push(ret);
  garch.updateVolatility(ret);
}

assert(returns.length === 100, 'Generated 100 returns');
assert(garch.varianceHistory.length >= 50, 'Variance history tracked (at least 50 entries)');

console.log(`  Current volatility: ${(garch.getCurrentVolatility() * 100).toFixed(2)}%`);
console.log(`  Annualized volatility: ${(garch.getAnnualizedVolatility() * 100).toFixed(2)}%\n`);

// ============================================================================
// Test 2: Fat-Tailed Distributions
// ============================================================================
console.log('Test 2: Fat-Tailed Distributions (Student\'s t)');
console.log('----------------------------------------------------------------------\n');

// Generate large sample from Student's t
const tSamples = [];
for (let i = 0; i < 10000; i++) {
  tSamples.push(generateStudentT(5));
}

// Calculate kurtosis (should be > 3 for fat tails)
const kurtosis = calculateKurtosis(tSamples);
const skewness = calculateSkewness(tSamples);

assert(kurtosis > 0.5, 'Excess kurtosis is positive (fat tails present)');
console.log(`  Excess kurtosis: ${kurtosis.toFixed(2)} (normal = 0, observed stocks ≈ 3-10)`);
console.log(`  Skewness: ${skewness.toFixed(2)} (should be near 0 for symmetric distribution)`);

// Check for extreme values (should occur more frequently than normal)
const extremeCount = tSamples.filter(x => Math.abs(x) > 3).length;
const extremePercent = (extremeCount / tSamples.length) * 100;
console.log(`  Extreme values (|x| > 3σ): ${extremeCount} (${extremePercent.toFixed(2)}%)`);
console.log(`  (Normal distribution would have ~0.3%, Student's t has more)\n`);

assert(extremePercent > 0.3, 'Fat tails produce more extreme values than normal distribution');

// ============================================================================
// Test 3: Correlation Matrix
// ============================================================================
console.log('Test 3: Stock Correlation Matrix');
console.log('----------------------------------------------------------------------\n');

const corrMatrix = new CorrelationMatrix();

// Test within-sector correlation
const techTechCorr = corrMatrix.getCorrelation('Technology', 'Technology', false);
assert(techTechCorr === 0.65, 'Within-sector correlation for Technology correct');

// Test cross-sector correlation
const techFinCorr = corrMatrix.getCorrelation('Technology', 'Financial', false);
assert(techFinCorr === 0.35, 'Cross-sector correlation Tech-Financial correct');

// Test stress correlation amplification
const stressCorr = corrMatrix.getCorrelation('Technology', 'Financial', true);
assert(stressCorr > techFinCorr, 'Correlations increase during market stress');
console.log(`  Tech-Financial correlation: Normal ${techFinCorr.toFixed(2)}, Stress ${stressCorr.toFixed(2)}`);

// Test correlated return generation
const stocks = [
  { symbol: 'AAPL', sector: 'Technology' },
  { symbol: 'GOOGL', sector: 'Technology' },
  { symbol: 'JPM', sector: 'Financial' }
];

const independentShocks = [1.0, 0.5, -0.5];  // Independent N(0,1) shocks
const correlatedReturns = corrMatrix.generateCorrelatedReturns(stocks, independentShocks, false);

assert(correlatedReturns.length === 3, 'Generated correlated returns for 3 stocks');
console.log(`  Correlated returns: ${correlatedReturns.map(r => r.toFixed(3)).join(', ')}`);

// Test that same-sector stocks have positively correlated returns
assert(
  Math.sign(correlatedReturns[0]) === Math.sign(correlatedReturns[1]) || 
  Math.abs(correlatedReturns[0] - correlatedReturns[1]) < 0.5,
  'Same-sector stocks (AAPL, GOOGL) show correlated movements'
);

console.log();

// ============================================================================
// Test 4: Early Warning System
// ============================================================================
console.log('Test 4: Early Warning System for Crashes');
console.log('----------------------------------------------------------------------\n');

const ews = new EarlyWarningSystem();

// Test normal market conditions
const normalMarket = {
  averagePE: 18,
  currentVolatility: 0.15,
  baselineVolatility: 0.15,
  sixMonthReturn: 0.10,
  yearlyReturn: 0.12,
  sentimentScore: 0.20,
  liquidityLevel: 0.95,
  sectorReturns: {
    'Technology': 0.15,
    'Financial': 0.08
  }
};

const normalAnalysis = ews.calculateCrashProbability(normalMarket);
assert(normalAnalysis.warningLevel < 0.30, 'Warning level low for normal conditions');
assert(normalAnalysis.activeSignals.length === 0, 'No active warning signals in normal market');
console.log(`  Normal market warning level: ${(normalAnalysis.warningLevel * 100).toFixed(1)}%`);
console.log(`  Baseline crash probability: ${(normalAnalysis.baselineProbability * 100).toFixed(0)}%`);
console.log(`  Adjusted crash probability: ${(normalAnalysis.adjustedProbability * 100).toFixed(0)}%`);
console.log(`  Recommendation: ${normalAnalysis.recommendation}\n`);

// Test bubble conditions
const bubbleMarket = {
  averagePE: 35,           // High P/E
  averagePB: 6,            // High P/B
  currentVolatility: 0.40,  // High volatility
  baselineVolatility: 0.15,
  sixMonthReturn: 0.60,     // Rapid growth
  yearlyReturn: 1.20,       // Bubble-like growth
  sentimentScore: 0.85,     // Extreme greed
  liquidityLevel: 0.50,
  sectorReturns: {
    'Technology': 0.95      // Tech bubble
  }
};

const bubbleAnalysis = ews.calculateCrashProbability(bubbleMarket);
assert(bubbleAnalysis.warningLevel > 0.50, 'Warning level high for bubble conditions');
assert(bubbleAnalysis.activeSignals.length >= 3, 'Multiple warning signals in bubble market');
assert(bubbleAnalysis.adjustedProbability > bubbleAnalysis.baselineProbability, 'Crash probability elevated');

console.log(`  Bubble market warning level: ${(bubbleAnalysis.warningLevel * 100).toFixed(1)}%`);
console.log(`  Active signals: ${bubbleAnalysis.activeSignals.length}`);
console.log(`  Signal categories: ${bubbleAnalysis.activeSignals.map(s => s.category).join(', ')}`);
console.log(`  Adjusted crash probability: ${(bubbleAnalysis.adjustedProbability * 100).toFixed(0)}%`);
console.log(`  Amplification factor: ${bubbleAnalysis.amplificationFactor.toFixed(2)}x`);
console.log(`  Recommendation: ${bubbleAnalysis.recommendation}\n`);

// ============================================================================
// Test 5: Integration with Market Crash Simulation
// ============================================================================
console.log('Test 5: Integration with Market Crash Simulation');
console.log('----------------------------------------------------------------------\n');

// Reset market state
marketCrash.resetForTesting();

// Initialize GARCH for test stock
const testSymbol = 'TEST';
const testSector = 'Technology';
marketCrash.initializeStockVolatility(testSymbol);

// Test price impact without crash
const basePrice = 100.00;
const normalPrice = marketCrash.calculateStockPriceImpact(testSymbol, testSector, basePrice, new Date());
assert(Math.abs(normalPrice - basePrice) < basePrice * 0.05, 'Normal price impact is small (< 5%)');
console.log(`  Base price: $${basePrice.toFixed(2)}`);
console.log(`  Price without crash: $${normalPrice.toFixed(2)} (${((normalPrice/basePrice - 1) * 100).toFixed(2)}%)`);

// Trigger a crash event
const crashResult = marketCrash.triggerCrashEvent('black_monday_1987', new Date('2024-10-19'));
assert(crashResult.success, 'Crash event triggered successfully');
console.log(`  Triggered crash: ${crashResult.event.name}`);

// Test price impact during crash
const crashPrice = marketCrash.calculateStockPriceImpact(testSymbol, testSector, basePrice, new Date('2024-10-19'));
assert(crashPrice < basePrice, 'Crash causes price drop');
console.log(`  Price during crash: $${crashPrice.toFixed(2)} (${((crashPrice/basePrice - 1) * 100).toFixed(2)}%)`);

// Get GARCH model and check volatility increased
const garchModel = marketCrash.getStockVolatilityModel(testSymbol);
const crashVolatility = garchModel.getAnnualizedVolatility();
console.log(`  Volatility during crash: ${(crashVolatility * 100).toFixed(2)}% annualized`);
assert(crashVolatility > 0.20, 'Volatility elevated during crash');

console.log();

// ============================================================================
// Test 6: Stylized Facts Validation
// ============================================================================
console.log('Test 6: Stylized Facts of Financial Returns');
console.log('----------------------------------------------------------------------\n');

// Generate 1000 returns using GARCH + Student's t with zero drift
marketCrash.resetForTesting();
const stylizedGarch = new GARCHModel();
const stylizedReturns = [];

// Use zero drift for mean calculation test
for (let i = 0; i < 1000; i++) {
  const ret = stylizedGarch.generateReturn(5, 0);  // Ensure zero drift
  stylizedReturns.push(ret);
  stylizedGarch.updateVolatility(ret);
}

// Check stylized facts
const stylizedKurtosis = calculateKurtosis(stylizedReturns);
const stylizedSkewness = calculateSkewness(stylizedReturns);

// Fact 1: Fat tails (excess kurtosis > 0)
assert(stylizedKurtosis > 0, 'Stylized Fact 1: Returns exhibit fat tails');
console.log(`  ✓ Excess kurtosis: ${stylizedKurtosis.toFixed(2)} (fat tails present)`);

// Fact 2: Volatility clustering (check if high volatility periods cluster)
const volHistory = stylizedGarch.varianceHistory;
let clusterCount = 0;
for (let i = 1; i < volHistory.length; i++) {
  if (volHistory[i] > 1.5 * stylizedGarch.unconditionalVariance && 
      volHistory[i-1] > 1.5 * stylizedGarch.unconditionalVariance) {
    clusterCount++;
  }
}
assert(clusterCount > 10, 'Stylized Fact 2: Volatility clustering observed');
console.log(`  ✓ Volatility clusters: ${clusterCount} periods of sustained high volatility`);

// Fact 3: Near-zero mean (returns should average close to 0 for zero-drift)
const meanReturn = stylizedReturns.reduce((a, b) => a + b, 0) / stylizedReturns.length;
const absMeanReturn = Math.abs(meanReturn);
assert(absMeanReturn < 0.05, 'Stylized Fact 3: Returns have near-zero mean');
console.log(`  ✓ Mean return: ${(meanReturn * 100).toFixed(4)}% (within ±5% bounds)`);

console.log();

// ============================================================================
// Summary
// ============================================================================
console.log('======================================================================');
console.log('Test Summary');
console.log('======================================================================\n');

const totalTests = testsPassed + testsFailed;
const passRate = (testsPassed / totalTests * 100).toFixed(1);

console.log(`Total tests: ${totalTests}`);
console.log(`Passed: ${testsPassed} (${passRate}%)`);
console.log(`Failed: ${testsFailed}`);
console.log();

if (testsFailed === 0) {
  console.log('✓ ALL TESTS PASSED');
  console.log('\nResearch-based enhancements successfully implemented:');
  console.log('  • GARCH(1,1) volatility modeling with clustering');
  console.log('  • Fat-tailed return distributions (Student\'s t)');
  console.log('  • Stock correlation matrix with stress amplification');
  console.log('  • Early warning system for crash prediction');
  console.log('  • Integration with existing market crash simulation');
  console.log('  • Validation of stylized facts of financial returns');
} else {
  console.log(`✗ ${testsFailed} TEST(S) FAILED`);
  process.exit(1);
}

console.log('\n======================================================================\n');

module.exports = {
  testsPassed,
  testsFailed
};
