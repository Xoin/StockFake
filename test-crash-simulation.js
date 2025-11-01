#!/usr/bin/env node

/**
 * Integration test for Market Crash Simulation
 * This script validates the crash simulation functionality
 */

const marketCrashSim = require('./helpers/marketCrashSimulation');
const crashEvents = require('./data/market-crash-events');
const stocks = require('./data/stocks');

console.log('=== Market Crash Simulation Integration Test ===\n');

// Test 1: Initialize market state
console.log('Test 1: Initialize market state');
try {
  marketCrashSim.initializeMarketState();
  const state = marketCrashSim.getMarketState();
  
  if (state.currentVolatility !== 1.0 || state.liquidityLevel !== 1.0 || state.sentimentScore !== 0.0) {
    throw new Error('Market state not initialized correctly');
  }
  
  console.log('✓ Market state initialized successfully');
  console.log(`  Volatility: ${state.currentVolatility}`);
  console.log(`  Liquidity: ${state.liquidityLevel}`);
  console.log(`  Sentiment: ${state.sentimentScore}\n`);
} catch (error) {
  console.error('✗ Failed to initialize market state:', error.message);
  process.exit(1);
}

// Test 2: Load crash scenarios
console.log('Test 2: Load crash scenarios');
try {
  const allScenarios = crashEvents.getAllScenarios();
  const historicalScenarios = crashEvents.getHistoricalScenarios();
  const hypotheticalScenarios = crashEvents.getHypotheticalScenarios();
  
  if (allScenarios.length === 0) {
    throw new Error('No scenarios loaded');
  }
  
  console.log(`✓ Loaded ${allScenarios.length} scenarios`);
  console.log(`  Historical: ${historicalScenarios.length}`);
  console.log(`  Hypothetical: ${hypotheticalScenarios.length}\n`);
} catch (error) {
  console.error('✗ Failed to load scenarios:', error.message);
  process.exit(1);
}

// Test 3: Trigger a crash event
console.log('Test 3: Trigger a crash event');
try {
  const testDate = new Date('2020-03-01T09:30:00');
  
  // Trigger COVID crash scenario
  const result = marketCrashSim.triggerCrashEvent('covid_crash_2020', testDate);
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to trigger event');
  }
  
  const activeEvents = marketCrashSim.getActiveEvents();
  if (activeEvents.length !== 1) {
    throw new Error(`Expected 1 active event, got ${activeEvents.length}`);
  }
  
  console.log('✓ Crash event triggered successfully');
  console.log(`  Event: ${result.event.name}`);
  console.log(`  Type: ${result.event.type}`);
  console.log(`  Severity: ${result.event.severity}\n`);
} catch (error) {
  console.error('✗ Failed to trigger crash event:', error.message);
  process.exit(1);
}

// Test 4: Calculate stock price impact
console.log('Test 4: Calculate stock price impact');
try {
  const testDate = new Date('2020-03-01T09:30:00');  // Same day as crash trigger
  const basePrice = 100.0;
  const symbol = 'AAPL';
  const sector = 'Technology';
  
  // Calculate impacted price
  const impactedPrice = marketCrashSim.calculateStockPriceImpact(symbol, sector, basePrice, testDate);
  
  if (impactedPrice >= basePrice) {
    throw new Error('Expected price to decrease during crash');
  }
  
  const priceChange = ((impactedPrice - basePrice) / basePrice) * 100;
  
  console.log('✓ Stock price impact calculated');
  console.log(`  Base price: $${basePrice.toFixed(2)}`);
  console.log(`  Impacted price: $${impactedPrice.toFixed(2)}`);
  console.log(`  Change: ${priceChange.toFixed(2)}%\n`);
} catch (error) {
  console.error('✗ Failed to calculate price impact:', error.message);
  process.exit(1);
}

// Test 5: Market state during crash
console.log('Test 5: Market state during crash');
try {
  const state = marketCrashSim.getMarketState();
  
  if (state.currentVolatility <= 1.0) {
    throw new Error('Expected volatility to increase during crash');
  }
  
  if (state.liquidityLevel >= 1.0) {
    throw new Error('Expected liquidity to decrease during crash');
  }
  
  if (state.sentimentScore >= 0.0) {
    throw new Error('Expected negative sentiment during crash');
  }
  
  console.log('✓ Market state properly affected by crash');
  console.log(`  Volatility: ${state.currentVolatility.toFixed(2)}x`);
  console.log(`  Liquidity: ${(state.liquidityLevel * 100).toFixed(0)}%`);
  console.log(`  Sentiment: ${state.sentimentScore.toFixed(2)}\n`);
} catch (error) {
  console.error('✗ Market state check failed:', error.message);
  process.exit(1);
}

// Test 6: Cascading effects over time
console.log('Test 6: Cascading effects over time');
try {
  const basePrice = 100.0;
  const symbol = 'AAPL';
  const sector = 'Technology';
  
  // Check price impact at different time points
  const day1 = new Date('2020-03-01T09:30:00');  // Day 1 (event triggered earlier)
  const day7 = new Date('2020-03-07T09:30:00');  // Day 7
  const day30 = new Date('2020-03-30T09:30:00'); // Day 30
  
  const price1 = marketCrashSim.calculateStockPriceImpact(symbol, sector, basePrice, day1);
  const price7 = marketCrashSim.calculateStockPriceImpact(symbol, sector, basePrice, day7);
  const price30 = marketCrashSim.calculateStockPriceImpact(symbol, sector, basePrice, day30);
  
  console.log('✓ Cascading effects calculated');
  console.log(`  Day 1: $${price1.toFixed(2)} (${(((price1 - basePrice) / basePrice) * 100).toFixed(2)}%)`);
  console.log(`  Day 7: $${price7.toFixed(2)} (${(((price7 - basePrice) / basePrice) * 100).toFixed(2)}%)`);
  console.log(`  Day 30: $${price30.toFixed(2)} (${(((price30 - basePrice) / basePrice) * 100).toFixed(2)}%)\n`);
} catch (error) {
  console.error('✗ Failed to calculate cascading effects:', error.message);
  process.exit(1);
}

// Test 7: Deactivate crash event
console.log('Test 7: Deactivate crash event');
try {
  const activeEvents = marketCrashSim.getActiveEvents();
  if (activeEvents.length === 0) {
    throw new Error('No active events to deactivate');
  }
  
  const eventId = activeEvents[0].id;
  const result = marketCrashSim.deactivateCrashEvent(eventId);
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to deactivate event');
  }
  
  const remainingEvents = marketCrashSim.getActiveEvents();
  if (remainingEvents.length !== 0) {
    throw new Error('Event was not deactivated');
  }
  
  console.log('✓ Crash event deactivated successfully');
  console.log(`  Deactivated: ${result.message}\n`);
} catch (error) {
  console.error('✗ Failed to deactivate event:', error.message);
  process.exit(1);
}

// Test 8: Create custom crash scenario
console.log('Test 8: Create custom crash scenario');
try {
  const customScenario = crashEvents.createCrashTemplate({
    id: 'test_custom_crash',
    name: 'Test Custom Crash',
    type: crashEvents.CRASH_TYPES.MARKET_CRASH,
    severity: crashEvents.SEVERITY_LEVELS.MODERATE,
    marketImpact: -0.20,
    volatilityMultiplier: 3.0,
    sectors: {
      'Technology': -0.25,
      'Financial': -0.18
    }
  });
  
  if (!customScenario.id || !customScenario.name) {
    throw new Error('Custom scenario not created properly');
  }
  
  console.log('✓ Custom crash scenario created');
  console.log(`  ID: ${customScenario.id}`);
  console.log(`  Name: ${customScenario.name}`);
  console.log(`  Type: ${customScenario.type}`);
  console.log(`  Market Impact: ${(customScenario.impact.market * 100).toFixed(0)}%\n`);
} catch (error) {
  console.error('✗ Failed to create custom scenario:', error.message);
  process.exit(1);
}

// Test 9: Liquidity impact calculation
console.log('Test 9: Liquidity impact calculation');
try {
  // Trigger a liquidity crisis
  const testDate = new Date('2008-09-15T09:30:00');
  marketCrashSim._resetState();  // Reset state first
  marketCrashSim.triggerCrashEvent('financial_crisis_2008', testDate);
  
  const normalLiquidity = 10000;
  const shares = 2000;  // Request less than normal liquidity
  
  const liquidityImpact = marketCrashSim.calculateLiquidityImpact(shares, normalLiquidity);
  
  if (!liquidityImpact.executable) {
    throw new Error('Expected trade to be executable with reduced shares');
  }
  
  if (liquidityImpact.priceImpact <= 0) {
    throw new Error('Expected positive price impact during liquidity crisis');
  }
  
  console.log('✓ Liquidity impact calculated');
  console.log(`  Shares requested: ${shares}`);
  console.log(`  Available shares: ${liquidityImpact.availableShares}`);
  console.log(`  Price impact: ${(liquidityImpact.priceImpact * 100).toFixed(2)}%\n`);
} catch (error) {
  console.error('✗ Failed to calculate liquidity impact:', error.message);
  process.exit(1);
}

// Test 10: Analytics and reporting
console.log('Test 10: Analytics and reporting');
try {
  const analytics = marketCrashSim.getCrashAnalytics();
  
  if (typeof analytics.activeEventsCount !== 'number') {
    throw new Error('Invalid analytics structure');
  }
  
  console.log('✓ Analytics retrieved successfully');
  console.log(`  Active events: ${analytics.activeEventsCount}`);
  console.log(`  Historical events: ${analytics.historicalEventsCount}`);
  console.log(`  Market volatility: ${analytics.marketState.currentVolatility.toFixed(2)}x`);
  console.log(`  Market sentiment: ${analytics.marketState.sentimentScore.toFixed(2)}\n`);
} catch (error) {
  console.error('✗ Failed to retrieve analytics:', error.message);
  process.exit(1);
}

// Cleanup
console.log('Cleaning up...');
marketCrashSim._resetState();

console.log('\n=== All Tests Passed! ===');
process.exit(0);
