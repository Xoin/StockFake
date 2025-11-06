# StockFake Testing Guide

## Overview

StockFake uses Jest as its testing framework to ensure game logic works correctly across different historical periods and market conditions. Tests are organized into three categories: unit tests, integration tests, and simulation tests.

## Testing Framework

The project uses **Jest** - a delightful JavaScript Testing Framework with a focus on simplicity.

### Why Jest?

- Built-in assertion library with intuitive API
- Fast parallel test execution
- Excellent mocking capabilities
- Code coverage reporting
- Watch mode for development
- Great developer experience with clear error messages

## Directory Structure

```
tests/
├── unit/                    # Unit tests for individual functions
│   ├── bonds.test.js
│   ├── crypto.test.js
│   ├── technicalIndicators.test.js
│   ├── pause-handler.test.js
│   ├── loan-vs-sell-logic.test.js
│   └── ...
├── integration/             # Integration tests for system components
│   ├── server-loan-logic.test.js
│   └── ...
├── simulation/              # Full market simulations
│   └── ...
└── helpers/                 # Test utilities and helpers
    ├── testUtils.js         # Test assertion and suite utilities
    └── simulationUtils.js   # Market simulation helpers
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

### Run Specific Test File
```bash
npm test -- tests/unit/bonds.test.js
npm test -- tests/simulation/comprehensive-market-simulation.test.js
```

### Run Tests Matching a Pattern
```bash
npm test -- crypto
npm test -- tests/unit/
```

### Run with Coverage
```bash
npm test -- --coverage
```

## Writing Tests with Jest

### Basic Test Structure

```javascript
describe('Feature Name', () => {
  test('should do something specific', () => {
    const result = functionUnderTest();
    expect(result).toBe(expectedValue);
  });
  
  test('should handle edge case', () => {
    expect(() => functionWithError()).toThrow();
  });
});
```

### Common Jest Matchers

```javascript
// Equality
expect(value).toBe(expected);           // Strict equality (===)
expect(value).toEqual(expected);        // Deep equality
expect(value).not.toBe(unwanted);       // Negation

// Numbers
expect(number).toBeGreaterThan(3);
expect(number).toBeGreaterThanOrEqual(3.5);
expect(number).toBeLessThan(5);
expect(number).toBeLessThanOrEqual(4.5);
expect(number).toBeCloseTo(0.3);        // Floating point

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();

// Arrays and Iterables
expect(array).toContain(item);
expect(array).toHaveLength(3);
expect(array.length).toBeGreaterThan(0);

// Objects
expect(object).toHaveProperty('key');
expect(object).toMatchObject({key: value});

// Exceptions
expect(() => {
  throw new Error('error');
}).toThrow();
```

### Setup and Teardown

```javascript
describe('My Test Suite', () => {
  beforeAll(() => {
    // Run once before all tests
  });

  beforeEach(() => {
    // Run before each test
  });

  afterEach(() => {
    // Run after each test  
  });

  afterAll(() => {
    // Run once after all tests
  });

  test('example test', () => {
    expect(true).toBe(true);
  });
});
```

## Test Categories

### Unit Tests
Unit tests validate individual functions and decision logic in isolation.

**Example: Loan vs Sell Decision Logic**
```javascript
describe('Loan vs Sell Decision Logic', () => {
  test('Should sell assets when portfolio >> negative balance', () => {
    const account = createMockUserAccount({
      cash: -1000,
      portfolio: { 'AAPL': 100 }
    });
    
    const decision = shouldSellAssetsInsteadOfLoan(account, 1000, gameTime);
    expect(decision).toBe(true);
  });
});
```

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

## Test File Naming

- Unit tests: `*.test.js` in `tests/unit/`
- Integration tests: `*.test.js` in `tests/integration/`
- Simulation tests: `*.test.js` in `tests/simulation/`

All test files ending in `.test.js` or `.spec.js` are automatically discovered and run by Jest.

## Continuous Integration

Tests should be run before:
- Committing code changes
- Creating pull requests
- Deploying to production

All tests must pass for changes to be accepted.

## Test Output

Jest provides clean, colored output:
- ✓ Green checkmarks for passing tests
- ✗ Red X marks for failing tests
- Summary at the end showing pass/fail counts
- Stack traces for debugging failures

Failed tests include error messages and diffs for easy debugging.

## Configuration

Jest is configured via `jest.config.js` in the project root:

```javascript
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js', '**/tests/**/*.spec.js'],
  testTimeout: 30000,  // 30 seconds for long-running simulations
  verbose: true
};
```

## Best Practices

1. **Test edge cases** - Test boundary conditions and unusual scenarios
2. **Use descriptive test names** - Make it clear what behavior is being tested
3. **Keep tests focused** - Each test should validate one specific behavior
4. **Use beforeEach for setup** - Keep tests isolated and independent
5. **Mock external dependencies** - Unit tests should be fast and deterministic
6. **Test both success and failure paths** - Don't just test the happy path
7. **Run tests frequently** - Test early and often during development

## Debugging Tests

### Run a single test
```bash
npm test -- -t "test name pattern"
```

### Run with more verbose output
```bash
npm test -- --verbose
```

### Debug in VSCode
Add this to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal"
}
```

## Troubleshooting

### Tests fail with "Cannot find module"
Make sure you're running tests from the project root directory and dependencies are installed:
```bash
npm install
```

### Simulation tests show unexpected results
Check that historical stock data is loaded correctly and dates are within available data range.

### Test timeout errors
Increase the timeout in jest.config.js or for specific tests:
```javascript
test('long running test', async () => {
  // test code
}, 60000); // 60 second timeout
```

## Migration Notes

The project has been migrated from a custom test runner to Jest. Key changes:

- **Test syntax**: `suite.add()` → `describe()` and `test()`
- **Assertions**: Custom `assert()` → Jest `expect()` matchers
- **Test discovery**: Automatic via Jest's test matching patterns
- **No manual test runner**: Jest handles test execution and reporting

## Future Enhancements

Planned testing improvements:
- Performance benchmarking tests
- Stress testing with extreme market conditions
- Multi-portfolio comparison tests
- Tax calculation validation tests
- API endpoint integration tests
- Snapshot testing for UI components
