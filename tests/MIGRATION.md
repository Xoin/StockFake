# Test Migration Status

This document tracks the migration of test files from the custom test framework to Jest.

## Migration Status

### ✅ Migrated (8 files, 130 tests)

These test files have been successfully migrated to Jest:

1. **tests/unit/bonds.test.js** (26 tests) - Bond functionality and pricing
2. **tests/unit/crypto.test.js** (23 tests) - Cryptocurrency features
3. **tests/unit/technicalIndicators.test.js** (28 tests) - Technical analysis indicators
4. **tests/unit/pause-handler.test.js** (9 tests) - Game pause functionality
5. **tests/unit/loan-vs-sell-logic.test.js** (6 tests) - Financial decision logic
6. **tests/unit/realistic-volatility.test.js** (15 tests) - Stock price volatility validation
7. **tests/integration/server-loan-logic.test.js** (10 tests) - Server-side loan logic
8. **tests/simulation/loan-decision-scenarios.test.js** (4 tests) - Historical market scenarios

### ⚠️ Pending Migration (4 files)

These test files still use the custom test framework and are temporarily excluded via `testPathIgnorePatterns` in jest.config.js:

1. **tests/unit/data-retention.test.js** (541 lines)
   - Complex database retention and pruning tests
   - Requires careful migration of database setup/teardown logic

2. **tests/integration/bond-api.test.js** (330 lines)
   - Bond trading API integration tests
   - Uses custom assertion functions

3. **tests/integration/data-retention-api.test.js** (291 lines)
   - Data retention API tests
   - Database-heavy integration tests

4. **tests/simulation/comprehensive-market-simulation.test.js** (345 lines)
   - Full historical market simulations
   - Complex simulation logic across decades

## Migration Pattern

All migrated tests follow this pattern:

### Before (Custom Framework)
```javascript
const { TestSuite, assert } = require('../helpers/testUtils');
const suite = new TestSuite('My Test Suite');

suite.add('Test name', () => {
  assert(condition === expected, 'Error message');
});

const allPassed = suite.run();
if (!allPassed) {
  process.exit(1);
}
```

### After (Jest)
```javascript
describe('My Test Suite', () => {
  test('Test name', () => {
    expect(condition).toBe(expected);
  });
});
```

## How to Complete Migration

To migrate one of the remaining test files:

1. **Replace test structure:**
   - `const suite = new TestSuite('Name')` → `describe('Name', () => {`
   - `suite.add('test', () => {})` → `test('test', () => {})`
   - Remove `suite.run()` and `process.exit()` calls

2. **Replace assertions:**
   - `assert(x === y, 'msg')` → `expect(x).toBe(y)`
   - `assert(x > y, 'msg')` → `expect(x).toBeGreaterThan(y)`
   - `assert(x, 'msg')` → `expect(x).toBeTruthy()`
   - See docs/TESTING.md for more matchers

3. **Remove console logging:**
   - Remove `section()` and `subsection()` calls
   - Remove manual test counting
   - Let Jest handle output

4. **Handle database setup:**
   - Use `beforeEach()` and `afterEach()` for setup/teardown
   - Use `beforeAll()` and `afterAll()` for expensive operations

5. **Update jest.config.js:**
   - Remove the file from `testPathIgnorePatterns`

6. **Test it:**
   ```bash
   npm test -- path/to/migrated/file.test.js
   ```

## Running Tests

### Migrated Tests Only
```bash
npm test
```

This runs all migrated tests (currently excluded files won't run).

### Specific Test File
```bash
npm test -- tests/unit/bonds.test.js
```

### Watch Mode
```bash
npm test -- --watch
```

### Coverage
```bash
npm test -- --coverage
```

## Notes

- The custom test runner (tests/run-tests.js) has been removed
- Test utilities in tests/helpers/ are still used by unmigrated tests
- Once all files are migrated, testPathIgnorePatterns can be removed from jest.config.js
- The helpers/testUtils.js file can be deprecated after full migration

## Benefits of Jest

- **Better assertions**: Intuitive expect() API with descriptive matchers
- **Parallel execution**: Tests run faster
- **Watch mode**: Automatically re-run tests on file changes
- **Coverage reports**: Built-in code coverage
- **Better error messages**: Clear diffs and stack traces
- **Mocking support**: Easy function and module mocking
- **Community standard**: Most popular JavaScript testing framework

## Migration Priority

Suggested order for migrating remaining files:

1. **bond-api.test.js** - Most straightforward integration test
2. **data-retention-api.test.js** - Similar to bond-api
3. **comprehensive-market-simulation.test.js** - Complex but important
4. **data-retention.test.js** - Largest and most complex

## Help

- See [docs/TESTING.md](../docs/TESTING.md) for Jest usage guide
- See migrated test files for examples
- Jest documentation: https://jestjs.io/docs/getting-started
