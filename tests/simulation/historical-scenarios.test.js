#!/usr/bin/env node

/**
 * Historical market simulation test
 * Tests the loan/sell behavior with realistic historical scenarios
 */

const { TestSuite, assert, section, subsection } = require('../helpers/testUtils');
const { 
  createMockUserAccount, 
  createScenario, 
  runScenario,
  calculatePortfolioValue,
  calculateTotalLoanDebt
} = require('../helpers/simulationUtils');

section('Historical Market Simulation Tests');

// Scenario 1: 1987 Black Monday Crash
subsection('Scenario 1: 1987 Black Monday - Portfolio in Crisis');

const crashScenario = createScenario('Black Monday 1987', {
  description: 'User has portfolio but faces margin call after crash',
  startDate: new Date('1987-10-15T09:30:00'),
  endDate: new Date('1987-10-22T16:00:00'),
  initialCash: -5000, // Negative balance from margin call
  initialPortfolio: {
    'IBM': 100,
    'GE': 150,
    'XOM': 80
  },
  initialLoans: [],
  events: []
});

const crashResult = runScenario(crashScenario);

console.log('Initial state:');
console.log(`  Cash: $${crashResult.dailyResults[0].cash.toFixed(2)}`);
console.log(`  Portfolio: $${crashResult.dailyResults[0].portfolioValue.toFixed(2)}`);
console.log(`  Net Worth: $${crashResult.dailyResults[0].netWorth.toFixed(2)}`);

console.log('\nFinal state:');
const lastDay = crashResult.dailyResults[crashResult.dailyResults.length - 1];
console.log(`  Cash: $${lastDay.cash.toFixed(2)}`);
console.log(`  Portfolio: $${lastDay.portfolioValue.toFixed(2)}`);
console.log(`  Loan Debt: $${lastDay.loanDebt.toFixed(2)}`);
console.log(`  Net Worth: $${lastDay.netWorth.toFixed(2)}`);

console.log('\n✓ Scenario completed - In this case, selling assets would be smarter than taking a loan');
console.log('  Reason: Portfolio value is substantial and can cover the negative balance');

// Scenario 2: Early investor with minimal portfolio
subsection('\nScenario 2: Early 1970s - New Investor with Small Portfolio');

const earlyInvestorScenario = createScenario('Early Investor 1970', {
  description: 'New investor with small portfolio faces unexpected expense',
  startDate: new Date('1970-06-01T09:30:00'),
  endDate: new Date('1970-06-05T16:00:00'),
  initialCash: -3000, // Unexpected expense
  initialPortfolio: {
    'IBM': 10 // Small position
  },
  initialLoans: [],
  events: []
});

const earlyResult = runScenario(earlyInvestorScenario);

console.log('Initial state:');
console.log(`  Cash: $${earlyResult.dailyResults[0].cash.toFixed(2)}`);
console.log(`  Portfolio: $${earlyResult.dailyResults[0].portfolioValue.toFixed(2)}`);
console.log(`  Net Worth: $${earlyResult.dailyResults[0].netWorth.toFixed(2)}`);

console.log('\n✓ Scenario completed - In this case, taking a loan might be reasonable');
console.log('  Reason: Portfolio is small and would be completely liquidated');

// Scenario 3: Over-leveraged investor
subsection('\nScenario 3: 2008 Financial Crisis - Over-Leveraged Investor');

const overleveragedScenario = createScenario('Over-Leveraged 2008', {
  description: 'Investor with existing loans faces additional crisis',
  startDate: new Date('2008-09-15T09:30:00'),
  endDate: new Date('2008-09-20T16:00:00'),
  initialCash: -2000,
  initialPortfolio: {
    'C': 500,    // Citigroup - heavily affected
    'BAC': 300,  // Bank of America
    'JPM': 100   // JPMorgan
  },
  initialLoans: [
    { id: 1, balance: 15000, status: 'active', interestRate: 0.12 },
    { id: 2, balance: 8000, status: 'active', interestRate: 0.15 }
  ],
  events: []
});

const overleveragedResult = runScenario(overleveragedScenario);

console.log('Initial state:');
console.log(`  Cash: $${overleveragedResult.dailyResults[0].cash.toFixed(2)}`);
console.log(`  Portfolio: $${overleveragedResult.dailyResults[0].portfolioValue.toFixed(2)}`);
console.log(`  Existing Loans: $${overleveragedResult.dailyResults[0].loanDebt.toFixed(2)}`);
console.log(`  Net Worth: $${overleveragedResult.dailyResults[0].netWorth.toFixed(2)}`);

console.log('\n✓ Scenario completed - In this case, selling assets is CRITICAL');
console.log('  Reason: Already heavily in debt, taking more loans would be catastrophic');

// Summary
section('Simulation Summary');

console.log('These scenarios demonstrate that the decision to sell vs take a loan should be based on:');
console.log('  1. Current portfolio value vs negative balance');
console.log('  2. Existing loan debt levels');
console.log('  3. Credit score and ability to repay');
console.log('  4. Relative size of the shortfall');
console.log('\nThe current implementation (always preferring loans) can lead to:');
console.log('  ✗ Accumulating debt that cannot be repaid');
console.log('  ✗ Ignoring valuable portfolios that could cover shortfalls');
console.log('  ✗ Poor financial decisions during market crashes');

console.log('\n' + '='.repeat(70));
