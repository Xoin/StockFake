/**
 * Test Suite for Market Average Controls Module
 * 
 * Validates the implementation of academically-backed mechanisms to prevent
 * extreme market average movements post-2024.
 */

const marketControls = require('./helpers/marketAverageControls');

console.log('======================================================================');
console.log('Market Average Controls Test Suite');
console.log('======================================================================\n');

let passedTests = 0;
let failedTests = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`✓ PASS: ${description}`);
    passedTests++;
  } catch (err) {
    console.log(`✗ FAIL: ${description}`);
    console.log(`  Error: ${err.message}`);
    failedTests++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertApprox(actual, expected, tolerance, message) {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    throw new Error(`${message}: expected ${expected}, got ${actual} (diff: ${diff})`);
  }
}

// Reset state before tests
marketControls.resetMarketState();

console.log('Test Category 1: Mean Reversion (Ornstein-Uhlenbeck Process)');
console.log('----------------------------------------------------------------------\n');

test('Mean reversion should pull extreme positive returns toward long-term mean', () => {
  marketControls.resetMarketState();
  const extremeReturn = 0.50; // 50% return
  const adjusted = marketControls.applyMeanReversion(extremeReturn, 2025);
  
  // Should be reduced significantly (closer to 7% long-term mean)
  assert(adjusted < extremeReturn, 'Extreme positive return should be reduced');
  assert(adjusted > 0, 'Should still be positive');
  
  // Expected: ~0.50 - 0.15 * (0.50 - 0.07) ≈ 0.435
  assertApprox(adjusted, 0.435, 0.02, 'Mean reversion calculation');
});

test('Mean reversion should pull extreme negative returns toward long-term mean', () => {
  marketControls.resetMarketState();
  const extremeReturn = -0.40; // -40% return
  const adjusted = marketControls.applyMeanReversion(extremeReturn, 2025);
  
  // Should be pulled up (less negative, closer to 7% mean)
  assert(adjusted > extremeReturn, 'Extreme negative return should be less severe');
  assert(adjusted < 0, 'Should still be negative');
  
  // Expected: -0.40 - 0.15 * (-0.40 - 0.07) ≈ -0.3295
  assertApprox(adjusted, -0.3295, 0.02, 'Mean reversion calculation');
});

test('Mean reversion should not apply to pre-2025 years', () => {
  marketControls.resetMarketState();
  const testReturn = 0.30;
  const adjusted = marketControls.applyMeanReversion(testReturn, 2020);
  
  assert(adjusted === testReturn, 'Pre-2025 returns should be unchanged');
});

test('Mean reversion half-life should be approximately 4.6 years', () => {
  // Half-life = ln(2) / theta
  const config = marketControls.getConfiguration();
  const halfLife = Math.log(2) / config.meanReversion.theta;
  
  assertApprox(halfLife, 4.6, 0.2, 'Half-life calculation');
});

console.log('\nTest Category 2: Valuation-Based Dampening (CAPE-inspired)');
console.log('----------------------------------------------------------------------\n');

test('Normal P/E ratios should not dampen returns', () => {
  const testReturn = 0.15;
  const normalPE = 15;
  const adjusted = marketControls.applyValuationDampening(testReturn, normalPE);
  
  assert(adjusted === testReturn, 'Normal P/E should not dampen returns');
});

test('High P/E ratios should dampen positive returns', () => {
  const testReturn = 0.20;
  const highPE = 30;
  const adjusted = marketControls.applyValuationDampening(testReturn, highPE);
  
  assert(adjusted < testReturn, 'High P/E should dampen returns');
  assert(adjusted > 0, 'Should still be positive');
  
  // At P/E 30, should dampen to ~40-50% of original
  assert(adjusted / testReturn < 0.6, 'Dampening should be significant');
});

test('Extreme P/E ratios should heavily dampen positive returns', () => {
  const testReturn = 0.25;
  const extremePE = 40;
  const adjusted = marketControls.applyValuationDampening(testReturn, extremePE);
  
  assert(adjusted < testReturn, 'Extreme P/E should heavily dampen');
  
  // At P/E 40, should dampen to ~20% of original
  assert(adjusted / testReturn < 0.3, 'Dampening should be severe');
  assertApprox(adjusted, 0.05, 0.02, 'Extreme dampening calculation');
});

test('Valuation dampening should not amplify negative returns', () => {
  const testReturn = -0.15;
  const highPE = 30;
  const adjusted = marketControls.applyValuationDampening(testReturn, highPE);
  
  assert(adjusted === testReturn, 'Negative returns should not be dampened');
});

test('Valuation dampening should interpolate smoothly between thresholds', () => {
  const testReturn = 0.20;
  
  // Test at multiple P/E levels
  const pe20 = marketControls.applyValuationDampening(testReturn, 20);
  const pe25 = marketControls.applyValuationDampening(testReturn, 25);
  const pe30 = marketControls.applyValuationDampening(testReturn, 30);
  
  // Should show smooth gradient
  assert(pe20 > pe25, 'PE 20 should allow more return than PE 25');
  assert(pe25 > pe30, 'PE 25 should allow more return than PE 30');
});

console.log('\nTest Category 3: Dynamic Volatility Controls');
console.log('----------------------------------------------------------------------\n');

test('Normal volatility should allow standard return caps', () => {
  const normalVol = 0.15;
  const testReturn = 0.35;
  const adjusted = marketControls.applyVolatilityCaps(testReturn, normalVol);
  
  // Normal cap is 40%
  assert(adjusted === testReturn, 'Return below cap should not be affected');
});

test('High volatility should reduce maximum allowed returns', () => {
  const highVol = 0.40;
  const testReturn = 0.35;
  const adjusted = marketControls.applyVolatilityCaps(testReturn, highVol);
  
  // High volatility cap should be lower than normal
  assert(adjusted < testReturn, 'High volatility should cap returns');
  assert(adjusted <= 0.25, 'Should be capped at elevated threshold');
});

test('Extreme volatility should impose strict return caps', () => {
  const extremeVol = 0.60;
  const testReturn = 0.30;
  const adjusted = marketControls.applyVolatilityCaps(testReturn, extremeVol);
  
  // Extreme cap is 15%
  assert(adjusted <= 0.15, 'Should be strictly capped at 15%');
});

test('Volatility caps should be symmetric (apply to negative returns)', () => {
  const highVol = 0.40;
  const negativeReturn = -0.35;
  const adjusted = marketControls.applyVolatilityCaps(negativeReturn, highVol);
  
  assert(adjusted > negativeReturn, 'Negative extreme should be capped');
  assert(adjusted >= -0.25, 'Negative cap should match positive cap');
});

console.log('\nTest Category 4: Soft Circuit Breakers');
console.log('----------------------------------------------------------------------\n');

test('Returns below circuit breaker threshold should not be affected', () => {
  const normalReturn = 0.08;
  const recentReturns = [0.05, 0.03, -0.02, 0.04, 0.06];
  const adjusted = marketControls.applySoftCircuitBreaker(normalReturn, recentReturns, 'daily');
  
  assert(adjusted === normalReturn, 'Normal returns should pass through');
});

test('Returns above daily threshold should be dampened', () => {
  const extremeReturn = 0.15; // Above 10% daily threshold
  const recentReturns = [0.05, 0.03, -0.02, 0.04, 0.06];
  const adjusted = marketControls.applySoftCircuitBreaker(extremeReturn, recentReturns, 'daily');
  
  assert(adjusted < extremeReturn, 'Extreme daily return should be dampened');
  assert(adjusted > 0.10, 'Should keep threshold portion');
  
  // Expected: 0.10 + (0.15 - 0.10) * 0.5 = 0.125
  assertApprox(adjusted, 0.125, 0.001, 'Circuit breaker dampening');
});

test('Weekly circuit breakers should have higher threshold', () => {
  const weeklyReturn = 0.15;
  const recentReturns = [0.05, 0.08, -0.03, 0.06, 0.09];
  
  const dailyAdjusted = marketControls.applySoftCircuitBreaker(weeklyReturn, recentReturns, 'daily');
  const weeklyAdjusted = marketControls.applySoftCircuitBreaker(weeklyReturn, recentReturns, 'weekly');
  
  // Weekly threshold (20%) should allow more than daily (10%)
  assert(weeklyAdjusted === weeklyReturn, 'Weekly threshold should not trigger at 15%');
  assert(dailyAdjusted < weeklyReturn, 'Daily threshold should trigger');
});

test('Soft circuit breakers should work on negative returns', () => {
  const extremeNegative = -0.15;
  const recentReturns = [0.05, 0.03, -0.02, 0.04, 0.06];
  const adjusted = marketControls.applySoftCircuitBreaker(extremeNegative, recentReturns, 'daily');
  
  assert(adjusted > extremeNegative, 'Extreme negative should be dampened');
  
  // Expected: -(0.10 + (0.15 - 0.10) * 0.5) = -0.125
  assertApprox(adjusted, -0.125, 0.001, 'Negative circuit breaker');
});

console.log('\nTest Category 5: Integrated Controls');
console.log('----------------------------------------------------------------------\n');

test('All controls should work together on extreme positive return', () => {
  marketControls.resetMarketState();
  
  const extremeReturn = 0.60; // 60% annual return
  const year = 2030;
  
  const result = marketControls.applyMarketAverageControls(extremeReturn, year);
  
  assert(result.adjustedReturn < extremeReturn, 'Should reduce extreme return');
  assert(result.adjustedReturn > 0, 'Should remain positive');
  
  // With all controls, should be significantly reduced
  const reduction = extremeReturn - result.adjustedReturn;
  assert(reduction > 0.20, 'Should reduce by at least 20 percentage points');
  
  console.log(`  Original: ${(extremeReturn*100).toFixed(1)}%, Adjusted: ${(result.adjustedReturn*100).toFixed(1)}%`);
});

test('All controls should work together on extreme negative return', () => {
  marketControls.resetMarketState();
  
  const extremeReturn = -0.50; // -50% annual return
  const year = 2030;
  
  const result = marketControls.applyMarketAverageControls(extremeReturn, year);
  
  assert(result.adjustedReturn > extremeReturn, 'Should moderate extreme crash');
  assert(result.adjustedReturn < 0, 'Should remain negative');
  
  console.log(`  Original: ${(extremeReturn*100).toFixed(1)}%, Adjusted: ${(result.adjustedReturn*100).toFixed(1)}%`);
});

test('Controls should not apply to pre-2025 years', () => {
  marketControls.resetMarketState();
  
  const testReturn = 0.40;
  const year = 2020;
  
  const result = marketControls.applyMarketAverageControls(testReturn, year);
  
  assert(result.adjustedReturn === testReturn, 'Pre-2025 should be unchanged');
  assert(result.controls.meanReversion === 0, 'No mean reversion applied');
});

test('Moderate returns should pass through with minimal adjustment', () => {
  marketControls.resetMarketState();
  
  const moderateReturn = 0.08; // 8% return (close to long-term mean)
  const year = 2028;
  
  const result = marketControls.applyMarketAverageControls(moderateReturn, year);
  
  // Should be close to original
  const diff = Math.abs(result.adjustedReturn - moderateReturn);
  assert(diff < 0.03, 'Moderate return should have minimal adjustment');
});

console.log('\nTest Category 6: State Management');
console.log('----------------------------------------------------------------------\n');

test('Market P/E should update based on price movements', () => {
  marketControls.resetMarketState();
  
  const initialPE = marketControls.getMarketState().currentPE;
  
  // Simulate price appreciation without earnings growth
  marketControls.updateMarketPE(0.20, 0.05); // 20% price, 5% earnings
  
  const newPE = marketControls.getMarketState().currentPE;
  
  assert(newPE > initialPE, 'P/E should increase when prices outpace earnings');
  
  const expectedIncrease = 0.20 - 0.05; // 15%
  assertApprox(newPE / initialPE, 1 + expectedIncrease, 0.02, 'P/E change calculation');
});

test('Volatility should update using EWMA', () => {
  marketControls.resetMarketState();
  
  const initialVol = marketControls.getMarketState().recentVolatility;
  
  // Feed in a large return (should increase volatility)
  marketControls.updateVolatility(0.10);
  
  const newVol = marketControls.getMarketState().recentVolatility;
  
  assert(newVol > initialVol, 'Volatility should increase after large return');
});

test('Market state should reset properly', () => {
  // Mess up the state
  marketControls.updateMarketPE(0.50, 0.05);
  marketControls.updateVolatility(0.20);
  
  // Reset
  marketControls.resetMarketState();
  
  const state = marketControls.getMarketState();
  
  assert(state.currentPE === 16, 'P/E should reset to 16');
  assert(state.recentVolatility === 0.15, 'Volatility should reset to 0.15');
  assert(state.historicalReturns.length === 0, 'Historical returns should be empty');
});

console.log('\nTest Category 7: Edge Cases and Bounds');
console.log('----------------------------------------------------------------------\n');

test('P/E ratio should stay within reasonable bounds', () => {
  marketControls.resetMarketState();
  
  // Try to push P/E extremely high
  for (let i = 0; i < 10; i++) {
    marketControls.updateMarketPE(0.50, 0.01);
  }
  
  const state = marketControls.getMarketState();
  assert(state.currentPE <= 50, 'P/E should be capped at 50');
  
  // Reset and try to push extremely low
  marketControls.resetMarketState();
  for (let i = 0; i < 10; i++) {
    marketControls.updateMarketPE(-0.30, 0.05);
  }
  
  const state2 = marketControls.getMarketState();
  assert(state2.currentPE >= 5, 'P/E should be floored at 5');
});

test('Zero return should pass through all controls unchanged', () => {
  marketControls.resetMarketState();
  
  const result = marketControls.applyMarketAverageControls(0, 2030);
  
  assertApprox(result.adjustedReturn, 0, 0.01, 'Zero return should be near zero');
});

test('Multiple sequential years should maintain consistency', () => {
  marketControls.resetMarketState();
  
  const returns = [];
  
  // Simulate 10 years of moderate growth
  for (let year = 2025; year <= 2034; year++) {
    const result = marketControls.applyMarketAverageControls(0.12, year);
    returns.push(result.adjustedReturn);
  }
  
  // All returns should be reasonable
  returns.forEach((ret, idx) => {
    assert(ret >= -0.30 && ret <= 0.40, `Year ${2025+idx} return out of bounds: ${ret}`);
  });
  
  console.log(`  10-year average: ${(returns.reduce((a,b)=>a+b,0)/returns.length*100).toFixed(2)}%`);
});

console.log('\nTest Category 8: Diagnostic Functions');
console.log('----------------------------------------------------------------------\n');

test('Diagnostics should provide scenario analysis', () => {
  marketControls.resetMarketState();
  
  const diagnostics = marketControls.getDiagnostics(2030);
  
  assert(diagnostics.year === 2030, 'Should return correct year');
  assert(Array.isArray(diagnostics.scenarios), 'Should return scenarios array');
  assert(diagnostics.scenarios.length > 0, 'Should have scenarios');
  
  // Check first scenario
  const firstScenario = diagnostics.scenarios[0];
  assert('scenario' in firstScenario, 'Should have scenario field');
  assert('adjusted' in firstScenario, 'Should have adjusted field');
  assert('reduction' in firstScenario, 'Should have reduction field');
});

test('Configuration should be retrievable and updatable', () => {
  const originalConfig = marketControls.getConfiguration();
  
  assert(originalConfig.meanReversion, 'Should have meanReversion config');
  assert(originalConfig.valuation, 'Should have valuation config');
  
  // Update config
  marketControls.updateConfiguration({
    meanReversion: { theta: 0.20 }
  });
  
  const newConfig = marketControls.getConfiguration();
  assert(newConfig.meanReversion.theta === 0.20, 'Config should update');
  
  // Restore original
  marketControls.updateConfiguration({
    meanReversion: { theta: 0.15 }
  });
});

console.log('\nTest Category 9: Long-Term Simulation');
console.log('----------------------------------------------------------------------\n');

test('25-year simulation should prevent runaway growth', () => {
  marketControls.resetMarketState();
  
  let cumulativeValue = 100000; // Start with $100k
  const yearlyReturns = [];
  
  // Simulate aggressive market (0.15 proposed returns each year)
  for (let year = 2025; year <= 2050; year++) {
    const result = marketControls.applyMarketAverageControls(0.15, year);
    cumulativeValue *= (1 + result.adjustedReturn);
    yearlyReturns.push(result.adjustedReturn);
  }
  
  // Calculate annualized return
  const years = 26;
  const annualizedReturn = Math.pow(cumulativeValue / 100000, 1 / years) - 1;
  
  console.log(`  Starting value: $100,000`);
  console.log(`  Ending value: $${Math.round(cumulativeValue).toLocaleString()}`);
  console.log(`  Annualized return: ${(annualizedReturn * 100).toFixed(2)}%`);
  
  // Should be realistic (5-10% annualized)
  assert(annualizedReturn >= 0.04, 'Should have positive long-term return');
  assert(annualizedReturn <= 0.12, 'Should not have unrealistic growth');
  
  // Final value should be reasonable
  assert(cumulativeValue < 1000000, 'Should not exceed $1M from $100k in 26 years at controlled rates');
});

test('25-year simulation with varying returns should remain stable', () => {
  marketControls.resetMarketState();
  
  let cumulativeValue = 100000;
  const proposedReturns = [0.20, 0.15, -0.05, 0.25, 0.10, 0.18, -0.10, 0.30, 0.12, 0.08,
                           0.15, 0.22, -0.08, 0.17, 0.14, 0.25, 0.11, 0.19, -0.05, 0.16,
                           0.20, 0.13, 0.18, -0.07, 0.21, 0.15];
  
  proposedReturns.forEach((proposedReturn, idx) => {
    const year = 2025 + idx;
    const result = marketControls.applyMarketAverageControls(proposedReturn, year);
    cumulativeValue *= (1 + result.adjustedReturn);
  });
  
  const annualizedReturn = Math.pow(cumulativeValue / 100000, 1 / 26) - 1;
  
  console.log(`  Varying returns - Annualized: ${(annualizedReturn * 100).toFixed(2)}%`);
  console.log(`  Final value: $${Math.round(cumulativeValue).toLocaleString()}`);
  
  assert(annualizedReturn >= 0.04, 'Should have positive long-term return');
  assert(annualizedReturn <= 0.12, 'Should prevent excessive growth');
});

// Summary
console.log('\n======================================================================');
console.log('Test Summary');
console.log('======================================================================\n');
console.log(`Total: ${passedTests + failedTests} | Passed: ${passedTests} | Failed: ${failedTests}\n`);

if (failedTests === 0) {
  console.log('✓ All tests passed!\n');
  process.exit(0);
} else {
  console.log(`✗ ${failedTests} test(s) failed\n`);
  process.exit(1);
}
