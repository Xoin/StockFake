/**
 * Test utilities for StockFake testing framework
 * Provides common functions for running tests and simulations
 */

/**
 * Simple test assertion
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

/**
 * Check if value is approximately equal (for floating point comparisons)
 */
function assertApprox(actual, expected, tolerance = 0.01, message) {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    throw new Error(
      message || `Expected ${actual} to be approximately ${expected} (tolerance: ${tolerance}, diff: ${diff})`
    );
  }
}

/**
 * Test section header
 */
function section(title) {
  console.log('\n' + '='.repeat(70));
  console.log(title);
  console.log('='.repeat(70));
}

/**
 * Test subsection header
 */
function subsection(title) {
  console.log('\n' + title);
  console.log('-'.repeat(70));
}

/**
 * Print test result
 */
function testResult(passed, testName, details = '') {
  const symbol = passed ? '✓' : '✗';
  const status = passed ? 'PASS' : 'FAIL';
  console.log(`${symbol} ${status}: ${testName}`);
  if (details) {
    console.log(`  ${details}`);
  }
}

/**
 * Run a test and capture result
 */
function runTest(testName, testFn) {
  try {
    testFn();
    testResult(true, testName);
    return { passed: true, name: testName };
  } catch (error) {
    testResult(false, testName, error.message);
    return { passed: false, name: testName, error: error.message };
  }
}

/**
 * Test suite runner
 */
class TestSuite {
  constructor(name) {
    this.name = name;
    this.tests = [];
    this.results = [];
  }

  add(testName, testFn) {
    this.tests.push({ name: testName, fn: testFn });
  }

  run() {
    section(`Test Suite: ${this.name}`);
    
    for (const test of this.tests) {
      const result = runTest(test.name, test.fn);
      this.results.push(result);
    }

    this.printSummary();
    return this.results;
  }

  printSummary() {
    subsection('Summary');
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;
    
    console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`);
    
    if (failed > 0) {
      console.log('\nFailed tests:');
      this.results.filter(r => !r.passed).forEach(r => {
        console.log(`  - ${r.name}: ${r.error}`);
      });
    }
    
    return failed === 0;
  }
}

module.exports = {
  assert,
  assertApprox,
  section,
  subsection,
  testResult,
  runTest,
  TestSuite
};
