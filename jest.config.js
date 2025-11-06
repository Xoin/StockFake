module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Test match patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],

  // Paths to ignore
  testPathIgnorePatterns: [
    '/node_modules/',
    // Temporarily ignore unmigrated test files
    'tests/unit/data-retention.test.js',
    'tests/unit/realistic-volatility.test.js',
    'tests/integration/bond-api.test.js',
    'tests/integration/data-retention-api.test.js',
    'tests/simulation/comprehensive-market-simulation.test.js',
    'tests/simulation/loan-decision-scenarios.test.js'
  ],

  // Coverage collection
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/data/**',
    '!**/public/**',
    '!jest.config.js',
    '!test-*.js',
    '!demo-*.js',
    '!final-*.js'
  ],

  // Test timeout (some simulations may take longer)
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Indicates whether the coverage information should be collected
  collectCoverage: false,

  // Coverage directory
  coverageDirectory: 'coverage',

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html']
};
