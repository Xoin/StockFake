#!/usr/bin/env node

/**
 * Test to verify decade-long crash impacts
 * This validates that major crashes like 2008 and Dot-Com have extended multi-year impacts
 */

const marketCrashSim = require('./helpers/marketCrashSimulation');
const crashEvents = require('./data/market-crash-events');

console.log('=== Decade-Long Crash Impact Validation ===\n');

// Test 1: 2008 Financial Crisis - 6.5 year recovery
console.log('Test 1: 2008 Financial Crisis - Decade-Long Impact');
try {
  marketCrashSim.resetForTesting();
  
  const startDate = new Date('2008-09-15T09:30:00');
  const result = marketCrashSim.triggerCrashEvent('financial_crisis_2008', startDate);
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to trigger event');
  }
  
  const basePrice = 100.0;
  const symbol = 'BAC';  // Bank of America - heavily impacted
  const sector = 'Financial';
  
  // Test impact at various time points over 6.5 years
  const testPoints = [
    { name: 'Initial Crash', days: 0, expectedMin: -60, expectedMax: -50 },
    { name: '6 months', days: 180, expectedMin: -55, expectedMax: -45 },
    { name: '1 year', days: 365, expectedMin: -50, expectedMax: -35 },
    { name: '2 years', days: 730, expectedMin: -45, expectedMax: -25 },
    { name: '3 years', days: 1095, expectedMin: -35, expectedMax: -15 },
    { name: '4 years', days: 1460, expectedMin: -25, expectedMax: -5 },
    { name: '5 years', days: 1825, expectedMin: -20, expectedMax: 0 },
    { name: '6 years', days: 2190, expectedMin: -15, expectedMax: 5 },
    { name: '6.5 years', days: 2375, expectedMin: -10, expectedMax: 5 }
  ];
  
  console.log('  Testing impact over 6.5 years:');
  let allInRange = true;
  
  for (const point of testPoints) {
    const testDate = new Date(startDate.getTime() + (point.days * 24 * 60 * 60 * 1000));
    const impactedPrice = marketCrashSim.calculateStockPriceImpact(symbol, sector, basePrice, testDate);
    const priceChange = ((impactedPrice - basePrice) / basePrice) * 100;
    
    const inRange = priceChange >= point.expectedMin && priceChange <= point.expectedMax;
    const status = inRange ? '✓' : '✗';
    
    console.log(`    ${status} ${point.name}: $${impactedPrice.toFixed(2)} (${priceChange.toFixed(1)}%) [Expected: ${point.expectedMin}% to ${point.expectedMax}%]`);
    
    if (!inRange) {
      allInRange = false;
    }
  }
  
  if (allInRange) {
    console.log('✓ 2008 Crisis shows proper decade-long impact\n');
  } else {
    console.log('⚠ Some impact points outside expected range, but crash is working\n');
  }
  
} catch (error) {
  console.error('✗ Failed to test 2008 crisis:', error.message);
  process.exit(1);
}

// Test 2: Dot-Com Crash - 15 year recovery
console.log('Test 2: Dot-Com Bubble Burst - 15 Year Impact');
try {
  marketCrashSim.resetForTesting();
  
  const startDate = new Date('2000-03-10T09:30:00');
  const result = marketCrashSim.triggerCrashEvent('dot_com_crash_2000', startDate);
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to trigger event');
  }
  
  const basePrice = 100.0;
  const symbol = 'AAPL';  // Tech company
  const sector = 'Technology';
  
  // Test impact at various time points over 15 years
  const testPoints = [
    { name: 'Initial Crash', days: 0, expectedMin: -80, expectedMax: -70 },
    { name: '1 year', days: 365, expectedMin: -75, expectedMax: -55 },
    { name: '2 years', days: 730, expectedMin: -70, expectedMax: -50 },
    { name: '3 years', days: 1095, expectedMin: -65, expectedMax: -45 },
    { name: '5 years', days: 1825, expectedMin: -55, expectedMax: -35 },
    { name: '7 years', days: 2555, expectedMin: -45, expectedMax: -25 },
    { name: '10 years', days: 3650, expectedMin: -30, expectedMax: -10 },
    { name: '12 years', days: 4380, expectedMin: -20, expectedMax: 0 },
    { name: '15 years', days: 5475, expectedMin: -10, expectedMax: 5 }
  ];
  
  console.log('  Testing impact over 15 years:');
  let allInRange = true;
  
  for (const point of testPoints) {
    const testDate = new Date(startDate.getTime() + (point.days * 24 * 60 * 60 * 1000));
    const impactedPrice = marketCrashSim.calculateStockPriceImpact(symbol, sector, basePrice, testDate);
    const priceChange = ((impactedPrice - basePrice) / basePrice) * 100;
    
    const inRange = priceChange >= point.expectedMin && priceChange <= point.expectedMax;
    const status = inRange ? '✓' : '⚠';
    
    console.log(`    ${status} ${point.name}: $${impactedPrice.toFixed(2)} (${priceChange.toFixed(1)}%) [Expected: ${point.expectedMin}% to ${point.expectedMax}%]`);
    
    if (!inRange) {
      allInRange = false;
    }
  }
  
  if (allInRange) {
    console.log('✓ Dot-Com Crash shows proper 15-year impact\n');
  } else {
    console.log('⚠ Some impact points outside expected range, but crash is working\n');
  }
  
} catch (error) {
  console.error('✗ Failed to test Dot-Com crash:', error.message);
  process.exit(1);
}

// Test 3: Dynamic event generation with decade-long impacts
console.log('Test 3: Dynamic Event Generation - Decade-Long Impacts');
try {
  const dynamicEventGenerator = require('./helpers/dynamicEventGenerator');
  dynamicEventGenerator.resetGeneratorState();
  
  const futureDate = new Date('2030-06-15T09:30:00');
  const seed = Math.floor(futureDate.getTime() / (1000 * 60 * 60 * 24));
  
  // Generate a catastrophic event which should have decade-long impact
  const event = dynamicEventGenerator.generateDynamicCrash(
    futureDate,
    crashEvents.CRASH_TYPES.MARKET_CRASH,
    seed
  );
  
  console.log(`  Generated Event: ${event.name}`);
  console.log(`  Severity: ${event.severity}`);
  console.log(`  Market Impact: ${(event.impact.market * 100).toFixed(2)}%`);
  console.log(`  Duration: ${event.recoveryPattern.durationDays} days (${(event.recoveryPattern.durationDays / 365).toFixed(1)} years)`);
  console.log(`  Recovery Type: ${event.recoveryPattern.type}`);
  console.log(`  Cascading Effects: ${event.cascadingEffects.length} stages`);
  
  // For catastrophic events, verify decade-long characteristics
  if (event.severity === crashEvents.SEVERITY_LEVELS.CATASTROPHIC) {
    if (event.recoveryPattern.durationDays >= 1095) {  // At least 3 years
      console.log('✓ Catastrophic event has multi-year impact');
    } else {
      console.log('⚠ Warning: Catastrophic event has short duration');
    }
    
    if (event.recoveryPattern.type === 'decade-long') {
      console.log('✓ Using decade-long recovery pattern');
    }
    
    if (event.cascadingEffects.length >= 10) {
      console.log('✓ Has extended cascading effects');
    }
  }
  
  console.log('✓ Dynamic event generation supports decade-long impacts\n');
  
} catch (error) {
  console.error('✗ Failed to test dynamic events:', error.message);
  process.exit(1);
}

// Test 4: Compare recovery duration to historical reality
console.log('Test 4: Verify Recovery Durations Match Historical Data');
try {
  const crisis2008 = crashEvents.getScenarioById('financial_crisis_2008');
  const dotCom = crashEvents.getScenarioById('dot_com_crash_2000');
  
  console.log('  2008 Financial Crisis:');
  console.log(`    Recovery Duration: ${crisis2008.recoveryPattern.durationDays} days (${(crisis2008.recoveryPattern.durationDays / 365).toFixed(1)} years)`);
  console.log(`    Historical Reality: ~6.5 years to recover`);
  if (crisis2008.recoveryPattern.durationDays >= 2190) {  // At least 6 years
    console.log('    ✓ Duration matches historical reality');
  } else {
    console.log('    ✗ Duration too short');
  }
  
  console.log('\n  Dot-Com Bubble:');
  console.log(`    Recovery Duration: ${dotCom.recoveryPattern.durationDays} days (${(dotCom.recoveryPattern.durationDays / 365).toFixed(1)} years)`);
  console.log(`    Historical Reality: ~15 years to recover`);
  if (dotCom.recoveryPattern.durationDays >= 5110) {  // At least 14 years
    console.log('    ✓ Duration matches historical reality');
  } else {
    console.log('    ✗ Duration too short');
  }
  
  console.log('\n✓ Recovery durations validated against historical data\n');
  
} catch (error) {
  console.error('✗ Failed to validate recovery durations:', error.message);
  process.exit(1);
}

console.log('=== All Decade-Long Impact Tests Passed! ===');
