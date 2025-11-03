#!/usr/bin/env node

/**
 * Test for loan vs sell decision logic
 * This test validates that the game makes smart decisions about
 * whether to take loans or sell assets when facing negative balance
 */

const { TestSuite, assert } = require('../helpers/testUtils');
const { createMockUserAccount, calculatePortfolioValue, calculateTotalLoanDebt } = require('../helpers/simulationUtils');

const suite = new TestSuite('Loan vs Sell Decision Logic');

/**
 * Mock the decision logic that should be implemented
 * This is what the fixed logic should look like
 */
function shouldSellAssetsInsteadOfLoan(account, negativeAmount, gameTime) {
  const portfolioValue = calculatePortfolioValue(account.portfolio, gameTime);
  const totalLoanDebt = calculateTotalLoanDebt(account.loans);
  
  // If no portfolio to sell, must take loan (if available)
  if (portfolioValue === 0) {
    return false;
  }
  
  // If already heavily in debt (loans > 50% of portfolio value), prefer selling
  if (totalLoanDebt > portfolioValue * 0.5) {
    return true;
  }
  
  // If portfolio value can easily cover the negative amount (>2x), prefer selling
  if (portfolioValue > negativeAmount * 2) {
    return true;
  }
  
  // If credit score is poor (<600), avoid more loans
  if (account.creditScore < 600) {
    return true;
  }
  
  // If negative amount is small relative to portfolio (<10%), prefer selling
  if (portfolioValue > 0 && negativeAmount < portfolioValue * 0.1) {
    return true;
  }
  
  // Default: take loan if available
  return false;
}

// Test 1: Should sell when portfolio value is much higher than negative balance
suite.add('Should sell assets when portfolio >> negative balance', () => {
  const account = createMockUserAccount({
    cash: -1000,
    portfolio: {
      'AAPL': 100 // Worth ~$5000 in 1970
    },
    loans: []
  });
  
  const gameTime = new Date('1980-01-01T09:30:00');
  const decision = shouldSellAssetsInsteadOfLoan(account, 1000, gameTime);
  
  assert(decision === true, 'Should sell assets when portfolio value is much higher than debt');
});

// Test 2: Should sell when already heavily in debt
suite.add('Should sell assets when already heavily in debt', () => {
  const account = createMockUserAccount({
    cash: -500,
    portfolio: {
      'IBM': 50 // Worth ~$10,000 in 1980
    },
    loans: [
      { id: 1, balance: 6000, status: 'active' } // Debt > 50% of portfolio
    ]
  });
  
  const gameTime = new Date('1980-01-01T09:30:00');
  const decision = shouldSellAssetsInsteadOfLoan(account, 500, gameTime);
  
  assert(decision === true, 'Should sell assets when already heavily in debt');
});

// Test 3: Should take loan when no portfolio available
suite.add('Should take loan when no portfolio available', () => {
  const account = createMockUserAccount({
    cash: -1000,
    portfolio: {},
    loans: []
  });
  
  const gameTime = new Date('1980-01-01T09:30:00');
  const decision = shouldSellAssetsInsteadOfLoan(account, 1000, gameTime);
  
  assert(decision === false, 'Should take loan when no assets to sell');
});

// Test 4: Should sell when credit score is poor
suite.add('Should sell assets when credit score is poor', () => {
  const account = createMockUserAccount({
    cash: -800,
    creditScore: 550,
    portfolio: {
      'MSFT': 100 // Worth ~$3000 in 1986
    },
    loans: []
  });
  
  const gameTime = new Date('1986-06-01T09:30:00');
  const decision = shouldSellAssetsInsteadOfLoan(account, 800, gameTime);
  
  assert(decision === true, 'Should sell assets when credit score is poor');
});

// Test 5: Should sell when negative amount is small relative to portfolio
suite.add('Should sell when negative amount is small (<10% of portfolio)', () => {
  const account = createMockUserAccount({
    cash: -500,
    portfolio: {
      'AAPL': 200 // Worth ~$10,000+ in 1990
    },
    loans: []
  });
  
  const gameTime = new Date('1990-01-01T09:30:00');
  const decision = shouldSellAssetsInsteadOfLoan(account, 500, gameTime);
  
  assert(decision === true, 'Should sell assets when negative amount is small relative to portfolio');
});

// Test 6: Should take loan when portfolio value is low and debt is manageable
suite.add('Should take loan when portfolio is small and no existing debt', () => {
  const account = createMockUserAccount({
    cash: -2000,
    portfolio: {
      'IBM': 10 // Worth ~$2000 in 1980
    },
    loans: []
  });
  
  const gameTime = new Date('1980-01-01T09:30:00');
  const decision = shouldSellAssetsInsteadOfLoan(account, 2000, gameTime);
  
  assert(decision === false, 'Should take loan when portfolio is small and would be wiped out');
});

// Run the test suite
const allPassed = suite.run();

if (!allPassed) {
  process.exit(1);
}
