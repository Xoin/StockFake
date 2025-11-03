# StockFake Testing Guide

## Overview

StockFake uses a modular testing system to ensure game logic works correctly across different historical periods and market conditions. Tests are organized into three categories: unit tests, integration tests, and simulation tests.

## Directory Structure

```
tests/
├── run-tests.js              # Main test runner
├── helpers/
│   ├── testUtils.js         # Test assertion and suite utilities
│   └── simulationUtils.js   # Market simulation helpers
├── unit/                    # Unit tests for individual functions
│   └── loan-vs-sell-logic.test.js
├── integration/             # Integration tests for system components
│   └── server-loan-logic.test.js
└── simulation/              # Full market simulations
    ├── comprehensive-market-simulation.test.js
    └── loan-decision-scenarios.test.js
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test File
```bash
node tests/unit/loan-vs-sell-logic.test.js
node tests/simulation/comprehensive-market-simulation.test.js
```

### Run Test Category
```bash
# Run all unit tests
node tests/run-tests.js tests/unit/

# Run all simulation tests
node tests/run-tests.js tests/simulation/
```

## Test Categories

### Unit Tests
Unit tests validate individual functions and decision logic in isolation.

**Example: Loan vs Sell Decision Logic**
- Tests the `shouldSellAssetsInsteadOfLoan()` function
- Validates decision-making based on portfolio value, debt, and credit score
- Ensures proper thresholds are applied

### Integration Tests
Integration tests verify that components work correctly together within the full system.

**Example: Server Loan Logic Integration**
- Verifies the fix is properly implemented in server.js
- Checks that all decision criteria are present
- Validates proper handling of both loan and sell paths

### Simulation Tests
Simulation tests run complete market scenarios across historical periods to validate realistic behavior.

**Example: Comprehensive Market Simulation**
- Simulates buy-and-hold strategies from 1970s to 2010s
- Tests performance during major market events (oil crisis, Black Monday, dot-com bubble, 2008 crisis)
- Validates dividend accumulation and long-term returns
- Compares sector performance during different economic conditions

## Writing Tests

### Using Test Utilities

```javascript
const { TestSuite, assert, assertApprox } = require('../helpers/testUtils');

const suite = new TestSuite('My Test Suite');

suite.add('Test name', () => {
  assert(condition, 'Error message if false');
  assertApprox(actual, expected, tolerance, 'Error message');
});

suite.run(); // Returns true if all tests pass
```

### Creating Market Simulations

```javascript
const { 
  createMockUserAccount,
  calculatePortfolioValue,
  createScenario,
  runScenario
} = require('../helpers/simulationUtils');

// Create a test scenario
const scenario = createScenario('Test Scenario', {
  startDate: new Date('1980-01-01'),
  endDate: new Date('1985-01-01'),
  initialCash: 10000,
  initialPortfolio: { 'AAPL': 100 },
  events: [
    {
      date: new Date('1982-01-01'),
      action: (account, date) => {
        // Custom event logic
      }
    }
  ]
});

// Run the scenario
const result = runScenario(scenario);
```

## Market Simulation Features

### Historical Period Simulations
The comprehensive market simulation tests cover:

1. **1970s Oil Crisis** - Energy vs Tech performance
2. **1980s Bull Market** - Growth stock performance
3. **1987 Black Monday** - Crash recovery and active trading
4. **Dot-com Bubble (1998-2002)** - Tech bubble and crash
5. **2008 Financial Crisis** - Banking sector stress
6. **Long-term Wealth Building** - 20+ year buy-and-hold

### What Simulations Validate

- ✓ Stock prices respond to historical market conditions
- ✓ Different sectors perform differently during crises
- ✓ Dividends accumulate over time
- ✓ Active trading strategies can be executed
- ✓ Market crashes and recoveries are tracked
- ✓ Long-term wealth building is possible
- ✓ Loan vs sell decisions are made intelligently

## Test File Naming

- Unit tests: `*.test.js` in `tests/unit/`
- Integration tests: `*.test.js` in `tests/integration/`
- Simulation tests: `*.test.js` in `tests/simulation/`

All test files ending in `.test.js` or `.spec.js` are automatically discovered and run by the test runner.

## Continuous Integration

Tests should be run before:
- Committing code changes
- Creating pull requests
- Deploying to production

All tests must pass for changes to be accepted.

## Test Output

The test runner provides colored output:
- ✓ Green for passing tests
- ✗ Red for failing tests
- Summary at the end showing pass/fail counts

Failed tests include error messages and stack traces for debugging.

## Examples

### Example: Testing a Decision Function

```javascript
suite.add('Should sell when portfolio is large', () => {
  const account = createMockUserAccount({
    cash: -1000,
    portfolio: { 'AAPL': 100 }, // Worth ~$5000
    loans: []
  });
  
  const decision = shouldSellAssetsInsteadOfLoan(account, 1000, gameTime);
  assert(decision === true, 'Should sell assets when portfolio >> debt');
});
```

### Example: Running a Historical Simulation

```javascript
const simulation = simulateBuyAndHold(
  new Date('1990-01-01'),
  new Date('2010-01-01'),
  10000,
  'MSFT',
  100
);

console.log(`Return: ${((simulation.finalValue / 10000 - 1) * 100).toFixed(2)}%`);
console.log(`Dividends: $${simulation.totalDividends.toFixed(2)}`);
```

## Best Practices

1. **Test edge cases** - Test boundary conditions and unusual scenarios
2. **Use realistic data** - Base tests on actual historical market conditions
3. **Keep tests focused** - Each test should validate one specific behavior
4. **Document expected behavior** - Include comments explaining what's being tested
5. **Run tests frequently** - Test early and often during development

## Troubleshooting

### Tests fail with "Cannot find module"
Make sure you're running tests from the project root directory.

### Simulation tests show unexpected results
Check that historical stock data is loaded correctly and dates are within available data range.

### Test runner doesn't find tests
Ensure test files end with `.test.js` or `.spec.js` and are in the `tests/` directory.

## Future Enhancements

Planned testing improvements:
- Performance benchmarking tests
- Stress testing with extreme market conditions
- Multi-portfolio comparison tests
- Tax calculation validation tests
- API endpoint integration tests
