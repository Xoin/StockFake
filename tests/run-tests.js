#!/usr/bin/env node

/**
 * Main test runner for StockFake
 * Runs all tests in the tests/ directory
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function printHeader(text) {
  console.log('\n' + '='.repeat(70));
  console.log(colorize(text, 'bold'));
  console.log('='.repeat(70));
}

function printSubheader(text) {
  console.log('\n' + colorize(text, 'cyan'));
  console.log('-'.repeat(70));
}

/**
 * Discover test files in a directory
 */
function discoverTests(directory) {
  const tests = [];
  
  if (!fs.existsSync(directory)) {
    return tests;
  }
  
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Recursively discover tests in subdirectories
      tests.push(...discoverTests(fullPath));
    } else if (file.endsWith('.test.js') || file.endsWith('.spec.js')) {
      tests.push(fullPath);
    }
  }
  
  return tests;
}

/**
 * Run a single test file
 */
function runTestFile(testPath) {
  const relativePath = path.relative(process.cwd(), testPath);
  
  try {
    printSubheader(`Running: ${relativePath}`);
    
    // Clear the require cache to ensure fresh execution
    delete require.cache[require.resolve(testPath)];
    
    // Run the test
    require(testPath);
    
    return { passed: true, path: relativePath };
  } catch (error) {
    console.error(colorize(`\n✗ Test failed: ${error.message}`, 'red'));
    if (error.stack) {
      console.error(error.stack);
    }
    return { passed: false, path: relativePath, error: error.message };
  }
}

/**
 * Main test runner
 */
function runAllTests() {
  printHeader('StockFake Test Suite');
  
  const testDir = __dirname; // Start from tests/ directory
  const testFiles = discoverTests(testDir);
  
  if (testFiles.length === 0) {
    console.log(colorize('No test files found!', 'yellow'));
    return;
  }
  
  console.log(`\nFound ${testFiles.length} test file(s)`);
  
  const results = [];
  
  for (const testFile of testFiles) {
    const result = runTestFile(testFile);
    results.push(result);
  }
  
  // Print summary
  printHeader('Test Summary');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  
  console.log(`\nTotal: ${total} | ${colorize(`Passed: ${passed}`, 'green')} | ${failed > 0 ? colorize(`Failed: ${failed}`, 'red') : 'Failed: 0'}`);
  
  if (failed > 0) {
    console.log(colorize('\nFailed tests:', 'red'));
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.path}`);
      if (r.error) {
        console.log(`    ${r.error}`);
      }
    });
    process.exit(1);
  } else {
    console.log(colorize('\n✓ All tests passed!', 'green'));
  }
}

// Run tests if this is the main module
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests, runTestFile, discoverTests };
