#!/usr/bin/env node

/**
 * Integration test for Dynamic Event Generator
 * This script validates the dynamic event generation functionality
 */

const dynamicEventGenerator = require('./helpers/dynamicEventGenerator');
const crashEvents = require('./data/market-crash-events');

console.log('=== Dynamic Event Generator Integration Test ===\n');

// Test 1: Get default configuration
console.log('Test 1: Get default configuration');
try {
  const config = dynamicEventGenerator.getConfiguration();
  
  if (!config.historicalDataEndDate || !config.annualCrashProbability) {
    throw new Error('Configuration missing required fields');
  }
  
  console.log('✓ Configuration retrieved successfully');
  console.log(`  Historical data end: ${config.historicalDataEndDate.toISOString().split('T')[0]}`);
  console.log(`  Annual crash probability: ${(config.annualCrashProbability * 100).toFixed(0)}%`);
  console.log(`  Annual correction probability: ${(config.annualCorrectionProbability * 100).toFixed(0)}%\n`);
} catch (error) {
  console.error('✗ Failed to get configuration:', error.message);
  process.exit(1);
}

// Test 2: Generate dynamic crash event
console.log('Test 2: Generate dynamic crash event');
try {
  const testDate = new Date('2025-06-15T09:30:00');
  const seed = Math.floor(testDate.getTime() / (1000 * 60 * 60 * 24));
  
  const event = dynamicEventGenerator.generateDynamicCrash(
    testDate,
    crashEvents.CRASH_TYPES.MARKET_CRASH,
    seed
  );
  
  if (!event.id || !event.name || !event.impact) {
    throw new Error('Generated event missing required fields');
  }
  
  if (!event.isDynamic) {
    throw new Error('Event not marked as dynamic');
  }
  
  console.log('✓ Dynamic crash event generated');
  console.log(`  ID: ${event.id}`);
  console.log(`  Name: ${event.name}`);
  console.log(`  Type: ${event.type}`);
  console.log(`  Severity: ${event.severity}`);
  console.log(`  Market Impact: ${(event.impact.market * 100).toFixed(2)}%\n`);
} catch (error) {
  console.error('✗ Failed to generate dynamic event:', error.message);
  process.exit(1);
}

// Test 3: Test event generation for future dates
console.log('Test 3: Test event generation for future dates');
try {
  dynamicEventGenerator.resetGeneratorState();
  
  // Test date after historical data
  const futureDate = new Date('2025-06-15T09:30:00');
  
  // First call should initialize but may not generate event
  let events = dynamicEventGenerator.generateDynamicEvents(futureDate);
  console.log(`  First check: ${events.length} events generated`);
  
  // Advance time by 3 months
  const laterDate = new Date('2025-09-15T09:30:00');
  events = dynamicEventGenerator.generateDynamicEvents(laterDate);
  console.log(`  After 3 months: ${events.length} events generated`);
  
  console.log('✓ Future date event generation tested\n');
} catch (error) {
  console.error('✗ Failed to test future date generation:', error.message);
  process.exit(1);
}

// Test 4: Test that events aren't generated during historical period
console.log('Test 4: Test historical period restriction');
try {
  dynamicEventGenerator.resetGeneratorState();
  
  // Test date during historical period
  const historicalDate = new Date('2020-06-15T09:30:00');
  const events = dynamicEventGenerator.generateDynamicEvents(historicalDate);
  
  if (events.length > 0) {
    throw new Error('Events generated during historical period');
  }
  
  console.log('✓ No events generated during historical period\n');
} catch (error) {
  console.error('✗ Historical period test failed:', error.message);
  process.exit(1);
}

// Test 5: Test configuration update
console.log('Test 5: Test configuration update');
try {
  const newConfig = {
    annualCrashProbability: 0.25,
    minDaysBetweenEvents: 60
  };
  
  dynamicEventGenerator.updateConfiguration(newConfig);
  const updatedConfig = dynamicEventGenerator.getConfiguration();
  
  if (updatedConfig.annualCrashProbability !== 0.25) {
    throw new Error('Configuration not updated correctly');
  }
  
  if (updatedConfig.minDaysBetweenEvents !== 60) {
    throw new Error('minDaysBetweenEvents not updated correctly');
  }
  
  console.log('✓ Configuration updated successfully');
  console.log(`  New crash probability: ${(updatedConfig.annualCrashProbability * 100).toFixed(0)}%`);
  console.log(`  New min days between events: ${updatedConfig.minDaysBetweenEvents}\n`);
  
  // Reset to defaults
  dynamicEventGenerator.updateConfiguration({
    annualCrashProbability: 0.15,
    minDaysBetweenEvents: 90
  });
} catch (error) {
  console.error('✗ Failed to update configuration:', error.message);
  process.exit(1);
}

// Test 6: Test deterministic generation
console.log('Test 6: Test deterministic event generation');
try {
  dynamicEventGenerator.resetGeneratorState();
  
  const testDate = new Date('2025-06-15T09:30:00');
  const seed = Math.floor(testDate.getTime() / (1000 * 60 * 60 * 24));
  
  // Generate same event twice with same seed
  const event1 = dynamicEventGenerator.generateDynamicCrash(
    testDate,
    crashEvents.CRASH_TYPES.MARKET_CRASH,
    seed
  );
  
  const event2 = dynamicEventGenerator.generateDynamicCrash(
    testDate,
    crashEvents.CRASH_TYPES.MARKET_CRASH,
    seed
  );
  
  if (event1.name !== event2.name) {
    throw new Error('Event names differ with same seed');
  }
  
  if (Math.abs(event1.impact.market - event2.impact.market) > 0.001) {
    throw new Error('Event impacts differ with same seed');
  }
  
  console.log('✓ Deterministic generation verified');
  console.log(`  Event name: ${event1.name}`);
  console.log(`  Market impact: ${(event1.impact.market * 100).toFixed(2)}%\n`);
} catch (error) {
  console.error('✗ Deterministic generation test failed:', error.message);
  process.exit(1);
}

// Test 7: Test different event types
console.log('Test 7: Test different event types');
try {
  const testDate = new Date('2025-06-15T09:30:00');
  const seed = 12345;
  
  const marketCrash = dynamicEventGenerator.generateDynamicCrash(
    testDate,
    crashEvents.CRASH_TYPES.MARKET_CRASH,
    seed
  );
  
  const sectorCrash = dynamicEventGenerator.generateDynamicCrash(
    testDate,
    crashEvents.CRASH_TYPES.SECTOR_CRASH,
    seed + 1
  );
  
  const correction = dynamicEventGenerator.generateDynamicCrash(
    testDate,
    crashEvents.CRASH_TYPES.CORRECTION,
    seed + 2
  );
  
  if (marketCrash.type !== crashEvents.CRASH_TYPES.MARKET_CRASH) {
    throw new Error('Market crash type incorrect');
  }
  
  if (sectorCrash.type !== crashEvents.CRASH_TYPES.SECTOR_CRASH) {
    throw new Error('Sector crash type incorrect');
  }
  
  if (correction.type !== crashEvents.CRASH_TYPES.CORRECTION) {
    throw new Error('Correction type incorrect');
  }
  
  console.log('✓ Different event types generated correctly');
  console.log(`  Market crash: ${marketCrash.name}`);
  console.log(`  Sector crash: ${sectorCrash.name}`);
  console.log(`  Correction: ${correction.name}\n`);
} catch (error) {
  console.error('✗ Event type test failed:', error.message);
  process.exit(1);
}

// Test 8: Test event structure
console.log('Test 8: Validate event structure');
try {
  const testDate = new Date('2025-06-15T09:30:00');
  const seed = 54321;
  
  const event = dynamicEventGenerator.generateDynamicCrash(
    testDate,
    crashEvents.CRASH_TYPES.MARKET_CRASH,
    seed
  );
  
  // Check required fields
  const requiredFields = ['id', 'name', 'type', 'severity', 'impact', 'cascadingEffects', 'recoveryPattern'];
  for (const field of requiredFields) {
    if (!event[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  // Check impact structure
  const impactFields = ['market', 'volatilityMultiplier', 'liquidityReduction', 'sentimentShift', 'sectors'];
  for (const field of impactFields) {
    if (event.impact[field] === undefined) {
      throw new Error(`Missing impact field: ${field}`);
    }
  }
  
  // Check cascading effects
  if (!Array.isArray(event.cascadingEffects) || event.cascadingEffects.length === 0) {
    throw new Error('Invalid cascading effects');
  }
  
  // Check recovery pattern
  if (!event.recoveryPattern.type || !event.recoveryPattern.durationDays) {
    throw new Error('Invalid recovery pattern');
  }
  
  console.log('✓ Event structure validated');
  console.log(`  All required fields present`);
  console.log(`  Cascading effects: ${event.cascadingEffects.length} stages`);
  console.log(`  Recovery: ${event.recoveryPattern.type} over ${event.recoveryPattern.durationDays} days\n`);
} catch (error) {
  console.error('✗ Event structure validation failed:', error.message);
  process.exit(1);
}

// Cleanup
console.log('Cleaning up...');
dynamicEventGenerator.resetGeneratorState();

console.log('\n=== All Tests Passed! ===');
process.exit(0);
