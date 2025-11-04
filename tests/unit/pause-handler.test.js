/**
 * Unit tests for the centralized pause handler
 */

const pauseHandler = require('../../helpers/pauseHandler');

console.log('\n======================================================================');
console.log('Pause Handler Unit Tests');
console.log('======================================================================\n');

// Test 1: Initial state
console.log('Test 1: Initial State');
console.log('----------------------------------------------------------------------');
const initialPaused = pauseHandler.getIsPaused();
console.log(`Initial paused state: ${initialPaused}`);
if (initialPaused === true) {
  console.log('✓ PASS: Game starts paused by default');
} else {
  throw new Error('✗ FAIL: Game should start paused by default');
}

// Test 2: shouldProcessGameState when paused
console.log('\nTest 2: Should NOT Process Game State When Paused');
console.log('----------------------------------------------------------------------');
pauseHandler.setIsPaused(true);
const shouldNotProcess = pauseHandler.shouldProcessGameState();
console.log(`Should process when paused: ${shouldNotProcess}`);
if (shouldNotProcess === false) {
  console.log('✓ PASS: Game state should not process when paused');
} else {
  throw new Error('✗ FAIL: Game state should not process when paused');
}

// Test 3: shouldProcessGameState when unpaused
console.log('\nTest 3: SHOULD Process Game State When Unpaused');
console.log('----------------------------------------------------------------------');
pauseHandler.setIsPaused(false);
const shouldProcess = pauseHandler.shouldProcessGameState();
console.log(`Should process when unpaused: ${shouldProcess}`);
if (shouldProcess === true) {
  console.log('✓ PASS: Game state should process when unpaused');
} else {
  throw new Error('✗ FAIL: Game state should process when unpaused');
}

// Test 4: Toggling pause state
console.log('\nTest 4: Toggling Pause State');
console.log('----------------------------------------------------------------------');
pauseHandler.setIsPaused(true);
if (pauseHandler.getIsPaused() === true) {
  console.log('✓ PASS: Can set pause to true');
} else {
  throw new Error('✗ FAIL: Failed to set pause to true');
}

pauseHandler.setIsPaused(false);
if (pauseHandler.getIsPaused() === false) {
  console.log('✓ PASS: Can set pause to false');
} else {
  throw new Error('✗ FAIL: Failed to set pause to false');
}

// Test 5: executeIfNotPaused when paused
console.log('\nTest 5: executeIfNotPaused When Paused');
console.log('----------------------------------------------------------------------');
pauseHandler.setIsPaused(true);
let executedWhenPaused = false;
const resultWhenPaused = pauseHandler.executeIfNotPaused(() => {
  executedWhenPaused = true;
  return 'executed';
});

if (!executedWhenPaused && resultWhenPaused === undefined) {
  console.log('✓ PASS: Function not executed when paused');
} else {
  throw new Error('✗ FAIL: Function should not execute when paused');
}

// Test 6: executeIfNotPaused when unpaused
console.log('\nTest 6: executeIfNotPaused When Unpaused');
console.log('----------------------------------------------------------------------');
pauseHandler.setIsPaused(false);
let executedWhenUnpaused = false;
const resultWhenUnpaused = pauseHandler.executeIfNotPaused(() => {
  executedWhenUnpaused = true;
  return 'executed';
});

if (executedWhenUnpaused && resultWhenUnpaused === 'executed') {
  console.log('✓ PASS: Function executed when unpaused');
} else {
  throw new Error('✗ FAIL: Function should execute when unpaused');
}

// Test 7: wrapWithPauseCheck
console.log('\nTest 7: wrapWithPauseCheck');
console.log('----------------------------------------------------------------------');
let wrapExecuted = false;
const wrappedFn = pauseHandler.wrapWithPauseCheck(() => {
  wrapExecuted = true;
  return 'wrapped result';
});

// When paused
pauseHandler.setIsPaused(true);
wrapExecuted = false;
const wrappedResultPaused = wrappedFn();
if (!wrapExecuted && wrappedResultPaused === undefined) {
  console.log('✓ PASS: Wrapped function not executed when paused');
} else {
  throw new Error('✗ FAIL: Wrapped function should not execute when paused');
}

// When unpaused
pauseHandler.setIsPaused(false);
wrapExecuted = false;
const wrappedResultUnpaused = wrappedFn();
if (wrapExecuted && wrappedResultUnpaused === 'wrapped result') {
  console.log('✓ PASS: Wrapped function executed when unpaused');
} else {
  throw new Error('✗ FAIL: Wrapped function should execute when unpaused');
}

// Test 8: Type coercion (testing setIsPaused with non-boolean values)
console.log('\nTest 8: Type Coercion');
console.log('----------------------------------------------------------------------');
pauseHandler.setIsPaused(1);
if (pauseHandler.getIsPaused() === true) {
  console.log('✓ PASS: Truthy value coerced to true');
} else {
  throw new Error('✗ FAIL: Truthy value should be coerced to true');
}

pauseHandler.setIsPaused(0);
if (pauseHandler.getIsPaused() === false) {
  console.log('✓ PASS: Falsy value coerced to false');
} else {
  throw new Error('✗ FAIL: Falsy value should be coerced to false');
}

console.log('\n======================================================================');
console.log('Test Summary');
console.log('======================================================================');
console.log('✓ All pause handler tests passed!\n');
