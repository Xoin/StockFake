#!/usr/bin/env node

/**
 * Integration test for Index Fund Rebalancing
 * This script validates the rebalancing functionality
 */

const dbModule = require('./database');
const indexFunds = require('./data/index-funds');
const indexFundRebalancing = require('./helpers/indexFundRebalancing');
const stocks = require('./data/stocks');

console.log('=== Index Fund Rebalancing Integration Test ===\n');

// Test 1: Initialize rebalancing configurations
console.log('Test 1: Initialize rebalancing configurations');
try {
  const testDate = new Date('2020-01-01T09:30:00');
  indexFundRebalancing.initializeRebalancingConfigs(indexFunds.indexFunds, testDate);
  console.log('✓ Configurations initialized successfully\n');
} catch (error) {
  console.error('✗ Failed to initialize configurations:', error.message);
  process.exit(1);
}

// Test 2: Calculate market-cap weights
console.log('Test 2: Calculate market-cap weighted constituents');
try {
  const testDate = new Date('2020-01-01T09:30:00');
  const spxFund = indexFunds.indexFunds.find(f => f.symbol === 'SPX500');
  
  if (!spxFund) {
    throw new Error('SPX500 fund not found');
  }
  
  const weights = indexFundRebalancing.calculateMarketCapWeights(
    spxFund.constituents.slice(0, 10), // Test with first 10 constituents
    testDate,
    3600,
    false
  );
  
  if (weights.length === 0) {
    throw new Error('No weights calculated');
  }
  
  // Verify weights sum to approximately 1.0
  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  if (Math.abs(totalWeight - 1.0) > 0.001) {
    throw new Error(`Weights don't sum to 1.0: ${totalWeight}`);
  }
  
  console.log(`✓ Calculated weights for ${weights.length} constituents`);
  console.log(`  Total weight: ${totalWeight.toFixed(6)}`);
  console.log(`  Sample: ${weights[0].symbol} = ${(weights[0].weight * 100).toFixed(2)}%\n`);
} catch (error) {
  console.error('✗ Failed to calculate weights:', error.message);
  process.exit(1);
}

// Test 3: Perform manual rebalancing
console.log('Test 3: Perform manual rebalancing');
try {
  const testDate = new Date('2020-01-01T09:30:00');
  const techFund = indexFunds.indexFunds.find(f => f.symbol === 'TECH100');
  
  if (!techFund) {
    throw new Error('TECH100 fund not found');
  }
  
  const result = indexFundRebalancing.performRebalancing(
    techFund,
    testDate,
    3600,
    false,
    indexFundRebalancing.TRIGGER_TYPES.MANUAL
  );
  
  if (!result.success) {
    throw new Error(result.error);
  }
  
  console.log(`✓ Rebalancing completed successfully`);
  console.log(`  Constituents: ${result.constituents}`);
  console.log(`  Added: ${result.changes.added.length}`);
  console.log(`  Removed: ${result.changes.removed.length}`);
  console.log(`  Adjusted: ${result.changes.adjusted.length}\n`);
} catch (error) {
  console.error('✗ Failed to perform rebalancing:', error.message);
  process.exit(1);
}

// Test 4: Retrieve rebalancing history
console.log('Test 4: Retrieve rebalancing history');
try {
  const history = indexFundRebalancing.getRebalancingHistory('TECH100', 10);
  
  if (history.length === 0) {
    console.log('⚠ No rebalancing history found (this is expected on first run)');
  } else {
    console.log(`✓ Retrieved ${history.length} rebalancing event(s)`);
    const latest = history[0];
    console.log(`  Latest event: ${latest.triggerType} on ${latest.date}\n`);
  }
} catch (error) {
  console.error('✗ Failed to retrieve history:', error.message);
  process.exit(1);
}

// Test 5: Get current weights
console.log('Test 5: Get current constituent weights');
try {
  const testDate = new Date('2020-01-01T09:30:00');
  const weights = indexFundRebalancing.getCurrentWeights('TECH100', testDate);
  
  if (weights.length === 0) {
    console.log('⚠ No historical weights found (expected if no rebalancing occurred yet)');
  } else {
    console.log(`✓ Retrieved weights for ${weights.length} constituents`);
    console.log(`  Sample: ${weights[0].symbol} = ${(weights[0].weight * 100).toFixed(2)}%\n`);
  }
} catch (error) {
  console.error('✗ Failed to get current weights:', error.message);
  process.exit(1);
}

// Test 6: Check rebalancing configuration
console.log('Test 6: Check rebalancing configuration');
try {
  const config = dbModule.getRebalancingConfig.get('SPX500');
  
  if (!config) {
    throw new Error('Configuration not found for SPX500');
  }
  
  console.log('✓ Configuration retrieved successfully');
  console.log(`  Strategy: ${config.strategy}`);
  console.log(`  Frequency: ${config.rebalancing_frequency}`);
  console.log(`  Drift threshold: ${(config.drift_threshold * 100).toFixed(2)}%`);
  console.log(`  Auto-rebalance: ${config.auto_rebalance_enabled ? 'enabled' : 'disabled'}\n`);
} catch (error) {
  console.error('✗ Failed to check configuration:', error.message);
  process.exit(1);
}

// Test 7: Calculate next rebalancing date
console.log('Test 7: Calculate next rebalancing date');
try {
  const baseDate = new Date('2020-01-01T09:30:00');
  const frequencies = Object.values(indexFundRebalancing.REBALANCING_FREQUENCIES);
  
  for (const freq of frequencies) {
    const nextDate = indexFundRebalancing.calculateNextRebalancing(baseDate, freq);
    const daysDiff = Math.round((nextDate - baseDate) / (1000 * 60 * 60 * 24));
    console.log(`  ${freq}: ${daysDiff} days`);
  }
  
  console.log('✓ Next rebalancing dates calculated\n');
} catch (error) {
  console.error('✗ Failed to calculate next rebalancing:', error.message);
  process.exit(1);
}

// Test 8: Test auto-rebalancing check
console.log('Test 8: Test auto-rebalancing check');
try {
  const testDate = new Date('2020-06-01T09:30:00'); // 5 months after initialization
  const spxFund = indexFunds.indexFunds.find(f => f.symbol === 'SPX500');
  
  const rebalancingNeeded = indexFundRebalancing.checkRebalancingNeeded(
    spxFund,
    testDate,
    3600,
    false
  );
  
  if (rebalancingNeeded) {
    console.log(`✓ Rebalancing check detected trigger: ${rebalancingNeeded.triggerType}`);
    console.log(`  Reason: ${rebalancingNeeded.reason}\n`);
  } else {
    console.log('✓ No rebalancing needed at this time\n');
  }
} catch (error) {
  console.error('✗ Failed to check rebalancing need:', error.message);
  process.exit(1);
}

// Test 9: Test multiple fund rebalancing
console.log('Test 9: Process auto-rebalancing for all funds');
try {
  const testDate = new Date('2021-01-01T09:30:00');
  const results = indexFundRebalancing.processAutoRebalancing(
    indexFunds.indexFunds,
    testDate,
    3600,
    false
  );
  
  console.log(`✓ Processed ${results.length} fund(s) for auto-rebalancing`);
  
  if (results.length > 0) {
    for (const result of results) {
      console.log(`  - ${result.fundName}: ${result.triggerType}`);
    }
  }
  console.log('');
} catch (error) {
  console.error('✗ Failed to process auto-rebalancing:', error.message);
  process.exit(1);
}

console.log('=== All Tests Passed! ===');
console.log('\nIndex fund rebalancing system is functioning correctly.');
